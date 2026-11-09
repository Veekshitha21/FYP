"""
MODULE H.1: Audio Capture
File: speech/audio_capture.py
Captures real-time audio from microphone using sounddevice, computes RMS audio level,
maintains circular audio buffers, and enumerates input devices.
"""

import time
import threading
from typing import List, Dict, Any, Optional, Callable
import numpy as np
import sounddevice as sd

from utils.logger import get_logger
import config

logger = get_logger("AudioCapture")

class AudioCaptureManager:
    def __init__(
        self,
        sample_rate: int = config.SPEECH_SAMPLE_RATE,
        channels: int = config.SPEECH_CHANNELS
    ):
        self.sample_rate = sample_rate
        self.channels = channels
        self.is_recording = False
        self.stream: Optional[sd.InputStream] = None
        self.lock = threading.Lock()
        
        self.current_rms_level: float = 0.0 # 0.0 to 1.0 for UI audio visualizer
        self.audio_buffer: List[np.ndarray] = []
        self.buffer_lock = threading.Lock()
        self.on_chunk_callback: Optional[Callable[[np.ndarray], None]] = None

    @staticmethod
    def list_microphones() -> List[Dict[str, Any]]:
        """Enumerates connected audio input devices."""
        devices = []
        try:
            device_list = sd.query_devices()
            for idx, dev in enumerate(device_list):
                if dev.get("max_input_channels", 0) > 0:
                    devices.append({
                        "index": idx,
                        "name": dev.get("name", f"Microphone {idx}"),
                        "channels": dev.get("max_input_channels"),
                        "default_sample_rate": dev.get("default_samplerate"),
                        "status": "available"
                    })
        except Exception as e:
            logger.warning(f"Could not list audio devices: {e}")
        return devices

    def _audio_callback(self, indata, frames, time_info, status):
        """Low-level sounddevice audio stream callback."""
        if status:
            logger.debug(f"SoundDevice status: {status}")

        # Compute RMS volume level (normalized 0.0 to 1.0)
        rms = np.sqrt(np.mean(indata**2))
        normalized_rms = min(1.0, float(rms * 10.0))

        with self.lock:
            self.current_rms_level = normalized_rms

        with self.buffer_lock:
            self.audio_buffer.append(indata.copy())
            # Keep approximately 5 seconds of audio buffer
            max_chunks = int(5.0 * (self.sample_rate / max(1, frames)))
            if len(self.audio_buffer) > max_chunks:
                self.audio_buffer.pop(0)

        if self.on_chunk_callback:
            try:
                self.on_chunk_callback(indata.copy())
            except Exception as e:
                logger.error(f"Error in on_chunk_callback: {e}")

    def start(self, device_index: Optional[int] = None) -> bool:
        """Starts real-time microphone stream."""
        if self.is_recording:
            return True

        logger.info("Starting AudioCaptureManager...")
        try:
            self.stream = sd.InputStream(
                samplerate=self.sample_rate,
                channels=self.channels,
                device=device_index,
                callback=self._audio_callback,
                blocksize=int(self.sample_rate * 0.1) # 100ms chunks
            )
            self.stream.start()
            self.is_recording = True
            logger.info("Microphone stream started.")
            return True
        except Exception as e:
            logger.error(f"Failed to start audio stream: {e}")
            self.is_recording = False
            return False

    def get_rms_level(self) -> float:
        """Returns the current audio input level (0.0 to 1.0)."""
        with self.lock:
            return round(self.current_rms_level, 3)

    def get_recent_audio(self, duration_sec: float = 2.0) -> np.ndarray:
        """Concatenates and returns the most recent N seconds of audio samples."""
        with self.buffer_lock:
            if not self.audio_buffer:
                return np.zeros((0, self.channels), dtype=np.float32)
            concatenated = np.concatenate(self.audio_buffer, axis=0)
            target_samples = int(duration_sec * self.sample_rate)
            if len(concatenated) > target_samples:
                return concatenated[-target_samples:]
            return concatenated

    def stop(self):
        """Stops audio stream and releases hardware."""
        self.is_recording = False
        if self.stream:
            try:
                self.stream.stop()
                self.stream.close()
            except Exception as e:
                logger.debug(f"Error closing audio stream: {e}")
            self.stream = None
        with self.lock:
            self.current_rms_level = 0.0
        with self.buffer_lock:
            self.audio_buffer.clear()
        logger.info("Audio capture manager stopped.")
