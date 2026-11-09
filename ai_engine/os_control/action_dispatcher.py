"""
MODULE K.3: Central Action Dispatcher
File: os_control/action_dispatcher.py
Coordinates OS action execution with safety validation, application allowlisting,
cooldown rate limiting, and emergency stop overrides.
"""

import time
import subprocess
from typing import Dict, Any, Optional, List
from utils.logger import get_logger
from os_control.mouse_controller import MouseController
from os_control.keyboard_controller import KeyboardController
import config

logger = get_logger("ActionDispatcher")

class ActionDispatcher:
    def __init__(self):
        self.mouse = MouseController()
        self.keyboard = KeyboardController()
        
        # Safety & Emergency States
        self.emergency_stop = False
        self.is_paused = False
        
        # Action logging history
        self.action_history: List[Dict[str, Any]] = []
        self.max_history_entries = 100
        self.actions_count = 0

        # Cooldown timestamps
        self.last_click_time = 0.0
        self.last_scroll_time = 0.0
        self.min_click_interval_sec = 0.25
        self.min_scroll_interval_sec = 0.05

    def set_emergency_stop(self, stop: bool):
        """Immediately locks or unlocks all OS input dispatching."""
        self.emergency_stop = stop
        if stop:
            logger.critical("EMERGENCY STOP ACTIVATED! All OS actions suspended.")
        else:
            logger.info("Emergency stop deactivated. Resuming normal operations.")
        self._record_action("EMERGENCY_STOP", f"State set to {stop}", success=True)

    def set_paused(self, paused: bool):
        """Pauses or resumes OS control."""
        self.is_paused = paused
        logger.info(f"System paused state changed: {paused}")
        self._record_action("PAUSE_TOGGLE", f"Paused: {paused}", success=True)

    def dispatch(self, action_type: str, payload: Optional[Any] = None) -> bool:
        """
        Validates and executes an OS action.
        Returns True if executed, False if rejected or dropped.
        """
        # Safety checks
        if self.emergency_stop:
            return False

        if self.is_paused and action_type not in ["RESUME", "EMERGENCY_STOP"]:
            return False

        now = time.perf_counter()

        try:
            # 1. Cursor Movement
            if action_type == "MOVE_CURSOR":
                if payload and isinstance(payload, (tuple, list)) and len(payload) >= 2:
                    self.mouse.move_to(payload[0], payload[1])
                    return True
                return False

            # 2. Clicks (with cooldown protection)
            elif action_type == "LEFT_CLICK":
                if (now - self.last_click_time) < self.min_click_interval_sec:
                    return False
                self.mouse.left_click()
                self.last_click_time = now
                self._record_action("LEFT_CLICK", "Left click triggered")
                return True

            elif action_type == "RIGHT_CLICK":
                if (now - self.last_click_time) < self.min_click_interval_sec:
                    return False
                self.mouse.right_click()
                self.last_click_time = now
                self._record_action("RIGHT_CLICK", "Right click triggered")
                return True

            elif action_type == "DOUBLE_CLICK":
                if (now - self.last_click_time) < self.min_click_interval_sec * 2:
                    return False
                self.mouse.double_click()
                self.last_click_time = now
                self._record_action("DOUBLE_CLICK", "Double click triggered")
                return True

            # 3. Viewport Scrolling
            elif action_type == "SCROLL":
                if (now - self.last_scroll_time) < self.min_scroll_interval_sec:
                    return False
                amount = int(payload) if payload is not None else -config.SCROLL_SPEED_BASE
                self.mouse.scroll(amount)
                self.last_scroll_time = now
                self._record_action("SCROLL", f"Scroll amount: {amount}")
                return True

            # 4. Keyboard Inputs
            elif action_type == "TYPE_TEXT":
                if payload and isinstance(payload, str):
                    self.keyboard.type_string(payload)
                    self._record_action("TYPE_TEXT", f"Typed: {payload}")
                    return True
                return False

            elif action_type == "PRESS_KEY":
                if payload and isinstance(payload, str):
                    self.keyboard.press_key(payload)
                    self._record_action("PRESS_KEY", f"Pressed: {payload}")
                    return True
                return False

            # 5. Application Launching (Strict Allowlist)
            elif action_type == "LAUNCH_APP":
                target_app = str(payload).lower()
                allowed_cmd = config.ALLOWED_APPLICATIONS.get(target_app)
                if allowed_cmd:
                    logger.info(f"Launching verified allowlist application: '{allowed_cmd}'")
                    subprocess.Popen(allowed_cmd, shell=True)
                    self._record_action("LAUNCH_APP", f"Started {target_app}")
                    return True
                else:
                    logger.warning(f"Rejected application launch for untrusted app: '{target_app}'")
                    return False

            # 6. Safety controls
            elif action_type == "PAUSE":
                self.set_paused(True)
                return True

            elif action_type == "RESUME":
                self.set_paused(False)
                return True

            elif action_type == "EMERGENCY_STOP":
                self.set_emergency_stop(True)
                return True

        except Exception as e:
            logger.error(f"Dispatch error for action {action_type}: {e}")
            return False

        return False

    def _record_action(self, action_type: str, description: str, success: bool = True):
        """Maintains timestamped action log for UI."""
        self.actions_count += 1
        entry = {
            "id": self.actions_count,
            "type": action_type,
            "description": description,
            "timestamp": time.strftime("%H:%M:%S"),
            "success": success
        }
        self.action_history.insert(0, entry)
        if len(self.action_history) > self.max_history_entries:
            self.action_history.pop()

    def get_recent_actions(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.action_history[:limit]
