"""
MODULE G.2: 2D Kalman Filter
File: signal_processing/kalman_filter.py
Implements a 4-state Kalman Filter [x, y, vx, vy] for trajectory smoothing,
linear prediction, and noise reduction in pointer navigation.
"""

from typing import Tuple
import numpy as np
import config

class KalmanFilter2D:
    def __init__(
        self,
        process_noise: float = config.KALMAN_PROCESS_NOISE,
        measurement_noise: float = config.KALMAN_MEASUREMENT_NOISE
    ):
        # State vector: [x, y, vx, vy]^T
        self.state = np.zeros((4, 1), dtype=np.float64)
        
        # State transition matrix F (dt initialized to 1/30)
        self.dt = 1.0 / 30.0
        self.F = np.array([
            [1.0, 0.0, self.dt, 0.0],
            [0.0, 1.0, 0.0, self.dt],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0]
        ], dtype=np.float64)

        # Measurement matrix H (we measure x and y)
        self.H = np.array([
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0]
        ], dtype=np.float64)

        # Covariance matrix P
        self.P = np.eye(4, dtype=np.float64) * 1.0

        # Process noise covariance Q
        self.Q = np.eye(4, dtype=np.float64) * process_noise

        # Measurement noise covariance R
        self.R = np.eye(2, dtype=np.float64) * measurement_noise

        self.initialized = False

    def reset(self):
        self.state = np.zeros((4, 1), dtype=np.float64)
        self.P = np.eye(4, dtype=np.float64) * 1.0
        self.initialized = False

    def update(self, z_x: float, z_y: float, dt: float = 0.033) -> Tuple[float, float]:
        """
        Performs predict and update steps given measured coordinates (z_x, z_y).
        Returns smoothed (x, y).
        """
        if dt > 0 and dt != self.dt:
            self.dt = dt
            self.F[0, 2] = self.dt
            self.F[1, 3] = self.dt

        if not self.initialized:
            self.state = np.array([[z_x], [z_y], [0.0], [0.0]], dtype=np.float64)
            self.initialized = True
            return z_x, z_y

        # Predict
        self.state = self.F @ self.state
        self.P = self.F @ self.P @ self.F.T + self.Q

        # Measurement
        z = np.array([[z_x], [z_y]], dtype=np.float64)
        y = z - (self.H @ self.state) # Innovation

        # Innovation covariance
        S = self.H @ self.P @ self.H.T + self.R
        K = self.P @ self.H.T @ np.linalg.inv(S) # Kalman gain

        # State update
        self.state = self.state + (K @ y)
        self.P = (np.eye(4) - (K @ self.H)) @ self.P

        filtered_x = float(self.state[0, 0])
        filtered_y = float(self.state[1, 0])

        return filtered_x, filtered_y

    def predict(self, steps: int = 1) -> Tuple[float, float]:
        """Predicts position N steps ahead."""
        pred_state = self.state.copy()
        for _ in range(steps):
            pred_state = self.F @ pred_state
        return float(pred_state[0, 0]), float(pred_state[1, 0])
