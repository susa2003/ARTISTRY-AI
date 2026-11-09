# ARTISTRY AI — Backend API Documentation
**Version:** 1.0.0  
**Base URL:** `/api/v1` (with root aliases supported)

---

## 1. Overview
The ARTISTRY AI Backend is a production-grade Node.js & Express service written in TypeScript. It coordinates 22 API modules across computer vision, multimodal intelligence, bilingual voice processing, asynchronous job queues, cloud asset management, and offline-first state synchronization.

---

## 2. Authentication & Headers
- **Authorization:** `Bearer <JWT_TOKEN>` (Supported on all endpoints; defaults to anonymous guest mode in local/offline environments).
- **Request ID:** Header `X-Request-Id` is generated automatically via UUIDv4 or propagated from incoming client requests.
- **Async Execution:** Pass header `Prefer-Async: true` to defer long-running AI tasks into the background job queue (returns HTTP 202 with `jobId`).

---

## 3. Endpoints Catalog

### 3.1 System & Diagnostics
- `GET /api/v1/health`
  - Returns service status, uptime, system CPU/RAM, and V8 heap stats.
- `GET /api/v1/providers/status`
  - Returns operational status of all registered AI engines: FastAPI CV bridge, Gemini API, OpenAI, Anthropic.

### 3.2 AI Drawing Intelligence
- `POST /api/v1/sketch/convert`
  - Body: `{ imageUri: string, options: { style, intensity, contrast, brightness, detailLevel, edgeStrength, grayscale, paperTexture } }`
  - Styles: `graphite`, `charcoal`, `ink`, `lineart`, `coloredpencil`, `watercolor`, `cartoon`, `realistic`.
- `POST /api/v1/drawing/analyze`
  - Body: `{ width: number, height: number, drawingUri?: string, referenceUri?: string }`
  - Returns: overallScore, proportionsScore, alignmentScore, perspectiveScore, compositionScore, shadingScore, feedback array, and Skia annotation overlays.
- `POST /api/v1/reference/generate`
  - Body: `{ category: string, customPrompt?: string, style?: string, complexity?: string, aspectRatio?: string }`
  - Returns: Procedural/generative SVG reference URI.
- `POST /api/v1/pose/detect`
  - Body: `{ imageUri?: string, width?: number, height?: number }`
  - Returns: 33 body landmarks, Line of Action spline, and balance metrics.
- `POST /api/v1/handfoot/detect`
  - Body: `{ type: "hand" | "foot", imageUri?: string, width?: number, height?: number }`
  - Returns: 21 landmarks, palm box, finger length ratios, and mistake warnings.
- `POST /api/v1/lighting/analyze`
  - Body: `{ lightAngleDeg: number, width?: number, height?: number }`
  - Returns: 360° light direction vector, highlight/shadow zones, and 2H/HB/2B/6B graphite recommendations.
- `POST /api/v1/composition/analyze`
  - Body: `{ mode: "thirds" | "golden", width?: number, height?: number }`
  - Returns: Rule of Thirds power points, Golden Spiral points, and visual weight center.
- `POST /api/v1/linecleaner/clean`
  - Body: `{ imageUri: string, options: { binarizeThreshold, removeScannerGrain, enhanceContrast, smoothContours } }`
  - Returns: Cleaned binarized PNG URI with scanner grain removed.
- `POST /api/v1/segmentation/separate`
  - Body: `{ imageUri: string, tolerance: number, feathering: number }`
  - Returns: Foreground RGBA URI with alpha channel and mask URI.
- `POST /api/v1/color/recommend`
  - Body: `{ imageUri?: string, harmonyType: string, count: number }`
  - Returns: Harmonic hex palette, primary, accent, and tonal values.
- `POST /api/v1/turnaround/generate`
  - Body: `{ subjectUri?: string, prompt?: string, characterStyle?: string, includeHeightGuides: boolean }`
  - Returns: 4-view model sheet (Front, 3/4, Profile, Back) with 8 height locks.
- `POST /api/v1/mistakes/detect`
  - Body: `{ drawingUri?: string, subjectType: string }`
  - Returns: Facial slant, eye level drift, cranium proportion warnings.
- `POST /api/v1/mentor/chat`
  - Body: `{ messages: Array<{ role, content }>, experienceMode: "beginner" | "professional", topic?: string }`
  - Returns: Context-aware pedagogical drawing guidance.
- `POST /api/v1/vectorize`
  - Body: `{ imageUri: string, options: { pathTolerance, curveSmoothness, cornerThreshold, exportSvgXml } }`
  - Returns: SVG XML markup, path count, and point metrics.

### 3.3 Synchronization
- `POST /api/v1/sync/progress`
  - Bidirectional sync of 6-axis skill radar dimensions and milestone history.
- `POST /api/v1/sync/replays`
  - Cloud backup of stroke replay events, timestamps, and project metadata.

### 3.4 Voice Assistant
- `POST /api/v1/voice/process`
  - Body: `{ transcript?: string, audioBase64?: string, language: "en" | "ta", currentScreen?: string }`
  - Returns: Parsed action (`SELECT_PENCIL`, `UNDO`, `OPEN_STUDIO`, etc.), target, parameters, requiresConfirmation, spokenResponseEn, spokenResponseTa.

### 3.5 Storage & Asset Management
- `POST /api/v1/storage/upload`
  - Multipart upload (`file`). Validates MIME (JPEG, PNG, WEBP, SVG) and max file size (25MB).
- `GET /api/v1/storage/:assetId`
  - Serves managed asset file.
- `POST /api/v1/storage/cleanup`
  - Deletes expired ephemeral assets older than 24 hours.

### 3.6 Asynchronous AI Jobs
- `GET /api/v1/jobs/:jobId`
  - Returns job status (`pending` | `processing` | `completed` | `failed` | `cancelled`), progress (0–100), input, result, and errors.
- `POST /api/v1/jobs/:jobId/cancel`
  - Cancels a pending or processing job.
