"""
MODULE J.2: Conflict Resolver
File: fusion/conflict_resolver.py
Resolves conflicts when multiple modalities generate concurrent actions
(e.g., simultaneous dwell click + wink click, or voice scroll + head tilt scroll).
Enforces hierarchy, deduplication, and timing windows.
"""

import time
from typing import Optional, Dict, Any, Tuple
from utils.logger import get_logger

logger = get_logger("ConflictResolver")

class ConflictResolver:
    def __init__(self, click_dedup_window_sec: float = 0.4):
        self.click_dedup_window_sec = click_dedup_window_sec
        self.last_resolved_click_time = 0.0
        self.last_click_source: Optional[str] = None

    def resolve_click(self, action_type: str, source: str) -> bool:
        """
        Determines whether a click request from a modality should proceed
        or if it is a duplicate / conflict with another recent click.
        Priority: Gesture (deliberate wink) > Voice Command > Dwell Click.
        """
        now = time.perf_counter()
        elapsed = now - self.last_resolved_click_time

        if elapsed < self.click_dedup_window_sec:
            # Within conflict window!
            # If current is higher priority than previous, allow override
            priority = {"gesture": 3, "voice": 2, "dwell": 1}
            current_prio = priority.get(source, 1)
            last_prio = priority.get(self.last_click_source, 1)

            if current_prio > last_prio:
                logger.info(f"Conflict resolution: {source} overrides recent {self.last_click_source} click.")
                self.last_resolved_click_time = now
                self.last_click_source = source
                return True
            else:
                logger.debug(f"Conflict resolution: Suppressed duplicate {source} click (within {elapsed*1000:.0f}ms of {self.last_click_source}).")
                return False

        self.last_resolved_click_time = now
        self.last_click_source = source
        return True
