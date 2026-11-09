# ARTISTRY AI — Production Backend & AI Engine Deployment Guide

This document provides complete, production-grade instructions for provisioning, configuring, hardening, and deploying the **ARTISTRY AI** server ecosystem:
1. **Node.js + Express API Gateway / Backend** (Port `4000`)
2. **Python FastAPI Computer Vision & AI Engine** (Port `8000`)
3. **MongoDB Production Database** (Port `27017`)
4. **Nginx / Caddy Reverse Proxy & TLS Termination** (Port `80` / `443`)

---

## 1. System Architecture & Topology

```
             ┌────────────────────────────────────────────────────────┐
             │                Google Play Android Client              │
             │                   (ai.artistry.studio)                 │
             └───────────────────────────┬────────────────────────────┘
                                         │ HTTPS / TLS 1.3
                                         ▼
             ┌────────────────────────────────────────────────────────┐
             │           Nginx / Caddy Reverse Proxy (443)            │
             │           - SSL Termination (Let's Encrypt)            │
             │           - Rate Limiting & DDOS Mitigation            │
             │           - Strict Security Headers & CORS             │
             └───────────┬────────────────────────────────┬───────────┘
                         │                                │
      /api/v1/*          ▼                                ▼  (Internal Only)
             ┌───────────────────────┐        ┌───────────────────────┐
             │  Node.js API Gateway  │◄──────►│  FastAPI AI Engine    │
             │  Express + TypeScript │  HTTP  │  OpenCV + MediaPipe   │
             │      (Port 4000)      │        │      (Port 8000)      │
             └───────────┬───────────┘        └───────────────────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │   MongoDB 7 Cluster   │
             │ Replica Set (rs0/TLS) │
             │     (Port 27017)      │
             └───────────────────────┘
```

---

## 2. Infrastructure Prerequisites

| Component | Minimum Specification | Recommended Production Spec |
| :--- | :--- | :--- |
| **Operating System** | Ubuntu 22.04 LTS or 24.04 LTS | Ubuntu 24.04 LTS |
| **CPU** | 2 vCPU | 4–8 vCPU (Dedicated compute for OpenCV/MediaPipe) |
| **RAM** | 4 GB | 8–16 GB |
| **Disk Storage** | 40 GB NVMe SSD | 100+ GB NVMe SSD |
| **Docker Engine** | Docker Engine 24+ / Compose v2.20+ | Docker Engine 27+ / Compose v2.29+ |

---

## 3. Directory Layout on Deployment Host

Deploy to `/opt/artistry-ai`:
```bash
/opt/artistry-ai/
├── backend/
│   ├── Dockerfile
│   ├── .env.production
│   ├── dist/
│   └── package.json
├── ai-engine/
│   ├── Dockerfile
│   ├── .env.production
│   └── requirements.txt
├── docker-compose.prod.yml
├── nginx/
│   └── artistry.conf
└── scripts/
    ├── backup-mongodb.sh
    └── restore-mongodb.sh
```

---

## 4. Production Environment Configuration

### A. Node.js Backend (`backend/.env.production`)
Create `/opt/artistry-ai/backend/.env.production` with permissions `chmod 600`:
```ini
PORT=4000
NODE_ENV=production
API_PREFIX=/api/v1
CORS_ORIGIN=https://admin.artistry.ai,https://api.artistry.ai
FASTAPI_AI_URL=http://ai-engine:8000
ENABLE_MONGODB=true
MONGODB_URI=mongodb://artistry_app_user:STRONG_SECURE_PASSWORD@mongodb:27017/artistry_ai?authSource=admin&replicaSet=rs0
JWT_SECRET=GENERATE_64_BYTE_HEX_OR_BASE64_RANDOM_SECRET
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_DAYS=60
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE_MB=25
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=/app/secrets/play-service-account.json
GOOGLE_PLAY_PACKAGE_NAME=ai.artistry.studio
GEMINI_API_KEY=YOUR_PRODUCTION_GEMINI_API_KEY
```

> **Security Guard**: Generate a cryptographic JWT secret using:
> ```bash
> openssl rand -base64 48
> ```

### B. Python AI Engine (`ai-engine/.env.production`)
Create `/opt/artistry-ai/ai-engine/.env.production` with permissions `chmod 600`:
```ini
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
LOG_LEVEL=info
WORKERS=4
CORS_ORIGINS=http://backend:4000
GEMINI_API_KEY=YOUR_PRODUCTION_GEMINI_API_KEY
CV_MAX_IMAGE_DIMENSION=2048
CV_JPEG_QUALITY=90
```

---

## 5. Automated Container Orchestration with Docker Compose

To boot all production services:
```bash
cd /opt/artistry-ai
docker compose -f docker-compose.prod.yml up -d --build
```

Verify service health:
```bash
docker compose -f docker-compose.prod.yml ps
```
All services (`backend`, `ai-engine`, `mongodb`) should transition to `(healthy)`.

---

## 6. Reverse Proxy Configuration (Nginx & SSL/TLS)

Install Nginx and Certbot:
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

Configure `/etc/nginx/sites-available/api.artistry.ai`:
```nginx
# Rate Limiting Zones
limit_req_zone $binary_remote_addr zone=artistry_api_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=artistry_auth_limit:10m rate=5r/s;

server {
    server_name api.artistry.ai;

    client_max_body_size 30M;

    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Auth routes rate-limiting
    location /api/v1/auth/ {
        limit_req zone=artistry_auth_limit burst=10 nodelay;
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # General API routes
    location /api/v1/ {
        limit_req zone=artistry_api_limit burst=50 nodelay;
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
    }

    # Deny direct access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

Obtain Let's Encrypt TLS Certificate:
```bash
sudo certbot --nginx -d api.artistry.ai
```

---

## 7. MongoDB Production Hardening & Backups

### Initializing MongoDB Indexes
Run the index synchronization script to guarantee optimal query performance:
```bash
docker compose -f docker-compose.prod.yml exec backend npm run db:indexes
```

### Automated Backup Script (`/opt/artistry-ai/scripts/backup-mongodb.sh`)
```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/artistry-ai-mongodb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TARGET="${BACKUP_DIR}/artistry_${TIMESTAMP}"
RETENTION_DAYS=14

mkdir -p "${BACKUP_DIR}"

echo "[${TIMESTAMP}] Starting MongoDB backup..."
docker compose -f /opt/artistry-ai/docker-compose.prod.yml exec -T mongodb mongodump \
  --db=artistry_ai \
  --archive > "${TARGET}.archive"

gzip "${TARGET}.archive"
echo "[${TIMESTAMP}] Backup completed: ${TARGET}.archive.gz"

# Retention prune
find "${BACKUP_DIR}" -name "*.archive.gz" -mtime +${RETENTION_DAYS} -delete
echo "[${TIMESTAMP}] Pruned backups older than ${RETENTION_DAYS} days."
```

Schedule daily backup via `crontab -e`:
```cron
0 2 * * * /opt/artistry-ai/scripts/backup-mongodb.sh >> /var/log/artistry-backup.log 2>&1
```

---

## 8. Zero-Downtime Rolling Deployment Strategy

To deploy an updated backend or AI engine container image without taking down the service:
```bash
#!/bin/bash
set -e

echo "Pulling latest code and building containers..."
docker compose -f docker-compose.prod.yml build --pull backend ai-engine

echo "Performing rolling update on backend..."
docker compose -f docker-compose.prod.yml up -d --no-deps --build backend

echo "Verifying health..."
sleep 10
curl -f http://127.0.0.1:4000/api/v1/health || { echo "Health check failed! Rolling back."; exit 1; }

echo "Performing rolling update on ai-engine..."
docker compose -f docker-compose.prod.yml up -d --no-deps --build ai-engine

echo "Deployment successful."
```

---

## 9. Health Checks, Monitoring & Alerting

### Health Endpoint
- **GET** `https://api.artistry.ai/api/v1/health`
- **Expected Status**: `200 OK`
- **Payload Schema**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-11-09T18:20:00.000Z",
    "version": "1.0.0",
    "services": {
      "mongodb": "connected",
      "fastapi_ai": "available"
    }
  }
  ```

Monitor this endpoint every 60 seconds with an external uptime monitor (e.g., UptimeRobot, Datadog, Prometheus Blackbox Exporter). Alert on HTTP status $\ne 200$.
