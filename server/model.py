"""
Gemma 3 1B model loader and inference pipeline.
Downloads google/gemma-3-1b-it from Hugging Face Hub on startup
and provides a generate() function for text generation.
"""

import os
import logging
from threading import Lock

logger = logging.getLogger(__name__)

_pipeline = None
_lock = Lock()


def load_model():
    """
    Download and initialize the Gemma 3 1B model.
    Called once at server startup. Uses HF_TOKEN for gated model access.
    """
    global _pipeline

    from huggingface_hub import login
    from transformers import pipeline

    hf_token = os.environ.get("HF_TOKEN", "")
    if hf_token:
        logger.info("Logging in to Hugging Face Hub...")
        login(token=hf_token)
    else:
        logger.warning("HF_TOKEN not set — model download may fail for gated models.")

    model_id = "google/gemma-3-1b-it"
    logger.info(f"Loading model: {model_id} (this may take a few minutes on first run)...")

    _pipeline = pipeline(
        "text-generation",
        model=model_id,
        device_map="auto",
        torch_dtype="auto",
    )

    logger.info(f"Model {model_id} loaded successfully.")


def generate(
    messages: list[dict],
    max_new_tokens: int = 1024,
    temperature: float = 0.7,
    top_p: float = 0.9,
) -> str:
    """
    Generate a response given a list of chat messages.
    
    Args:
        messages: List of dicts with 'role' and 'content' keys.
        max_new_tokens: Maximum tokens to generate.
        temperature: Sampling temperature.
        top_p: Nucleus sampling parameter.
    
    Returns:
        Generated text string.
    """
    global _pipeline

    if _pipeline is None:
        raise RuntimeError("Model not loaded. Call load_model() first.")

    with _lock:
        outputs = _pipeline(
            messages,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_p=top_p,
            do_sample=True,
        )

    # Extract the assistant's response from pipeline output
    generated = outputs[0]["generated_text"]

    # The pipeline returns the full conversation; extract the last assistant message
    if isinstance(generated, list):
        # Chat pipeline returns list of message dicts
        for msg in reversed(generated):
            if isinstance(msg, dict) and msg.get("role") == "assistant":
                return msg.get("content", "")
        # Fallback: return the last message content
        if generated:
            last = generated[-1]
            if isinstance(last, dict):
                return last.get("content", str(last))
            return str(last)
    elif isinstance(generated, str):
        return generated

    return str(generated)
