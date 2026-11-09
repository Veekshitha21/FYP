"""
MODULE J.3: Context-Aware Intent Router
File: fusion/intent_router.py
Translates multimodal events (Gaze, Head, Facial Gesture, Voice) into
concrete OS interaction commands and dispatches them to the ActionDispatcher.
"""

from typing import Dict, Any, Optional
from utils.logger import get_logger
from fusion.action_validator import ActionValidator
from fusion.conflict_resolver import ConflictResolver
from os_control.action_dispatcher import ActionDispatcher

logger = get_logger("IntentRouter")

class IntentRouter:
    def __init__(self, dispatcher: ActionDispatcher):
        self.dispatcher = dispatcher
        self.validator = ActionValidator()
        self.resolver = ConflictResolver()

    def route_gaze_movement(self, x_norm: float, y_norm: float, confidence: float):
        """Routes filtered cursor movement directly to the OS."""
        if confidence >= 0.5:
            self.dispatcher.dispatch("MOVE_CURSOR", (x_norm, y_norm))

    def route_head_scroll(self, scroll_direction: str, confidence: float):
        """Routes head pose scroll intentions (SCROLL_UP / SCROLL_DOWN)."""
        valid, _ = self.validator.validate_action(scroll_direction, confidence, source="head")
        if not valid:
            return

        amount = 50 if scroll_direction == "SCROLL_UP" else -50
        self.dispatcher.dispatch("SCROLL", amount)

    def route_gesture_action(self, gesture: str, confidence: float):
        """Routes validated deliberate facial gestures."""
        valid, reason = self.validator.validate_action(gesture, confidence, source="gesture")
        if not valid:
            logger.debug(f"Gesture {gesture} rejected: {reason}")
            return

        if gesture == "LEFT_WINK":
            if self.resolver.resolve_click("LEFT_CLICK", source="gesture"):
                self.dispatcher.dispatch("LEFT_CLICK")

        elif gesture == "RIGHT_WINK":
            if self.resolver.resolve_click("RIGHT_CLICK", source="gesture"):
                self.dispatcher.dispatch("RIGHT_CLICK")

        elif gesture == "SMILE":
            if self.resolver.resolve_click("DOUBLE_CLICK", source="gesture"):
                self.dispatcher.dispatch("DOUBLE_CLICK")

    def route_dwell_click(self, confidence: float):
        """Routes dynamic dwell-based click when eye rests on a target."""
        if self.resolver.resolve_click("LEFT_CLICK", source="dwell"):
            self.dispatcher.dispatch("LEFT_CLICK")

    def route_voice_intent(self, intent_data: Dict[str, Any]):
        """Routes parsed voice commands."""
        intent = intent_data.get("intent")
        target = intent_data.get("target")
        confidence = intent_data.get("confidence", 0.9)

        valid, _ = self.validator.validate_action(intent, confidence, source="voice")
        if not valid:
            return

        if intent == "LEFT_CLICK":
            if self.resolver.resolve_click("LEFT_CLICK", source="voice"):
                self.dispatcher.dispatch("LEFT_CLICK")
        elif intent == "DOUBLE_CLICK":
            if self.resolver.resolve_click("DOUBLE_CLICK", source="voice"):
                self.dispatcher.dispatch("DOUBLE_CLICK")
        elif intent == "RIGHT_CLICK":
            if self.resolver.resolve_click("RIGHT_CLICK", source="voice"):
                self.dispatcher.dispatch("RIGHT_CLICK")
        elif intent == "SCROLL_UP":
            self.dispatcher.dispatch("SCROLL", 120)
        elif intent == "SCROLL_DOWN":
            self.dispatcher.dispatch("SCROLL", -120)
        elif intent == "PRESS_ENTER":
            self.dispatcher.dispatch("PRESS_KEY", "enter")
        elif intent == "PRESS_BACKSPACE":
            self.dispatcher.dispatch("PRESS_KEY", "backspace")
        elif intent == "TYPE_TEXT" and target:
            self.dispatcher.dispatch("TYPE_TEXT", target)
        elif intent == "OPEN_APPLICATION" and target:
            self.dispatcher.dispatch("LAUNCH_APP", target)
        elif intent == "PAUSE":
            self.dispatcher.dispatch("PAUSE")
        elif intent == "RESUME":
            self.dispatcher.dispatch("RESUME")
        elif intent == "EMERGENCY_STOP":
            self.dispatcher.dispatch("EMERGENCY_STOP")
