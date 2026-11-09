"""
MODULE G.1: Speed-Gain Adaptive One-Euro (1€) Filter
File: signal_processing/one_euro_filter.py
Implements the Casiez et al. 1€ filter for human-computer interaction.
Provides near-zero latency during rapid saccades and high jitter smoothing
during static gaze fixation.
"""

import math
from typing import Tuple, Optional
import config

class LowPassFilter:
    def __init__(self, alpha: float = 0.5):
        self.alpha = alpha
        self.hat_x_prev: Optional[float] = None

    def reset(self):
        self.hat_x_prev = None

    def filter(self, x: float, alpha: Optional[float] = None) -> float:
        if alpha is not None:
            self.alpha = alpha
        if self.hat_x_prev is None:
            hat_x = x
        else:
            hat_x = self.alpha * x + (1.0 - self.alpha) * self.hat_x_prev
        self.hat_x_prev = hat_x
        return hat_x

class OneEuroFilter1D:
    def __init__(
        self,
        min_cutoff: float = config.ONE_EURO_MIN_CUTOFF,
        beta: float = config.ONE_EURO_BETA,
        d_cutoff: float = config.ONE_EURO_DCUTOFF
    ):
        self.min_cutoff = min_cutoff
        self.beta = beta
        self.d_cutoff = d_cutoff
        self.x_filter = LowPassFilter()
        self.dx_filter = LowPassFilter()
        self.t_prev: Optional[float] = None

    def _alpha(self, cutoff: float, dt: float) -> float:
        tau = 1.0 / (2.0 * math.pi * cutoff)
        return 1.0 / (1.0 + tau / dt)

    def reset(self):
        self.x_filter.reset()
        self.dx_filter.reset()
        self.t_prev = None

    def filter(self, x: float, timestamp_sec: float) -> float:
        if self.t_prev is None:
            self.t_prev = timestamp_sec
            return self.x_filter.filter(x, 1.0)

        dt = max(1e-4, timestamp_sec - self.t_prev)
        self.t_prev = timestamp_sec

        # Compute raw derivative
        prev_val = self.x_filter.hat_x_prev if self.x_filter.hat_x_prev is not None else x
        dx = (x - prev_val) / dt

        # Filter the derivative
        alpha_d = self._alpha(self.d_cutoff, dt)
        edx = self.dx_filter.filter(dx, alpha_d)

        # Dynamic cutoff frequency calculation
        cutoff = self.min_cutoff + self.beta * abs(edx)

        # Filter the signal
        alpha = self._alpha(cutoff, dt)
        return self.x_filter.filter(x, alpha)

class OneEuroFilter2D:
    """Independent 2D One-Euro Filter for X and Y cursor coordinates."""
    def __init__(
        self,
        min_cutoff: float = config.ONE_EURO_MIN_CUTOFF,
        beta: float = config.ONE_EURO_BETA,
        d_cutoff: float = config.ONE_EURO_DCUTOFF
    ):
        self.filter_x = OneEuroFilter1D(min_cutoff, beta, d_cutoff)
        self.filter_y = OneEuroFilter1D(min_cutoff, beta, d_cutoff)

    def update_params(self, min_cutoff: Optional[float] = None, beta: Optional[float] = None):
        if min_cutoff is not None:
            self.filter_x.min_cutoff = min_cutoff
            self.filter_y.min_cutoff = min_cutoff
        if beta is not None:
            self.filter_x.beta = beta
            self.filter_y.beta = beta

    def reset(self):
        self.filter_x.reset()
        self.filter_y.reset()

    def filter(self, x: float, y: float, timestamp_sec: float) -> Tuple[float, float]:
        fx = self.filter_x.filter(x, timestamp_sec)
        fy = self.filter_y.filter(y, timestamp_sec)
        return fx, fy
