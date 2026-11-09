"""
Unit tests for Camera Manager & Frame Acquisition
"""

import sys
import os
import unittest
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai_engine')))

from vision.camera import CameraManager

class TestCamera(unittest.TestCase):
    def test_camera_enumeration(self):
        cameras = CameraManager.list_available_cameras(max_tested=2)
        self.assertIsInstance(cameras, list)
        print(f"Cameras detected: {len(cameras)}")

    def test_camera_lifecycle(self):
        cam = CameraManager()
        started = cam.start()
        if started:
            # Allow camera hardware sensor 1.5s to auto-expose and deliver frames
            for _ in range(15):
                time.sleep(0.1)
                ret, frame, ts = cam.read_frame()
                if ret:
                    break
            self.assertTrue(ret)
            self.assertIsNotNone(frame)
            self.assertEqual(len(frame.shape), 3)
            stats = cam.get_stats()
            self.assertTrue(stats["running"])
            cam.stop()
            self.assertFalse(cam.is_running)
            print("Camera lifecycle (start, grab frame, stop) validated successfully.")
        else:
            print("No physical camera available on index 0 for lifecycle test; skipping.")

if __name__ == "__main__":
    unittest.main()
