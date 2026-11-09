# MotionEase System Architecture

## 1. Executive Architecture Summary

MotionEase is an ultra-low latency, multi-modal hands-free human-computer interface (HCI) platform designed to eliminate the physical accessibility barrier for motor-impaired individuals (ALS, Quadriplegia, Cerebral Palsy, high spinal cord injury).

Unlike traditional accessibility software that imposes rigid sequential mode switching (e.g., voice-triggering "Eye Mode", "Scroll Mode"), MotionEase employs a **Parallel Multi-Modal Feature Fusion Architecture**. Eye gaze, head movements, facial expressions, and offline voice commands are ingested simultaneously in real time and fused into unified OS actions.

```
USER INPUT
├── Standard HD Webcam (720p / 1080p @ 30+ FPS)
└── Standard Microphone (16 kHz Mono)
       │
       ▼
INPUT ACQUISITION & PREPROCESSING
├── OpenCV Frame Acquisition with monotonic timestamping
├── Adaptive Dynamic Histogram Equalization (CLAHE)
└── Audio circular buffer & RMS energy measurement
       │
       ▼
PARALLEL AI FEATURE EXTRACTION
├── MediaPipe Face Landmarker Tasks API (478 3D landmarks + 52 Blendshapes + Irises)
├── Eye Aspect Ratio (EAR) & Deliberate Wink Duration Validation
├── OpenCV solvePnP 3D Head Pose Estimation (Yaw, Pitch, Roll)
└── Offline Voice Command Parser (Safe Application Allowlist)
       │
       ▼
SIGNAL PROCESSING & FILTERING
├── Speed-Gain Adaptive 1€ (One-Euro) Signal Filter (Jitter removal & dynamic cutoff)
├── 2D Linear Kalman Filter (Trajectory smoothing & velocity prediction)
└── Context-Aware Dynamic Dwell Scaling (Target stability & Midas Touch eradication)
       │
       ▼
MULTIMODAL FEATURE FUSION & CONFLICT RESOLUTION
├── Parallel Channel Ingestion (Gaze + Head + Gesture + Speech)
├── Priority Resolution Hierarchy: Emergency Stop > Deliberate Gesture > Voice > Dwell
└── Duplicate Action Suppression & Timing Windows
       │
       ▼
ACTION DISPATCHER & OS CONTROL
├── PyAutoGUI & Windows SendInput
├── Viewport Dynamic Scrolling
├── Virtual Keyboard Dwell Keying & Autocomplete
└── Local SLM Predictive Sentence Completion (llama.cpp GGUF / Dictionary)
       │
       ▼
ELECTRON DESKTOP INTERFACE & TELEMETRY
├── Secure IPC Bridge with Context Isolation
├── Localhost WebSocket Telemetry Server (ws://127.0.0.1:8765)
└── React 18 + Tailwind + Framer Motion 11-Screen Accessibility Studio
```

---

## 2. Key Mathematical Formulations

### 2.1 Speed-Gain Adaptive One-Euro (1€) Filter

Raw gaze coordinates captured from webcams suffer from micro-saccadic tremors and noise. MotionEase implements the Casiez et al. 1€ filter:

$$\hat{X}_i = \alpha X_i + (1 - \alpha) \hat{X}_{i-1}$$

Where the dynamic smoothing factor $\alpha$ is modulated by the filtered derivative rate of change $\dot{\hat{X}}_i$:

$$\alpha = \frac{1}{1 + \frac{\tau}{\Delta t}}, \quad \tau = \frac{1}{2\pi f_c}$$

$$f_c = f_{c,min} + \beta |\dot{\hat{X}}_i|$$

- At low velocities (static fixation), $f_c \to f_{c,min} = 1.0\text{ Hz}$, eliminating trembling jitter.
- During high-speed eye saccades, $f_c$ scales linearly via $\beta = 0.05$, eliminating pointer lag.

### 2.2 Eye Aspect Ratio (EAR) & Involuntary Blink Discrimination

For eye landmarks $p_1 \dots p_6$:

$$\text{EAR} = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2 \|p_1 - p_4\|}$$

- **Involuntary Blink**: $\text{EAR}_{left} < 0.18$ **AND** $\text{EAR}_{right} < 0.18 \implies$ Dropped (NO CLICK).
- **Deliberate Left Wink**: $\text{EAR}_{left} < 0.18$ **AND** $\text{EAR}_{right} \ge 0.25$ held for $3 \le N \le 20$ frames $\implies$ Left Click on release.

### 2.3 Context-Aware Dynamic Dwell Scaling

To eradicate the "Midas Touch", the dwell duration $T_{dwell}$ dynamically scales based on positional stability within tolerance radius $R = 35\text{px}$:

$$T_{dwell} = T_{min} \cdot \left(1 + 0.8(1 - C)\right) \cdot \left(1 + 0.3 \frac{d}{R}\right)$$

Where $C \in [0, 1]$ is landmark confidence and $d$ is Euclidean deviation from the initial dwell anchor.
