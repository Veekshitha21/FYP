"""
MODULE I.2: Local Small Language Model (SLM) Predictive Text Engine
File: typing_engine/slm_engine.py
Connects to local GGUF models via llama.cpp or falls back gracefully to the
dictionary-based autocomplete engine when no local weights are mounted.
Strictly adheres to privacy and offline execution.
"""

import os
import time
from typing import List, Dict, Any, Optional
from utils.logger import get_logger
from typing_engine.autocomplete import AutocompleteEngine
import config

logger = get_logger("SLMEngine")

class SLMPredictiveEngine:
    def __init__(self, model_dir: str = str(config.MODELS_DIR / "language_model")):
        self.model_dir = model_dir
        self.fallback_engine = AutocompleteEngine()
        self.model = None
        self.model_filename = None
        self.is_loaded = False
        self.last_latency_ms = 0.0

        self._check_and_load_model()

    def _check_and_load_model(self):
        """Scans models directory for a local .gguf model file."""
        if not os.path.exists(self.model_dir):
            os.makedirs(self.model_dir, exist_ok=True)

        files = [f for f in os.listdir(self.model_dir) if f.endswith(".gguf")]
        if not files:
            logger.info("No local GGUF models found in models/language_model. Using dictionary fallback engine.")
            self.is_loaded = False
            return

        self.model_filename = files[0]
        model_path = os.path.join(self.model_dir, self.model_filename)
        logger.info(f"Found local model: {self.model_filename}. Attempting initialization...")

        try:
            # Attempt to import llama_cpp if installed
            from llama_cpp import Llama
            self.model = Llama(
                model_path=model_path,
                n_ctx=512,
                n_threads=4,
                verbose=False
            )
            self.is_loaded = True
            logger.info(f"Local SLM {self.model_filename} successfully loaded!")
        except ImportError:
            logger.warning("llama_cpp Python package is not installed. Using dictionary autocomplete fallback.")
            self.is_loaded = False
        except Exception as e:
            logger.error(f"Error loading GGUF model: {e}")
            self.is_loaded = False

    def predict(self, context_text: str, max_tokens: int = 15) -> Dict[str, Any]:
        """
        Generates predictive text completions for the current typed context.
        Falls back seamlessly to dictionary suggestions if SLM is not active.
        """
        start_time = time.perf_counter()

        if self.is_loaded and self.model:
            try:
                prompt = f"Complete the following sentence naturally for an assistive AAC user:\nInput: {context_text}\nCompletion:"
                output = self.model(
                    prompt,
                    max_tokens=max_tokens,
                    stop=["\n", "."],
                    temperature=0.3
                )
                text = output["choices"][0]["text"].strip()
                self.last_latency_ms = round((time.perf_counter() - start_time) * 1000.0, 1)
                return {
                    "suggestions": [text] if text else self.fallback_engine.get_suggestions(context_text),
                    "engine": f"Local SLM ({self.model_filename})",
                    "latency_ms": self.last_latency_ms,
                    "is_local_slm": True
                }
            except Exception as e:
                logger.error(f"SLM inference failure: {e}")

        # Dictionary Fallback
        suggestions = self.fallback_engine.get_suggestions(context_text)
        self.last_latency_ms = round((time.perf_counter() - start_time) * 1000.0, 1)
        return {
            "suggestions": suggestions,
            "engine": "Local Dictionary & N-Gram Fallback",
            "latency_ms": self.last_latency_ms,
            "is_local_slm": False
        }

    def get_status(self) -> Dict[str, Any]:
        return {
            "is_loaded": self.is_loaded,
            "model_name": self.model_filename if self.is_loaded else "None (Dictionary Fallback)",
            "model_dir": self.model_dir,
            "last_latency_ms": self.last_latency_ms
        }
