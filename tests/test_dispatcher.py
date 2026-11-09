"""
Unit tests for OS Control Action Dispatcher
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai_engine')))

from os_control.action_dispatcher import ActionDispatcher

class TestActionDispatcher(unittest.TestCase):
    def setUp(self):
        self.dispatcher = ActionDispatcher()

    def test_emergency_stop_toggle(self):
        self.dispatcher.set_emergency_stop(True)
        self.assertTrue(self.dispatcher.emergency_stop)
        self.assertFalse(self.dispatcher.dispatch("LEFT_CLICK"))

        self.dispatcher.set_emergency_stop(False)
        self.assertFalse(self.dispatcher.emergency_stop)

    def test_action_logging(self):
        initial_count = self.dispatcher.actions_count
        self.dispatcher._record_action("TEST_EVENT", "Test description executed")
        self.assertEqual(self.dispatcher.actions_count, initial_count + 1)
        recent = self.dispatcher.get_recent_actions(limit=5)
        self.assertGreaterEqual(len(recent), 1)
        self.assertEqual(recent[0]["type"], "TEST_EVENT")

if __name__ == "__main__":
    unittest.main()
