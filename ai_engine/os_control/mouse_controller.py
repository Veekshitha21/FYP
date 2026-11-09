"""
MODULE K.1: Mouse Controller
File: os_control/mouse_controller.py
Interfaces with system mouse events via native Windows APIs and PyAutoGUI.
Provides smooth cursor movement, left/right/double clicks, and dynamic scrolling.
"""

import sys
from typing import Tuple
import pyautogui
from utils.logger import get_logger
import config

logger = get_logger("MouseController")

# Disable PyAutoGUI fail-safe so looking at screen corners never halts tracking
pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.0 # Zero overhead

# Native Windows cursor control setup
_is_windows = sys.platform == "win32"
if _is_windows:
    try:
        import ctypes
        import ctypes.wintypes
        _user32 = ctypes.windll.user32
    except Exception as e:
        logger.warning(f"Could not initialize Windows user32: {e}")
        _user32 = None
else:
    _user32 = None

class MouseController:
    def __init__(self):
        self.screen_width, self.screen_height = pyautogui.size()
        logger.info(f"Screen resolution detected: {self.screen_width}x{self.screen_height}")

    def move_to(self, norm_x: float, norm_y: float):
        """
        Moves the OS mouse cursor to normalized coordinates (0.0 to 1.0).
        Uses native Windows SetCursorPos for zero-latency instantaneous control.
        """
        clamped_x = max(0, min(self.screen_width - 1, int(norm_x * self.screen_width)))
        clamped_y = max(0, min(self.screen_height - 1, int(norm_y * self.screen_height)))

        if _user32:
            try:
                _user32.SetCursorPos(clamped_x, clamped_y)
                return
            except Exception:
                pass

        try:
            pyautogui.moveTo(clamped_x, clamped_y)
        except Exception as e:
            logger.debug(f"Mouse move error: {e}")

    def left_click(self):
        """Performs a primary left mouse click."""
        try:
            pyautogui.click()
            logger.info("Executed OS Left Click")
        except Exception as e:
            logger.error(f"Click error: {e}")

    def right_click(self):
        """Performs a secondary right mouse click."""
        try:
            pyautogui.rightClick()
            logger.info("Executed OS Right Click")
        except Exception as e:
            logger.error(f"Right click error: {e}")

    def double_click(self):
        """Performs a double mouse click."""
        try:
            pyautogui.doubleClick()
            logger.info("Executed OS Double Click")
        except Exception as e:
            logger.error(f"Double click error: {e}")

    def scroll(self, amount: int):
        """
        Scrolls the viewport.
        Positive amount = scroll up, Negative amount = scroll down.
        """
        try:
            pyautogui.scroll(amount)
        except Exception as e:
            logger.debug(f"Scroll error: {e}")

    def get_position(self) -> Tuple[int, int]:
        """Returns current OS cursor position in pixels."""
        pos = pyautogui.position()
        return pos.x, pos.y
