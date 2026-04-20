"""
Itinerary generation endpoint — replaces the Supabase generate-itinerary edge function.
Uses Gemma 3 1B to generate structured travel itineraries with Pexels photos.
"""

import json
import logging
import re
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from server.model import generate
from server.routes.images import search_pexels_internal

logger = logging.getLogger(__name__)

router = APIRouter()


def extract_json(text: str) -> dict | None:
    """
    Attempt to extract a JSON object from model output.
    Tries multiple strategies for robust parsing.
    """
    # Strategy 1: Try parsing the whole text as JSON
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        pass

    # Strategy 2: Find JSON in code blocks
    code_block = re.search(r"```(?:json)?\s*\n?(.*?)```", text, re.DOTALL)
    if code_block:
        try:
            return json.loads(code_block.group(1).strip())
        except (json.JSONDecodeError, TypeError):
            pass

    # Strategy 3: Find the first { ... } block
    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except (json.JSONDecodeError, TypeError):
            pass

    return None


def build_fallback_itinerary(destination: str, days: int) -> dict:
    """Build a simple fallback itinerary if AI generation fails."""
    activities = []
    time_slots = ["morning", "afternoon", "evening"]
    for day in range(1, days + 1):
        for slot in time_slots:
            activities.append({
                "day_number": day,
                "time_slot": slot,
                "title": f"{slot.capitalize()} exploration in {destination}",
                "description": f"Explore the local sights and culture of {destination}.",
                "location": destination,
                "estimated_cost": 500,
                "photo_url": None,
            })
    return {
        "activities": activities,
        "total_estimated_cost": len(activities) * 500,
        "tips": [
            f"Research local customs before visiting {destination}.",
            "Keep copies of important documents.",
            "Try the local cuisine for an authentic experience.",
        ],
    }


@router.post("/api/itinerary")
async def generate_itinerary(request: Request):
    """
    Generate a structured travel itinerary using Gemma 3 1B.
    Enriches activities with Pexels photos.
    """
    try:
        body = await request.json()
        destination = body.get("destination", "")
        days = body.get("days", 3)
        budget = body.get("budget")
        travelers = body.get("travelers", 1)
        preferences = body.get("preferences", "general sightseeing")

        if not destination:
            return JSONResponse(
                {"error": "Destination is required"}, status_code=400
            )

        prompt = f"""Generate a detailed {days}-day travel itinerary for {destination}.
Budget: ₹{budget or 'flexible'} for {travelers} traveler(s).
Preferences: {preferences}.

You MUST respond with ONLY a valid JSON object (no other text) in this exact format:
{{
  "activities": [
    {{
      "day_number": 1,
      "time_slot": "morning",
      "title": "Activity name",
      "description": "Brief description",
      "location": "Exact location name",
      "estimated_cost": 500
    }}
  ],
  "total_estimated_cost": 5000,
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}}

Include 3 activities per day (morning, afternoon, evening). Use realistic costs in INR.
Respond with ONLY the JSON object, no markdown, no explanation."""

        messages = [
            {
                "role": "system",
                "content": (
                    "You are an expert travel planner. You MUST respond with ONLY valid JSON. "
                    "No markdown, no explanation, no code blocks. Just the raw JSON object."
                ),
            },
            {"role": "user", "content": prompt},
        ]

        response_text = generate(messages, max_new_tokens=2048, temperature=0.3)

        # Try to parse structured output
        itinerary = extract_json(response_text)

        if not itinerary or "activities" not in itinerary:
            logger.warning(
                "Model did not return valid JSON. Using fallback itinerary. Raw output: %s",
                response_text[:500],
            )
            itinerary = build_fallback_itinerary(destination, days)

        # Ensure required fields exist
        if "tips" not in itinerary:
            itinerary["tips"] = []
        if "total_estimated_cost" not in itinerary:
            itinerary["total_estimated_cost"] = sum(
                a.get("estimated_cost", 0) for a in itinerary.get("activities", [])
            )

        # Enrich activities with Pexels photos
        if isinstance(itinerary.get("activities"), list):
            for activity in itinerary["activities"]:
                activity.setdefault("photo_url", None)
                if activity.get("title"):
                    query = f"{activity['title']} {destination}".strip()
                    photo_url = await search_pexels_internal(query)
                    if photo_url:
                        activity["photo_url"] = photo_url

        return JSONResponse(itinerary)

    except Exception as e:
        logger.error(f"Itinerary generation error: {e}", exc_info=True)
        return JSONResponse(
            {"error": str(e)}, status_code=500
        )
