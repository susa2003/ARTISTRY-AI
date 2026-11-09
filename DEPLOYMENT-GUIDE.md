# ARTISTRY AI — Deployment Guide & Environment Operations

---

## 1. Local Development Quickstart

### Prerequisites
- Node.js >= 20.x, npm >= 10.x
- Python >= 3.10
- Android SDK Platform-Tools (ADB)

### Step 1: Start Python AI Engine
```powershell
cd ai-engine
# On Windows:
$env:PYTHONPATH="ai-engine;ai-engine/.venv/Lib/site-packages"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 2: Start Node.js Backend API
```powershell
cd backend
npm install
npm run dev
# Server boots on http://localhost:4000
```

### Step 3: Run Android Application
```powershell
# Set backend URL for Android emulator (10.0.2.2 maps to host localhost)
$env:EXPO_PUBLIC_AI_API_URL="http://10.0.2.2:4000"
npm start
# Or build offline debug APK:
python scripts/build_offline_apk.py
```

---

## 2. Docker & Containerized Production Deployment

ARTISTRY AI includes a production `docker-compose.yml` orchestrating all services:

```powershell
# Boot Node.js Backend, Python FastAPI AI Engine, and MongoDB
docker compose up -d --build

# Verify services
docker compose ps
curl http://localhost:4000/api/v1/health
curl http://localhost:8000/health
```

### Resource Allocation Guidelines
- **Backend:** 512 MB RAM, 0.5 CPU cores
- **AI Engine (OpenCV/MediaPipe):** 1 GB RAM, 1.0 CPU cores
- **MongoDB:** 512 MB RAM, persistent volume `mongo-data`

---

## 3. Graceful Shutdown & Zero-Downtime Health
Both services implement proper signal trapping (`SIGTERM`, `SIGINT`):
- Node.js closes pending HTTP connections and disconnects Mongoose cleanly.
- Background worker processes finish in-flight jobs before terminating.
