"""
Unit tests for Head Pose Estimation (Yaw, Pitch, Roll) & solvePnP
"""

import sys
import os
import unittest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai_engine')))

from vision.head_pose import HeadPoseEstimator, LANDMARK_INDICES

class TestHeadPose(unittest.TestCase):
    def setUp(self):
        self.estimator = HeadPoseEstimator(frame_width=640, frame_height=480)

    def test_neutral_head_pose(self):
        # Generate simulated frontal landmarks
        # Nose: 320, 240; Chin: 320, 360; Left Eye: 260, 200; Right Eye: 380, 200; Mouth Left: 280, 320; Mouth Right: 360, 320
        landmarks = [(0, 0)] * 500
        landmarks[1] = (320, 240)    # Nose
        landmarks[152] = (320, 360)  # Chin
        landmarks[33] = (260, 200)   # Left eye corner
        landmarks[263] = (380, 200)  # Right eye corner
        landmarks[61] = (280, 320)   # Mouth left
        landmarks[291] = (360, 320)  # Mouth right

        res = self.estimator.estimate_pose(landmarks, (480, 640))
        self.assertTrue(res["valid"])
        self.assertIn(res["direction"], ["neutral", "up", "down", "left", "right"])
        print(f"Head Pose solvePnP: Yaw={res['yaw']}°, Pitch={res['pitch']}°, Direction={res['direction']}")

if __name__ == "__main__":
    unittest.main()
