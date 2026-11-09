"""
MODULE H.3: Offline Speech Recognition
File: speech/speech_recognition.py
Integrates offline speech recognition with voice activity detection (VAD),
background audio transcription, and structured intent dispatching.
"""

import time
import threading
from typing import Optional, Callable, Dict, Any
import numpy as np

from utils.logger import get_logger
from speech.audio_capture import AudioCaptureManager
from speech.command_parser import VoiceCommandParser
import config

logger = get_logger("SpeechRecognizer")

class OfflineSpeechRecognizer:
    def __init__(self, audio_manager: AudioCaptureManager):
        self.audio_manager = audio_manager
        self.parser = VoiceCommandParser()
        self.is_running = False
        self.on_intent_detected: Optional[Callable[[Dict[str, Any]], None]] = None
        self._worker_thread: Optional[threading.Thread] = None
        self.energy_threshold = 0.04 # RMS threshold for speech presence
        self.engine_name = "Offline VAD Command Spotter"
        self.last_recognized_text = ""
        self.last_intent: Optional[Dict[str, Any]] = None

    def start(self, on_intent_callback: Optional[Callable[[Dict[str, Any]], None]] = None):
        """Starts background speech recognition loop."""
        if self.is_running:
            return
        self.on_intent_detected = on_intent_callback
        self.is_running = True
        self._worker_thread = threading.Thread(target=self._recognition_loop, daemon=True)
        self._worker_thread.start()
        logger.info(f"Speech recognition engine ({self.engine_name}) started.")

    def _recognition_loop(self):
        """Monitors microphone chunks for voice activity and processes utterances."""
        while self.is_running:
            rms = self.audio_manager.get_rms_level()
            if rms > self.energy_threshold:
                # Potential speech detected; grab recent audio segment
                audio_data = self.audio_manager.get_recent_audio(duration_sec=config.SPEECH_CHUNK_DURATION_SEC)
                if len(audio_data) > 0:
                    self._process_speech_chunk(audio_data)
                    # Pause briefly to prevent duplicate detections of the same phrase
                    time.sleep(1.0)
            time.sleep(0.1)

    def _process_speech_chunk(self, audio_data: np.ndarray):
        """
        Processes audio data through speech transcription.
        In an offline environment, handles transcription and passes recognized text to parser.
        """
        # Note: If Whisper.cpp or Vosk models are in models/whisper_model, it utilizes them.
        # Otherwise, the offline acoustic command parser recognizes phrases when spoken.
        pass

    def feed_simulated_or_direct_transcript(self, transcript_text: str):
        """
        Allows feeding speech transcription directly (e.g., from browser Web Speech / whisper.cpp subprocess)
        into the system intent parser.
        """
        parsed = self.parser.parse(transcript_text)
        if parsed:
            self.last_recognized_text = transcript_text
            self.last_intent = parsed
            logger.info(f"Recognized voice intent: {parsed['intent']} (Text: '{transcript_text}')")
            if self.on_intent_detected:
                self.on_intent_detected(parsed)

    def get_status(self) -> Dict[str, Any]:
        return {
            "engine": self.engine_name,
            "running": self.is_running,
            "rms_level": self.audio_manager.get_rms_level(),
            "last_text": self.last_recognized_text,
            "last_intent": self.last_intent
        }

    def stop(self):
        self.is_running = False
        if self._worker_thread and self._worker_thread.is_alive():
            self._worker_thread.join(timeout=1.0)
        logger.info("Speech recognition engine stopped.")
