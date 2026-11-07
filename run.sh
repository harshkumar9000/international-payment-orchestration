#!/usr/bin/env bash
# ==============================================================================
# International Payment Orchestration Platform Runner
# Launches:
# 1. Python FastAPI Intelligence Microservice (Port 8000)
# 2. Node.js Express Orchestration Server (Port 5001)
# 3. React Vite Tailwind Frontend (Port 5173)
# ==============================================================================

set -e

echo "🚀 Starting International Payment Orchestration Platform..."
npm run dev

