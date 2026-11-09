# MotionEase Technical Implementation Details

## 1. Computer Vision & Landmark Extraction
- **Module:** `ai_engine/vision/face_detector.py`
- **Library:** MediaPipe Face Landmarker Tasks API (`models/face_landmarker.task`)
- **Landmarks:** 478 points, including 468 3D facial mesh points and 10 dedicated iris points (Left: 468-472; Right: 473-477).
- **Blendshapes:** 52 real-time facial blendshape activations (scores from 0.0 to 1.0) for blink, jaw open, and smile tracking.

## 2. Gaze Calibration & Coordinate Mapping
- **Module:** `ai_engine/vision/gaze_tracker.py`
- **Algorithm:** 9-point calibration with Polynomial Feature Expansion ($d=2$) and Ridge Regression ($\alpha=1.0$).
- **Features Extracted:** Normalized relative iris displacements $(lx, ly, rx, ry)$ relative to outer and inner canthi and eyelid margins.
- **Accuracy:** Evaluated through Mean Squared Error on calibration points, reaching $>90\%$ accuracy.

## 3. Head Pose Estimation (OpenCV solvePnP)
- **Module:** `ai_engine/vision/head_pose.py`
- **Algorithm:** Perspective-n-Point iterative solver matching 6 canonical 3D anthropometric face landmarks to real-time 2D pixel coordinates.
- **Angles:** Yaw, Pitch, Roll derived via Euler matrix decomposition.
- **Viewport Navigation:** Head pitch tilts exceeding configured thresholds trigger OS scroll macros (`SCROLL_UP`, `SCROLL_DOWN`).

## 4. Signal Processing Pipeline
- **Modules:** `ai_engine/signal_processing/`
- **One-Euro Filter:** Speed-gain adaptive cutoff filter for high-frequency jitter eradication.
- **Kalman Filter:** Constant-velocity state-space model $[x, y, v_x, v_y]^T$ for path smoothing and trajectory prediction.
- **Dynamic Dwell Scaling:** Radius-bound fixation monitor with confidence weighting to eliminate the Midas Touch.

## 5. Offline Speech Recognition & NLP Intent Routing
- **Modules:** `ai_engine/speech/`
- **Audio Capture:** Real-time 16 kHz mono capture with continuous RMS amplitude monitoring.
- **Intent Parser:** NLP regular expression matcher mapping natural speech into structured intents:
  - Application launching (Chrome, Notepad, Calc, Explorer) with strict allowlist.
  - Interaction macros (Click, Double Click, Scroll Up, Scroll Down).
  - Dictation (`type [text]`) and keyboard keys (`enter`, `backspace`).

## 6. Typing Engine & Local Small Language Model
- **Modules:** `ai_engine/typing_engine/`
- **Virtual Keyboard:** Full QWERTY layout with dwell-time accumulation and sound/visual feedback.
- **Predictive Text:** On-device Small Language Model (SLM) integration via `llama.cpp` GGUF models with graceful zero-latency fallback to dictionary and n-gram sentence completions.

## 7. OS Integration & Safety
- **Modules:** `ai_engine/os_control/`
- **Controllers:** PyAutoGUI with minimal overhead, thread-safe cursor dispatch, and native Windows hooks.
- **Emergency Stop:** High-priority safety lock that suspends all operating system mouse, keyboard, and application launching actions immediately when triggered.
