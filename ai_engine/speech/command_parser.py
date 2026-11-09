"""
MODULE H.2: Voice Command Parser
File: speech/command_parser.py
Parses natural spoken text into structured, validated system intents.
Restricts execution to a safe application allowlist and safe action macros.
"""

import re
from typing import Dict, Any, Optional
from utils.logger import get_logger
import config

logger = get_logger("CommandParser")

class VoiceCommandParser:
    def __init__(self):
        self.allowed_apps = config.ALLOWED_APPLICATIONS

    def parse(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Parses text and extracts intent and optional payload.
        Returns: {
            'intent': str,
            'target': Optional[str],
            'confidence': float,
            'raw_text': str
        } or None if no match.
        """
        if not text or not text.strip():
            return None

        cleaned = text.strip().lower()

        # 1. Emergency Stop & Safety
        if "emergency stop" in cleaned or "halt" in cleaned:
            return {"intent": "EMERGENCY_STOP", "target": None, "confidence": 1.0, "raw_text": text}

        if cleaned in ["pause", "pause control", "pause tracking", "freeze"]:
            return {"intent": "PAUSE", "target": None, "confidence": 0.95, "raw_text": text}

        if cleaned in ["resume", "resume control", "resume tracking", "unpause"]:
            return {"intent": "RESUME", "target": None, "confidence": 0.95, "raw_text": text}

        # 2. Clicks & Selection
        if cleaned in ["double click", "double tap"]:
            return {"intent": "DOUBLE_CLICK", "target": None, "confidence": 0.95, "raw_text": text}

        if cleaned in ["click", "left click", "select", "press"]:
            return {"intent": "LEFT_CLICK", "target": None, "confidence": 0.90, "raw_text": text}

        if cleaned in ["right click", "context menu"]:
            return {"intent": "RIGHT_CLICK", "target": None, "confidence": 0.90, "raw_text": text}

        # 3. Viewport Scrolling
        if "scroll down" in cleaned or "page down" in cleaned or cleaned == "down":
            return {"intent": "SCROLL_DOWN", "target": None, "confidence": 0.92, "raw_text": text}

        if "scroll up" in cleaned or "page up" in cleaned or cleaned == "up":
            return {"intent": "SCROLL_UP", "target": None, "confidence": 0.92, "raw_text": text}

        # 4. Keyboard Shortcuts & Keys
        if cleaned in ["press enter", "enter", "return", "submit"]:
            return {"intent": "PRESS_ENTER", "target": None, "confidence": 0.95, "raw_text": text}

        if cleaned in ["press backspace", "backspace", "delete"]:
            return {"intent": "PRESS_BACKSPACE", "target": None, "confidence": 0.95, "raw_text": text}

        # 5. Type text ("type hello world" -> payload: "hello world")
        match_type = re.match(r"^(?:type|write|input)\s+(.+)$", cleaned)
        if match_type:
            payload = match_type.group(1).strip()
            return {"intent": "TYPE_TEXT", "target": payload, "confidence": 0.90, "raw_text": text}

        # 6. Open Application with Allowlist verification
        match_open = re.match(r"^(?:open|launch|start)\s+(.+)$", cleaned)
        if match_open:
            app_query = match_open.group(1).strip()
            # Lookup in safe allowlist
            for key, exec_name in self.allowed_apps.items():
                if key in app_query:
                    return {
                        "intent": "OPEN_APPLICATION",
                        "target": exec_name,
                        "confidence": 0.95,
                        "raw_text": text
                    }
            logger.warning(f"Application '{app_query}' is not in the safe allowlist.")
            return None

        return None
