"""
Margdarshi AI model — uses NVIDIA NIM API for instant responses.

NVIDIA API is OpenAI-compatible, runs on NVIDIA's GPUs, giving 2-3 second
responses instead of ~30s with local CPU inference.

Requires NVIDIA_API_KEY environment variable (set in HF Space secrets).
"""

import os
import logging
import requests

logger = logging.getLogger(__name__)

_pipeline = None  # Set to truthy when client is ready

MODEL_ID = "meta/llama-3.1-8b-instruct"
NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"


def load_model():
    """Initialize: just verify the API key is set. No model download needed."""
    global _pipeline

    api_key = os.environ.get("NVIDIA_API_KEY")
    if not api_key:
        raise RuntimeError("NVIDIA_API_KEY not set. Add it to HF Space secrets.")

    # Mark as ready
    _pipeline = True
    logger.info(f"NVIDIA API ready (model: {MODEL_ID})")


def generate(
    messages: list[dict],
    max_new_tokens: int = 512,
    temperature: float = 0.7,
    top_p: float = 0.9,
    _retries: int = 1,
) -> str:
    """
    Generate a response using the NVIDIA NIM API.

    Args:
        messages: List of dicts with 'role' and 'content' keys.
        max_new_tokens: Max tokens to generate.
        temperature: Sampling temperature.
        top_p: Nucleus sampling.
        _retries: Number of retry attempts on transient failures.

    Returns:
        Generated text string.
    """
    api_key = os.environ.get("NVIDIA_API_KEY")
    if not api_key:
        raise RuntimeError("NVIDIA_API_KEY not configured.")

    last_error = None
    for attempt in range(_retries + 1):
        try:
            resp = requests.post(
                NVIDIA_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL_ID,
                    "messages": messages,
                    "max_tokens": max_new_tokens,
                    "temperature": temperature,
                    "top_p": top_p,
                    "stream": False,
                },
                timeout=45,
            )

            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return content.strip()

            error_detail = resp.text[:300]
            logger.error(f"NVIDIA API error {resp.status_code} (attempt {attempt + 1}): {error_detail}")
            last_error = RuntimeError(f"NVIDIA API returned {resp.status_code}: {error_detail}")

            # Retry on 429 (rate limit), 500, 502, 503, 504
            if resp.status_code in (429, 500, 502, 503, 504) and attempt < _retries:
                import time
                time.sleep(2)
                continue
            raise last_error

        except requests.Timeout:
            last_error = RuntimeError("NVIDIA API timed out. Try again.")
            if attempt < _retries:
                import time
                time.sleep(2)
                continue
            raise last_error
        except requests.RequestException as e:
            raise RuntimeError(f"NVIDIA API request failed: {e}")

    raise last_error or RuntimeError("NVIDIA API failed after retries.")
