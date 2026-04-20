"""
Margdarshi Python Backend — FastAPI server.

Serves:
  - /api/chat         — Streaming AI chat (Gemma 3 1B)
  - /api/itinerary    — AI itinerary generation with Pexels photos
  - /api/images/search — Pexels image search proxy

On startup, downloads and loads google/gemma-3-1b-it from Hugging Face Hub.
In production (HF Spaces), also serves the built React frontend as static files.
"""

import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Load .env from project root (one level up from server/)
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("margdarshi")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: load the AI model. Shutdown: cleanup."""
    logger.info("Starting Margdarshi backend...")
    from server.model import load_model
    load_model()
    logger.info("Backend ready.")
    yield
    logger.info("Shutting down Margdarshi backend.")


app = FastAPI(
    title="Margdarshi API",
    description="AI Travel Planner Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Vite dev server and any origin in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
from server.routes.chat import router as chat_router
from server.routes.itinerary import router as itinerary_router
from server.routes.images import router as images_router

app.include_router(chat_router)
app.include_router(itinerary_router)
app.include_router(images_router)


# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok", "model": "google/gemma-3-1b-it"}


# Serve frontend static files in production
# (when the React app is built to ../dist/)
dist_dir = Path(__file__).resolve().parent.parent / "dist"
if dist_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="assets")

    # Catch-all: serve index.html for client-side routing
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = dist_dir / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(dist_dir / "index.html"))


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting server on port {port}...")
    uvicorn.run(
        "server.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
    )
