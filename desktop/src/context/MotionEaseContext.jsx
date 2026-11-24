import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import wsService from '../services/websocket';

const MotionEaseContext = createContext(null);

export const MotionEaseProvider = ({ children }) => {
  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  
  // Navigation active page
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing' | 'setup' | 'dashboard' | 'studio' | 'calibration' | 'gestures' | 'voice' | 'keyboard' | 'slm' | 'settings' | 'tutorial'

  // Dynamic Cursor & Filter Settings
  const [settings, setSettings] = useState(() => {
    const defaults = {
      invert_x: true,
      invert_y: false,
      cursor_speed: 1.0,
      deadband_px: 8,
      cursor_rate_hz: 60,
      min_cutoff: 0.85,
      beta: 0.015,
      min_dwell_ms: 600,
      max_dwell_ms: 1500,
      dwell_radius_px: 35,
      tracking_mode: 'auto',
      blink_click: true
    };
    try {
      const saved = localStorage.getItem('motionease_settings');
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse saved settings:', e);
    }
    return defaults;
  });

  // Real-Time Telemetry
  const [telemetry, setTelemetry] = useState({
    face_detected: false,
    bbox: null,
    landmarks: [],
    tracking_mode: 'auto',
    hand: { detected: false, x: 0.5, y: 0.5, gesture: null, pinch_dist: 0.0, landmarks: [] },
    gaze: { x: 0.5, y: 0.5, raw_x: 0.5, raw_y: 0.5, confidence: 0.0, mode: 'idle', is_calibrated: false },
    head: { pitch: 0.0, yaw: 0.0, roll: 0.0, direction: 'neutral', scroll_action: null },
    gesture: { detected: null, confidence: 0.0, left_ear: 0.3, right_ear: 0.3, is_blink: false, blink_progress: 0.0, blendshapes: {} },
    dwell: { progress: 0.0, is_dwelling: false },
    audio_level: 0.0
  });

  // Measured Live System Status
  const [systemStatus, setSystemStatus] = useState({
    camera: 'connected',
    microphone: 'connected',
    fps: 0,
    latency_ms: 0,
    cpu_usage: 0,
    memory_usage_mb: 0,
    actions_executed: 0,
    is_tracking: true,
    is_paused: false,
    emergency_stop: false,
    slm: { is_loaded: false, model_name: 'Dictionary Fallback', last_latency_ms: 0 },
    recent_actions: []
  });

  // Modality States
  const [modalities, setModalities] = useState({
    gaze: true,
    head: true,
    gesture: true,
    voice: true
  });

  // Action Log
  const [actionLog, setActionLog] = useState([]);

  // Hardware Devices
  const [devices, setDevices] = useState({
    cameras: [{ index: 0, name: 'Default Camera (640x480)', status: 'connected' }],
    microphones: [{ index: 0, name: 'Default Microphone', status: 'available' }],
    selectedCamera: 0,
    selectedMicrophone: 0
  });

  // Virtual Keyboard & Predictive Text State
  const [keyboardState, setKeyboardState] = useState({
    text: '',
    suggestions: ['I need', 'Please', 'Thank you', 'Hello', 'Water'],
    slm_info: { is_local_slm: false, latency_ms: 0, engine: 'Dictionary Fallback' }
  });

  // Calibration State
  const [calibrationState, setCalibrationState] = useState({
    isCalibrating: false,
    currentPointIndex: 0,
    activePoint: null,
    totalPoints: 9,
    accuracy: null,
    isCompleted: false
  });

  // UI Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Update Settings Dispatcher
  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('motionease_settings', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }

      // Dispatch payload to Python backend
      const payload = {
        invert_x: updated.invert_x,
        invert_y: updated.invert_y,
        cursor_speed: updated.cursor_speed,
        deadband_px: updated.deadband_px,
        cursor_rate_hz: updated.cursor_rate_hz,
        tracking_mode: updated.tracking_mode,
        blink_click: updated.blink_click,
        one_euro: { min_cutoff: updated.min_cutoff, beta: updated.beta },
        dwell: {
          min_dwell_ms: updated.min_dwell_ms,
          max_dwell_ms: updated.max_dwell_ms,
          radius_px: updated.dwell_radius_px
        }
      };
      wsService.sendCommand('UPDATE_SETTINGS', payload);
      return updated;
    });
  }, []);

  // Command Methods
  const startTracking = useCallback(() => {
    wsService.sendCommand('START_TRACKING');
    setSystemStatus((prev) => ({ ...prev, is_tracking: true, is_paused: false, emergency_stop: false }));
    addToast('Hands-free control started', 'success');
  }, [addToast]);

  const pauseTracking = useCallback(() => {
    wsService.sendCommand('PAUSE_TRACKING');
    setSystemStatus((prev) => ({ ...prev, is_tracking: false, is_paused: true }));
    addToast('Hands-free control paused (Press ESC or click Start to resume)', 'warning');
  }, [addToast]);

  const stopTracking = useCallback(() => {
    wsService.sendCommand('STOP_TRACKING');
    setSystemStatus((prev) => ({ ...prev, is_tracking: false, is_paused: true }));
    addToast('Tracking stopped', 'info');
  }, [addToast]);

  const triggerEmergencyStop = useCallback(() => {
    wsService.sendCommand('EMERGENCY_STOP');
    if (window.motionEaseBridge?.triggerEmergencyStop) {
      window.motionEaseBridge.triggerEmergencyStop();
    }
    setSystemStatus((prev) => ({ ...prev, emergency_stop: true, is_tracking: false }));
    addToast('EMERGENCY STOP ACTIVATED! (Press F8 to clear)', 'danger');
  }, [addToast]);

  const resumeEmergencyStop = useCallback(() => {
    wsService.sendCommand('RESUME_EMERGENCY_STOP');
    setSystemStatus((prev) => ({ ...prev, emergency_stop: false, is_tracking: true }));
    addToast('Emergency stop cleared. Resuming control.', 'success');
  }, [addToast]);

  // Initialize WebSocket & event listeners
  useEffect(() => {
    wsService.connect();

    const unsubConn = wsService.on('connection_change', (data) => {
      setIsConnected(data.connected);
      if (data.connected) {
        addToast('Connected to MotionEase AI Engine', 'success');
        // Push initial preferences to backend
        try {
          const saved = localStorage.getItem('motionease_settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            wsService.sendCommand('UPDATE_SETTINGS', {
              invert_x: parsed.invert_x,
              invert_y: parsed.invert_y,
              cursor_speed: parsed.cursor_speed,
              deadband_px: parsed.deadband_px,
              cursor_rate_hz: parsed.cursor_rate_hz,
              one_euro: { min_cutoff: parsed.min_cutoff, beta: parsed.beta },
              dwell: { min_dwell_ms: parsed.min_dwell_ms, max_dwell_ms: parsed.max_dwell_ms, radius_px: parsed.dwell_radius_px }
            });
          }
        } catch (e) {}
      } else {
        addToast('Connection to AI Engine lost. Retrying...', 'warning');
      }
    });

    const unsubTelemetry = wsService.on('telemetry', (data) => {
      setTelemetry((prev) => ({
        ...prev,
        face_detected: data.face_detected,
        bbox: data.bbox,
        preview_frame: data.preview_frame || prev.preview_frame,
        landmarks: data.landmarks || [],
        gaze: data.gaze || prev.gaze,
        head: data.head || prev.head,
        gesture: data.gesture || prev.gesture,
        dwell: data.dwell || prev.dwell,
        audio_level: data.audio_level || 0.0
      }));

      // If gesture was detected, add entry to action log
      if (data.gesture && data.gesture.detected) {
        setActionLog((prev) => [
          {
            id: Date.now(),
            type: 'GESTURE',
            description: `Gesture '${data.gesture.detected}' recognized (${(data.gesture.confidence * 100).toFixed(0)}%)`,
            timestamp: new Date().toLocaleTimeString(),
            success: true
          },
          ...prev.slice(0, 49)
        ]);
      }
    });

    const unsubStatus = wsService.on('system_status', (data) => {
      setSystemStatus((prev) => ({
        ...prev,
        ...data
      }));
      if (data.recent_actions && data.recent_actions.length > 0) {
        setActionLog(data.recent_actions);
      }
      if (data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    });

    const unsubHotkey = wsService.on('hotkey_event', (data) => {
      if (data.action === 'TOGGLE_TRACKING') {
        setSystemStatus((prev) => ({
          ...prev,
          is_tracking: data.is_tracking,
          is_paused: !data.is_tracking
        }));
        addToast(data.message, data.is_tracking ? 'success' : 'warning');
      } else if (data.action === 'EMERGENCY_STOP') {
        setSystemStatus((prev) => ({
          ...prev,
          emergency_stop: data.emergency_stop,
          is_tracking: !data.emergency_stop
        }));
        addToast(data.message, data.emergency_stop ? 'danger' : 'success');
      }
    });

    const unsubVoice = wsService.on('voice_command', (data) => {
      addToast(`Voice Command: "${data.raw_text}" -> ${data.intent}`, 'info');
      setActionLog((prev) => [
        {
          id: Date.now(),
          type: 'VOICE_COMMAND',
          description: `Voice: "${data.raw_text}" (${data.intent})`,
          timestamp: data.timestamp || new Date().toLocaleTimeString(),
          success: true
        },
        ...prev.slice(0, 49)
      ]);
    });

    const unsubDevices = wsService.on('device_list', (data) => {
      setDevices((prev) => ({
        ...prev,
        cameras: data.cameras && data.cameras.length > 0 ? data.cameras : prev.cameras,
        microphones: data.microphones && data.microphones.length > 0 ? data.microphones : prev.microphones
      }));
    });

    const unsubKeyboard = wsService.on('keyboard_update', (data) => {
      setKeyboardState({
        text: data.text,
        suggestions: data.suggestions || [],
        slm_info: data.slm_info || {}
      });
    });

    const unsubCalibration = wsService.on('calibration_event', (data) => {
      if (data.status === 'started' || data.status === 'point_active') {
        setCalibrationState({
          isCalibrating: true,
          currentPointIndex: data.point_index,
          activePoint: data.point,
          totalPoints: data.total_points || 9,
          accuracy: null,
          isCompleted: false
        });
      } else if (data.status === 'completed') {
        if (data.result?.success) {
          setCalibrationState((prev) => ({
            ...prev,
            isCalibrating: false,
            accuracy: data.result.accuracy,
            isCompleted: true
          }));
          addToast(`Calibration completed! Accuracy: ${data.result.accuracy.toFixed(1)}%`, 'success');
        } else {
          setCalibrationState((prev) => ({
            ...prev,
            isCalibrating: false,
            isCompleted: false
          }));
          addToast(data.result?.error || 'Calibration failed. Keep your face visible and try again.', 'danger');
        }
      } else if (data.status === 'reset') {
        setCalibrationState({
          isCalibrating: false,
          currentPointIndex: 0,
          activePoint: null,
          totalPoints: 9,
          accuracy: null,
          isCompleted: false
        });
        addToast('Gaze calibration reset to baseline', 'info');
      }
    });

    // Browser-level keyboard shortcut listeners
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSystemStatus((prev) => {
          if (prev.is_tracking) {
            pauseTracking();
          } else {
            startTracking();
          }
          return prev;
        });
      } else if (e.key === 'F8') {
        e.preventDefault();
        setSystemStatus((prev) => {
          if (prev.emergency_stop) {
            resumeEmergencyStop();
          } else {
            triggerEmergencyStop();
          }
          return prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Electron global shortcut listener
    let unsubGlobalHotkey = null;
    if (window.motionEaseBridge?.onGlobalHotkey) {
      unsubGlobalHotkey = window.motionEaseBridge.onGlobalHotkey((data) => {
        if (data.key === 'Escape') {
          setSystemStatus((prev) => {
            if (prev.is_tracking) {
              pauseTracking();
            } else {
              startTracking();
            }
            return prev;
          });
        } else if (data.key === 'F8') {
          setSystemStatus((prev) => {
            if (prev.emergency_stop) {
              resumeEmergencyStop();
            } else {
              triggerEmergencyStop();
            }
            return prev;
          });
        }
      });
    }

    return () => {
      unsubConn();
      unsubTelemetry();
      unsubStatus();
      unsubHotkey();
      unsubVoice();
      unsubDevices();
      unsubKeyboard();
      unsubCalibration();
      window.removeEventListener('keydown', handleKeyDown);
      if (unsubGlobalHotkey) unsubGlobalHotkey();
      wsService.disconnect();
    };
  }, [addToast, pauseTracking, startTracking, triggerEmergencyStop, resumeEmergencyStop]);

  const toggleModality = (modality, enabled) => {
    setModalities((prev) => ({ ...prev, [modality]: enabled }));
    wsService.sendCommand('TOGGLE_MODALITY', { modality, enabled });
    addToast(`${modality.toUpperCase()} control ${enabled ? 'enabled' : 'disabled'}`, 'info');
  };

  const startCalibration = () => {
    wsService.sendCommand('START_CALIBRATION');
  };

  const setCalibrationPoint = (index) => {
    wsService.sendCommand('SET_CALIBRATION_POINT', { index });
  };

  const completeCalibration = () => {
    wsService.sendCommand('COMPLETE_CALIBRATION');
  };

  const resetCalibration = () => {
    wsService.sendCommand('RESET_CALIBRATION');
  };

  const calibrateNeutralHead = () => {
    if (systemStatus.is_tracking) {
      wsService.sendCommand('PAUSE_TRACKING');
      setSystemStatus((prev) => ({ ...prev, is_tracking: false, is_paused: true }));
      addToast('Tracking paused. Head center saved safely; resume when ready.', 'warning');
    }
    wsService.sendCommand('CALIBRATE_NEUTRAL_HEAD');
    addToast('Current head posture saved as neutral center', 'success');
  };

  const virtualKeyboardPress = (key) => {
    wsService.sendCommand('KEYBOARD_PRESS', { key });
  };

  const virtualKeyboardSuggestion = (suggestion) => {
    wsService.sendCommand('KEYBOARD_SUGGESTION', { suggestion });
  };

  const virtualKeyboardClear = () => {
    wsService.sendCommand('KEYBOARD_CLEAR');
  };

  const recenterGaze = useCallback(() => {
    wsService.sendCommand('RECENTER_GAZE');
    addToast('Pointer baseline centered to your current position', 'success');
  }, [addToast]);

  const setTrackingMode = useCallback((mode) => {
    updateSettings({ tracking_mode: mode });
    wsService.sendCommand('SET_TRACKING_MODE', { mode });
    addToast(`Control mode switched to ${mode.toUpperCase()}`, 'info');
  }, [updateSettings, addToast]);

  const testVoiceCommand = (text) => {
    wsService.sendCommand('TEST_VOICE_COMMAND', { text });
  };

  return (
    <MotionEaseContext.Provider
      value={{
        isConnected,
        currentPage,
        setCurrentPage,
        settings,
        updateSettings,
        telemetry,
        systemStatus,
        modalities,
        actionLog,
        devices,
        keyboardState,
        calibrationState,
        toasts,
        addToast,
        startTracking,
        pauseTracking,
        stopTracking,
        triggerEmergencyStop,
        resumeEmergencyStop,
        toggleModality,
        startCalibration,
        setCalibrationPoint,
        completeCalibration,
        resetCalibration,
        calibrateNeutralHead,
        recenterGaze,
        setTrackingMode,
        virtualKeyboardPress,
        virtualKeyboardSuggestion,
        virtualKeyboardClear,
        testVoiceCommand
      }}
    >
      {children}
    </MotionEaseContext.Provider>
  );
};

export const useMotionEase = () => {
  const context = useContext(MotionEaseContext);
  if (!context) {
    throw new Error('useMotionEase must be used within a MotionEaseProvider');
  }
  return context;
};
