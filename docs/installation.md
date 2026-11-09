# MotionEase Installation & Execution Guide

## System Prerequisites
- **Operating System:** Windows 10 / 11 (64-bit)
- **Node.js:** v18.0.0 or higher (v24.x tested and supported)
- **Python:** 3.11.x (64-bit recommended)
- **Hardware:** Standard consumer USB or built-in webcam (720p/1080p @ 30+ FPS) and standard microphone.

---

## 1. Quick Setup & Installation

### Step A: Install Desktop Frontend & Electron Dependencies
```bash
cd desktop
npm install
```

### Step B: Install Python AI Engine Dependencies
```bash
cd ../ai_engine
# If using a virtual environment:
python -m venv .venv
.venv\Scripts\activate

pip install -r requirements.txt
```

### Step C: Verify MediaPipe Model Asset
The MediaPipe face landmarker model `face_landmarker.task` is automatically stored in `models/face_landmarker.task`.
To redownload or verify:
```bash
python -c "
import urllib.request, os
url = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
os.makedirs('models', exist_ok=True)
if not os.path.exists('models/face_landmarker.task'):
    urllib.request.urlretrieve(url, 'models/face_landmarker.task')
    print('Model ready.')
"
```

---

## 2. Launching MotionEase

### Integrated Launch (Electron Desktop App + Python AI Backend)
```bash
cd desktop
npm run app:dev
```
This concurrently starts the Vite React dev server, launches the Python AI backend, and boots the Electron desktop window.

### Standalone Backend Execution (for Testing & Telemetry Inspection)
```bash
cd ai_engine
python main.py
```
Starts the Python WebSocket server on `ws://127.0.0.1:8765` and initiates the computer vision tracking loop.

---

## 3. Running Unit and Integration Tests

Execute the automated test suite:
```bash
python -m unittest discover -s tests -p "test_*.py"
```

Individual test execution:
```bash
python tests/test_filters.py
python tests/test_gestures.py
python tests/test_speech.py
python tests/test_fusion.py
python tests/test_head_pose.py
python tests/test_gaze.py
python tests/test_camera.py
python tests/test_dispatcher.py
```
