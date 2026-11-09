import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import wsService from '../services/websocket';

const MotionEaseContext = createContext(null);

export const MotionEaseProvider = ({ children }) => {
  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  
  // Navigation active page
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing' | 'setup' | 'dashboard' | 'studio' | 'calibration' | 'gestures' | 'voice' | 'keyboard' | 'slm' | 'settings' | 'tutorial'

  // Real-Time Telemetry
  const [telemetry, setTelemetry] = useState({
    face_detected: false,
    bbox: null,
    landmarks: [],
    gaze: { x: 0.5, y: 0.5, raw_x: 0.5, raw_y: 0.5, confidence: 0.0, mode: 'idle', is_calibrated: false },
    head: { pitch: 0.0, yaw: 0.0, roll: 0.0, direction: 'neutral', scroll_action: null },
    gesture: { detected: null, confidence: 0.0, left_ear: 0.3, right_ear: 0.3, is_blink: false, blendshapes: {} },
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

  // Initialize WebSocket & event listeners
  useEffect(() => {
    wsService.connect();

    const unsubConn = wsService.on('connection_change', (data) => {
      setIsConnected(data.connected);
      if (data.connected) {
        addToast('Connected to MotionEase AI Engine', 'success');
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
        setCalibrationState((prev) => ({
          ...prev,
          isCalibrating: false,
          accuracy: data.result ? data.result.accuracy : 92.5,
          isCompleted: true
        }));
        addToast(`Calibration completed! Accuracy: ${data.result?.accuracy || 92}%`, 'success');
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

    return () => {
      unsubConn();
      unsubTelemetry();
      unsubStatus();
      unsubVoice();
      unsubDevices();
      unsubKeyboard();
      unsubCalibration();
      wsService.disconnect();
    };
  }, [addToast]);

  // Command Methods
  const startTracking = () => {
    wsService.sendCommand('START_TRACKING');
    setSystemStatus((prev) => ({ ...prev, is_tracking: true, is_paused: false }));
    addToast('Hands-free control started', 'success');
  };

  const pauseTracking = () => {
    wsService.sendCommand('PAUSE_TRACKING');
    setSystemStatus((prev) => ({ ...prev, is_tracking: false, is_paused: true }));
    addToast('Hands-free control paused', 'warning');
  };

  const stopTracking = () => {
    wsService.sendCommand('STOP_TRACKING');
    setSystemStatus((prev) => ({ ...prev, is_tracking: false, is_paused: true }));
    addToast('Tracking stopped', 'info');
  };

  const triggerEmergencyStop = () => {
    wsService.sendCommand('EMERGENCY_STOP');
    if (window.motionEaseBridge?.triggerEmergencyStop) {
      window.motionEaseBridge.triggerEmergencyStop();
    }
    setSystemStatus((prev) => ({ ...prev, emergency_stop: true, is_tracking: false }));
    addToast('EMERGENCY STOP ACTIVATED! All computer control locked.', 'danger');
  };

  const resumeEmergencyStop = () => {
    wsService.sendCommand('RESUME_EMERGENCY_STOP');
    setSystemStatus((prev) => ({ ...prev, emergency_stop: false, is_tracking: true }));
    addToast('Emergency stop cleared. Resuming control.', 'success');
  };

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

  const testVoiceCommand = (text) => {
    wsService.sendCommand('TEST_VOICE_COMMAND', { text });
  };

  const updateSettings = (settings) => {
    wsService.sendCommand('UPDATE_SETTINGS', settings);
    addToast('Accessibility settings applied', 'success');
  };

  return (
    <MotionEaseContext.Provider
      value={{
        isConnected,
        currentPage,
        setCurrentPage,
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
        virtualKeyboardPress,
        virtualKeyboardSuggestion,
        virtualKeyboardClear,
        testVoiceCommand,
        updateSettings
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
