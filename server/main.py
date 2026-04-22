"""
Margdarshi Python Backend — FastAPI server.

Routes:
  /api/chat          — Streaming AI chat (NVIDIA Llama 3.1 8B)
  /api/itinerary     — AI itinerary generation with Pexels photos
  /api/images/search — Pexels image search proxy
  /api/health        — Health check
  /*                 — React SPA (index.html) + static assets
"""

import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse

# Load .env from project root
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("margdarshi")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize NVIDIA API client on startup (instant)."""
    logger.info("Margdarshi backend starting...")
    try:
        from server.model import load_model
        load_model()
        logger.info("NVIDIA API client ready!")
    except Exception as e:
        logger.error(f"Model init failed: {e}")
    yield
    logger.info("Margdarshi backend shutting down.")


app = FastAPI(
    title="Margdarshi API",
    description="AI Travel Planner Backend — powered by NVIDIA Llama 3.1 8B",
    version="3.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routes ────────────────────────────────────────────────────────────────

from server.routes.chat import router as chat_router
from server.routes.itinerary import router as itinerary_router
from server.routes.images import router as images_router

app.include_router(chat_router)
app.include_router(itinerary_router)
app.include_router(images_router)


@app.get("/api/health")
async def health():
    from server.model import _pipeline, MODEL_ID
    return {
        "status": "ok",
        "model": MODEL_ID,
        "inference": "NVIDIA NIM API (GPU-powered)",
        "model_ready": _pipeline is not None,
    }


# ── React SPA ─────────────────────────────────────────────────────────────────

dist_dir = Path(__file__).resolve().parent.parent / "dist"


def _setup_spa():
    if not dist_dir.exists():
        logger.warning("dist/ not found — frontend not built.")
        return

    assets_dir = dist_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        p = dist_dir / "favicon.ico"
        return FileResponse(str(p)) if p.exists() else JSONResponse({}, 404)

    @app.get("/manifest.json", include_in_schema=False)
    async def manifest():
        p = dist_dir / "manifest.json"
        return FileResponse(str(p)) if p.exists() else JSONResponse({}, 404)

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(request: Request, full_path: str):
        if full_path.startswith("api/") or full_path == "api":
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        file_path = dist_dir / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        index = dist_dir / "index.html"
        if index.exists():
            return FileResponse(str(index))
        return JSONResponse({"detail": "Frontend not built"}, status_code=503)

    logger.info("React SPA catch-all registered.")


_setup_spa()


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run("server.main:app", host="0.0.0.0", port=port, reload=False)
