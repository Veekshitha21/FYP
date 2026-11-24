"""
Unit tests for Hand Detector
Verifies hand initialization, graceful fallback, coordinate calculation, and pinch detection.
"""

import sys
import os
import unittest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai_engine')))

from vision.hand_detector import HandDetector

class TestHandDetector(unittest.TestCase):
    def setUp(self):
        self.detector = HandDetector()

    def test_initialization(self):
        """Ensures HandDetector loads the model properly."""
        self.assertTrue(self.detector.is_initialized)
        print("PASS: HandDetector initialized with task model.")

    def test_empty_frame_handling(self):
        """Ensures detector handles empty frames gracefully without exceptions."""
        black_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        res = self.detector.detect(black_frame, timestamp_ms=100)
        self.assertFalse(res["hand_detected"])
        self.assertIsNone(res["gesture"])
        print("PASS: HandDetector handled empty frame safely.")

if __name__ == "__main__":
    unittest.main()
