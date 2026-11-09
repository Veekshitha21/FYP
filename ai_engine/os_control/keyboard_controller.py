"""
MODULE K.2: Keyboard Controller
File: os_control/keyboard_controller.py
Interfaces with system keyboard events via PyAutoGUI.
Dispatches virtual keyboard characters, backspace, enter, and text strings.
"""

from typing import List
import pyautogui
from utils.logger import get_logger

logger = get_logger("KeyboardController")

class KeyboardController:
    def __init__(self):
        pass

    def type_string(self, text: str):
        """Types out a string of characters."""
        try:
            pyautogui.write(text, interval=0.01)
            logger.info(f"Typed text into OS: '{text}'")
        except Exception as e:
            logger.error(f"Type text error: {e}")

    def press_key(self, key_name: str):
        """Presses and releases a specific key (e.g. 'enter', 'backspace', 'tab')."""
        try:
            pyautogui.press(key_name.lower())
            logger.info(f"Pressed OS key: '{key_name}'")
        except Exception as e:
            logger.error(f"Press key error: {e}")

    def hotkey(self, *keys: str):
        """Triggers a keyboard shortcut (e.g. 'ctrl', 'c')."""
        try:
            pyautogui.hotkey(*keys)
            logger.info(f"Executed hotkey: {keys}")
        except Exception as e:
            logger.error(f"Hotkey error: {e}")
