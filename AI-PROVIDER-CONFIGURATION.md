# ARTISTRY AI — AI Provider Configuration & Adapter Architecture

---

## 1. Provider Tier Hierarchy

ARTISTRY AI operates on a multi-tier, vendor-agnostic provider architecture:

```
[Client Request]
       |
       v
[Node.js AIBridgeService]
       |
       +---> [1. Python FastAPI AI Engine (OpenCV + MediaPipe)]  <-- Priority 1 for CV
       |
       +---> [2. Configured Cloud LLM / Vision (Gemini 2.5 Flash)] <-- Priority 1 for Analysis & Chat
       |
       +---> [3. Local Algorithmic Fallback Engine]            <-- 100% Offline Resilience
```

---

## 2. Supported Providers

### A. Python FastAPI AI Engine (`ai-engine/`)
- **Runtime:** Python 3.12 + FastAPI + OpenCV 5.0.0
- **Capabilities:**
  - Adaptive Gaussian binarization and scanner noise despeckling.
  - Dodge-blend pencil, charcoal, and ink sketch filters.
  - Saliency detection and alpha-feathered foreground extraction.
  - ApproxPolyDP polygonal contour simplification and SVG generation.
  - 33-point body pose landmark connections and Line of Action curve.
  - 21-point hand skeleton, palm box, and finger length ratios.
- **Environment:** `FASTAPI_AI_URL=http://localhost:8000` (or `http://ai-engine:8000` in Docker).

### B. Google Gemini API (Multimodal Vision & Conversational AI)
- **Model:** `gemini-2.5-flash`
- **Capabilities:**
  - High-fidelity artistic critique and proportion assessment.
  - Bilingual (English & Tamil) conversational art pedagogy.
  - Structured output schemas with zero hallucinated coordinates.
- **Environment:** `GEMINI_API_KEY=<your_api_key>` in `backend/.env`.

### C. Local Algorithmic Fallback Engine (`LocalFallbackProvider`)
- **Execution:** Pure on-device TypeScript and Python math without external dependencies.
- **Zero False Claims:** When external credentials or services are missing, the response explicitly includes `isLocalFallback: true` and status `NOT_CONFIGURED` without mock lies.

---

## 3. Environment Variable Matrix

| Variable | Description | Default | Location |
| :--- | :--- | :--- | :--- |
| `PORT` | Node.js Backend Port | `4000` | `backend/.env` |
| `FASTAPI_AI_URL` | AI Engine internal RPC URL | `http://localhost:8000` | `backend/.env` |
| `ENABLE_MONGODB` | Enable MongoDB persistence | `false` (in-memory dev) | `backend/.env` |
| `MONGODB_URI` | MongoDB Connection URI | `mongodb://localhost:27017/artistry_ai` | `backend/.env` |
| `GEMINI_API_KEY` | Google Gemini API Key | *(empty)* | `backend/.env` |
| `JWT_SECRET` | Backend JWT Signing Key | *(dev secret)* | `backend/.env` |
| `UPLOAD_DIR` | Upload storage directory | `./uploads` | `backend/.env` |
| `HOST` | FastAPI Host | `0.0.0.0` | `ai-engine/.env` |
| `PORT` | FastAPI Port | `8000` | `ai-engine/.env` |
| `EXPO_PUBLIC_AI_API_URL` | Android Client Backend URL | `http://10.0.2.2:4000` | Android client `.env` |
