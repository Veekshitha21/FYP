/**
 * WebSocket Service for MotionEase
 * Connects to ws://127.0.0.1:8765 with automatic reconnection,
 * heartbeat monitoring, and event listeners.
 */

class WebSocketService {
  constructor(url = 'ws://127.0.0.1:8765') {
    this.url = url;
    this.ws = null;
    this.listeners = new Map(); // eventType -> Set of callbacks
    this.isConnected = false;
    this.reconnectInterval = 2000;
    this.reconnectTimer = null;
    this.shouldReconnect = true;
  }

  connect() {
    this.shouldReconnect = true;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[WebSocket] Connected to MotionEase Python Engine at', this.url);
        this._notify('connection_change', { connected: true });
        // Request device list on connect
        this.sendCommand('GET_DEVICES');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;
          if (type) {
            this._notify(type, data);
          }
          // Also broadcast raw message to catch-all listeners
          this._notify('*', data);
        } catch (err) {
          console.error('[WebSocket] Error parsing JSON message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this._notify('connection_change', { connected: false });
        if (this.shouldReconnect) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };

      this.ws.onerror = (err) => {
        console.debug('[WebSocket] Connection attempt notice:', err);
        if (this.ws) {
          try {
            this.ws.close();
          } catch (_) {}
        }
      };
    } catch (err) {
      console.warn('[WebSocket] Initialization error:', err);
      if (this.shouldReconnect) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectInterval);
      }
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.close(1000, "Client unmount");
        } catch (_) {}
      } else if (this.ws.readyState === WebSocket.CONNECTING) {
        // Allow handshake to complete before closing cleanly to avoid abortive handshake errors
        const socket = this.ws;
        socket.onopen = () => {
          try {
            socket.close(1000, "Clean close after connect");
          } catch (_) {}
        };
      }
      this.ws = null;
    }
  }

  sendCommand(command, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ command, data, timestamp: Date.now() }));
    }
  }

  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
    return () => this.off(type, callback);
  }

  off(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback);
    }
  }

  _notify(type, data) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[WebSocket] Listener error for ${type}:`, e);
        }
      });
    }
  }
}

export const wsService = new WebSocketService();
export default wsService;
