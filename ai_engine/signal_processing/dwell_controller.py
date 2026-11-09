"""
MODULE G.3: Context-Aware Dynamic Dwell Scaling
File: signal_processing/dwell_controller.py
Tracks spatial pointer fixation within a tolerance radius. Dynamically scales
required dwell time based on movement velocity and gaze confidence to prevent
the "Midas Touch" (accidental triggers during casual looking).
"""

import time
import math
from typing import Dict, Any, Optional, Tuple
from utils.logger import get_logger
from utils.helpers import current_time_ms, euclidean_distance, clamp
import config

logger = get_logger("DwellController")

class DynamicDwellController:
    def __init__(
        self,
        min_dwell_ms: float = config.DWELL_TIME_MIN_MS,
        max_dwell_ms: float = config.DWELL_TIME_MAX_MS,
        radius_px: float = config.DWELL_RADIUS_PIXELS,
        cooldown_ms: float = config.DWELL_CLICK_COOLDOWN_MS
    ):
        self.min_dwell_ms = min_dwell_ms
        self.max_dwell_ms = max_dwell_ms
        self.radius_px = radius_px
        self.cooldown_ms = cooldown_ms

        self.anchor_x: Optional[float] = None
        self.anchor_y: Optional[float] = None
        self.dwell_start_time_ms: Optional[float] = None
        self.last_click_time_ms: float = -999999.0
        self.dwell_progress: float = 0.0
        self.enabled = True

    def set_enabled(self, enabled: bool):
        self.enabled = enabled
        if not enabled:
            self.reset()

    def reset(self):
        self.anchor_x = None
        self.anchor_y = None
        self.dwell_start_time_ms = None
        self.dwell_progress = 0.0

    def update(
        self,
        current_x_px: float,
        current_y_px: float,
        confidence: float = 0.9,
        timestamp_ms: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Updates dwell tracking with the current cursor pixel position.
        Returns: {
            'click_triggered': bool,
            'dwell_progress': float (0.0 to 1.0),
            'dwell_target': Optional[Tuple[float, float]],
            'is_dwelling': bool
        }
        """
        if not self.enabled:
            return {"click_triggered": False, "dwell_progress": 0.0, "is_dwelling": False}

        now = timestamp_ms if timestamp_ms is not None else current_time_ms()

        # Cooldown guard
        if (now - self.last_click_time_ms) < self.cooldown_ms:
            self.reset()
            return {"click_triggered": False, "dwell_progress": 0.0, "is_dwelling": False}

        # First point or re-anchoring
        if self.anchor_x is None or self.anchor_y is None:
            self.anchor_x = current_x_px
            self.anchor_y = current_y_px
            self.dwell_start_time_ms = now
            self.dwell_progress = 0.0
            return {"click_triggered": False, "dwell_progress": 0.0, "is_dwelling": True}

        # Check distance from anchor
        dist = euclidean_distance((current_x_px, current_y_px), (self.anchor_x, self.anchor_y))

        if dist > self.radius_px:
            # User moved gaze outside stability bubble -> reset dwell anchor
            self.anchor_x = current_x_px
            self.anchor_y = current_y_px
            self.dwell_start_time_ms = now
            self.dwell_progress = 0.0
            return {"click_triggered": False, "dwell_progress": 0.0, "is_dwelling": False}

        # Dwell is actively accumulating inside the target radius
        elapsed_ms = now - self.dwell_start_time_ms

        # Context-aware dynamic scaling:
        # Lower confidence or larger micro-movements increase required dwell time
        # Confidence penalty factor between 1.0 and 1.5
        conf_factor = 1.0 + max(0.0, (1.0 - confidence) * 0.8)
        # Stability factor: closer to exact center requires slightly less dwell
        dist_factor = 1.0 + (dist / self.radius_px) * 0.3

        required_dwell_ms = clamp(
            self.min_dwell_ms * conf_factor * dist_factor,
            self.min_dwell_ms,
            self.max_dwell_ms
        )

        self.dwell_progress = clamp(elapsed_ms / required_dwell_ms, 0.0, 1.0)

        click_triggered = False
        if self.dwell_progress >= 1.0:
            click_triggered = True
            self.last_click_time_ms = now
            self.reset()
            logger.info(f"Dwell click triggered at ({current_x_px:.0f}, {current_y_px:.0f}) after {elapsed_ms:.0f}ms")

        return {
            "click_triggered": click_triggered,
            "dwell_progress": round(self.dwell_progress, 3),
            "dwell_target": (self.anchor_x, self.anchor_y) if self.anchor_x is not None else None,
            "is_dwelling": True
        }
