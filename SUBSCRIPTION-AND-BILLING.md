# ARTISTRY AI — SUBSCRIPTION & ENTITLEMENT SYSTEM
**Document Version:** 1.0.0 (Phase 6)  
**Package:** `ai.artistry.studio`  
**Backend:** Node.js v24 + Express + TypeScript ES2022  

---

## 1. Overview & Tier Matrix

All subscription quotas, entitlements, and prices are centrally configured in [`backend/src/config/plans.ts`](file:///d:/antigravity/artist%20ai%20app/backend/src/config/plans.ts) and served dynamically via `GET /api/v1/subscriptions/plans`.

| Dimension | Free Artist (`free`) | Pro Illustrator (`pro`) | Studio Master (`premium`) |
| :--- | :---: | :---: | :---: |
| **Monthly Pricing (USD)** | **\$0.00** | **\$9.99 / mo** | **\$19.99 / mo** |
| **Yearly Pricing (USD)** | **\$0.00** | **\$95.88 / yr** (20% off) | **\$191.88 / yr** (20% off) |
| **Monthly Pricing (INR)** | **₹0** | **₹499 / mo** | **₹999 / mo** |
| **Yearly Pricing (INR)** | **₹0** | **₹4,790 / yr** | **₹9,590 / yr** |
| **Monthly AI Credits** | 50 credits | 500 credits | 2,000 credits |
| **Cloud Storage Allowance** | 25 MB | 250 MB | 2,048 MB (2 GB) |
| **Core Skia Canvas (Offline)** | **Full Access (Forever)** | **Full Access** | **Full Access** |
| **Loomis Head Studio** | Full 8 stages | Full 8 stages | Full 8 stages |
| **Perspective Assistant** | 1, 2, 3-point grids | 1, 2, 3-point grids | 1, 2, 3-point grids |
| **Shading Studio** | 360° light & 5 values | 360° light & 5 values | 360° light & 5 values |
| **AI Drawing Analyzer** | Basic feedback | Multi-factor rubrics | Multi-factor rubrics |
| **Photographic Sketch Converter**| Standard dodge filter | Paper textures + ink binarization | High-resolution multi-style |
| **Pose & Hand/Foot Assistant**| Basic landmarks | 33 Pose + 21 Hand landmarks | Advanced contour & balance |
| **AI Art Mentor** | Unavailable | Unavailable | **Unlimited dialogue sessions** |
| **Diffusion Reference Generator**| Standard templates | High-res templates | **Text-to-Image synthesis** |
| **3D Turnaround Character Sheets**| Unavailable | Unavailable | **Full 4-view turnaround generation** |
| **GPU Processing Queue** | Standard | High | **Priority processing** |

---

## 2. Server-Side Entitlement & Access Control

Entitlement is enforced server-side using middleware [`backend/src/middleware/entitlement.ts`](file:///d:/antigravity/artist%20ai%20app/backend/src/middleware/entitlement.ts):
- `requireTier(minTier)`: Rejects lower-tier requests with HTTP 403 `UPGRADE_REQUIRED`.
- `requireFeature(featureKey)`: Dynamically checks `FEATURE_ENTITLEMENT_GATES`.

```typescript
export const FEATURE_ENTITLEMENT_GATES: Record<string, SubscriptionTier> = {
  canvas: "free",
  loomis: "free",
  perspective: "free",
  shading: "free",
  reference_library: "free",
  stroke_replay: "free",

  drawing_analysis: "pro",
  sketch_conversion: "pro",
  pose_coach: "pro",
  hand_foot: "pro",
  line_cleaner: "pro",
  color_recommender: "pro",
  vectorizer: "pro",
  cloud_sync: "pro",

  art_mentor: "premium",
  reference_generation: "premium",
  turnaround_creator: "premium",
  mistake_detector: "premium",
  smart_segmentation: "premium",
  lighting_predictor: "premium",
};
```

---

## 3. Expiration & Grace Period Mechanics

1. **Active Period:** Subscription is valid until `currentPeriodEnd`.
2. **Grace Period (3 Days):** If renewal fails (e.g., payment declined), `gracePeriodExpiresAt` grants a 72-hour window during which paid entitlements remain accessible.
3. **Automatic Demotion:** When both `currentPeriodEnd` and `gracePeriodExpiresAt` elapse without verified payment, user is gracefully demoted to the `free` tier.
4. **Cancellation Policy:** When a user cancels, `cancelAtPeriodEnd` is set to `true`. The user retains paid access until their existing prepaid billing cycle ends.
5. **Offline Independence:** Irrespective of subscription state or payment status, the local Skia drawing canvas and offline projects are **never locked**.
