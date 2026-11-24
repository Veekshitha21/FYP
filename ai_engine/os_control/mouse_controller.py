"""
MODULE K.1: Mouse Controller
File: os_control/mouse_controller.py
Interfaces with system mouse events via native Windows APIs and PyAutoGUI.
Provides smooth cursor movement, left/right/double clicks, dynamic scrolling,
and intelligent Human-Touch-to-Yield arbitration.
"""

import sys
import time
import math
from typing import Tuple, Optional
import pyautogui
from utils.logger import get_logger
import config

logger = get_logger("MouseController")

# Disable PyAutoGUI internal fail-safe so custom safety arbiters handle yields cleanly
pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.0 # Zero overhead

# Native Windows cursor control setup
_is_windows = sys.platform == "win32"
if _is_windows:
    try:
        import ctypes
        import ctypes.wintypes
        _user32 = ctypes.windll.user32
        class _POINT(ctypes.Structure):
            _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]
    except Exception as e:
        logger.warning(f"Could not initialize Windows user32: {e}")
        _user32 = None
else:
    _user32 = None

class MouseController:
    def __init__(self):
        self.screen_width, self.screen_height = pyautogui.size()
        self._last_position: Tuple[int, int] = pyautogui.position()
        self._last_ai_pos: Optional[Tuple[int, int]] = None
        self.deadband_px = config.CURSOR_DEADBAND_PIXELS
        
        # Human-Touch-to-Yield State
        self.human_yield_until: float = 0.0
        self._last_yield_log_time: float = 0.0
        
        logger.info(f"Screen resolution detected: {self.screen_width}x{self.screen_height}")

    def update_settings(self, deadband_px: Optional[int] = None):
        """Dynamically updates fixation deadband to adjust jitter vs precision."""
        if deadband_px is not None:
            self.deadband_px = max(2, min(30, int(deadband_px)))
            logger.info(f"MouseController deadband updated: {self.deadband_px}px")

    def get_position(self) -> Tuple[int, int]:
        """Returns current OS cursor position in pixels using fastest available API."""
        if _user32:
            try:
                pt = _POINT()
                if _user32.GetCursorPos(ctypes.byref(pt)):
                    return int(pt.x), int(pt.y)
            except Exception:
                pass
        pos = pyautogui.position()
        return pos.x, pos.y

    def is_human_yielding(self) -> bool:
        """Returns True if MotionEase is currently yielding control to the human user."""
        return time.perf_counter() < self.human_yield_until

    def yield_to_human(self, duration_sec: float = None):
        """Forces MotionEase to yield cursor control to the human for a specified duration."""
        duration = duration_sec or config.HUMAN_OVERRIDE_YIELD_SEC
        self.human_yield_until = time.perf_counter() + duration
        now = time.perf_counter()
        if (now - self._last_yield_log_time) > 1.5:
            logger.info(f"Human physical mouse activity detected. Yielding control for {duration:.1f}s.")
            self._last_yield_log_time = now

    def move_to(self, norm_x: float, norm_y: float):
        """
        Moves the OS mouse cursor to normalized coordinates (0.0 to 1.0).
        Includes Human-Touch-to-Yield arbitration: if the user touches the physical
        mouse/trackpad, MotionEase automatically steps aside.
        """
        now = time.perf_counter()
        current_x, current_y = self.get_position()

        # 1. Check if user moved cursor to screen corner (Emergency Corner Failsafe)
        if config.FAILSAFE_CORNER_ACTIVATED and (current_x <= 15 and current_y <= 15):
            self.yield_to_human(3.0)
            return

        # 2. Check if currently in active human yield period
        if now < self.human_yield_until:
            self._last_ai_pos = (current_x, current_y)
            return

        # 3. Detect physical mouse movement by user (Smart Touch-to-Yield)
        if self._last_ai_pos is not None:
            human_dist = math.hypot(current_x - self._last_ai_pos[0], current_y - self._last_ai_pos[1])
            if human_dist > config.HUMAN_OVERRIDE_DISTANCE_PX:
                self.yield_to_human(config.HUMAN_OVERRIDE_YIELD_SEC)
                self._last_ai_pos = (current_x, current_y)
                return

        # 4. Clamp target coordinates to primary screen boundaries
        clamped_x = max(0, min(self.screen_width - 1, int(norm_x * self.screen_width)))
        clamped_y = max(0, min(self.screen_height - 1, int(norm_y * self.screen_height)))

        # 5. Fixation deadband: do not move if delta is below threshold (kills jitter during fixation)
        last_x, last_y = self._last_position
        dist_from_last = math.hypot(clamped_x - last_x, clamped_y - last_y)
        if dist_from_last < self.deadband_px:
            return

        self._last_position = (clamped_x, clamped_y)
        self._last_ai_pos = (clamped_x, clamped_y)

        # 6. Set cursor position instantaneously via native Windows API
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
        """Performs a primary left mouse click if human is not overriding."""
        if self.is_human_yielding():
            return
        try:
            pyautogui.click()
            logger.info("Executed OS Left Click")
        except Exception as e:
            logger.error(f"Click error: {e}")

    def right_click(self):
        """Performs a secondary right mouse click if human is not overriding."""
        if self.is_human_yielding():
            return
        try:
            pyautogui.rightClick()
            logger.info("Executed OS Right Click")
        except Exception as e:
            logger.error(f"Right click error: {e}")

    def double_click(self):
        """Performs a double mouse click if human is not overriding."""
        if self.is_human_yielding():
            return
        try:
            pyautogui.doubleClick()
            logger.info("Executed OS Double Click")
        except Exception as e:
            logger.error(f"Double click error: {e}")

    def scroll(self, amount: int):
        """
        Scrolls the viewport.
        Positive amount = scroll up, Negative amount = scroll down.
        Amount represents wheel steps. On Windows, 1 wheel step = 120 units (WHEEL_DELTA).
        """
        if self.is_human_yielding():
            return

        # On Windows, native mouse_event with WHEEL_DELTA (120) provides smooth, instantaneous scrolling
        # in all applications (Chrome, Edge, PDF readers, Explorer, etc.)
        if _user32:
            try:
                # 1 wheel click in Windows = 120 units (WHEEL_DELTA)
                wheel_units = int(amount * 120) if abs(amount) < 20 else int(amount)
                # MOUSEEVENTF_WHEEL = 0x0800
                _user32.mouse_event(0x0800, 0, 0, wheel_units, 0)
                logger.debug(f"Executed Windows Wheel Scroll: {wheel_units} units ({amount} clicks)")
                return
            except Exception as e:
                logger.debug(f"Native Windows scroll error: {e}")

        try:
            clicks = int(amount * 120) if abs(amount) < 20 else int(amount)
            pyautogui.scroll(clicks)
        except Exception as e:
            logger.debug(f"Scroll error: {e}")
