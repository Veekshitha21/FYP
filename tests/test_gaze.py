"""
Unit tests for Gaze Tracker & Polynomial Regression Mapping
"""

import sys
import os
import unittest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai_engine')))

from vision.gaze_tracker import GazeTracker
import config

class TestGazeTracker(unittest.TestCase):
    def setUp(self):
        # Use a temporary calibration file for testing
        self.tracker = GazeTracker(calibration_file="temp_test_calibration.json")

    def tearDown(self):
        if os.path.exists("temp_test_calibration.json"):
            os.remove("temp_test_calibration.json")

    def test_polynomial_calibration_training(self):
        self.tracker.start_calibration()
        
        # Simulate collecting samples across 9 points
        for pt in config.CALIBRATION_POINTS:
            for s in range(10):
                # Simulated relative iris coordinates roughly proportional to screen target
                lx = pt["x"] * 0.4 + 0.3 + np.random.normal(0, 0.01)
                ly = pt["y"] * 0.4 + 0.3 + np.random.normal(0, 0.01)
                rx = lx
                ry = ly
                self.tracker.calibration_samples.append({
                    "point_id": pt["id"],
                    "target_x": pt["x"],
                    "target_y": pt["y"],
                    "features": [lx, ly, rx, ry]
                })

        res = self.tracker.complete_calibration()
        self.assertTrue(res["success"])
        self.assertGreater(res["accuracy"], 80.0)
        self.assertTrue(self.tracker.is_calibrated)
        print(f"9-Point Calibration Training completed: Accuracy={res['accuracy']}%")

if __name__ == "__main__":
    unittest.main()
