"""
MODULE J.4: Multimodal Feature Fusion
File: fusion/feature_fusion.py
Central orchestrator for parallel multimodal fusion. Simultaneously receives
features from Vision (Gaze, Head Pose, Gestures) and Audio (Speech Intents),
computes cross-modal contextual synergy, and coordinates execution.
"""

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

        # Last observed multimodal state
        self.current_state = {
            "gaze": {"x": 0.5, "y": 0.5, "confidence": 0.0},
            "head": {"pitch": 0.0, "yaw": 0.0, "roll": 0.0, "direction": "neutral"},
            "gesture": {"last_gesture": None, "confidence": 0.0},
            "voice": {"last_command": None, "intent": None}
        }

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
        logger.info(f"Modality '{modality}' enabled status: {enabled}")

    def process_vision_frame(
        self,
        gaze_data: Optional[Dict[str, Any]],
        head_data: Optional[Dict[str, Any]],
        gesture_data: Optional[Dict[str, Any]],
        dwell_data: Optional[Dict[str, Any]]
    ):
        """
        Processes synchronized vision features from the current video frame.
        """
        is_scrolling = False

        # 1. Head Pose & Scrolling
        if self.head_enabled and head_data and head_data.get("valid"):
            self.current_state["head"] = head_data
            scroll_action = head_data.get("scroll_action")
            if scroll_action:
                is_scrolling = True
                self.router.route_head_scroll(scroll_action, head_data.get("confidence", 0.9))

        # 2. Gaze Pointer Control
        if self.gaze_enabled and gaze_data:
            gx = gaze_data.get("screen_x", 0.5)
            gy = gaze_data.get("screen_y", 0.5)
            g_conf = gaze_data.get("confidence", 0.8)
            self.current_state["gaze"] = {"x": gx, "y": gy, "confidence": g_conf}

            # Only move cursor if user is not in the middle of a drastic head scroll
            if not is_scrolling:
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
