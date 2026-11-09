"""
MODULE E: Head Pose Estimation
File: vision/head_pose.py
Estimates Head Yaw, Pitch, and Roll angles using OpenCV solvePnP with a 3D canonical
facial model. Handles neutral calibration and classifies head direction for scrolling.
"""

from typing import Dict, Any, Tuple, Optional
import math
import cv2
import numpy as np

from utils.logger import get_logger
import config

logger = get_logger("HeadPose")

# 3D generic facial model points (in mm)
# Points: Nose tip, Chin, Left eye left corner, Right eye right corner, Left mouth corner, Right mouth corner
MODEL_POINTS_3D = np.array([
    (0.0, 0.0, 0.0),          # Nose tip (index 1)
    (0.0, -330.0, -65.0),     # Chin (index 152)
    (-225.0, 170.0, -135.0),  # Left eye outer corner (index 33)
    (225.0, 170.0, -135.0),   # Right eye outer corner (index 263)
    (-150.0, -150.0, -125.0), # Left mouth corner (index 61)
    (150.0, -150.0, -125.0)   # Right mouth corner (index 291)
], dtype=np.float64)

# Corresponding MediaPipe landmark indices
LANDMARK_INDICES = [1, 152, 33, 263, 61, 291]

class HeadPoseEstimator:
    def __init__(self, frame_width: int = config.FRAME_WIDTH, frame_height: int = config.FRAME_HEIGHT):
        self.frame_width = frame_width
        self.frame_height = frame_height
        
        # Approximate camera intrinsic matrix (focal length ~ frame_width)
        focal_length = self.frame_width
        center = (self.frame_width / 2, self.frame_height / 2)
        self.camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
        
        self.dist_coeffs = np.zeros((4, 1), dtype=np.float64) # Assuming minimal lens distortion

        # Neutral calibration baseline offsets
        self.neutral_pitch: float = 0.0
        self.neutral_yaw: float = 0.0
        self.neutral_roll: float = 0.0
        self.is_calibrated: bool = False

    def calibrate_neutral(self, pitch: float, yaw: float, roll: float):
        """Sets the current head pose as the neutral reference baseline."""
        self.neutral_pitch = pitch
        self.neutral_yaw = yaw
        self.neutral_roll = roll
        self.is_calibrated = True
        logger.info(f"Neutral head pose calibrated: Pitch={pitch:.1f}, Yaw={yaw:.1f}, Roll={roll:.1f}")

    def reset_neutral(self):
        """Resets neutral head pose to zero."""
        self.neutral_pitch = 0.0
        self.neutral_yaw = 0.0
        self.neutral_roll = 0.0
        self.is_calibrated = False

    def estimate_pose(self, landmarks_px: list, frame_shape: Tuple[int, int]) -> Dict[str, Any]:
        """
        Estimates head yaw, pitch, roll in degrees from 2D pixel coordinates.
        """
        if not landmarks_px or len(landmarks_px) < max(LANDMARK_INDICES) + 1:
            return {
                "valid": False,
                "yaw": 0.0,
                "pitch": 0.0,
                "roll": 0.0,
                "direction": "neutral",
                "scroll_action": None
            }

        h, w = frame_shape
        # Dynamically update camera matrix if resolution changed
        if w != self.frame_width or h != self.frame_height:
            self.frame_width = w
            self.frame_height = h
            focal_length = w
            center = (w / 2, h / 2)
            self.camera_matrix = np.array([
                [focal_length, 0, center[0]],
                [0, focal_length, center[1]],
                [0, 0, 1]
            ], dtype=np.float64)

        image_points = []
        for idx in LANDMARK_INDICES:
            pt = landmarks_px[idx]
            image_points.append([float(pt[0]), float(pt[1])])
        image_points = np.array(image_points, dtype=np.float64)

        # Solve PnP
        success, rot_vec, trans_vec = cv2.solvePnP(
            MODEL_POINTS_3D,
            image_points,
            self.camera_matrix,
            self.dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )

        if not success:
            return {
                "valid": False,
                "yaw": 0.0,
                "pitch": 0.0,
                "roll": 0.0,
                "direction": "neutral",
                "scroll_action": None
            }

        # Convert rotation vector to rotation matrix
        rot_mat, _ = cv2.Rodrigues(rot_vec)

        # Extract Euler angles (in degrees)
        # Decompose rotation matrix into Tait-Bryan angles
        sy = math.sqrt(rot_mat[0, 0] * rot_mat[0, 0] + rot_mat[1, 0] * rot_mat[1, 0])
        singular = sy < 1e-6

        if not singular:
            pitch = math.atan2(rot_mat[2, 1], rot_mat[2, 2])
            yaw = math.atan2(-rot_mat[2, 0], sy)
            roll = math.atan2(rot_mat[1, 0], rot_mat[0, 0])
        else:
            pitch = math.atan2(-rot_mat[1, 2], rot_mat[1, 1])
            yaw = math.atan2(-rot_mat[2, 0], sy)
            roll = 0

        # Convert radians to degrees
        pitch_deg = math.degrees(pitch)
        yaw_deg = math.degrees(yaw)
        roll_deg = math.degrees(roll)

        # Adjust for neutral calibration
        rel_pitch = pitch_deg - self.neutral_pitch
        rel_yaw = yaw_deg - self.neutral_yaw
        rel_roll = roll_deg - self.neutral_roll

        # Classify head direction and scroll intention
        direction = "neutral"
        scroll_action = None

        if rel_pitch < config.HEAD_PITCH_SCROLL_UP:
            direction = "up"
            scroll_action = "SCROLL_UP"
        elif rel_pitch > config.HEAD_PITCH_SCROLL_DOWN:
            direction = "down"
            scroll_action = "SCROLL_DOWN"
        elif rel_yaw > config.HEAD_YAW_THRESHOLD:
            direction = "right"
        elif rel_yaw < -config.HEAD_YAW_THRESHOLD:
            direction = "left"

        return {
            "valid": True,
            "pitch": round(rel_pitch, 2),
            "yaw": round(rel_yaw, 2),
            "roll": round(rel_roll, 2),
            "raw_pitch": round(pitch_deg, 2),
            "raw_yaw": round(yaw_deg, 2),
            "raw_roll": round(roll_deg, 2),
            "direction": direction,
            "scroll_action": scroll_action,
            "confidence": 0.92
        }
