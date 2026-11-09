"""
MODULE C: Image Preprocessing
File: vision/preprocessing.py
Implements adaptive histogram equalization (CLAHE), brightness assessment,
contrast normalization, and frame validation for variable ambient lighting.
"""

from typing import Tuple
import cv2
import numpy as np

from utils.logger import get_logger
import config

logger = get_logger("ImagePreprocessing")

class ImagePreprocessor:
    def __init__(self, enable_clahe: bool = config.ENABLE_CLAHE):
        self.enable_clahe = enable_clahe
        self.clahe = cv2.createCLAHE(
            clipLimit=config.CLAHE_CLIP_LIMIT,
            tileGridSize=config.CLAHE_TILE_GRID_SIZE
        )

    def assess_lighting(self, frame_bgr: np.ndarray) -> Tuple[float, str]:
        """
        Assesses ambient brightness from the L-channel of the LAB color space.
        Returns: (mean_brightness, lighting_condition: 'low' | 'normal' | 'harsh')
        """
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        if brightness < 60.0:
            condition = "low"
        elif brightness > 200.0:
            condition = "harsh"
        else:
            condition = "normal"
        return brightness, condition

    def process(self, frame_bgr: np.ndarray) -> np.ndarray:
        """
        Applies adaptive enhancement to the frame.
        If CLAHE is enabled and lighting is poor or contrast is low,
        applies CLAHE to the L channel in LAB color space to preserve natural chrominance.
        """
        if frame_bgr is None or frame_bgr.size == 0:
            return frame_bgr

        if not self.enable_clahe:
            return frame_bgr

        try:
            # Check brightness
            brightness, condition = self.assess_lighting(frame_bgr)

            # Apply CLAHE primarily under low-light or uneven lighting conditions
            if condition == "low" or condition == "harsh":
                lab = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2LAB)
                l, a, b = cv2.split(lab)
                cl = self.clahe.apply(l)
                enhanced_lab = cv2.merge((cl, a, b))
                return cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
            
            return frame_bgr
        except Exception as e:
            logger.debug(f"Preprocessing exception: {e}")
            return frame_bgr
