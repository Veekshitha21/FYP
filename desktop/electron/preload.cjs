const { contextBridge, ipcRenderer } = require('electron');

// Expose protected capabilities to the renderer via window.motionEaseBridge
contextBridge.exposeInMainWorld('motionEaseBridge', {
  // Application window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  // Backend process status & control
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
  restartBackend: () => ipcRenderer.invoke('restart-backend'),
  stopBackend: () => ipcRenderer.invoke('stop-backend'),

  // Emergency safety trigger
  triggerEmergencyStop: () => ipcRenderer.send('emergency-stop-invoked'),

  // Environment info
  getAppInfo: () => ({
    name: 'MotionEase',
    version: '1.0.0',
    platform: process.platform,
    wsUrl: 'ws://127.0.0.1:8765'
  }),

  // Listen to IPC events from main
  onBackendLog: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('backend-log', handler);
    return () => ipcRenderer.removeListener('backend-log', handler);
  },
  onBackendStateChange: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('backend-state-change', handler);
    return () => ipcRenderer.removeListener('backend-state-change', handler);
  }
});
