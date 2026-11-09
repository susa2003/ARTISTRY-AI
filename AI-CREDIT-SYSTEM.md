# ARTISTRY AI — AI CREDIT & USAGE MANAGEMENT SYSTEM
**Document Version:** 1.0.0 (Phase 6)  
**Package:** `ai.artistry.studio`  
**Backend:** Node.js v24 + Express + TypeScript ES2022  

---

## 1. Credit Economics & Cost Schedule

All credit balances and deductions are **strictly server-authoritative**. Credit values cannot be dictated, forged, or altered by the Android client. Every AI operation has a configurable credit cost defined in [`backend/src/config/credits.ts`](file:///d:/antigravity/artist%20ai%20app/backend/src/config/credits.ts):

| Feature Name | Feature Key | Credit Cost | Notes |
| :--- | :--- | :---: | :--- |
| **Core Skia Drawing Canvas** | `canvas` | **0 credits** | **100% Free & Unlimited Offline** |
| **Loomis Head Construction** | `loomis` | **0 credits** | **100% Free (All 8 Stages)** |
| **Perspective Vanishing Grids**| `perspective` | **0 credits** | **100% Free (1, 2, 3 Points)** |
| **5-Value Shading Studio** | `shading` | **0 credits** | **100% Free** |
| **Local Reference Library** | `reference_library` | **0 credits** | **100% Free** |
| **Stroke Replay & Timelapse** | `stroke_replay` | **0 credits** | **100% Free** |
| **AI Drawing Analyzer** | `drawing_analysis` | 5 credits | Multi-factor rubrics & annotations |
| **Photographic Sketch Converter**| `sketch_conversion` | 3 credits | OpenCV dodge blend & paper grain |
| **AI Reference Generator** | `reference_generation` | 10 credits | Procedural SVG / Diffusion synthesis |
| **3D Turnaround Character Sheet**| `turnaround_creator` | 15 credits | 4-view model turnaround sheet |
| **AI Art Mentor Chat** | `art_mentor` | 2 credits | Pedagogical drawing guidance |
| **Pose & Gesture Coach** | `pose_coach` | 2 credits | 33-point skeletal landmark analysis |
| **Hand & Foot Assistant** | `hand_foot` | 2 credits | 21-point hand anatomy check |
| **Lighting Predictor** | `lighting_predictor` | 2 credits | 360° light direction vector |
| **Composition Coach** | `composition_coach` | 2 credits | Golden ratio & Rule of Thirds |
| **Line Art Cleaner** | `line_cleaner` | 3 credits | Scanner noise & despeckle |
| **Smart Object Separation** | `smart_segmentation` | 4 credits | Saliency & alpha feathering |
| **Color Recommender** | `color_recommender` | 2 credits | HSL harmonic palette computation |
| **Sketch-to-Vector Converter** | `vectorizer` | 3 credits | `approxPolyDP` SVG polygon export |
| **AI Mistake Detector** | `mistake_detector` | 3 credits | Cranium & facial drift alerts |

---

## 2. Server-Side Atomic Deductions & Idempotency

1. **Atomic Deductions:** Deductions execute via atomic database operations:
   ```typescript
   UserModel.findOneAndUpdate(
     { userId, creditBalance: { $gte: cost } },
     { $inc: { creditBalance: -cost } },
     { new: true }
   );
   ```
2. **Idempotency Protection:** Clients send an `Idempotency-Key` header with AI requests. If a network retry occurs, [`CreditService`](file:///d:/antigravity/artist%20ai%20app/backend/src/services/CreditService.ts) detects the existing transaction and returns the cached confirmation without charging the user a second time.
3. **Automatic Job Failure Refunds:** When an eligible AI job fails or times out, the server automatically executes `refundCredits()`:
   - Restores the deducted amount atomically via `$inc: { creditBalance: cost }`.
   - Records a refund transaction tagged `type: "refund"`.
   - Prevents duplicate refunds using idempotency key `refund:<txId>`.

---

## 3. Offline Immunity Guarantee

> [!IMPORTANT]
> If a user's cloud credit balance reaches **0 credits**, the user is **NEVER locked out** of creating, sketching, editing, saving, or exporting their artwork. All classical drawing tools, local brush engines, and offline project storage continue to function with zero disruption.
