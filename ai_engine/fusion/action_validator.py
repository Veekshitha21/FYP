"""
MODULE J.1: Action Validator
File: fusion/action_validator.py
Validates potential system actions based on minimum confidence thresholds,
deliberate intention checks, and safety rules.
"""

from typing import Dict, Any, Tuple
from utils.logger import get_logger

logger = get_logger("ActionValidator")

class ActionValidator:
    def __init__(self, min_confidence: float = 0.65):
        self.min_confidence = min_confidence

    def validate_action(self, action_type: str, confidence: float, source: str) -> Tuple[bool, str]:
        """
        Validates if an action is safe and meets confidence criteria.
        Returns: (is_valid: bool, reason: str)
        """
        # Always allow safety halts regardless of confidence
        if action_type in ["EMERGENCY_STOP", "PAUSE"]:
            return True, "Safety override accepted"

        # Check confidence
        if confidence < self.min_confidence:
            return False, f"Confidence {confidence:.2f} below threshold {self.min_confidence:.2f}"

        # Additional domain validation rules
        if action_type in ["LEFT_CLICK", "RIGHT_CLICK", "DOUBLE_CLICK"]:
            if source == "gesture" and confidence < 0.80:
                return False, "Facial gesture confidence too low for deliberate click"

        return True, "Validation passed"
