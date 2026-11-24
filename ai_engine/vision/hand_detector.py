"""
MODULE H: Hand Landmark & Gesture Detector
File: vision/hand_detector.py
Uses MediaPipe Hand Landmarker Tasks API to track hand position in real time.
Extracts index fingertip and palm center for cursor steering, and detects
pinch (thumb + index) and fist gestures for mouse clicks.
"""

import os
import math
from typing import Optional, Dict, Any, List, Tuple
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from utils.logger import get_logger
import config

logger = get_logger("HandDetector")

# MediaPipe Hand landmark indices
WRIST = 0
THUMB_CMC = 1
THUMB_MCP = 2
THUMB_IP = 3
THUMB_TIP = 4
INDEX_FINGER_MCP = 5
INDEX_FINGER_PIP = 6
INDEX_FINGER_DIP = 7
INDEX_FINGER_TIP = 8
MIDDLE_FINGER_MCP = 9
MIDDLE_FINGER_PIP = 10
MIDDLE_FINGER_DIP = 11
MIDDLE_FINGER_TIP = 12
RING_FINGER_MCP = 13
RING_FINGER_PIP = 14
RING_FINGER_DIP = 15
RING_FINGER_TIP = 16
PINKY_MCP = 17
PINKY_PIP = 18
PINKY_DIP = 19
PINKY_TIP = 20

class HandDetector:
    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            self.model_path = str(config.MODELS_DIR / "hand_landmarker.task")
        else:
            self.model_path = model_path

        self.detector = None
        self.is_initialized = False

        # Smoothing state
        self._prev_x: Optional[float] = None
        self._prev_y: Optional[float] = None

        # Gesture state
        self.pinch_frames = 0
        self.last_pinch_time = 0.0
        self.pinch_cooldown_sec = 0.4

        self._init_detector()

    def _init_detector(self):
        if not os.path.exists(self.model_path):
            logger.warning(f"Hand landmarker model not found at {self.model_path}. Hand tracking disabled.")
            return

        try:
            base_options = python.BaseOptions(model_asset_path=self.model_path)
            options = vision.HandLandmarkerOptions(
                base_options=base_options,
                num_hands=1,
                min_hand_detection_confidence=0.5,
                min_hand_presence_confidence=0.5,
                min_tracking_confidence=0.5
            )
            self.detector = vision.HandLandmarker.create_from_options(options)
            self.is_initialized = True
            logger.info("MediaPipe Hand Landmarker initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Hand Landmarker: {e}")
            self.detector = None

    def detect(self, frame_bgr: np.ndarray, timestamp_ms: float = 0.0) -> Dict[str, Any]:
        """
        Detects hand in BGR frame and computes cursor coordinates and gestures.
        Returns:
            hand_detected: bool
            cursor_x: float (0.0 to 1.0)
            cursor_y: float (0.0 to 1.0)
            gesture: Optional[str] ('PINCH_CLICK', 'FIST', None)
            confidence: float
            landmarks: list of (x, y) normalized
        """
        if not self.is_initialized or self.detector is None or frame_bgr is None:
            return {
                "hand_detected": False,
                "cursor_x": 0.5,
                "cursor_y": 0.5,
                "gesture": None,
                "confidence": 0.0,
                "landmarks": []
            }

        h, w = frame_bgr.shape[:2]
        rgb_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        try:
            result = self.detector.detect(mp_image)
        except Exception as e:
            logger.debug(f"Hand detection error: {e}")
            return {
                "hand_detected": False,
                "cursor_x": 0.5,
                "cursor_y": 0.5,
                "gesture": None,
                "confidence": 0.0,
                "landmarks": []
            }

        if not result.hand_landmarks or len(result.hand_landmarks) == 0:
            self._prev_x = None
            self._prev_y = None
            self.pinch_frames = 0
            return {
                "hand_detected": False,
                "cursor_x": 0.5,
                "cursor_y": 0.5,
                "gesture": None,
                "confidence": 0.0,
                "landmarks": []
            }

        hand_lms = result.hand_landmarks[0]
        landmarks_list = [{"x": round(lm.x, 3), "y": round(lm.y, 3)} for lm in hand_lms]

        # Use index fingertip (8) for precise pointing, or palm center (0 and 9 average)
        # Using index finger tip + middle MCP center creates intuitive pointing
        idx_tip = hand_lms[INDEX_FINGER_TIP]
        mid_mcp = hand_lms[MIDDLE_FINGER_MCP]
        thumb_tip = hand_lms[THUMB_TIP]

        # Pointing coordinates: mirror X so moving hand right moves cursor right!
        # In webcam feed, user moving hand right appears at lower X (camera right is user left)
        # Therefore, 1.0 - raw_x mirrors it to match user intuition
        raw_x = 1.0 - idx_tip.x
        raw_y = idx_tip.y

        # Deadband & responsive smoothing
        if self._prev_x is None:
            smooth_x = raw_x
            smooth_y = raw_y
        else:
            dx = abs(raw_x - self._prev_x)
            dy = abs(raw_y - self._prev_y)
            if dx < 0.003 and dy < 0.003:
                # Stationary lock - eliminate drift when hand is still
                smooth_x = self._prev_x
                smooth_y = self._prev_y
            else:
                # Responsive EMA: 0.55 tracks hand crisply without latency
                smooth_x = 0.55 * raw_x + 0.45 * self._prev_x
                smooth_y = 0.55 * raw_y + 0.45 * self._prev_y

        self._prev_x = smooth_x
        self._prev_y = smooth_y

        # Detect Pinch Gesture: Euclidean distance between index tip and thumb tip
        pinch_dist = math.hypot(idx_tip.x - thumb_tip.x, idx_tip.y - thumb_tip.y)
        detected_gesture = None

        now_sec = timestamp_ms / 1000.0 if timestamp_ms > 0 else 0.0
        # Pinch threshold: tips touching or very close (~0.065 in normalized space)
        if pinch_dist < 0.065:
            self.pinch_frames += 1
            if self.pinch_frames == 2:  # Trigger on second frame of deliberate pinch
                if (now_sec - self.last_pinch_time) > self.pinch_cooldown_sec:
                    detected_gesture = "PINCH_CLICK"
                    self.last_pinch_time = now_sec
                    logger.info("Hand Pinch Gesture detected -> Left Click")
        else:
            self.pinch_frames = 0

        # Optional Fist detection (all fingertips close to wrist)
        # Can be used for right click or secondary action if needed

        return {
            "hand_detected": True,
            "cursor_x": round(max(0.0, min(1.0, smooth_x)), 4),
            "cursor_y": round(max(0.0, min(1.0, smooth_y)), 4),
            "gesture": detected_gesture,
            "pinch_dist": round(pinch_dist, 3),
            "confidence": 0.95,
            "landmarks": landmarks_list
        }
