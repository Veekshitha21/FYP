"""
MODULE L: WebSocket Server
File: communication/websocket_server.py
Asynchronous WebSocket server facilitating secure localhost communication between
the Python AI Engine and the Electron/React frontend. Broadcasts telemetry and
receives UI commands.
"""

import asyncio
import json
import logging
import threading
from typing import Set, Dict, Any, Optional, Callable
import websockets
from websockets.server import WebSocketServerProtocol

from utils.logger import get_logger
import config

logger = get_logger("WebSocketServer")

# Suppress websockets internal handshake / disconnect tracebacks from cluttering the console
logging.getLogger("websockets").setLevel(logging.CRITICAL)
logging.getLogger("websockets.server").setLevel(logging.CRITICAL)
logging.getLogger("websockets.asyncio.server").setLevel(logging.CRITICAL)

class MotionEaseWebSocketServer:
    def __init__(self, host: str = config.WEBSOCKET_HOST, port: int = config.WEBSOCKET_PORT):
        self.host = host
        self.port = port
        self.clients: Set[Any] = set()
        self.is_running = False
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self._server_thread: Optional[threading.Thread] = None
        self.command_handler: Optional[Callable[[Dict[str, Any]], None]] = None

    def start(self, command_handler: Optional[Callable[[Dict[str, Any]], None]] = None):
        """Starts WebSocket server inside an independent daemon thread."""
        if self.is_running:
            return
        self.command_handler = command_handler
        self.is_running = True
        self._server_thread = threading.Thread(target=self._run_event_loop, daemon=True)
        self._server_thread.start()
        logger.info(f"WebSocket server starting on ws://{self.host}:{self.port}...")

    def _run_event_loop(self):
        """Runs asyncio event loop in thread."""
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)

        def _process_request(connection, request):
            """Gracefully handles any HTTP GET requests to the WebSocket port."""
            try:
                upgrade = request.headers.get("Upgrade", "")
                if upgrade.lower() != "websocket":
                    from websockets.http11 import Status
                    body = b'{"status": "MotionEase AI WebSocket Server is running", "endpoint": "ws://127.0.0.1:8765"}\n'
                    return connection.respond(Status.OK, body)
            except Exception:
                pass
            return None

        async def main_coroutine():
            try:
                async with websockets.serve(
                    self._handle_client,
                    self.host,
                    self.port,
                    process_request=_process_request
                ):
                    logger.info(f"WebSocket server running on ws://{self.host}:{self.port}")
                    while self.is_running:
                        await asyncio.sleep(0.5)
            except Exception as e:
                logger.error(f"WebSocket serve error: {e}")

        try:
            self.loop.run_until_complete(main_coroutine())
        except Exception as e:
            logger.error(f"WebSocket server loop error: {e}")
        finally:
            self.loop.close()

    async def _handle_client(self, websocket):
        """Manages client connection, registration, and incoming JSON messages."""
        self.clients.add(websocket)
        logger.info(f"Frontend client connected from {getattr(websocket, 'remote_address', 'localhost')}. Active clients: {len(self.clients)}")
        try:
            async for message in websocket:
                try:
                    payload = json.loads(message)
                    if self.command_handler:
                        self.command_handler(payload)
                except json.JSONDecodeError:
                    logger.warning(f"Malformed JSON received: {str(message)[:100]}")
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            logger.debug(f"Client connection closed: {e}")
        finally:
            self.clients.discard(websocket)
            logger.info(f"Client disconnected. Remaining clients: {len(self.clients)}")

    def broadcast(self, message_dict: Dict[str, Any]):
        """Thread-safe non-blocking broadcast to all connected frontend clients."""
        if not self.is_running or not self.clients or not self.loop or self.loop.is_closed():
            return

        json_str = json.dumps(message_dict)
        asyncio.run_coroutine_threadsafe(self._send_to_all(json_str), self.loop)

    async def _send_to_all(self, json_str: str):
        if not self.clients:
            return

        for client in list(self.clients):
            try:
                is_open = getattr(client, "open", None)
                if is_open is None:
                    state = getattr(client, "state", None)
                    is_open = str(state).endswith("OPEN") or state == 1
                if is_open:
                    await client.send(json_str)
            except Exception:
                self.clients.discard(client)

    def stop(self):
        """Stops the server gracefully."""
        self.is_running = False
        logger.info("WebSocket server stopped.")
