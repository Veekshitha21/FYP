"""
MODULE F: Facial Gesture Detection
File: vision/gesture_detector.py
Detects deliberate facial gestures (left wink, right wink, smile, mouth open)
using a dual approach: Eye Aspect Ratio (EAR) + MediaPipe facial blendshapes.
Enforces deliberate duration windows and cooldowns to strictly prevent involuntary
blinks from triggering false clicks.
"""

import time
from typing import Dict, Any, List, Tuple
from utils.logger import get_logger
from utils.helpers import calculate_ear, calculate_mar, current_time_ms
import config

logger = get_logger("GestureDetector")

class GestureDetector:
    def __init__(self):
        # Frame counters for temporal gesture validation
        self.left_eye_closed_frames = 0
        self.right_eye_closed_frames = 0
        self.both_eyes_closed_frames = 0
        self.smile_frames = 0
        self.mouth_open_frames = 0

        # Cooldown management
        self.last_gesture_time_ms = 0.0
        self.gesture_cooldown_ms = config.GESTURE_COOLDOWN_MS

        # Sensitivity thresholds
        self.ear_threshold = config.EAR_CLOSED_THRESHOLD
        self.wink_frames_min = config.WINK_CONSECUTIVE_FRAMES_MIN
        self.wink_frames_max = config.WINK_CONSECUTIVE_FRAMES_MAX

        # Blendshape threshold fallback/fusion
        self.blendshape_blink_threshold = 0.55
        self.blendshape_smile_threshold = 0.45
        self.blendshape_jaw_threshold = 0.40

        # Gesture enabled toggles
        self.enabled_gestures = {
            "LEFT_WINK": True,
            "RIGHT_WINK": True,
            "SMILE": True,
            "MOUTH_OPEN": True
        }

    def set_gesture_enabled(self, gesture: str, enabled: bool):
        """Enables or disables individual gestures dynamically."""
        if gesture in self.enabled_gestures:
            self.enabled_gestures[gesture] = enabled
            logger.info(f"Gesture {gesture} enabled: {enabled}")

    def detect_gestures(
        self,
        left_eye_pts: List[Tuple[float, float]],
        right_eye_pts: List[Tuple[float, float]],
        blendshapes: Dict[str, float],
        timestamp_ms: float = 0.0
    ) -> Dict[str, Any]:
        """
        Analyzes eye landmarks and blendshapes to recognize deliberate gestures.
        Returns: {
            'gesture': Optional[str],
            'confidence': float,
            'left_ear': float,
            'right_ear': float,
            'is_blink': bool,
            'blendshapes_summary': dict
        }
        """
        now = timestamp_ms if timestamp_ms > 0 else current_time_ms()

        # 1. Calculate EAR
        left_ear = calculate_ear(left_eye_pts)
        right_ear = calculate_ear(right_eye_pts)

        # 2. Extract blendshape blink scores if available
        bs_left_blink = blendshapes.get("eyeBlinkLeft", 0.0)
        bs_right_blink = blendshapes.get("eyeBlinkRight", 0.0)
        bs_smile_left = blendshapes.get("mouthSmileLeft", 0.0)
        bs_smile_right = blendshapes.get("mouthSmileRight", 0.0)
        bs_jaw_open = blendshapes.get("jawOpen", 0.0)

        # Determine eye state using fused EAR + blendshapes
        left_closed = (left_ear < self.ear_threshold) or (bs_left_blink > self.blendshape_blink_threshold)
        right_closed = (right_ear < self.ear_threshold) or (bs_right_blink > self.blendshape_blink_threshold)

        detected_gesture = None
        confidence = 0.0
        is_normal_blink = False

        # Involuntary blink detection: Both eyes closed
        if left_closed and right_closed:
            self.both_eyes_closed_frames += 1
            self.left_eye_closed_frames = 0
            self.right_eye_closed_frames = 0
            is_normal_blink = True
            # Involuntary blinks explicitly produce NO click
            return {
                "gesture": None,
                "confidence": 0.0,
                "left_ear": round(left_ear, 3),
                "right_ear": round(right_ear, 3),
                "is_blink": True,
                "blendshapes_summary": {
                    "smile": round((bs_smile_left + bs_smile_right) / 2.0, 2),
                    "jaw_open": round(bs_jaw_open, 2)
                }
            }
        else:
            self.both_eyes_closed_frames = 0

        # Check cooldown
        in_cooldown = (now - self.last_gesture_time_ms) < self.gesture_cooldown_ms

        # Left Eye Closed ONLY (Left Wink) -> Left Click
        if left_closed and not right_closed:
            self.left_eye_closed_frames += 1
            self.right_eye_closed_frames = 0
        elif not left_closed and self.left_eye_closed_frames > 0:
            # Wink released - check if duration meets deliberate threshold
            if (self.wink_frames_min <= self.left_eye_closed_frames <= self.wink_frames_max) and not in_cooldown:
                if self.enabled_gestures.get("LEFT_WINK", True):
                    detected_gesture = "LEFT_WINK"
                    confidence = 0.95
                    self.last_gesture_time_ms = now
                    logger.info(f"Deliberate Left Wink detected ({self.left_eye_closed_frames} frames).")
            self.left_eye_closed_frames = 0

        # Right Eye Closed ONLY (Right Wink) -> Right Click
        if right_closed and not left_closed:
            self.right_eye_closed_frames += 1
            self.left_eye_closed_frames = 0
        elif not right_closed and self.right_eye_closed_frames > 0:
            # Wink released
            if (self.wink_frames_min <= self.right_eye_closed_frames <= self.wink_frames_max) and not in_cooldown:
                if self.enabled_gestures.get("RIGHT_WINK", True):
                    detected_gesture = "RIGHT_WINK"
                    confidence = 0.95
                    self.last_gesture_time_ms = now
                    logger.info(f"Deliberate Right Wink detected ({self.right_eye_closed_frames} frames).")
            self.right_eye_closed_frames = 0

        # Smile detection (Mouth Smile Left & Right)
        avg_smile = (bs_smile_left + bs_smile_right) / 2.0
        if avg_smile > self.blendshape_smile_threshold:
            self.smile_frames += 1
            if self.smile_frames >= 5 and not in_cooldown:
                if self.enabled_gestures.get("SMILE", True):
                    detected_gesture = "SMILE"
                    confidence = round(avg_smile, 2)
                    self.last_gesture_time_ms = now
                    self.smile_frames = 0
                    logger.info("Deliberate Smile detected.")
        else:
            self.smile_frames = 0

        # Mouth Open (Jaw Open)
        if bs_jaw_open > self.blendshape_jaw_threshold:
            self.mouth_open_frames += 1
            if self.mouth_open_frames >= 6 and not in_cooldown:
                if self.enabled_gestures.get("MOUTH_OPEN", True):
                    detected_gesture = "MOUTH_OPEN"
                    confidence = round(bs_jaw_open, 2)
                    self.last_gesture_time_ms = now
                    self.mouth_open_frames = 0
                    logger.info("Mouth Open detected.")
        else:
            self.mouth_open_frames = 0

        return {
            "gesture": detected_gesture,
            "confidence": confidence,
            "left_ear": round(left_ear, 3),
            "right_ear": round(right_ear, 3),
            "is_blink": is_normal_blink,
            "blendshapes_summary": {
                "smile": round(avg_smile, 2),
                "jaw_open": round(bs_jaw_open, 2)
            }
        }
