# ARTISTRY AI — PHASE 9D BACKEND & AI DEPLOYMENT GUIDE
**Microservices Architecture, Docker Deployment, Environment Variables & Offline Invariants**

- **Date:** November 12, 2026
- **Repository:** `D:\antigravity\artist ai app`
- **Application Package ID:** `ai.artistry.studio`
- **Architecture:** Node.js Express API + Python FastAPI AI Engine + On-Device Local Fallback
- **Status:** **PRODUCTION READY**

---

## 1. System Architecture Overview

ARTISTRY AI uses a hybrid **offline-first edge architecture** with an optional cloud AI microservice cluster:

```
+-------------------------------------------------------------------------+
|                         ARTISTRY AI MOBILE CLIENT                       |
|                             (ai.artistry.studio)                        |
|                                                                         |
|  [Skia Canvas]  [Loomis/Grids]  [Paper Studio]  [SQLite Local DB (WAL)] |
|                                                                         |
|                   +-------------------------------+                     |
|                   |       AIServiceManager        |                     |
|                   +---------------+---------------+                     |
|                                   |                                     |
|             +---------------------+---------------------+               |
|             | (Online)                                  | (Offline)     |
|             v                                           v               |
|    [CloudHttpProvider]                      [LocalFallbackProvider]     |
|   (Timeout: 6s–10s)                       (100% On-Device Math/CV)      |
+-------------+-------------------------------------------+---------------+
              |
              | (HTTPS / WSS via Reverse Proxy)
              v
+-------------------------------------------------------------------------+
|                      OPTIONAL CLOUD AI MICROSERVICES                     |
|                                                                         |
|  +---------------------------+       +-------------------------------+  |
|  |    Node.js Express API    |<----->|    Python FastAPI AI Engine   |  |
|  |       (Port 4000)         |       |          (Port 8000)          |  |
|  |                           |       |                               |  |
|  | • JWT Auth & Sessions     |       | • Pose Landmarks (33 pts)     |  |
|  | • Project Cloud Sync      |       | • Neural Sketch Stylization   |  |
|  | • Credit System & Billing |       | • Lighting & Shadow Analysis  |  |
|  | • Rate Limiting & Logs    |       | • Diffusion Reference Synth   |  |
|  +-------------+-------------+       +---------------+---------------+  |
|                |                                     |                  |
|                v                                     v                  |
|       [MongoDB 7.0 (Data)]                 [Pre-trained AI Models]      |
+-------------------------------------------------------------------------+
```

---

## 2. Local-First vs Remote Functionality Matrix

| Feature Area | On-Device Execution (Offline) | Cloud Backend Execution (Optional) | Fallback Behavior |
| :--- | :--- | :--- | :--- |
| **Free Drawing Canvas** | 100% on-device Skia rendering | N/A (Client-only) | Immediate local execution |
| **Classical Overlays** | 100% on-device math rendering | N/A (Client-only) | Immediate local execution |
| **Loomis Head Method** | 100% on-device parametric model | N/A (Client-only) | Immediate local execution |
| **Perspective Grids** | 100% on-device 3D math engine | N/A (Client-only) | Immediate local execution |
| **Paper Studio Keystone** | 100% on-device quad warp | N/A (Client-only) | Immediate local execution |
| **Image Adjustments** | 100% on-device GPU manipulation | N/A (Client-only) | Immediate local execution |
| **Bargue Curriculum** | 100% bundled plates & checkpoints | N/A (Client-only) | Immediate local execution |
| **Drawing Critique** | Deterministic histogram & contour rubrics | Deep learning vision model | Transparent local fallback |
| **Pose Detection** | Bounding box & proportion heuristics | 33-landmark pose model | Transparent local fallback |
| **Sketch Conversion** | High-pass / Otsu thresholding | Neural edge extraction | Transparent local fallback |
| **Color Palettes** | CIELAB harmonic color theory | Generative aesthetic model | Transparent local fallback |
| **Art Mentor Chat** | Pedagogical rule-based guidance | LLM conversational agent | Transparent local fallback |

---

## 3. Production Deployment via Docker Compose

The complete cloud backend is containerized in `docker-compose.prod.yml` with healthchecks, resource limits, and internal network isolation.

### 3.1 Prerequisites
- Docker Engine 24.0+ and Docker Compose v2.
- 2 CPU cores, 4 GB RAM minimum (8 GB recommended for diffusion models).
- SSL domain configured with DNS pointing to server host.

### 3.2 Launch Commands
```bash
# 1. Clone repository to deployment server
git clone -b redesign/traditional-companion <repo-url> artistry-backend
cd artistry-backend

# 2. Configure production environment files
cp backend/.env.production.example backend/.env.production
cp ai-engine/.env.production.example ai-engine/.env.production

# Edit backend/.env.production and ai-engine/.env.production with real secrets:
nano backend/.env.production
nano ai-engine/.env.production

# 3. Build and launch services in detached mode
docker compose -f docker-compose.prod.yml up -d --build

# 4. Verify service health
docker compose -f docker-compose.prod.yml ps
```

---

## 4. Environment Variables Matrix

### 4.1 Node.js Express Backend (`backend/.env.production`)
| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Enables production optimizations and disables debug traces |
| `PORT` | Yes | `4000` | Internal server listening port |
| `API_PREFIX` | Yes | `/api/v1` | URL routing prefix for all endpoints |
| `CORS_ORIGIN` | Yes | `https://api.artistry.studio` | Restricts API access to authorized domain |
| `FASTAPI_AI_URL` | Yes | `http://ai-engine:8000` | Internal Docker network URL for Python AI engine |
| `ENABLE_MONGODB` | Yes | `true` | Enables database persistence for accounts and sync |
| `MONGODB_URI` | Yes | `mongodb://artistry_user:SECRET@mongodb:27017/artistry_ai?authSource=admin` | Authenticated MongoDB connection string |
| `JWT_SECRET` | Yes | *(Cryptographic 64-char string)* | Signs user authentication tokens |
| `JWT_EXPIRES_IN` | Yes | `7d` | Token lifetime |
| `UPLOAD_DIR` | Yes | `./uploads` | Persistent volume path for temporary images |
| `MAX_FILE_SIZE_MB` | Yes | `25` | Maximum image upload payload limit |
| `GEMINI_API_KEY` | Optional | *(Production API Key)* | Optional external model key for advanced critique |
| `OPENAI_API_KEY` | Optional | *(Production API Key)* | Optional external model key |

### 4.2 Python FastAPI AI Engine (`ai-engine/.env.production`)
| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `ENV` | Yes | `production` | FastAPI environment flag |
| `HOST` | Yes | `0.0.0.0` | Bind address inside Docker container |
| `PORT` | Yes | `8000` | Port inside Docker container |
| `WORKERS` | Yes | `2` | Uvicorn worker process count |
| `LOG_LEVEL` | Yes | `info` | Production logging level |
| `MODEL_CACHE_DIR`| Yes | `/app/models` | Local directory for cached weights |

### 4.3 Mobile Client (`.env` or build environment)
| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_AI_API_URL` | No | *(Empty for 100% offline)* | Points to production backend URL. If omitted, mobile app runs in 100% on-device offline mode. |

---

## 5. Reverse Proxy (NGINX) & SSL Configuration

To expose the services safely to the internet, terminate TLS using NGINX:

```nginx
server {
    listen 80;
    server_name api.artistry.studio;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.artistry.studio;

    ssl_certificate /etc/letsencrypt/live/api.artistry.studio/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.artistry.studio/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 30M;

    # Rate limiting zone (optional DDoS protection)
    limit_req zone=api_limit burst=20 nodelay;

    location /api/v1/ {
        proxy_pass http://127.0.0.1:4000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
    }

    location /health {
        proxy_pass http://127.0.0.1:4000/api/v1/health;
        access_log off;
    }
}
```

---

## 6. Network Error Handling, Timeouts & Retries

1. **Client-Side Abort Signals:** All remote API calls through `CloudHttpProvider` implement hard timeouts:
   - Health check: `2500ms`
   - Sketch conversion & critique: `6000ms`
   - Image generation: `8000ms`
2. **Immediate Local Fallback:** When a timeout occurs, HTTP 5xx is returned, or the device lacks an internet connection, the mobile app switches to `LocalFallbackProvider` seamlessly. The user experience is never interrupted.
3. **Graceful Degradation:** Cloud synchronization is asynchronous. If the server is temporarily unreachable, local drawings remain safe in SQLite (`artistry-ai.db`) and are synced when connectivity is restored.
