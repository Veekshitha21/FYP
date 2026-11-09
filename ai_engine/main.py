"""
MotionEase Core Engine Entrypoint
File: main.py
Orchestrates the entire AI pipeline:
Webcam Acquisition -> CLAHE Preprocessing -> MediaPipe Landmarker ->
Gaze & Iris Tracking -> Head Pose solvePnP -> Gesture EAR & Blendshapes ->
One-Euro & Kalman Filtering -> Dynamic Dwell Scaling -> Offline Audio & Speech ->
Parallel Multimodal Fusion -> OS Action Dispatcher -> WebSocket Telemetry.
"""

import sys
import time
import os
import signal
import threading
from typing import Dict, Any, Optional
import psutil

# Ensure root package can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.logger import get_logger
from utils.helpers import current_time_ms
import config

# Vision modules
from vision.camera import CameraManager
from vision.preprocessing import ImagePreprocessor
from vision.face_detector import FaceLandmarkDetector, LEFT_IRIS_CENTER, RIGHT_IRIS_CENTER
from vision.gaze_tracker import GazeTracker
from vision.head_pose import HeadPoseEstimator
from vision.gesture_detector import GestureDetector

# Signal processing
from signal_processing.one_euro_filter import OneEuroFilter2D
from signal_processing.kalman_filter import KalmanFilter2D
from signal_processing.dwell_controller import DynamicDwellController

# Speech modules
from speech.audio_capture import AudioCaptureManager
from speech.speech_recognition import OfflineSpeechRecognizer

# Typing & SLM
from typing_engine.virtual_keyboard import VirtualKeyboardEngine
from typing_engine.slm_engine import SLMPredictiveEngine

# OS Control & Multimodal Fusion
from os_control.action_dispatcher import ActionDispatcher
from fusion.feature_fusion import MultimodalFeatureFusion

# Communication
from communication.websocket_server import MotionEaseWebSocketServer

logger = get_logger("MotionEaseMain")

class MotionEaseEngine:
    def __init__(self):
        logger.info("Initializing MotionEase AI Engine...")
        self.is_running = False
        self.is_tracking = True # Gaze/pointer tracking active state
        self.process = psutil.Process()

        # Initialize OS Control and Multimodal Fusion
        self.dispatcher = ActionDispatcher()
        self.fusion = MultimodalFeatureFusion(self.dispatcher)

        # Initialize Vision Pipeline
        self.camera = CameraManager()
        self.preprocessor = ImagePreprocessor()
        self.face_detector = FaceLandmarkDetector()
        self.gaze_tracker = GazeTracker()
        self.head_pose = HeadPoseEstimator()
        self.gesture_detector = GestureDetector()

        # Initialize Signal Filters
        self.one_euro = OneEuroFilter2D(
            min_cutoff=config.ONE_EURO_MIN_CUTOFF,
            beta=config.ONE_EURO_BETA,
            d_cutoff=config.ONE_EURO_DCUTOFF
        )
        self.kalman = KalmanFilter2D()
        self.dwell_controller = DynamicDwellController()

        # Initialize Speech Pipeline
        self.audio_capture = AudioCaptureManager()
        self.speech_recognizer = OfflineSpeechRecognizer(self.audio_capture)

        # Initialize Typing & Predictive Text
        self.virtual_keyboard = VirtualKeyboardEngine()
        self.slm_engine = SLMPredictiveEngine()

        # Initialize WebSocket Server
        self.ws_server = MotionEaseWebSocketServer()

        # Performance Metrics
        self.frame_count = 0
        self.fps = 0.0
        self.avg_latency_ms = 0.0
        self.last_metrics_broadcast = 0.0

    def start(self):
        """Starts all subsystems and main vision-processing loop."""
        self.is_running = True

        # 1. Start WebSocket Server
        self.ws_server.start(command_handler=self.handle_client_command)

        # 2. Start Camera
        cam_started = self.camera.start()
        if not cam_started:
            logger.error("Failed to start primary webcam. Retrying in background...")

        # 3. Start Audio Capture & Speech Recognizer
        audio_started = self.audio_capture.start()
        if audio_started:
            self.speech_recognizer.start(on_intent_callback=self._on_voice_intent)

        logger.info("MotionEase Engine started successfully. Beginning processing loop.")

        # 4. Main Processing Loop
        try:
            self._main_loop()
        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received.")
        finally:
            self.stop()

    def _on_voice_intent(self, intent_data: Dict[str, Any]):
        """Callback for recognized voice commands."""
        # Route through Multimodal Fusion
        self.fusion.process_voice_intent(intent_data)

        # Broadcast event to UI
        self.ws_server.broadcast({
            "type": "voice_command",
            "intent": intent_data.get("intent"),
            "target": intent_data.get("target"),
            "raw_text": intent_data.get("raw_text"),
            "confidence": intent_data.get("confidence", 0.9),
            "timestamp": time.strftime("%H:%M:%S")
        })

    def _main_loop(self):
        fps_timer = time.perf_counter()
        frames_in_second = 0

        while self.is_running:
            loop_start = time.perf_counter()
            ret, frame, timestamp_ms = self.camera.read_frame()

            if not ret or frame is None:
                time.sleep(0.01)
                continue

            self._last_frame_bgr = frame
            self.frame_count += 1

            # 1. Image Preprocessing (Adaptive CLAHE for variable lighting)
            processed_frame = self.preprocessor.process(frame)

            # 2. Facial Landmark & Iris Detection
            detection = self.face_detector.detect(processed_frame, timestamp_ms)

            gaze_data = None
            head_data = None
            gesture_data = None
            dwell_data = None
            ui_landmarks = []

            if detection["face_detected"]:
                landmarks_norm = detection["landmarks_norm"]
                landmarks_px = detection["landmarks_px"]
                left_iris = detection["left_iris"]
                right_iris = detection["right_iris"]
                blendshapes = detection["blendshapes"]

                # A. Head Pose Estimation
                head_data = self.head_pose.estimate_pose(landmarks_px, frame.shape[:2])

                # B. Facial Gesture Recognition (EAR + Blendshapes)
                gesture_data = self.gesture_detector.detect_gestures(
                    detection["left_eye"],
                    detection["right_eye"],
                    blendshapes,
                    timestamp_ms
                )

                # C. Eye Gaze Tracking & Polynomial Calibration Mapping
                gaze_data = self.gaze_tracker.estimate_gaze(landmarks_norm, left_iris, right_iris)
                raw_x = gaze_data["screen_x"]
                raw_y = gaze_data["screen_y"]

                # D. Signal Filtering: Speed-Gain Adaptive 1€ Filter + Kalman
                timestamp_sec = timestamp_ms / 1000.0 if timestamp_ms > 0 else time.perf_counter()
                euro_x, euro_y = self.one_euro.filter(raw_x, raw_y, timestamp_sec)
                filtered_x, filtered_y = self.kalman.update(euro_x, euro_y)

                # Overwrite gaze_data with filtered coordinates
                gaze_data["screen_x"] = round(filtered_x, 4)
                gaze_data["screen_y"] = round(filtered_y, 4)
                gaze_data["raw_x"] = round(raw_x, 4)
                gaze_data["raw_y"] = round(raw_y, 4)

                # E. Dynamic Dwell Scaling
                dwell_data = self.dwell_controller.update(
                    filtered_x * self.dispatcher.mouse.screen_width,
                    filtered_y * self.dispatcher.mouse.screen_height,
                    confidence=gaze_data["confidence"],
                    timestamp_ms=timestamp_ms
                )

                # F. Handle Active Calibration Sample Gathering
                if self.gaze_tracker.is_calibrating and hasattr(self, "_active_calib_point"):
                    pt = self._active_calib_point
                    self.gaze_tracker.add_calibration_sample(
                        pt["id"], pt["x"], pt["y"],
                        landmarks_norm, left_iris, right_iris
                    )

                # Compact subsampled landmarks for frontend canvas visualization
                # Key facial contour indices + iris centers
                key_indices = [
                    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
                    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
                    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
                    # Left & Right eyes
                    33, 160, 158, 133, 153, 144,
                    362, 385, 387, 263, 373, 380,
                    # Lips
                    61, 291, 0, 17,
                    # Nose & Iris
                    1, 468, 473
                ]
                ui_landmarks = [
                    {"x": round(landmarks_norm[i][0], 3), "y": round(landmarks_norm[i][1], 3)}
                    for i in key_indices if i < len(landmarks_norm)
                ]

                # G. Parallel Multimodal Feature Fusion
                if self.is_tracking:
                    self.fusion.process_vision_frame(gaze_data, head_data, gesture_data, dwell_data)

            # Compute loop latency
            loop_duration_ms = (time.perf_counter() - loop_start) * 1000.0
            self.avg_latency_ms = round(self.avg_latency_ms * 0.9 + loop_duration_ms * 0.1, 1)

            # Calculate FPS
            frames_in_second += 1
            now = time.perf_counter()
            if now - fps_timer >= 1.0:
                self.fps = round(frames_in_second / (now - fps_timer), 1)
                frames_in_second = 0
                fps_timer = now

            # Broadcast Real-Time Telemetry to Frontend
            self._broadcast_telemetry(detection, gaze_data, head_data, gesture_data, dwell_data, ui_landmarks)

            # System Metrics Broadcast every 1s
            if now - self.last_metrics_broadcast >= config.METRICS_REPORT_INTERVAL_SEC:
                self._broadcast_system_metrics()
                self.last_metrics_broadcast = now

            # Throttle to maintain target frame rate
            time.sleep(0.005)

    def _broadcast_telemetry(self, detection, gaze_data, head_data, gesture_data, dwell_data, ui_landmarks):
        """Constructs and broadcasts structured telemetry JSON to React dashboard."""
        preview_b64 = None
        if hasattr(self, "_last_frame_bgr") and self._last_frame_bgr is not None and (self.frame_count % 2 == 0):
            try:
                import cv2
                import base64
                thumb = cv2.resize(self._last_frame_bgr, (320, 240))
                ok, enc = cv2.imencode(".jpg", thumb, [cv2.IMWRITE_JPEG_QUALITY, 45])
                if ok:
                    preview_b64 = "data:image/jpeg;base64," + base64.b64encode(enc).decode("ascii")
            except Exception:
                pass

        msg = {
            "type": "telemetry",
            "timestamp": time.time(),
            "preview_frame": preview_b64,
            "face_detected": detection.get("face_detected", False),
            "bbox": detection.get("bbox") if detection.get("face_detected") else None,
            "landmarks": ui_landmarks,
            "gaze": {
                "x": gaze_data["screen_x"] if gaze_data else 0.5,
                "y": gaze_data["screen_y"] if gaze_data else 0.5,
                "raw_x": gaze_data.get("raw_x", 0.5) if gaze_data else 0.5,
                "raw_y": gaze_data.get("raw_y", 0.5) if gaze_data else 0.5,
                "confidence": gaze_data["confidence"] if gaze_data else 0.0,
                "mode": gaze_data.get("mode") if gaze_data else "searching",
                "is_calibrated": self.gaze_tracker.is_calibrated
            },
            "head": {
                "pitch": head_data.get("pitch", 0.0) if head_data else 0.0,
                "yaw": head_data.get("yaw", 0.0) if head_data else 0.0,
                "roll": head_data.get("roll", 0.0) if head_data else 0.0,
                "direction": head_data.get("direction", "neutral") if head_data else "neutral",
                "scroll_action": head_data.get("scroll_action") if head_data else None
            },
            "gesture": {
                "detected": gesture_data.get("gesture") if gesture_data else None,
                "confidence": gesture_data.get("confidence", 0.0) if gesture_data else 0.0,
                "left_ear": gesture_data.get("left_ear", 0.0) if gesture_data else 0.0,
                "right_ear": gesture_data.get("right_ear", 0.0) if gesture_data else 0.0,
                "is_blink": gesture_data.get("is_blink", False) if gesture_data else False,
                "blendshapes": gesture_data.get("blendshapes_summary", {}) if gesture_data else {}
            },
            "dwell": {
                "progress": dwell_data.get("dwell_progress", 0.0) if dwell_data else 0.0,
                "is_dwelling": dwell_data.get("is_dwelling", False) if dwell_data else False
            },
            "audio_level": self.audio_capture.get_rms_level()
        }
        self.ws_server.broadcast(msg)

    def _broadcast_system_metrics(self):
        """Broadcasts actual measured system telemetry to the UI."""
        try:
            cpu_pct = psutil.cpu_percent()
            mem_info = self.process.memory_info()
            mem_mb = round(mem_info.rss / (1024 * 1024), 1)
        except Exception:
            cpu_pct = 0.0
            mem_mb = 0.0

        msg = {
            "type": "system_status",
            "camera": "connected" if self.camera.is_running else "disconnected",
            "microphone": "connected" if self.audio_capture.is_recording else "disconnected",
            "fps": self.fps,
            "latency_ms": self.avg_latency_ms,
            "cpu_usage": cpu_pct,
            "memory_usage_mb": mem_mb,
            "actions_executed": self.dispatcher.actions_count,
            "is_tracking": self.is_tracking,
            "is_paused": self.dispatcher.is_paused,
            "emergency_stop": self.dispatcher.emergency_stop,
            "fusion": self.fusion.get_fusion_state(),
            "slm": self.slm_engine.get_status(),
            "recent_actions": self.dispatcher.get_recent_actions(limit=10)
        }
        self.ws_server.broadcast(msg)

    def handle_client_command(self, payload: Dict[str, Any]):
        """Handles incoming command messages sent from the React UI."""
        cmd = payload.get("command")
        data = payload.get("data", {})
        logger.info(f"Received client command: '{cmd}'")

        if cmd == "START_TRACKING":
            self.is_tracking = True
            self.dispatcher.set_paused(False)

        elif cmd == "PAUSE_TRACKING":
            self.is_tracking = False
            self.dispatcher.set_paused(True)

        elif cmd == "STOP_TRACKING":
            self.is_tracking = False
            self.dispatcher.set_paused(True)

        elif cmd == "EMERGENCY_STOP":
            self.is_tracking = False
            self.dispatcher.set_emergency_stop(True)

        elif cmd == "RESUME_EMERGENCY_STOP":
            self.dispatcher.set_emergency_stop(False)
            self.is_tracking = True

        elif cmd == "TOGGLE_MODALITY":
            modality = data.get("modality")
            enabled = bool(data.get("enabled", True))
            self.fusion.set_modality_status(modality, enabled)

        elif cmd == "START_CALIBRATION":
            self.gaze_tracker.start_calibration()
            self._active_calib_point = config.CALIBRATION_POINTS[0]
            self.ws_server.broadcast({
                "type": "calibration_event",
                "status": "started",
                "point": self._active_calib_point,
                "point_index": 0,
                "total_points": len(config.CALIBRATION_POINTS)
            })

        elif cmd == "SET_CALIBRATION_POINT":
            index = data.get("index", 0)
            if 0 <= index < len(config.CALIBRATION_POINTS):
                self._active_calib_point = config.CALIBRATION_POINTS[index]
                self.ws_server.broadcast({
                    "type": "calibration_event",
                    "status": "point_active",
                    "point": self._active_calib_point,
                    "point_index": index,
                    "total_points": len(config.CALIBRATION_POINTS)
                })

        elif cmd == "COMPLETE_CALIBRATION":
            res = self.gaze_tracker.complete_calibration()
            if hasattr(self, "_active_calib_point"):
                delattr(self, "_active_calib_point")
            self.ws_server.broadcast({
                "type": "calibration_event",
                "status": "completed",
                "result": res
            })

        elif cmd == "RESET_CALIBRATION":
            self.gaze_tracker.reset_calibration()
            self.ws_server.broadcast({
                "type": "calibration_event",
                "status": "reset"
            })

        elif cmd == "CALIBRATE_NEUTRAL_HEAD":
            # Calibrate current head pose as baseline
            ret, frame, _ = self.camera.read_frame()
            if ret and frame is not None:
                det = self.face_detector.detect(frame)
                if det["face_detected"]:
                    hp = self.head_pose.estimate_pose(det["landmarks_px"], frame.shape[:2])
                    self.head_pose.calibrate_neutral(hp["raw_pitch"], hp["raw_yaw"], hp["raw_roll"])
                    self.ws_server.broadcast({
                        "type": "head_calibrated",
                        "pitch": hp["raw_pitch"],
                        "yaw": hp["raw_yaw"],
                        "roll": hp["raw_roll"]
                    })

        elif cmd == "GET_DEVICES":
            cameras = CameraManager.list_available_cameras()
            mics = AudioCaptureManager.list_microphones()
            self.ws_server.broadcast({
                "type": "device_list",
                "cameras": cameras,
                "microphones": mics
            })

        elif cmd == "KEYBOARD_PRESS":
            key = data.get("key", "")
            updated_text = self.virtual_keyboard.press_key(key)
            # Fetch predictive suggestions for the current text
            pred = self.slm_engine.predict(updated_text)
            self.ws_server.broadcast({
                "type": "keyboard_update",
                "text": updated_text,
                "suggestions": pred["suggestions"],
                "slm_info": pred
            })

        elif cmd == "KEYBOARD_SUGGESTION":
            sugg = data.get("suggestion", "")
            updated_text = self.virtual_keyboard.append_suggestion(sugg)
            pred = self.slm_engine.predict(updated_text)
            self.ws_server.broadcast({
                "type": "keyboard_update",
                "text": updated_text,
                "suggestions": pred["suggestions"],
                "slm_info": pred
            })

        elif cmd == "KEYBOARD_CLEAR":
            self.virtual_keyboard.clear()
            pred = self.slm_engine.predict("")
            self.ws_server.broadcast({
                "type": "keyboard_update",
                "text": "",
                "suggestions": pred["suggestions"],
                "slm_info": pred
            })

        elif cmd == "TEST_VOICE_COMMAND":
            text = data.get("text", "")
            self.speech_recognizer.feed_simulated_or_direct_transcript(text)

        elif cmd == "UPDATE_SETTINGS":
            # Update One-Euro, Dwell, or Gesture settings dynamically
            one_euro_cfg = data.get("one_euro")
            if one_euro_cfg:
                self.one_euro.update_params(
                    min_cutoff=one_euro_cfg.get("min_cutoff"),
                    beta=one_euro_cfg.get("beta")
                )
            dwell_cfg = data.get("dwell")
            if dwell_cfg:
                self.dwell_controller.min_dwell_ms = dwell_cfg.get("min_dwell_ms", self.dwell_controller.min_dwell_ms)
                self.dwell_controller.radius_px = dwell_cfg.get("radius_px", self.dwell_controller.radius_px)

    def stop(self):
        """Clean shutdown releasing all resources."""
        logger.info("Stopping MotionEase Engine...")
        self.is_running = False
        self.camera.stop()
        self.audio_capture.stop()
        self.speech_recognizer.stop()
        self.ws_server.stop()
        logger.info("MotionEase Engine shutdown completed cleanly.")

if __name__ == "__main__":
    engine = MotionEaseEngine()
    engine.start()
