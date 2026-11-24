"""
MODULE D: Gaze Tracking & 9-Point Calibration
File: vision/gaze_tracker.py
Extracts relative iris position within eye bounding boxes and maps pupil/iris
coordinates to calibrated on-screen coordinates using polynomial regression.
Supports 9-point interactive calibration, persistence, and confidence evaluation.
"""

import os
import json
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import Ridge

from utils.logger import get_logger
from utils.helpers import euclidean_distance, clamp
import config

logger = get_logger("GazeTracker")

class GazeTracker:
    def __init__(self, calibration_file: str = config.CALIBRATION_FILE):
        self.calibration_file = calibration_file
        self.is_calibrated = False

        # Direction and Sensitivity Configuration
        self.invert_x = config.INVERT_CURSOR_X
        self.invert_y = config.INVERT_CURSOR_Y
        self.sensitivity = config.CURSOR_SENSITIVITY

        # Neutral center reference baseline
        self.neutral_face_x: float = 0.5
        self.neutral_face_y: float = 0.5

        # Landmark pre-smoothing state (eliminates landmark-level vibration)
        self._smooth_face_x: Optional[float] = None
        self._smooth_face_y: Optional[float] = None

        # Polynomial regression models for X and Y screen mapping
        self.poly_degree = 2
        self.poly_transformer = PolynomialFeatures(degree=self.poly_degree)
        self.model_x: Optional[Ridge] = None
        self.model_y: Optional[Ridge] = None

        # Calibration state machine
        self.calibration_samples: List[Dict[str, Any]] = []
        self.current_point_index = 0
        self.is_calibrating = False

        # Load existing calibration if present
        self.load_calibration()

    def calibrate_center(self, face_x: Optional[float] = None, face_y: Optional[float] = None):
        """Sets the current face position as the neutral center reference."""
        if face_x is not None and face_y is not None:
            self.neutral_face_x = face_x
            self.neutral_face_y = face_y
        elif self._smooth_face_x is not None and self._smooth_face_y is not None:
            self.neutral_face_x = self._smooth_face_x
            self.neutral_face_y = self._smooth_face_y
        else:
            self.neutral_face_x = 0.5
            self.neutral_face_y = 0.5
        logger.info(f"GazeTracker center calibrated to: ({self.neutral_face_x:.3f}, {self.neutral_face_y:.3f})")

    def update_settings(
        self,
        invert_x: Optional[bool] = None,
        invert_y: Optional[bool] = None,
        sensitivity: Optional[float] = None
    ):
        """Dynamically applies runtime sensitivity and axis inversion settings."""
        if invert_x is not None:
            self.invert_x = bool(invert_x)
            logger.info(f"GazeTracker Invert X set to: {self.invert_x}")
        if invert_y is not None:
            self.invert_y = bool(invert_y)
            logger.info(f"GazeTracker Invert Y set to: {self.invert_y}")
        if sensitivity is not None:
            self.sensitivity = max(0.2, min(3.0, float(sensitivity)))
            logger.info(f"GazeTracker Sensitivity set to: {self.sensitivity:.2f}x")

    def get_relative_iris_features(
        self,
        landmarks_norm: List[Tuple[float, float, float]],
        left_iris_center: Tuple[float, float, float],
        right_iris_center: Tuple[float, float, float]
    ) -> Tuple[float, float, float, float]:
        """
        Computes relative position of both irises within the respective eye contours.
        Left eye: inner 133, outer 33, top 159, bottom 145
        Right eye: inner 362, outer 263, top 386, bottom 374
        Returns: (left_rel_x, left_rel_y, right_rel_x, right_rel_y)
        """
        if not landmarks_norm or len(landmarks_norm) < 478:
            return 0.5, 0.5, 0.5, 0.5

        # Left Eye Corner Landmarks
        l_outer = landmarks_norm[33]
        l_inner = landmarks_norm[133]
        l_top = landmarks_norm[159]
        l_bottom = landmarks_norm[145]

        # Right Eye Corner Landmarks
        r_inner = landmarks_norm[362]
        r_outer = landmarks_norm[263]
        r_top = landmarks_norm[386]
        r_bottom = landmarks_norm[374]

        # Calculate relative position (0.0 to 1.0)
        def compute_ratio(p_iris, p_left, p_right, p_top, p_bot):
            min_x = min(p_left[0], p_right[0])
            width = abs(p_right[0] - p_left[0])
            min_y = min(p_top[1], p_bot[1])
            height = abs(p_bot[1] - p_top[1])
            rel_x = (p_iris[0] - min_x) / (width + 1e-6)
            rel_y = (p_iris[1] - min_y) / (height + 1e-6)
            return clamp(rel_x, 0.0, 1.0), clamp(rel_y, 0.0, 1.0)

        lx, ly = compute_ratio(left_iris_center, l_outer, l_inner, l_top, l_bottom)
        rx, ry = compute_ratio(right_iris_center, r_inner, r_outer, r_top, r_bottom)

        return lx, ly, rx, ry

    def estimate_gaze(
        self,
        landmarks_norm: List[Tuple[float, float, float]],
        left_iris: Tuple[float, float, float],
        right_iris: Tuple[float, float, float]
    ) -> Dict[str, Any]:
        """
        Calculates screen gaze coordinates (0.0 to 1.0 normalized).
        Uses polynomial regression if calibrated; otherwise combines face posture & iris deflection.
        Applies directional inversion and sensitivity gain.
        """
        lx, ly, rx, ry = self.get_relative_iris_features(landmarks_norm, left_iris, right_iris)
        
        # Average iris displacement
        avg_rel_x = (lx + rx) / 2.0
        avg_rel_y = (ly + ry) / 2.0

        # Extract face center position (nose tip landmark 1)
        if landmarks_norm and len(landmarks_norm) > 1:
            nose = landmarks_norm[1]
            raw_face_x = nose[0]
            raw_face_y = nose[1]
        else:
            raw_face_x = 0.5
            raw_face_y = 0.5

        # Fixation Snap Lock: freezes face coordinates when stationary
        # Eliminates indefinite creeping, drifting, or crawling when no action is done!
        if self._smooth_face_x is None:
            self._smooth_face_x = raw_face_x
            self._smooth_face_y = raw_face_y
        else:
            delta_x = abs(raw_face_x - self._smooth_face_x)
            delta_y = abs(raw_face_y - self._smooth_face_y)
            # When displacement is below jitter/sway threshold (~2px), FREEZE completely
            if delta_x < 0.0035 and delta_y < 0.0035:
                pass
            else:
                # Responsive EMA: 0.38 adapts within 2-3 frames (~80ms) without lingering lag
                self._smooth_face_x = 0.38 * raw_face_x + 0.62 * self._smooth_face_x
                self._smooth_face_y = 0.38 * raw_face_y + 0.62 * self._smooth_face_y

        face_x = self._smooth_face_x
        face_y = self._smooth_face_y

        if self.is_calibrated and self.model_x and self.model_y:
            try:
                features = np.array([[lx, ly, rx, ry]])
                poly_feats = self.poly_transformer.transform(features)
                pred_x = float(self.model_x.predict(poly_feats)[0])
                pred_y = float(self.model_y.predict(poly_feats)[0])
                
                screen_x = clamp(pred_x, 0.0, 1.0)
                screen_y = clamp(pred_y, 0.0, 1.0)
                confidence = 0.94
                mode = "calibrated_polynomial"
            except Exception as e:
                logger.error(f"Prediction error: {e}")
                screen_x = clamp(face_x, 0.0, 1.0)
                screen_y = clamp(face_y, 0.0, 1.0)
                confidence = 0.60
                mode = "fallback_linear"
        else:
            # Active heuristic: combines head orientation (macro) and iris gaze (micro)
            # Center baseline is self.neutral_face_x / self.neutral_face_y
            dx = face_x - self.neutral_face_x
            dy = face_y - self.neutral_face_y

            def _smooth_gain(delta: float) -> float:
                sign = 1.0 if delta >= 0 else -1.0
                mag = abs(delta)
                if mag < 0.005:
                    return 0.0
                effective = mag - 0.005
                curved = (effective * 1.5) + (effective ** 1.4) * 1.0
                return sign * curved

            macro_x = 0.5 + _smooth_gain(dx)
            macro_y = 0.5 + _smooth_gain(dy)

            # Deadband small iris micro-flutter to eliminate high-frequency ocular jitter
            iris_dx = avg_rel_x - 0.5
            iris_dy = avg_rel_y - 0.5
            if abs(iris_dx) < 0.035:
                micro_x = 0.0
            else:
                effective_dx = iris_dx - (0.035 if iris_dx > 0 else -0.035)
                micro_x = effective_dx * 0.25

            if abs(iris_dy) < 0.035:
                micro_y = 0.0
            else:
                effective_dy = iris_dy - (0.035 if iris_dy > 0 else -0.035)
                micro_y = effective_dy * 0.25

            raw_screen_x = clamp(macro_x + micro_x, 0.0, 1.0)
            raw_screen_y = clamp(macro_y + micro_y, 0.0, 1.0)

            # Apply sensitivity multiplier around center
            screen_x = 0.5 + (raw_screen_x - 0.5) * self.sensitivity
            screen_y = 0.5 + (raw_screen_y - 0.5) * self.sensitivity

            # Directional inversion based on user preference
            if self.invert_x:
                screen_x = 1.0 - screen_x
            if self.invert_y:
                screen_y = 1.0 - screen_y

            screen_x = clamp(screen_x, 0.0, 1.0)
            screen_y = clamp(screen_y, 0.0, 1.0)
            confidence = 0.88
            mode = "uncalibrated_heuristic"

        return {
            "screen_x": round(screen_x, 4),
            "screen_y": round(screen_y, 4),
            "raw_features": {
                "left_iris_rel": (round(lx, 3), round(ly, 3)),
                "right_iris_rel": (round(rx, 3), round(ry, 3)),
                "avg_rel": (round(avg_rel_x, 3), round(avg_rel_y, 3))
            },
            "confidence": confidence,
            "mode": mode,
            "is_calibrated": self.is_calibrated,
            "invert_x": self.invert_x,
            "invert_y": self.invert_y,
            "sensitivity": self.sensitivity
        }

    # 9-Point Calibration Pipeline
    def start_calibration(self):
        """Initiates the 9-point calibration process."""
        self.is_calibrating = True
        self.calibration_samples = []
        self.current_point_index = 0
        self._smooth_face_x = None
        self._smooth_face_y = None
        logger.info("Started 9-point eye gaze calibration.")

    def add_calibration_sample(
        self,
        point_id: str,
        target_x: float,
        target_y: float,
        landmarks_norm: List[Tuple[float, float, float]],
        left_iris: Tuple[float, float, float],
        right_iris: Tuple[float, float, float]
    ):
        """Records an iris sample for a specific calibration target point."""
        lx, ly, rx, ry = self.get_relative_iris_features(landmarks_norm, left_iris, right_iris)
        self.calibration_samples.append({
            "point_id": point_id,
            "target_x": target_x,
            "target_y": target_y,
            "features": [lx, ly, rx, ry]
        })

    def complete_calibration(self) -> Dict[str, Any]:
        """
        Trains polynomial regression mapping from recorded samples and evaluates accuracy.
        """
        if len(self.calibration_samples) < len(config.CALIBRATION_POINTS) * 5:
            logger.warning("Insufficient calibration samples to train model.")
            return {"success": False, "error": "Insufficient samples collected"}

        X = []
        y_x = []
        y_y = []

        for sample in self.calibration_samples:
            X.append(sample["features"])
            y_x.append(sample["target_x"])
            y_y.append(sample["target_y"])

        X = np.array(X)
        y_x = np.array(y_x)
        y_y = np.array(y_y)

        poly_X = self.poly_transformer.fit_transform(X)

        self.model_x = Ridge(alpha=1.0)
        self.model_y = Ridge(alpha=1.0)
        self.model_x.fit(poly_X, y_x)
        self.model_y.fit(poly_X, y_y)

        # Calculate Mean Squared Error
        pred_x = self.model_x.predict(poly_X)
        pred_y = self.model_y.predict(poly_X)
        mse_x = float(np.mean((pred_x - y_x) ** 2))
        mse_y = float(np.mean((pred_y - y_y) ** 2))
        accuracy_score = max(0.0, 1.0 - (mse_x + mse_y) * 2.0)

        self.is_calibrated = True
        self.is_calibrating = False
        self.save_calibration()

        logger.info(f"Calibration completed! Accuracy: {accuracy_score*100:.1f}%")
        return {
            "success": True,
            "accuracy": round(accuracy_score * 100, 1),
            "sample_count": len(self.calibration_samples)
        }

    def save_calibration(self):
        """Persists trained polynomial weights to file."""
        if not self.is_calibrated or not self.model_x or not self.model_y:
            return
        data = {
            "poly_degree": self.poly_degree,
            "coef_x": self.model_x.coef_.tolist(),
            "intercept_x": float(self.model_x.intercept_),
            "coef_y": self.model_y.coef_.tolist(),
            "intercept_y": float(self.model_y.intercept_),
            "is_calibrated": True
        }
        try:
            with open(self.calibration_file, "w") as f:
                json.dump(data, f, indent=2)
            logger.info(f"Calibration saved to {self.calibration_file}")
        except Exception as e:
            logger.error(f"Failed to save calibration: {e}")

    def load_calibration(self):
        """Loads polynomial weights from disk if available."""
        if not os.path.exists(self.calibration_file):
            self.is_calibrated = False
            return
        try:
            with open(self.calibration_file, "r") as f:
                data = json.load(f)
            self.poly_degree = data.get("poly_degree", 2)
            self.poly_transformer = PolynomialFeatures(degree=self.poly_degree)
            # Create dummy fit to initialize polynomial features structure
            self.poly_transformer.fit(np.zeros((1, 4)))

            self.model_x = Ridge(alpha=1.0)
            self.model_x.coef_ = np.array(data["coef_x"])
            self.model_x.intercept_ = data["intercept_x"]

            self.model_y = Ridge(alpha=1.0)
            self.model_y.coef_ = np.array(data["coef_y"])
            self.model_y.intercept_ = data["intercept_y"]

            self.is_calibrated = True
            logger.info("Loaded previous eye gaze calibration successfully.")
        except Exception as e:
            logger.warning(f"Failed to load calibration data: {e}")
            self.is_calibrated = False

    def reset_calibration(self):
        """Clears calibration and resets to uncalibrated mode."""
        self.is_calibrated = False
        self.model_x = None
        self.model_y = None
        self._smooth_face_x = None
        self._smooth_face_y = None
        if os.path.exists(self.calibration_file):
            try:
                os.remove(self.calibration_file)
            except Exception as e:
                logger.error(f"Error removing calibration file: {e}")
        logger.info("Gaze calibration reset.")
