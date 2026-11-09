"""
MODULE B: Face Landmarker
File: vision/face_detector.py
Uses MediaPipe Face Landmarker Tasks API to extract 478 landmarks (including irises),
52 facial blendshapes, and 3D facial transformation matrix in real time.
"""

from typing import Optional, Dict, Any, List, Tuple
import os
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from utils.logger import get_logger
import config

logger = get_logger("FaceLandmarker")

# Canonical landmark indices
LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
LEFT_IRIS_CENTER = 468
RIGHT_IRIS_CENTER = 473
LEFT_IRIS_INDICES = [468, 469, 470, 471, 472]
RIGHT_IRIS_INDICES = [473, 474, 475, 476, 477]
MOUTH_OUTER_INDICES = [61, 291, 0, 17, 13, 14]
NOSE_TIP_INDEX = 1
CHIN_INDEX = 152

class FaceLandmarkDetector:
    def __init__(self, model_path: str = config.FACE_LANDMARKER_MODEL_PATH):
        self.model_path = model_path
        self.detector = None
        self._init_detector()

    def _init_detector(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"MediaPipe model asset not found at {self.model_path}")

        base_options = python.BaseOptions(model_asset_path=self.model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=True,
            output_facial_transformation_matrixes=True,
            num_faces=1,
            min_face_detection_confidence=config.MIN_FACE_DETECTION_CONFIDENCE,
            min_face_presence_confidence=config.MIN_FACE_TRACKING_CONFIDENCE
        )
        self.detector = vision.FaceLandmarker.create_from_options(options)
        logger.info("MediaPipe Face Landmarker initialized with iris & blendshape support.")

    def detect(self, frame_bgr: np.ndarray, timestamp_ms: float = 0.0) -> Dict[str, Any]:
        """
        Processes a BGR image frame and extracts structured facial features.
        Returns a dictionary with face detection status, landmarks, iris positions,
        blendshape scores, and transformation matrix.
        """
        if frame_bgr is None or self.detector is None:
            return {"face_detected": False}

        h, w = frame_bgr.shape[:2]
        rgb_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        result = self.detector.detect(mp_image)

        if not result.face_landmarks or len(result.face_landmarks) == 0:
            return {
                "face_detected": False,
                "landmarks": [],
                "blendshapes": {},
                "confidence": 0.0,
                "timestamp_ms": timestamp_ms
            }

        # Single primary face landmarks
        raw_landmarks = result.face_landmarks[0]
        landmarks_norm: List[Tuple[float, float, float]] = []
        landmarks_px: List[Tuple[int, int]] = []

        for lm in raw_landmarks:
            landmarks_norm.append((lm.x, lm.y, lm.z))
            px = int(lm.x * w)
            py = int(lm.y * h)
            landmarks_px.append((px, py))

        # Extract blendshapes dictionary
        blendshapes_dict: Dict[str, float] = {}
        if result.face_blendshapes and len(result.face_blendshapes) > 0:
            for category in result.face_blendshapes[0]:
                blendshapes_dict[category.category_name] = category.score

        # Extract facial transformation matrix
        trans_matrix = None
        if result.facial_transformation_matrixes and len(result.facial_transformation_matrixes) > 0:
            trans_matrix = result.facial_transformation_matrixes[0]

        # Extract eye coordinates
        left_eye_pts = [landmarks_norm[i] for i in LEFT_EYE_INDICES if i < len(landmarks_norm)]
        right_eye_pts = [landmarks_norm[i] for i in RIGHT_EYE_INDICES if i < len(landmarks_norm)]
        
        # Extract iris centers
        left_iris = landmarks_norm[LEFT_IRIS_CENTER] if LEFT_IRIS_CENTER < len(landmarks_norm) else (0.0, 0.0, 0.0)
        right_iris = landmarks_norm[RIGHT_IRIS_CENTER] if RIGHT_IRIS_CENTER < len(landmarks_norm) else (0.0, 0.0, 0.0)

        # Compute bounding box
        xs = [pt[0] for pt in landmarks_px]
        ys = [pt[1] for pt in landmarks_px]
        bbox = {
            "x": min(xs),
            "y": min(ys),
            "width": max(xs) - min(xs),
            "height": max(ys) - min(ys)
        }

        return {
            "face_detected": True,
            "landmarks_norm": landmarks_norm,
            "landmarks_px": landmarks_px,
            "bbox": bbox,
            "blendshapes": blendshapes_dict,
            "transformation_matrix": trans_matrix,
            "left_eye": left_eye_pts,
            "right_eye": right_eye_pts,
            "left_iris": left_iris,
            "right_iris": right_iris,
            "left_iris_center_px": landmarks_px[LEFT_IRIS_CENTER] if LEFT_IRIS_CENTER < len(landmarks_px) else (0, 0),
            "right_iris_center_px": landmarks_px[RIGHT_IRIS_CENTER] if RIGHT_IRIS_CENTER < len(landmarks_px) else (0, 0),
            "timestamp_ms": timestamp_ms,
            "confidence": 0.95
        }
