"""
Helper mathematical and system utilities for MotionEase
"""

import time
import math
from typing import Tuple, List, Optional
import numpy as np

def current_time_ms() -> float:
    """Returns the current monotonic timestamp in milliseconds."""
    return time.perf_counter() * 1000.0

def euclidean_distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """Calculates 2D Euclidean distance between two points."""
    return math.hypot(p1[0] - p2[0], p1[1] - p2[1])

def clamp(val: float, min_val: float, max_val: float) -> float:
    """Clamps a value within [min_val, max_val]."""
    return max(min_val, min(val, max_val))

def calculate_ear(eye_landmarks: List[Tuple[float, float]]) -> float:
    """
    Calculates Eye Aspect Ratio (EAR) from 6 canonical 2D eye landmarks.
    p1: outer corner, p4: inner corner
    p2, p6: top & bottom vertical pair 1
    p3, p5: top & bottom vertical pair 2
    EAR = (|p2 - p6| + |p3 - p5|) / (2.0 * |p1 - p4|)
    """
    if len(eye_landmarks) < 6:
        return 0.3 # default open estimate
    
    p1, p2, p3, p4, p5, p6 = eye_landmarks[:6]
    v1 = euclidean_distance(p2, p6)
    v2 = euclidean_distance(p3, p5)
    horiz = euclidean_distance(p1, p4)
    
    if horiz <= 1e-6:
        return 0.0
    return (v1 + v2) / (2.0 * horiz)

def calculate_mar(mouth_landmarks: List[Tuple[float, float]]) -> float:
    """
    Calculates Mouth Aspect Ratio (MAR) for mouth opening and smile detection.
    """
    if len(mouth_landmarks) < 6:
        return 0.0
    top = mouth_landmarks[1]
    bottom = mouth_landmarks[4]
    left = mouth_landmarks[0]
    right = mouth_landmarks[3]
    vert = euclidean_distance(top, bottom)
    horiz = euclidean_distance(left, right)
    if horiz <= 1e-6:
        return 0.0
    return vert / horiz
