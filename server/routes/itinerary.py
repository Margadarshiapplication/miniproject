"""
Itinerary generation endpoint.
Uses NVIDIA API (Llama 3.1 8B) for structured travel itineraries with Pexels photos.
Falls back to template if AI fails.
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


def _is_model_ready() -> bool:
    try:
        from server.model import _pipeline
        return _pipeline is not None
    except Exception:
        return False


def extract_json(text: str) -> dict | None:
    """Extract JSON object from model output."""
    # Strategy 1: Direct parse
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        pass

    # Strategy 2: Code blocks
    code_block = re.search(r"```(?:json)?\s*\n?(.*?)```", text, re.DOTALL)
    if code_block:
        try:
            return json.loads(code_block.group(1).strip())
        except (json.JSONDecodeError, TypeError):
            pass

    # Strategy 3: First { ... } block
    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except (json.JSONDecodeError, TypeError):
            pass

    return None


def build_fallback_itinerary(destination: str, days: int, budget: int | None = None, travelers: int = 1) -> dict:
    """Build a template-based itinerary when AI generation fails."""
    daily_budget = (budget or 5000 * days) // days // max(travelers, 1)
    activities = []

    templates = {
        "morning": [
            (f"Sunrise at {destination} viewpoint 🌅", "Watch the sunrise from a scenic viewpoint", 200),
            (f"Heritage walk in {destination} 🏛️", "Guided morning heritage walk through historic areas", 300),
            (f"Local market visit in {destination} 🛍️", "Browse famous local markets for souvenirs and crafts", 100),
        ],
        "afternoon": [
            (f"Explore {destination}'s main attractions 📸", "Visit the most popular tourist spots and landmarks", 500),
            (f"Cultural experience in {destination} 🎭", "Immerse in local traditions and culture", 400),
            (f"Scenic drive around {destination} 🚗", "Take in beautiful surroundings on a scenic route", 600),
        ],
        "evening": [
            (f"Sunset dinner in {destination} 🍽️", "Enjoy local cuisine at a recommended restaurant", 800),
            (f"Night walk in {destination} 🌃", "Experience the vibrant nightlife and food stalls", 500),
            (f"Traditional performance 🎶", "Watch a cultural show or traditional performance", 400),
        ],
    }

    for day in range(1, days + 1):
        for slot in ["morning", "afternoon", "evening"]:
            slot_templates = templates[slot]
            t = slot_templates[(day - 1) % len(slot_templates)]
            cost = min(t[2], daily_budget // 3)
            activities.append({
                "day_number": day,
                "time_slot": slot,
                "title": t[0],
                "description": t[1],
                "location": destination,
                "estimated_cost": cost,
                "photo_url": None,
            })

    total = sum(a["estimated_cost"] for a in activities)
    return {
        "activities": activities,
        "total_estimated_cost": total,
        "tips": [
            f"📍 Book accommodations in {destination} in advance for better rates",
            f"🍜 Try local street food for authentic flavors at lower prices",
            f"📅 Best time to visit {destination} depends on the season — research before booking",
            "📱 Download offline maps for navigation without internet",
            "💰 Carry some cash — not all places accept cards",
        ],
    }


@router.post("/api/itinerary")
async def generate_itinerary(request: Request):
    """Generate a structured travel itinerary using NVIDIA API."""
    try:
        body = await request.json()
        destination = body.get("destination", "")
        days = min(body.get("days", 3), 7)
        budget = body.get("budget")
        travelers = body.get("travelers", 1)
        preferences = body.get("preferences", "general sightseeing")

        if not destination:
            return JSONResponse({"error": "Destination is required"}, status_code=400)

        if not _is_model_ready():
            logger.info("Model not ready — returning fallback itinerary.")
            itinerary = build_fallback_itinerary(destination, days, budget, travelers)
        else:
            try:
                prompt = f"""Create a {days}-day travel itinerary for {destination}.
Budget: INR {budget or 'flexible'} for {travelers} traveler(s).
Preferences: {preferences}.

Respond with ONLY a valid JSON object (no markdown, no explanation):
{{"activities":[{{"day_number":1,"time_slot":"morning","title":"Activity Name","description":"Brief description","location":"Exact place","estimated_cost":500}}],"total_estimated_cost":5000,"tips":["tip 1","tip 2","tip 3"]}}

Rules:
- Include exactly 3 activities per day (morning, afternoon, evening)
- Costs in Indian Rupees (INR)
- Make titles fun with emojis
- Tips should be practical
- JSON ONLY — no other text"""

                messages = [
                    {"role": "system", "content": "You are a travel planner. Respond with ONLY valid JSON. No markdown, no explanation, just the raw JSON object."},
                    {"role": "user", "content": prompt},
                ]

                response_text = generate(messages, max_new_tokens=1024, temperature=0.3)
                itinerary = extract_json(response_text)

                if not itinerary or "activities" not in itinerary:
                    logger.warning("Model did not return valid JSON. Using fallback. Raw: %s", response_text[:300])
                    itinerary = build_fallback_itinerary(destination, days, budget, travelers)
            except Exception as model_err:
                logger.error(f"Model generation failed: {model_err}")
                itinerary = build_fallback_itinerary(destination, days, budget, travelers)

        # Ensure required fields
        itinerary.setdefault("tips", [])
        itinerary.setdefault("total_estimated_cost",
            sum(a.get("estimated_cost", 0) for a in itinerary.get("activities", [])))

        # Enrich activities with Pexels photos
        if isinstance(itinerary.get("activities"), list):
            for activity in itinerary["activities"]:
                activity.setdefault("photo_url", None)
                if activity.get("title"):
                    query = f"{activity['title']} {destination}".strip()
                    try:
                        photo_url = await search_pexels_internal(query)
                        if photo_url:
                            activity["photo_url"] = photo_url
                    except Exception:
                        pass

        return JSONResponse(itinerary)

    except Exception as e:
        logger.error(f"Itinerary generation error: {e}", exc_info=True)
        return JSONResponse({"error": str(e)}, status_code=500)
