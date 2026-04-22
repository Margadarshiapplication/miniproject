# =============================================================================
# Margdarshi — Dockerfile for Hugging Face Spaces
# Port 7860 | Docker SDK | FastAPI + React SPA + NVIDIA Llama 3.1 8B
# =============================================================================

FROM python:3.11-slim

# System deps + Node.js 20
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python backend ────────────────────────────────────────────────────────────
COPY server/requirements.txt server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt

# ── Frontend build ────────────────────────────────────────────────────────────
COPY package.json ./
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy all source files before building
COPY . .

# ── Vite build-time env vars ──────────────────────────────────────────────────
# Vite BAKES these into the JS bundle at build time.
ARG VITE_API_URL=https://ritchieellis00-margdarshi.hf.space
ARG VITE_SUPABASE_URL=https://pdjxymxgjglleqznlzxg.supabase.co
ARG VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkanh5bXhnamdsbGVxem5senhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0OTkxMzYsImV4cCI6MjA5MDA3NTEzNn0.EN25xcCruiqCZjcwVdmI-cEK18QyS36xgaf3UeB-O7U

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_KEY=$VITE_SUPABASE_KEY

RUN npm run build

# ── Runtime ───────────────────────────────────────────────────────────────────
ENV PORT=7860

# Backend runtime secrets (set via HF Space Settings → Secrets):
# NVIDIA_API_KEY, PEXELS_API_KEY, SUPABASE_SECRET_KEY, HF_TOKEN

EXPOSE 7860

CMD ["python", "-m", "server.main"]
