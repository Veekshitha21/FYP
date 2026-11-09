"""
MotionEase Configuration File
Central configuration for all computer vision, speech, signal processing,
fusion, OS control, and WebSocket parameters.
"""

import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
MODELS_DIR = PROJECT_ROOT / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Communication Settings
WEBSOCKET_HOST = "127.0.0.1"
WEBSOCKET_PORT = 8765
PREVIEW_FPS = 30
METRICS_REPORT_INTERVAL_SEC = 1.0

# Vision Settings
DEFAULT_CAMERA_INDEX = 0
FRAME_WIDTH = 640
FRAME_HEIGHT = 480
TARGET_FPS = 30
ENABLE_CLAHE = True
CLAHE_CLIP_LIMIT = 2.0
CLAHE_TILE_GRID_SIZE = (8, 8)

# MediaPipe Face Landmarker
FACE_LANDMARKER_MODEL_PATH = str(MODELS_DIR / "face_landmarker.task")
MIN_FACE_DETECTION_CONFIDENCE = 0.5
MIN_FACE_TRACKING_CONFIDENCE = 0.5

# Gaze Calibration & Tracking
CALIBRATION_FILE = str(BASE_DIR / "calibration_data.json")
CALIBRATION_POINTS = [
    {"id": "top_left", "x": 0.1, "y": 0.1},
    {"id": "top_center", "x": 0.5, "y": 0.1},
    {"id": "top_right", "x": 0.9, "y": 0.1},
    {"id": "mid_left", "x": 0.1, "y": 0.5},
    {"id": "center", "x": 0.5, "y": 0.5},
    {"id": "mid_right", "x": 0.9, "y": 0.5},
    {"id": "bottom_left", "x": 0.1, "y": 0.9},
    {"id": "bottom_center", "x": 0.5, "y": 0.9},
    {"id": "bottom_right", "x": 0.9, "y": 0.9},
]
SAMPLES_PER_CALIBRATION_POINT = 30

# Signal Filtering: One-Euro Filter Parameters
ONE_EURO_MIN_CUTOFF = 1.0       # Minimum cutoff frequency in Hz
ONE_EURO_BETA = 0.05            # Speed coefficient (higher = less lag, lower = more smooth)
ONE_EURO_DCUTOFF = 1.0          # Derivative cutoff frequency

# Kalman Filter Parameters
KALMAN_PROCESS_NOISE = 1e-4
KALMAN_MEASUREMENT_NOISE = 1e-2

# Dynamic Dwell Scaling
DWELL_TIME_MIN_MS = 600
DWELL_TIME_MAX_MS = 1500
DWELL_RADIUS_PIXELS = 35
DWELL_CLICK_COOLDOWN_MS = 800

# Facial Gesture Detection Thresholds
EAR_CLOSED_THRESHOLD = 0.18      # Eye Aspect Ratio threshold for closed eye
EAR_OPEN_THRESHOLD = 0.25        # EAR threshold for open eye
WINK_CONSECUTIVE_FRAMES_MIN = 3  # Minimum frames for deliberate wink (~100ms at 30fps)
WINK_CONSECUTIVE_FRAMES_MAX = 20 # Maximum frames (longer is a resting closure, not a wink click)
SMILE_MAR_THRESHOLD = 0.45       # Mouth aspect / smile ratio
MOUTH_OPEN_RATIO = 0.50
GESTURE_COOLDOWN_MS = 600

# Head Pose Scroll Thresholds (degrees)
HEAD_PITCH_SCROLL_UP = -12.0
HEAD_PITCH_SCROLL_DOWN = 10.0
HEAD_YAW_THRESHOLD = 18.0
SCROLL_SPEED_BASE = 40
SCROLL_COOLDOWN_MS = 150

# Speech Recognition & Voice Intents
SPEECH_SAMPLE_RATE = 16000
SPEECH_CHANNELS = 1
SPEECH_CHUNK_DURATION_SEC = 2.0
VOICE_INTENT_CONFIDENCE_THRESHOLD = 0.65

# Safe Application Allowlist for Voice Launcher
ALLOWED_APPLICATIONS = {
    "chrome": "chrome",
    "browser": "chrome",
    "notepad": "notepad",
    "calculator": "calc",
    "explorer": "explorer",
    "file explorer": "explorer",
    "settings": "ms-settings:",
    "task manager": "taskmgr",
}

# OS Control Safeguards
FAILSAFE_CORNER_ACTIVATED = True
EMERGENCY_STOP_ACTIVE = False
MOUSE_SMOOTH_DURATION = 0.0
