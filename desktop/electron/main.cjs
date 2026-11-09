const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let pythonProcess = null;
let backendStatus = 'stopped'; // 'starting' | 'running' | 'error' | 'stopped'
let lastBackendError = null;

// Resolve paths
const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
const projectRoot = path.resolve(__dirname, '..', '..');
const pythonScriptPath = path.join(projectRoot, 'ai_engine', 'main.py');

function startPythonBackend() {
  if (pythonProcess) {
    console.log('[Electron] Python process already running');
    return;
  }

  console.log('[Electron] Starting Python AI Engine:', pythonScriptPath);
  backendStatus = 'starting';
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('backend-state-change', { status: backendStatus });
  }

  // Attempt using 'python' or virtualenv python
  const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';

  pythonProcess = spawn(pythonExecutable, [pythonScriptPath], {
    cwd: projectRoot,
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  pythonProcess.stdout.on('data', (data) => {
    const text = data.toString().trim();
    console.log(`[Python Engine] ${text}`);
    if (text.includes('WebSocket server running') || text.includes('Engine started')) {
      backendStatus = 'running';
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('backend-state-change', { status: 'running' });
      }
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('backend-log', { level: 'info', message: text });
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    const text = data.toString().trim();
    console.error(`[Python Engine Error] ${text}`);
    lastBackendError = text;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('backend-log', { level: 'error', message: text });
    }
  });

  pythonProcess.on('close', (code) => {
    console.log(`[Electron] Python backend exited with code ${code}`);
    pythonProcess = null;
    backendStatus = code === 0 ? 'stopped' : 'error';
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('backend-state-change', { 
        status: backendStatus, 
        exitCode: code,
        error: lastBackendError 
      });
    }
  });

  pythonProcess.on('error', (err) => {
    console.error('[Electron] Failed to spawn Python backend:', err);
    pythonProcess = null;
    backendStatus = 'error';
    lastBackendError = err.message;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('backend-state-change', { 
        status: 'error', 
        error: err.message 
      });
    }
  });
}

function stopPythonBackend() {
  if (pythonProcess) {
    console.log('[Electron] Stopping Python backend process...');
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', pythonProcess.pid, '/f', '/t']);
      } else {
        pythonProcess.kill('SIGTERM');
      }
    } catch (e) {
      console.error('[Electron] Error killing Python process:', e);
    }
    pythonProcess = null;
    backendStatus = 'stopped';
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#080D18',
    frame: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#080D18',
      symbolColor: '#F8FAFC',
      height: 38
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // Load URL
  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('get-backend-status', () => {
  return { status: backendStatus, error: lastBackendError };
});

ipcMain.handle('restart-backend', () => {
  stopPythonBackend();
  setTimeout(() => startPythonBackend(), 500);
  return { success: true };
});

ipcMain.handle('stop-backend', () => {
  stopPythonBackend();
  return { success: true };
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('emergency-stop-invoked', () => {
  console.warn('[Electron Safety] Emergency stop received from renderer!');
});

// App Lifecycle
app.whenReady().then(() => {
  createWindow();
  startPythonBackend();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  stopPythonBackend();
});

app.on('window-all-closed', () => {
  stopPythonBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
