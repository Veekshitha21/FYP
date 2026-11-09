"""
Unit tests for Signal Processing Filters:
- One-Euro Filter (Jitter removal & speed adaptation)
- 2D Kalman Filter (State prediction & smoothing)
- Dynamic Dwell Controller (Midas Touch prevention & radius stability)
"""

import sys
import os
import unittest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai_engine')))

from signal_processing.one_euro_filter import OneEuroFilter2D
from signal_processing.kalman_filter import KalmanFilter2D
from signal_processing.dwell_controller import DynamicDwellController

class TestSignalProcessing(unittest.TestCase):
    def test_one_euro_filter(self):
        f = OneEuroFilter2D(min_cutoff=1.0, beta=0.05)
        # Stationary signal with micro-jitter
        clean_target = 0.5
        jittered_series = [clean_target + np.sin(i * 1.5) * 0.02 for i in range(50)]
        
        filtered_outputs = []
        for i, val in enumerate(jittered_series):
            fx, _ = f.filter(val, val, timestamp_sec=i * 0.033)
            filtered_outputs.append(fx)

        # Variance of the last 20 filtered values should be significantly lower than raw jitter
        raw_variance = np.var(jittered_series[-20:])
        filtered_variance = np.var(filtered_outputs[-20:])
        self.assertLess(filtered_variance, raw_variance)
        print(f"One-Euro Jitter Reduction: Raw Var={raw_variance:.6f} -> Filtered Var={filtered_variance:.6f}")

    def test_kalman_filter(self):
        kf = KalmanFilter2D()
        smoothed_x, smoothed_y = kf.update(100.0, 200.0)
        self.assertAlmostEqual(smoothed_x, 100.0, places=1)
        self.assertAlmostEqual(smoothed_y, 200.0, places=1)

        # Move with velocity
        for step in range(1, 10):
            sx, sy = kf.update(100.0 + step * 5.0, 200.0 + step * 2.0)
            self.assertGreater(sx, 100.0)

        pred_x, pred_y = kf.predict(steps=2)
        self.assertGreater(pred_x, 140.0)
        print(f"Kalman Filter 2D trajectory tracking & prediction validated (Pred X={pred_x:.1f})")

    def test_dynamic_dwell_controller(self):
        dc = DynamicDwellController(min_dwell_ms=400, max_dwell_ms=1000, radius_px=30)
        
        # Point fixated at (500, 500)
        res1 = dc.update(500, 500, timestamp_ms=0)
        self.assertFalse(res1["click_triggered"])
        self.assertTrue(res1["is_dwelling"])

        # Progress accumulated after 250ms
        res2 = dc.update(505, 502, timestamp_ms=250)
        self.assertFalse(res2["click_triggered"])
        self.assertGreater(res2["dwell_progress"], 0.3)

        # Click triggered after 500ms
        res3 = dc.update(502, 503, timestamp_ms=500)
        self.assertTrue(res3["click_triggered"])
        print(f"Dynamic Dwell Controller accurately triggered click at {res3['dwell_progress']*100:.0f}%")

if __name__ == "__main__":
    unittest.main()
