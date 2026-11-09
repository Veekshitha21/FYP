"""
MODULE I.3: Virtual Keyboard Engine
File: typing_engine/virtual_keyboard.py
Manages virtual on-screen QWERTY keyboard layout, key boundaries, gaze focus,
and dwell character accumulation.
"""

from typing import List, Dict, Any, Optional
from utils.logger import get_logger

logger = get_logger("VirtualKeyboard")

# Standard Assistive QWERTY Layout Rows
KEYBOARD_LAYOUT = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M", ",", "."],
    ["SPACE", "BACKSPACE", "ENTER", "CLEAR"]
]

class VirtualKeyboardEngine:
    def __init__(self):
        self.text_buffer: str = ""
        self.layout = KEYBOARD_LAYOUT
        self.shift_active = False

    def press_key(self, key_label: str) -> str:
        """
        Executes a key action on the virtual buffer and returns the updated text.
        """
        key_upper = key_label.upper()

        if key_upper == "SPACE":
            self.text_buffer += " "
        elif key_upper == "BACKSPACE":
            if self.text_buffer:
                self.text_buffer = self.text_buffer[:-1]
        elif key_upper == "CLEAR":
            self.text_buffer = ""
        elif key_upper == "ENTER":
            self.text_buffer += "\n"
        elif key_upper == "SHIFT":
            self.shift_active = not self.shift_active
        else:
            char = key_label.upper() if self.shift_active else key_label.lower()
            self.text_buffer += char

        logger.info(f"Key '{key_label}' pressed. Buffer: '{self.text_buffer}'")
        return self.text_buffer

    def append_suggestion(self, suggestion_text: str) -> str:
        """Appends an accepted predictive word/phrase suggestion to the buffer."""
        if not self.text_buffer or self.text_buffer.endswith(" "):
            self.text_buffer += suggestion_text + " "
        else:
            # Replace partial word at end
            tokens = self.text_buffer.split(" ")
            tokens[-1] = suggestion_text
            self.text_buffer = " ".join(tokens) + " "
        return self.text_buffer

    def clear(self):
        self.text_buffer = ""

    def get_text(self) -> str:
        return self.text_buffer
