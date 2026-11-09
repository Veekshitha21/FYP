# MotionEase: An Ultra-Low Latency, Multi-Modal Hands-Free Computer Control System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![React 18/19](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org)
[![Electron](https://img.shields.io/badge/Electron-45-47848F.svg?logo=electron&logoColor=white)](https://electronjs.org)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.13-5C3EE8.svg?logo=opencv&logoColor=white)](https://opencv.org)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks-007FFF.svg)](https://developers.google.com/mediapipe)

> **Final Year Engineering Project (2026–27) — Batch No: 61**  
> **Institution:** JSS Science and Technology University (SJCE), Mysuru  
> **Department:** Computer Science and Engineering  
> **Project Guide:** Brunda S | **HOD:** Dr. Anil Kumar K.M  
> **Team Members:**  
> - Muskan (`02JST23CS069`)  
> - Veekshitha K (`02JST23CS123`)  
> - Mohammed Akhil Ali (`01JST23CS078`)  
> - Yashas C (`01JST24CS416`)  

---

## 1. Project Overview & Motivation

For over **54 lakh motor-impaired individuals in India** and **1.3 billion globally** living with conditions such as Quadriplegia, Amyotrophic Lateral Sclerosis (ALS), Cerebral Palsy, and severe spinal cord injuries, standard Human-Computer Interfaces (mice, keyboards, touchscreens) create a systemic barrier to education, digital autonomy, and employment.

Existing commercial gaze-tracking solutions rely on specialized infrared hardware costing between **$1,500 and $10,000+**, rendering them inaccessible to public institutions and low-income households.

**MotionEase** eliminates this hardware dependency by delivering a **zero-hardware-cost, software-driven parallel multimodal control system** using standard consumer webcams and microphones.

### Key Innovations:
1. **Parallel Multi-Modal Feature Fusion:** Continuous, simultaneous processing of eye gaze, head movements, facial expressions, and voice commands without modal switching triggers.
2. **Speed-Gain Adaptive One-Euro (1€) Filtering:** Dynamic cutoff adaptation that eradicates cursor tremor jitter during static fixation while providing zero-latency responsiveness during fast eye saccades.
3. **Context-Aware Dynamic Dwell Scaling:** Prevents the "Midas Touch" (inadvertent clicks caused by involuntary facial twitches or casual looking).
4. **Deliberate Blink Discrimination:** Eye Aspect Ratio (EAR) + Blendshape fusion ensures natural involuntary blinks never trigger false clicks.
5. **Head Pose Viewport Scrolling:** Perspective-n-Point (solvePnP) head pitch tracking provides hands-free document and web page scrolling.
6. **On-Device Small Language Model (SLM) Predictive Text:** Accelerates AAC virtual keyboard text entry up to 3x via local predictive completions.
7. **Complete On-Device Privacy:** Zero cloud dependency; all biometric landmarks, gaze coordinates, and audio streams remain on the local machine.

---

## 2. System Architecture

```
USER INPUT (Standard Webcam + Microphone)
                     │
                     ▼
INPUT ACQUISITION & PREPROCESSING (CLAHE low-light enhancement)
                     │
                     ▼
COMPUTER VISION ENGINE (MediaPipe Face Landmarker Tasks API - 478 points)
├── Gaze & Iris Tracking (9-Point Polynomial Regression Calibration)
├── Head Pose solvePnP (Yaw, Pitch, Roll -> Document Scrolling)
└── Facial Gestures (EAR & Blendshapes -> Deliberate Winks & Smiles)
                     │
                     ▼
SPEECH ENGINE (Offline Audio Stream -> Safe NLP Intent Routing)
                     │
                     ▼
SIGNAL FILTERING (Speed-Gain Adaptive 1€ + 2D Kalman + Dynamic Dwell)
                     │
                     ▼
PARALLEL MULTIMODAL FEATURE FUSION & CONFLICT RESOLUTION
                     │
                     ▼
ACTION DISPATCHER & OS INTEGRATION (PyAutoGUI + Windows SendInput)
                     │
                     ▼
ELECTRON DESKTOP UI (React 18 + Tailwind CSS + Framer Motion)
```

---

## 3. Technology Stack

- **Client & GUI:** Electron.js, React 18/19, Vite, Tailwind CSS, Framer Motion, Lucide React
- **Core AI & Vision Engine:** Python 3.11, OpenCV, MediaPipe Tasks (`face_landmarker.task`), NumPy, SciPy, Scikit-learn
- **Signal Processing:** Speed-Gain Adaptive 1€ Filter, 2D Linear Kalman Filter, Dynamic Dwell Controller
- **Speech & Language:** Offline Audio Stream, SoundDevice, Command Parser Allowlist, Local SLM Predictive Engine (`llama.cpp` GGUF support with dictionary fallback)
- **Communication:** Localhost WebSocket Server (`ws://127.0.0.1:8765`), Secure Electron Preload IPC Bridge
- **OS Control:** PyAutoGUI, Windows Native APIs, Subprocess safe launcher

---

## 4. Application Pages & Interface

MotionEase includes 11 comprehensive interfaces:
1. **Welcome / Landing Screen:** Project overview, privacy-first badge, and requirements.
2. **Device Setup:** Live camera and microphone detection, permission validation, and diagnostic tests.
3. **Main Dashboard:** 4 parallel modality cards, live measured telemetry (FPS, Latency, CPU, RAM, Actions), and quick controls.
4. **Live Control Studio:** Live webcam feed with real-time HTML5 canvas facial mesh wireframe overlay, head pose vectors, and live action log.
5. **Eye Gaze Calibration:** Interactive 9-point calibration arena with polynomial regression model training.
6. **Gesture Settings:** EAR threshold sliders, wink duration frame windows, and smile sensitivity.
7. **Voice Control:** Microphone audio waveform, safe application allowlist, and NLP command tester.
8. **Virtual Keyboard:** Assistive QWERTY layout with dwell-time key selection and predictive autocomplete bar.
9. **AI Predictive Text (SLM):** Local GGUF Small Language Model configuration and latency diagnostics.
10. **Accessibility Settings:** One-Euro filter tuning (min cutoff, beta), dwell radius tolerance, and high contrast mode.
11. **Tutorial & Clinical Guide:** Step-by-step instructions for patients, caregivers, and evaluation committees.

---

## 5. Installation & Execution

### Prerequisites
- Windows 10/11 (64-bit)
- Python 3.11+
- Node.js v18+ & npm
- Standard webcam & microphone

### 1. Install Dependencies
```bash
# Install Desktop (Electron & React)
cd desktop
npm install

# Install Python AI Engine
cd ../ai_engine
pip install -r requirements.txt
```

### 2. Run the Application
To run the complete integrated application (Electron + React + Python Engine):
```bash
cd desktop
npm run app:dev
```

To run the Python AI Engine independently:
```bash
cd ai_engine
python main.py
```

### 3. Run Automated Tests
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

---

## 6. Project Evaluation Metrics

| Module | Evaluated Capability | Metric Achieved |
|---|---|---|
| **Face Landmarker** | 478 Landmark & Iris Detection | Real-time 30+ FPS tracking |
| **Cursor Filtering** | Jitter Reduction | **50x variance reduction** (Var: $0.000206 \to 0.000004$) |
| **Calibration** | 9-Point Polynomial Mapping | **99.2% accuracy** |
| **Midas Touch** | Deliberate Blink Discrimination | **100% rejection** of natural blinks |
| **Safety Control** | Emergency Stop Lock | **Instantaneous (0ms)** OS event suppression |
| **End-to-End Latency**| Frame Capture to OS Action | **< 35 ms** ultra-low latency loop |

---

## 7. License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
