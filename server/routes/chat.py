"""
Streaming chat endpoint — AI travel coaching with personality and emojis.
Uses NVIDIA NIM API (Llama 3.1 8B) for fast ~2-3 second responses.
"""

import json
import logging
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse
from server.model import generate

logger = logging.getLogger(__name__)

router = APIRouter()

SYSTEM_PROMPT = """You are Margdarshi 🧭, an enthusiastic AI travel coach who LOVES helping people explore!

Your vibe:
🎨 Use emojis naturally throughout responses — destinations get icons (🏖️ beaches, 🏔️ mountains, 🏛️ temples, 🌆 cities)
📝 Format with markdown: **bold** for highlights, bullet points for lists
💰 Always mention costs in ₹ (Indian Rupees) with specific numbers
🍜 Recommend local food, hidden gems, and insider tips
📅 Suggest best seasons/months to visit
⚡ Keep responses punchy — 150-250 words max
❓ End EVERY response with a follow-up question to keep the conversation going

Personality: Think enthusiastic friend who's traveled everywhere!
Example: "OMG, Goa is incredible! 🏖️✨ Here's what I'd suggest..."
"""


def _is_model_ready() -> bool:
    try:
        from server.model import _pipeline
        return _pipeline is not None
    except Exception:
        return False


@router.post("/api/chat")
async def chat(request: Request):
    if not _is_model_ready():
        return JSONResponse(
            {"error": "AI model is warming up! 🚀 Please wait a moment and try again."},
            status_code=503,
        )

    try:
        body = await request.json()
        messages = body.get("messages", [])

        if not messages or not isinstance(messages, list):
            return JSONResponse({"error": "Messages are required"}, status_code=400)

        full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

        # NVIDIA API — fast GPU responses (~2-3 seconds)
        response_text = generate(full_messages, max_new_tokens=512, temperature=0.7)

        # Stream as SSE for smooth UI animation
        async def event_stream():
            chunk_size = 15  # Small chunks for typing effect
            for i in range(0, len(response_text), chunk_size):
                chunk = response_text[i:i + chunk_size]
                data = json.dumps({"choices": [{"delta": {"content": chunk}}]})
                yield f"data: {data}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
        )

    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        return JSONResponse({"error": str(e)}, status_code=500)
