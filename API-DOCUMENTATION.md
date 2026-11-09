# ARTISTRY AI — API Documentation Specification

This document specifies the endpoints, protocols, and data contracts for both the **Node.js Express Backend** and the **Python FastAPI AI Engine**.

---

## Part 1: Node.js / Express Application API (Port 5000)

Base URL: `http://localhost:5000/api/v1`

### 1. Authentication Endpoints

#### `POST /auth/register`
Creates a new user account.
- **Request Body:**
  ```json
  {
    "email": "artist@artistry.ai",
    "password": "SecurePassword123!",
    "displayName": "Leonardo",
    "preferredLanguage": "en"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "refreshToken": "eyJhbGci...",
    "user": {
      "id": "usr_99812",
      "email": "artist@artistry.ai",
      "displayName": "Leonardo",
      "tier": "free"
    }
  }
  ```

#### `POST /auth/login`
Authenticates an existing user and returns JWT access tokens.

#### `POST /auth/refresh`
Refreshes an expired access token using the valid refresh token.

---

### 2. Cloud Project Backup & Sync Endpoints

#### `POST /projects/sync`
Performs cloud backup or delta sync of local SQLite projects.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "clientProjectId": "proj_12345",
    "name": "Self Portrait Study",
    "width": 1200,
    "height": 1600,
    "layersJson": "[...]",
    "updatedAt": 1730740000000
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "syncedAt": "2026-11-04T17:15:00.000Z",
    "version": 2
  }
  ```

#### `GET /projects`
Retrieves a paginated list of cloud-saved projects for the authenticated user.

---

### 3. Reference Library & Daily Challenges Endpoints

#### `GET /library`
Fetches categorized, ready-to-trace copyright-free art references.
- **Query Params:** `category=portraits&page=1&limit=20`
- **Response `200 OK`:**
  ```json
  {
    "items": [
      {
        "id": "ref_01",
        "title": "Classical Bust Profile",
        "category": "portraits",
        "imageUrl": "https://cdn.artistry.ai/references/bust_profile.jpg",
        "aspectRatio": 0.75,
        "suggestedTools": ["loomis", "shading", "tracing"]
      }
    ],
    "total": 85
  }
  ```

#### `GET /challenges/today`
Retrieves the daily drawing prompt, time limit, and bilingual instructions.

---

### 4. Subscription & Entitlements

#### `POST /subscriptions/verify`
Validates an Android Google Play purchase token and upgrades the account tier.

---

## Part 2: Python FastAPI AI Engine (Port 8000)

Base URL: `http://localhost:8000/api/v1`

### 1. Computer Vision & Landmark Endpoints

#### `POST /cv/loomis-pose`
Analyzes an uploaded facial image using MediaPipe FaceMesh to calculate 3D head rotation angles and Loomis landmarks.
- **Request Form-Data:**
  - `image`: File (JPEG / PNG / WEBP)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "angles": {
      "yaw": -14.2,
      "pitch": 5.8,
      "roll": -1.5
    },
    "cranium": {
      "centerX": 0.51,
      "centerY": 0.42,
      "radius": 0.28
    },
    "planes": {
      "browY": 0.42,
      "noseBaseY": 0.56,
      "chinY": 0.70,
      "hairlineY": 0.28
    },
    "landmarks468": [[0.512, 0.421, 0.012], "..."]
  }
  ```

#### `POST /cv/sketch-filter`
Applies advanced Difference of Gaussians (DoG) edge filtering and tonal cross-hatch simulation.
- **Request Form-Data:**
  - `image`: File
  - `mode`: `"contour" | "crosshatch" | "graphite"`
  - `weight`: Float (`0.5` to `2.5`)
- **Response:** Raw PNG image stream or base64 data.

#### `POST /cv/shading-analysis`
Computes the 5-value tonal decomposition (Highlight, Midtone, Core Shadow, Reflected Light, Cast Shadow).

---

### 2. Generative Art & Multimodal Critique Endpoints

#### `POST /ai/critique-drawing`
Compares a user's drawing against the reference image using Gemini Vision to evaluate proportions, value accuracy, and stroke confidence.
- **Request Form-Data:**
  - `reference`: File (Original reference photo)
  - `drawing`: File (User's drawing layer snapshot)
  - `language`: `"en" | "ta"`
- **Response `200 OK`:**
  ```json
  {
    "overallScore": 84,
    "metrics": {
      "proportionAccuracy": 88,
      "valueRange": 79,
      "contourAlignment": 85
    },
    "constructiveFeedback": {
      "strengths": "Strong block-in of the cranium and facial thirds alignment.",
      "areasToImprove": "The jawline contour on the shadow side is slightly too wide by approx 5%.",
      "tips": [
        "Use the 4x4 smart grid to check the nose base alignment with the earlobe.",
        "Darken the core shadow along the jawline to enhance 3D depth."
      ]
    }
  }
  ```

#### `POST /ai/generate-reference`
Synthesizes a copyright-free reference photo based on user prompt, pose, and lighting constraints.
- **Request Body:**
  ```json
  {
    "prompt": "Old sailor portrait with dramatic side lighting and textured beard",
    "style": "photorealistic",
    "lighting": "dramatic_chiaroscuro"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "imageUrl": "https://cdn.artistry.ai/generated/ref_88291.jpg",
    "width": 1024,
    "height": 1024
  }
  ```

---

*Last Updated: 2026-11-04*
