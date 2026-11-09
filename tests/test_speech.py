"""
Unit tests for Speech Recognition & Command Parser
Verifies safe application allowlisting, system macros, and rejection of unsafe commands.
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai_engine')))

from speech.command_parser import VoiceCommandParser

class TestCommandParser(unittest.TestCase):
    def setUp(self):
        self.parser = VoiceCommandParser()

    def test_allowed_app_launch(self):
        res1 = self.parser.parse("open notepad")
        self.assertIsNotNone(res1)
        self.assertEqual(res1["intent"], "OPEN_APPLICATION")
        self.assertEqual(res1["target"], "notepad")

        res2 = self.parser.parse("launch chrome")
        self.assertIsNotNone(res2)
        self.assertEqual(res2["intent"], "OPEN_APPLICATION")
        self.assertEqual(res2["target"], "chrome")

    def test_rejection_of_unallowlisted_commands(self):
        # Unsafe or non-whitelisted apps must be discarded
        res_unsafe = self.parser.parse("open malware_downloader.exe")
        self.assertIsNone(res_unsafe)

        res_shell = self.parser.parse("open powershell")
        self.assertIsNone(res_shell)
        print("PASS: Non-allowlisted applications safely rejected.")

    def test_system_macros(self):
        res_scroll = self.parser.parse("scroll down")
        self.assertEqual(res_scroll["intent"], "SCROLL_DOWN")

        res_click = self.parser.parse("double click")
        self.assertEqual(res_click["intent"], "DOUBLE_CLICK")

        res_stop = self.parser.parse("emergency stop")
        self.assertEqual(res_stop["intent"], "EMERGENCY_STOP")

        res_type = self.parser.parse("type hello world")
        self.assertEqual(res_type["intent"], "TYPE_TEXT")
        self.assertEqual(res_type["target"], "hello world")
        print("PASS: System macros & typing parsed successfully.")

if __name__ == "__main__":
    unittest.main()
