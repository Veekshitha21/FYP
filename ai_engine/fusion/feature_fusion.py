"""
MODULE J.4: Multimodal Feature Fusion
File: fusion/feature_fusion.py
Central orchestrator for parallel multimodal fusion. Simultaneously receives
features from Vision (Gaze, Head Pose, Gestures) and Audio (Speech Intents),
computes cross-modal contextual synergy, and coordinates execution.
"""

import time
from typing import Dict, Any, Optional
from utils.logger import get_logger
from fusion.intent_router import IntentRouter
from os_control.action_dispatcher import ActionDispatcher

logger = get_logger("FeatureFusion")

class MultimodalFeatureFusion:
    def __init__(self, dispatcher: ActionDispatcher):
        self.dispatcher = dispatcher
        self.router = IntentRouter(dispatcher)

        # Modality enable toggles
        self.gaze_enabled = True
        self.head_enabled = True
        self.gesture_enabled = True
        self.voice_enabled = True
        self.hand_enabled = True

        # Last observed multimodal state
        self.current_state = {
            "gaze": {"x": 0.5, "y": 0.5, "confidence": 0.0},
            "head": {"pitch": 0.0, "yaw": 0.0, "roll": 0.0, "direction": "neutral"},
            "gesture": {"last_gesture": None, "confidence": 0.0},
            "voice": {"last_command": None, "intent": None},
            "hand": {"hand_detected": False, "cursor_x": 0.5, "cursor_y": 0.5}
        }
        self._previous_pitch = None
        self._previous_pitch_time = None

        # Motion-intent gate: suppresses cursor dispatch when gaze hasn't moved enough.
        # Prevents cursor drift caused by breathing-rate facial micro-sway.
        # We track the last gaze point that actually triggered a cursor move in
        # normalised [0,1] coordinates and only dispatch again once the new point
        # differs by at least _GAZE_MOTION_GATE_PX pixels on a 1920-wide screen
        # (i.e. ~4 / 1920 ≈ 0.0021 in normalised units).
        self._last_dispatched_gaze_x: Optional[float] = None
        self._last_dispatched_gaze_y: Optional[float] = None
        # Minimum screen-pixel movement (at 1920×1080 reference) before cursor update
        self._GAZE_MOTION_GATE_PX = 4.0

    def set_modality_status(self, modality: str, enabled: bool):
        """Enables or disables individual input channels."""
        if modality == "gaze":
            self.gaze_enabled = enabled
        elif modality == "head":
            self.head_enabled = enabled
        elif modality == "gesture":
            self.gesture_enabled = enabled
        elif modality == "voice":
            self.voice_enabled = enabled
        elif modality == "hand":
            self.hand_enabled = enabled
        logger.info(f"Modality '{modality}' enabled status: {enabled}")

    def process_vision_frame(
        self,
        gaze_data: Optional[Dict[str, Any]],
        head_data: Optional[Dict[str, Any]],
        gesture_data: Optional[Dict[str, Any]],
        dwell_data: Optional[Dict[str, Any]],
        hand_data: Optional[Dict[str, Any]] = None
    ):
        """
        Processes synchronized vision features from the current video frame.
        Supports Hand Tracking, Head Pose, Eye Gaze, and Facial Gestures.
        """
        # 0. Hand Gesture Control (Active when hand is visible)
        if self.hand_enabled and hand_data and hand_data.get("hand_detected"):
            hx = hand_data.get("cursor_x", 0.5)
            hy = hand_data.get("cursor_y", 0.5)
            h_conf = hand_data.get("confidence", 0.95)
            self.current_state["hand"] = hand_data
            self.router.route_gaze_movement(hx, hy, h_conf)

            if hand_data.get("gesture") == "PINCH_CLICK":
                self.router.route_gesture_action("PINCH_CLICK", 0.95)
            return

        is_scrolling = False

        # 1. Head Pose & Scrolling
        if self.head_enabled and head_data and head_data.get("valid"):
            self.current_state["head"] = head_data
            scroll_action = head_data.get("scroll_action")
            if scroll_action:
                is_scrolling = True
                now = time.perf_counter()
                pitch = head_data.get("pitch", 0.0)
                pitch_velocity = 0.0
                if self._previous_pitch is not None and self._previous_pitch_time is not None:
                    elapsed = max(now - self._previous_pitch_time, 1e-3)
                    pitch_velocity = (pitch - self._previous_pitch) / elapsed
                self._previous_pitch = pitch
                self._previous_pitch_time = now
                self.router.route_head_scroll(
                    scroll_action,
                    head_data.get("confidence", 0.9),
                    pitch,
                    pitch_velocity
                )
            else:
                self._previous_pitch = head_data.get("pitch", 0.0)
                self._previous_pitch_time = time.perf_counter()

        # 2. Gaze Pointer Control
        if self.gaze_enabled and gaze_data:
            gx = gaze_data.get("screen_x", 0.5)
            gy = gaze_data.get("screen_y", 0.5)
            g_conf = gaze_data.get("confidence", 0.8)
            self.current_state["gaze"] = {"x": gx, "y": gy, "confidence": g_conf}

            # Only move cursor if user is not in the middle of a drastic head scroll
            if not is_scrolling:
                # Motion-intent gate: skip the cursor update if the filtered gaze
                # point has barely moved (noise from breathing / micro-sway).
                # We compare in pixel space using a 1920-wide reference screen.
                should_dispatch = True
                if self._last_dispatched_gaze_x is not None:
                    dx_px = abs(gx - self._last_dispatched_gaze_x) * 1920.0
                    dy_px = abs(gy - self._last_dispatched_gaze_y) * 1080.0
                    if dx_px < self._GAZE_MOTION_GATE_PX and dy_px < self._GAZE_MOTION_GATE_PX:
                        should_dispatch = False

                if should_dispatch:
                    self._last_dispatched_gaze_x = gx
                    self._last_dispatched_gaze_y = gy
                    self.router.route_gaze_movement(gx, gy, g_conf)

        # 3. Facial Gestures
        if self.gesture_enabled and gesture_data:
            detected_gesture = gesture_data.get("gesture")
            g_conf = gesture_data.get("confidence", 0.0)
            if detected_gesture:
                self.current_state["gesture"] = {"last_gesture": detected_gesture, "confidence": g_conf}
                self.router.route_gesture_action(detected_gesture, g_conf)

        # 4. Dynamic Dwell Click
        if self.gaze_enabled and dwell_data and dwell_data.get("click_triggered"):
            # Context-Aware rule: Don't trigger dwell click if scrolling or gesturing
            if not is_scrolling and not (gesture_data and gesture_data.get("gesture")):
                self.router.route_dwell_click(gaze_data.get("confidence", 0.9) if gaze_data else 0.8)

    def process_voice_intent(self, intent_data: Dict[str, Any]):
        """Processes voice command intent."""
        if not self.voice_enabled:
            return
        self.current_state["voice"] = {
            "last_command": intent_data.get("raw_text"),
            "intent": intent_data.get("intent")
        }
        self.router.route_voice_intent(intent_data)

    def get_fusion_state(self) -> Dict[str, Any]:
        return {
            "active_modalities": {
                "gaze": self.gaze_enabled,
                "head": self.head_enabled,
                "gesture": self.gesture_enabled,
                "voice": self.voice_enabled
            },
            "latest_state": self.current_state
        }
