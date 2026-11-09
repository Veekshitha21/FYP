"""
MODULE A: Camera Manager
File: vision/camera.py
Handles webcam acquisition, camera enumeration, frame timestamps,
disconnection recovery, and thread-safe frame access.
"""

import time
import threading
from typing import Optional, Tuple, List, Dict, Any
import cv2
import numpy as np

from utils.logger import get_logger
import config

logger = get_logger("CameraManager")

class CameraManager:
    def __init__(self, camera_index: int = config.DEFAULT_CAMERA_INDEX):
        self.camera_index = camera_index
        self.cap: Optional[cv2.VideoCapture] = None
        self.is_running = False
        self.latest_frame: Optional[np.ndarray] = None
        self.latest_timestamp_ms: float = 0.0
        self.frame_count: int = 0
        self.fps: float = 0.0
        self.lock = threading.Lock()
        self._thread: Optional[threading.Thread] = None
        self._last_fps_calc_time = time.perf_counter()
        self._frames_since_last_fps = 0

    @staticmethod
    def list_available_cameras(max_tested: int = 4) -> List[Dict[str, Any]]:
        """Enumerates connected webcams by testing camera indices."""
        available = []
        for idx in range(max_tested):
            try:
                cap = cv2.VideoCapture(idx)
                if cap.isOpened():
                    ret, _ = cap.read()
                    if ret:
                        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                        available.append({
                            "index": idx,
                            "name": f"Camera {idx} ({w}x{h})",
                            "width": w,
                            "height": h,
                            "status": "connected"
                        })
                    cap.release()
            except Exception as e:
                logger.debug(f"Testing camera index {idx} failed: {e}")
        return available

    def start(self, camera_index: Optional[int] = None) -> bool:
        """Starts video capture in a background thread."""
        with self.lock:
            if self.is_running:
                logger.info("Camera already running.")
                return True
            if camera_index is not None:
                self.camera_index = camera_index

            logger.info(f"Opening camera index {self.camera_index}...")
            # Try standard camera backends
            self.cap = cv2.VideoCapture(self.camera_index, cv2.CAP_MSMF)
            if not self.cap or not self.cap.isOpened():
                self.cap = cv2.VideoCapture(self.camera_index)
            if not self.cap or not self.cap.isOpened():
                self.cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)
            
            if not self.cap or not self.cap.isOpened():
                logger.error(f"Failed to open camera index {self.camera_index}")
                self.cap = None
                return False

            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, config.FRAME_WIDTH)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, config.FRAME_HEIGHT)
            self.cap.set(cv2.CAP_PROP_FPS, config.TARGET_FPS)

            self.is_running = True
            self._thread = threading.Thread(target=self._capture_loop, daemon=True)
            self._thread.start()
            logger.info(f"Camera {self.camera_index} started successfully.")
            return True

    def _capture_loop(self):
        """Continuously captures frames and updates timestamp."""
        while self.is_running:
            if not self.cap or not self.cap.isOpened():
                logger.warning("Camera connection lost. Attempting reconnection...")
                time.sleep(1.0)
                continue

            ret, frame = self.cap.read()
            if not ret or frame is None:
                logger.warning("Failed to grab frame from camera.")
                time.sleep(0.01)
                continue

            now = time.perf_counter()
            with self.lock:
                self.latest_frame = frame
                self.latest_timestamp_ms = now * 1000.0
                self.frame_count += 1
                self._frames_since_last_fps += 1

                elapsed = now - self._last_fps_calc_time
                if elapsed >= 1.0:
                    self.fps = round(self._frames_since_last_fps / elapsed, 1)
                    self._frames_since_last_fps = 0
                    self._last_fps_calc_time = now

            # Sleep slightly to prevent CPU overconsumption
            time.sleep(0.005)

    def read_frame(self) -> Tuple[bool, Optional[np.ndarray], float]:
        """
        Thread-safe retrieval of the most recent frame.
        Returns: (success, frame_bgr, timestamp_ms)
        """
        with self.lock:
            if not self.is_running or self.latest_frame is None:
                return False, None, 0.0
            return True, self.latest_frame.copy(), self.latest_timestamp_ms

    def get_stats(self) -> Dict[str, Any]:
        """Returns camera operational metrics."""
        with self.lock:
            return {
                "running": self.is_running,
                "camera_index": self.camera_index,
                "fps": self.fps,
                "frame_count": self.frame_count,
                "timestamp_ms": self.latest_timestamp_ms
            }

    def stop(self):
        """Safely stops capture and releases camera resources."""
        logger.info("Stopping camera manager...")
        self.is_running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.5)
        with self.lock:
            if self.cap and self.cap.isOpened():
                self.cap.release()
            self.cap = None
            self.latest_frame = None
            self.fps = 0.0
        logger.info("Camera manager stopped.")
