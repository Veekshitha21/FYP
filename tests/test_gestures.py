"""
Unit tests for Gesture Detection & Midas Touch Prevention
Verifies EAR calculation, deliberate wink recognition, and ensures involuntary
blinks never trigger a click action.
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai_engine')))

from vision.gesture_detector import GestureDetector
from utils.helpers import calculate_ear

class TestGestureDetection(unittest.TestCase):
    def setUp(self):
        self.detector = GestureDetector()
        # Canonical open eye landmarks (norm coords)
        self.open_eye = [
            (0.1, 0.5), # p1: outer
            (0.2, 0.45), # p2: top1
            (0.3, 0.45), # p3: top2
            (0.4, 0.5), # p4: inner
            (0.3, 0.55), # p5: bot2
            (0.2, 0.55)  # p6: bot1
        ]
        # Canonical closed eye landmarks (almost zero height)
        self.closed_eye = [
            (0.1, 0.5),
            (0.2, 0.498),
            (0.3, 0.498),
            (0.4, 0.5),
            (0.3, 0.502),
            (0.2, 0.502)
        ]

    def test_ear_calculation(self):
        ear_open = calculate_ear(self.open_eye)
        ear_closed = calculate_ear(self.closed_eye)
        self.assertGreater(ear_open, 0.25)
        self.assertLess(ear_closed, 0.15)
        print(f"EAR Open={ear_open:.3f}, Closed={ear_closed:.3f}")

    def test_involuntary_blink_ignored(self):
        """CRITICAL: Both eyes closed during normal blink MUST NOT trigger any click."""
        # Frame 1: both closed
        res1 = self.detector.detect_gestures(self.closed_eye, self.closed_eye, {}, timestamp_ms=100)
        self.assertTrue(res1["is_blink"])
        self.assertIsNone(res1["gesture"])

        # Frame 2: both closed
        res2 = self.detector.detect_gestures(self.closed_eye, self.closed_eye, {}, timestamp_ms=133)
        self.assertTrue(res2["is_blink"])
        self.assertIsNone(res2["gesture"])

        # Frame 3: eyes open again (blink ended)
        res3 = self.detector.detect_gestures(self.open_eye, self.open_eye, {}, timestamp_ms=166)
        self.assertIsNone(res3["gesture"])
        print("PASS: Involuntary bilateral blink correctly produced NO click action.")

    def test_deliberate_left_wink(self):
        """Deliberate left wink (left closed, right open for 4 frames) MUST trigger LEFT_WINK on release."""
        # 4 consecutive frames of left eye closed, right eye open
        for f in range(4):
            self.detector.detect_gestures(self.closed_eye, self.open_eye, {}, timestamp_ms=1000 + f * 33)

        # Release wink on frame 5
        res_release = self.detector.detect_gestures(self.open_eye, self.open_eye, {}, timestamp_ms=1150)
        self.assertEqual(res_release["gesture"], "LEFT_WINK")
        print("PASS: Deliberate left wink successfully recognized on release.")

if __name__ == "__main__":
    unittest.main()
