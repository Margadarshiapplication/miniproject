"""
Pexels image search endpoint — replaces the broken Supabase-based Pexels integration.
Calls the Pexels REST API directly from the backend.
"""

import os
import logging
import requests
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter()

PEXELS_BASE_URL = "https://api.pexels.com/v1/search"


def _get_pexels_key() -> str | None:
    return os.environ.get("PEXELS_API_KEY")


async def search_pexels_internal(query: str, per_page: int = 1) -> str | None:
    """
    Internal helper for searching Pexels. Used by itinerary generation.
    Returns the URL of the first matching photo, or None.
    """
    api_key = _get_pexels_key()
    if not api_key or not query:
        return None

    try:
        resp = requests.get(
            PEXELS_BASE_URL,
            params={
                "query": query,
                "per_page": per_page,
                "orientation": "landscape",
            },
            headers={"Authorization": api_key},
            timeout=10,
        )
        if resp.status_code != 200:
            logger.warning(f"Pexels API returned {resp.status_code} for query: {query}")
            return None

        data = resp.json()
        photos = data.get("photos", [])
        if photos:
            src = photos[0].get("src", {})
            return src.get("large") or src.get("medium") or None
    except Exception as e:
        logger.warning(f"Pexels search failed for '{query}': {e}")

    return None


@router.get("/api/images/search")
async def search_images(
    query: str = Query(..., description="Search query for images"),
    per_page: int = Query(5, ge=1, le=30, description="Results per page"),
    orientation: str = Query("landscape", description="Photo orientation"),
):
    """
    Proxy endpoint for Pexels image search.
    Returns cleaned photo results to the frontend.
    """
    api_key = _get_pexels_key()
    if not api_key:
        return JSONResponse(
            {"error": "PEXELS_API_KEY not configured"},
            status_code=500,
        )

    try:
        resp = requests.get(
            PEXELS_BASE_URL,
            params={
                "query": query,
                "per_page": per_page,
                "orientation": orientation,
            },
            headers={"Authorization": api_key},
            timeout=10,
        )

        if resp.status_code != 200:
            return JSONResponse(
                {"error": f"Pexels API error: {resp.status_code}"},
                status_code=resp.status_code,
            )

        data = resp.json()
        # Return a cleaned response
        photos = []
        for photo in data.get("photos", []):
            photos.append({
                "id": photo.get("id"),
                "alt": photo.get("alt", ""),
                "photographer": photo.get("photographer", ""),
                "src": {
                    "original": photo.get("src", {}).get("original"),
                    "large": photo.get("src", {}).get("large"),
                    "medium": photo.get("src", {}).get("medium"),
                    "small": photo.get("src", {}).get("small"),
                    "thumbnail": photo.get("src", {}).get("tiny"),
                },
            })

        return {
            "query": query,
            "total_results": data.get("total_results", 0),
            "photos": photos,
        }

    except requests.Timeout:
        return JSONResponse(
            {"error": "Pexels API timeout"}, status_code=504
        )
    except Exception as e:
        logger.error(f"Pexels search error: {e}", exc_info=True)
        return JSONResponse(
            {"error": str(e)}, status_code=500
        )
