"""
Streaming chat endpoint — replaces the Supabase chat edge function.
Uses Gemma 3 1B for AI travel coaching responses.
"""

import json
import logging
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from server.model import generate

logger = logging.getLogger(__name__)

router = APIRouter()

SYSTEM_PROMPT = (
    "You are Margdarshi, an expert AI travel coach. You help users plan trips, "
    "discover destinations, understand local cultures, find the best deals, and "
    "prepare for travel. You are friendly, concise, and proactive with suggestions. "
    "You know Indian and international destinations well. When giving advice, consider "
    "budget, season, travel style, and safety. Use markdown formatting for readability. "
    "If the user mentions a specific destination, provide actionable tips like best time "
    "to visit, must-see spots, local food, budget estimates in INR, and travel logistics."
)


@router.post("/api/chat")
async def chat(request: Request):
    """
    Streaming chat endpoint. Accepts messages array and conversation_id.
    Returns Server-Sent Events (SSE) with generated text chunks.
    """
    try:
        body = await request.json()
        messages = body.get("messages", [])
        # conversation_id is accepted but not used server-side
        # (conversation persistence is handled by the frontend via Supabase)

        if not messages or not isinstance(messages, list):
            return {"error": "Messages are required"}, 400

        # Prepend system prompt
        full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

        # Generate response (synchronous — runs in threadpool via FastAPI)
        response_text = generate(full_messages)

        # Stream the response as SSE for compatibility with the frontend
        async def event_stream():
            # Send the response in chunks to simulate streaming
            chunk_size = 20  # characters per chunk
            for i in range(0, len(response_text), chunk_size):
                chunk = response_text[i:i + chunk_size]
                data = json.dumps({
                    "choices": [{"delta": {"content": chunk}}]
                })
                yield f"data: {data}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )

    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        return {"error": str(e)}
