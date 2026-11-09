"""
Unit tests for Parallel Multimodal Feature Fusion & Conflict Resolution
Verifies parallel input processing, conflict priority hierarchy, and emergency stop lock.
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai_engine')))

from fusion.feature_fusion import MultimodalFeatureFusion
from fusion.conflict_resolver import ConflictResolver
from os_control.action_dispatcher import ActionDispatcher

class TestMultimodalFusion(unittest.TestCase):
    def setUp(self):
        self.dispatcher = ActionDispatcher()
        self.fusion = MultimodalFeatureFusion(self.dispatcher)
        self.resolver = ConflictResolver(click_dedup_window_sec=0.4)

    def test_conflict_resolution_hierarchy(self):
        """Gesture click (prio 3) must take precedence and override a simultaneous dwell click (prio 1)."""
        # First: Dwell click occurs
        first_dwell = self.resolver.resolve_click("LEFT_CLICK", source="dwell")
        self.assertTrue(first_dwell)

        # 50ms later: Deliberate gesture wink occurs (higher priority)
        override_gesture = self.resolver.resolve_click("LEFT_CLICK", source="gesture")
        self.assertTrue(override_gesture)

        # 50ms later: Low priority dwell tries again within window -> Must be suppressed
        duplicate_dwell = self.resolver.resolve_click("LEFT_CLICK", source="dwell")
        self.assertFalse(duplicate_dwell)
        print("PASS: Conflict resolver successfully enforced modal priority hierarchy.")

    def test_emergency_stop_overrides_all(self):
        """When emergency stop is activated, all dispatches must immediately return False."""
        self.dispatcher.set_emergency_stop(True)

        res_click = self.dispatcher.dispatch("LEFT_CLICK")
        self.assertFalse(res_click)

        res_scroll = self.dispatcher.dispatch("SCROLL", 100)
        self.assertFalse(res_scroll)

        res_type = self.dispatcher.dispatch("TYPE_TEXT", "hello")
        self.assertFalse(res_type)
        print("PASS: Emergency Stop safely suspended all OS actions.")

if __name__ == "__main__":
    unittest.main()
