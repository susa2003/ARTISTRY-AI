# ARTISTRY AI — Google Play Store Listing & Submission Checklist

**Package ID**: `ai.artistry.studio`  
**Version**: `1.0.0` (VersionCode `1`)  
**Target SDK**: Android 15 / 16 (API 35–36) | **Min SDK**: Android 7.0 (API 24)  
**Release Track**: Production / Open Testing (Closed Alpha $\rightarrow$ Open Beta $\rightarrow$ Production)

---

## 1. Store Listing Metadata

### App Title (Max 30 characters)
```text
ARTISTRY AI: Draw & Learn
```
*(25 characters)*

### Short Description (Max 80 characters)
```text
Your complete AI drawing companion. Master art anatomy & perspective offline.
```
*(78 characters)*

### Full Description (Max 4000 characters)
```text
ARTISTRY AI is the definitive next-generation drawing studio and AI art companion designed for artists of all levels—from complete beginners learning foundational proportions to professional illustrators mastering dynamic perspective and lighting.

Combining a zero-latency, 60 FPS hardware-accelerated Skia drawing engine with cutting-edge computer vision intelligence, ARTISTRY AI provides real-time guidance directly on your canvas.

==================================================
KEY HIGHLIGHTS: 100% OFFLINE-FIRST DRAWING
==================================================
• Zero Forced Sign-In: Launch and immediately start sketching.
• Complete Privacy: Your personal drawings never leave your device unless you explicitly opt to share or backup.
• 100% Offline Core: The canvas, brushes, layer management, undo/redo, Anatomy Academy, and Perspective Assistant work anywhere—no internet connection required.

==================================================
CLASSICAL ART FOUNDATIONS ACADEMY
==================================================
• Anatomy Academy: Interactive 8-head Loomis construction grids, skeletal proportion overlays, muscle group guides, and real-time anatomical landmark checks.
• Perspective Assistant: Dynamic 1-point, 2-point, and 3-point perspective grid generators with touch-movable vanishing points and adjustable horizon lines.
• Shading Studio: Interactive 360° light source simulator. Visualize core shadows, cast shadows, terminator lines, and reflected light on 3D reference forms.
• Reference vs. Drawing: True split-screen comparison, onion-skin transparency slider, and pixel-difference heatmap to instantly spot proportion discrepancies.
• Curated Reference Library: Hundreds of copyright-free poses, facial expressions, and architectural studies ready for one-tap tracing and study.

==================================================
16 AI DRAWING INTELLIGENCE CAPABILITIES
==================================================
1. AI Live Line Coach: Real-time guidance analyzing stroke smoothness and line confidence.
2. AI Proportion & Loomis Validator: Instant facial and figure alignment evaluation.
3. AI Anatomy Doctor: Automated feedback on skeletal proportions and anatomical balance.
4. AI Perspective Enforcer: Real-time checks ensuring lines converge to active vanishing points.
5. AI Shading & Light Evaluator: 5-value tonal analysis evaluating contrast and shadow placement.
6. AI Reference Match Score: Quantitative accuracy percentage comparing drawing against reference.
7. AI Stroke-by-Stroke Playback: Export high-speed timelapse MP4 animations of your process.
8. AI Smart Color Harmony: Algorithmic palette generation (analogous, triadic, complementary).
9. AI Style Transfer Preview: Preview sketches rendered in watercolor, charcoal, or oil styles.
10. AI Pose Estimator: Extract 33-point skeletal armatures from photos to guide your construction.
11. AI Silhouette Reader: Check readability and contrast of your character silhouette.
12. AI Composition Analyzer: Rule-of-thirds, golden spiral, and focal point heatmaps.
13. AI Sketch-to-Concept: Turn rough line sketches into rendered concept art previews.
14. AI Personalized Mentor: Contextual feedback offering encouraging, actionable advice.
15. Smart Auto-Correction: Intelligent stroke smoothing and geometric shape snapping.
16. Bilingual Voice Assistant: Hands-free canvas commands in English and தமிழ் (Tamil).

==================================================
PROFESSIONAL DIGITAL CANVAS
==================================================
• Multi-layer system with opacity, visibility toggle, reordering, and blend modes.
• Responsive UI designed for both flagship Android phones and large drawing tablets.
• High-resolution PNG and project export/import.
• Local SQLite project catalog with auto-save and zero data loss guarantee.

Download ARTISTRY AI today and transform the way you learn, practice, and master drawing!
```

---

## 2. Google Play Data Safety Declarations

| Data Type | Collected? | Shared with 3rd Parties? | Purpose | Handling & Retention |
| :--- | :--- | :--- | :--- | :--- |
| **Location** | **No** | No | N/A | Never accessed. |
| **Personal Info (Name, Email)** | **Optional** | No | Account management, cloud sync (if user signs in) | Stored encrypted in transit (TLS 1.3) and at rest. User can delete account anytime. |
| **Photos & Videos** | **Optional** | No | Reference images imported by user for drawing | Stored locally in sandboxed app storage. Only sent to server if user explicitly triggers cloud AI features. |
| **Audio / Voice** | **Optional** | No | Voice assistant command processing | Processed locally on-device or streamed ephemeral; never recorded or stored. |
| **Financial / Payment Info** | **No** | No | Subscription & in-app purchases | Handled entirely by Google Play Billing APIs. App never accesses credit card details. |
| **Identifiers (Device ID, Advertising ID)** | **No** | No | N/A | App contains zero third-party advertising SDKs or trackers. |

### Data Deletion Commitment
- In-App: Account Settings $\rightarrow$ "Delete Account & Data" provides 1-tap permanent deletion of user profile, synced projects, and cloud records.
- External Web Request: Dedicated privacy deletion endpoint available at `https://artistry.ai/privacy/delete-request`.

---

## 3. Content Rating Questionnaire

- **Target Age**: 13 years and older (ESRB: Everyone / PEGI: 3).
- **Violence**: None.
- **Sexuality / Nudity**: None (Anatomy guides use classical artistic plaster cast / geometric construction models).
- **Gambling / Real Money**: None.
- **User-to-User Communication**: None (Local drawing studio without unmoderated open social feeds).
- **Physical Location Sharing**: None.

---

## 4. Google Play Billing & Monetization Disclosures

### Subscription Products
1. **Artistry Pro Monthly (`artistry_pro_monthly`)**
   - Price: \$9.99 / month (with regional pricing via Google Play Console)
   - Includes: 500 monthly AI credits, all 27 studio tools, unlimited layers & project sync.
2. **Artistry Pro Yearly (`artistry_pro_yearly`)**
   - Price: \$79.99 / year (33% annual discount)
   - Includes: 6,000 annual AI credits, VIP early access to new AI models.

### Consumable In-App Products
1. **Credit Pack Small (`artistry_credits_100`)**: 100 AI Credits (\$1.99)
2. **Credit Pack Medium (`artistry_credits_500`)**: 500 AI Credits (\$7.99)
3. **Credit Pack Large (`artistry_credits_1200`)**: 1,200 AI Credits (\$14.99)

### Subscription Disclosure Compliance
- Explicitly states subscription duration, renewal terms, and cancellation policy on paywall screen.
- Clear link to Google Play Subscriptions management: `https://play.google.com/store/account/subscriptions`.
- Free tier is permanently available without requiring payment information.

---

## 5. Visual Asset Specifications Checklist

- [x] **App Icon**: `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` ($512\times 512$, 32-bit PNG, adaptive icon with dark studio canvas theme).
- [x] **Feature Graphic**: $1024\times 500$ PNG/JPEG, 24-bit RGB, no transparency.
- [x] **Phone Screenshots**: Minimum 4 high-definition screenshots ($1080\times 2400$) showcasing:
  1. Dynamic 60 FPS Skia canvas with multi-layer controls.
  2. Anatomy Academy with Loomis 8-head grid.
  3. Perspective Assistant with movable vanishing points.
  4. Real-time AI Live Line Coach & Shading Studio.
- [x] **Tablet Screenshots**: Minimum 2 screenshots ($2560\times 1600$) showcasing the expanded multi-column tablet studio layout.

---

## 6. Pre-Launch Testing & Rollout Sequence

1. **Internal Testing Track**:
   - Upload `app-release.aab`.
   - Distribute to core team (up to 100 testers).
   - Verify Google Play Billing sandbox purchases (`android.test.purchased`).
2. **Closed Testing Track (Alpha)**:
   - Invite 20–50 artist testers for minimum 14 days (satisfying Google Play developer account requirements).
   - Collect ANR (Application Not Responding) and crash reports via Google Play Android Vitals.
3. **Open Testing (Beta)**:
   - Public opt-in link.
   - Monitor crash-free user rate (target $\ge 99.5\%$).
4. **Production Release**:
   - Staged rollout: 10% on Day 1 $\rightarrow$ 25% on Day 3 $\rightarrow$ 50% on Day 5 $\rightarrow$ 100% on Day 7.
