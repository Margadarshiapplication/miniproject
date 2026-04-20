# =============================================================================
# Margdarshi — Dockerfile for Hugging Face Spaces Deployment
# Combined frontend (React/Vite) + backend (FastAPI + Gemma 3 1B)
# All served on port 7860 (HF Spaces default)
# =============================================================================

FROM python:3.11-slim

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---------- Python backend ----------
COPY server/requirements.txt server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt

# ---------- Frontend build ----------
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy all source files
COPY . .

# Build the React frontend with VITE_API_URL="" so it uses relative paths
# (API and frontend are on the same origin in HF Spaces)
ENV VITE_API_URL=""
RUN npm run build

# ---------- Runtime ----------
# Environment variables (set these as HF Space secrets)
ENV PORT=7860
ENV HF_TOKEN=""
ENV PEXELS_API_KEY=""
ENV VITE_SUPABASE_URL=""
ENV VITE_SUPABASE_KEY=""

# The model will be downloaded on first startup via HF_TOKEN
# HF Spaces provides persistent storage at /data for caching
ENV HF_HOME=/data/hf_cache
ENV TRANSFORMERS_CACHE=/data/hf_cache

EXPOSE 7860

# Start the FastAPI server which serves both the API and static frontend
CMD ["python", "-m", "server.main"]
