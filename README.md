# ARTISTRY AI — native Android studio

ARTISTRY AI is a local-first React Native Android drawing and AI-assisted art education studio. Expo Router provides native navigation; React Native Skia renders the drawing surface and high-performance vector overlays; Zustand holds the active editor state; SQLite stores projects, references, analyses, color palettes, and stroke replays. NativeWind is configured for styling.

The previous Vite/Capacitor application is preserved under [`legacy-web-first/`](./legacy-web-first/) along with its source, documentation, generated Android project, assets and dependency tree. See [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md) for the pre-migration inventory, feature mapping and phase plan.

## 27 Studio Tools & Modules

ARTISTRY AI provides 27 integrated studio tools accessible from the home shelf, organized across foundational drawing, structural foundation, and the **Phase 4 Complete AI Drawing Intelligence Ecosystem**:

### 1. Foundational & Structural Studios (Phases 1-3)
- **Digital Drawing Canvas:** Multi-layer raster/vector Skia canvas, 4 brush engines (Brush, Pencil, Ink Pen, Eraser), stroke smoothing, infinite undo/redo, zoom/pan.
- **AI Loomis Studio:** 8-stage interactive 3D Loomis head construction with yaw/pitch rotation and guide injection to canvas.
- **Smart Grid Studio:** Standard, diagonal, rule-of-thirds, and golden ratio grids with density controls.
- **Tracing Studio:** Natural, edge detection, chalkboard, and lightbox tracing modes with opacity sliders.
- **Anatomy Academy:** 8-head proportion canon, skeletal landmarks, muscle group volumes, and 4 interactive master tutorials.
- **Perspective Assistant:** 1, 2, and 3-point perspective grid systems with draggable vanishing points and horizon line.
- **Shading Studio:** 360° interactive light direction controller, 5-value tonal scale, core/cast shadow guides.
- **Reference vs My Drawing:** Live Skia split-screen comparison, onion-skin overlay, and real difference heatmap calculation.
- **Ready-to-Trace Reference Library:** Copyright-free categorized catalog with offline bundled procedural SVG templates.
- **Learning Center & Daily Challenges:** 6 master lessons and 7-day cyclical drawing sprints with countdown timer and streak tracking.

### 2. AI Drawing Intelligence Ecosystem (Phase 4)
- **AI Sketch Converter:** 8 styles (Graphite, Charcoal, Ink, Line art, Colored pencil, Watercolor, Cartoon, Realistic) with 5 real-time parametric sliders.
- **AI Drawing Analyzer:** Multi-factor analysis (proportions, symmetry, line quality, tonal values, anatomy, perspective) with canvas overlay annotations.
- **AI Reference Generator:** 11 subject categories (Portraits, Figures, Hands, Feet, Animals, Landscapes, Vehicles, Architecture, Still Life, Fantasy, Dynamic Poses) with offline procedural SVG synthesis.
- **Drawing Progress AI:** 6-axis skill radar chart, chronological history, and personalized practice recommendations.
- **AI Pose & Gesture Coach:** 33 anatomical landmarks, Line of Action curvature detection, and center-of-gravity balance indicator.
- **AI Hand & Foot Assistant:** 21 hand landmarks, palm box, finger length proportion checks, and joint spacing warnings.
- **AI Lighting & Shadow Predictor:** 360° light direction vector, highlight/mid-tone/shadow zone segmentation, and graphite grade recommendations (2H, HB, 2B, 6B).
- **AI Composition Coach:** Rule of Thirds power points, Golden Spiral logarithmic spiral, visual weight heatmaps, and negative space balance.
- **AI Line Art Cleaner:** Otsu/Sauvola adaptive binarization, scanner grain filter, and crisp ink vector extraction.
- **AI Smart Object Separation:** Saliency detection, foreground/background alpha masking, and edge feathering.
- **AI Color Recommender:** Harmonic color harmonies (complementary, analogous, triadic, skin tones) and SQLite palette persistence.
- **AI Multi-Angle Reference Creator:** 4-view model turnaround sheets (Front, 3/4, Profile, Back) with 8 height-level guide locks.
- **Smart Stroke Replay & Timelapse:** Chronological stroke recording, 0.5x to 5.0x speed playback, step scrubber, and replay persistence.
- **AI Drawing Mistake Detector:** Facial slant, eye level drift, cranium flattening, and heavy line warnings.
- **AI Art Mentor:** Conversational concept explorer, adaptive curriculum sequencing, and direct studio tool actions.
- **Sketch-to-Vector Converter:** Multi-pass Bézier contour path simplification, path tolerance sliders, and clean SVG XML file export.

## Dual Experience Mode

ARTISTRY AI features a live, persistent **Dual Experience Mode** switcher accessible from the app header:
- **Beginner Mode:** Simplified toolbars, contextual coaching tips, guided step-by-step instructions, and curated presets.
- **Professional Mode:** Full parametric slider ranges, raw geometric metrics, advanced Skia guide overlays, and direct vector/SVG exports.

## Offline AI Provider Architecture

ARTISTRY AI operates on an honest, transparent AI provider layer (`src/services/ai/`):
- **Local Fallback Engine:** 100% offline mathematical, geometric, and procedural algorithms (Bézier curves, Otsu binarization, Kuwahara tone quantization, HSL harmonic trigonometry) that execute instantly on-device without internet access.
- **Cloud HTTP Provider:** Seamlessly connects to optional remote AI backend services when `EXPO_PUBLIC_AI_API_URL` is configured, with automatic timeout and fallback to local algorithms.
- **Zero Fabricated Claims:** The app never pretends to call external AI or returns fake stock images when running offline.

## Workflows

- **Draw directly:** open a blank canvas without selecting or uploading a photo. Brush, pencil, ink pen, eraser, layers, undo, redo, color, zoom and pan work locally. Projects auto-save to SQLite and can be exported as PNG, JPG, or SVG through Android's share sheet.
- **Use a reference:** pick one image from Android's photo picker, camera, or document picker. JPG/JPEG/PNG/WEBP are accepted. ARTISTRY AI keeps an app-owned original and a separate working copy; transforms never overwrite the source image.
- **Image companions:** all 27 studio tools work from either blank canvases or selected local references with real-time local previews.

## Phase 6 Commercial Ecosystem & Architecture

ARTISTRY AI includes a production-grade commercial backend and monetization system:
- **Authentication & User Profiles:** Node.js `crypto.scrypt` password hashing with 32-byte salt and constant-time verification, short-lived 15m JWTs, rotating 30d refresh tokens with replay-attack detection, and Google OAuth sign-in.
- **Subscription & Entitlement System:** 3-tier catalog (Free, Pro @ $9.99/mo, Premium @ $19.99/mo), monthly/yearly billing, 3-day grace period, and express middleware feature gates (`requireTier`, `requireFeature`).
- **Google Play Billing Verification:** Cryptographic server-side purchase token verification for Android package `ai.artistry.studio`, duplicate token rejection, and zero client-side grant fabrication.
- **AI Credit Management:** Cost schedule (0 credits for classical tools, 5 credits for critique, 10 credits for diffusion), atomic deduction via MongoDB `$inc` with `$gte` balance condition, idempotency keys, and safe refund guarantees.
- **Admin Control Plane:** Role-based access control (`requireAdmin`), system overview metrics, user search and inspection, self-safe user suspension, manual credit grants, and audit logging.
- **Privacy & Regulatory Compliance:** GDPR Article 20 JSON data portability export, GDPR Article 17 Right to Erasure account deletion with password re-authentication, statutory financial PII anonymization, and in-app notifications.

## Development

```powershell
npm install
npx expo install --check
npm run typecheck
npm test
npx expo prebuild --platform android
npx expo run:android
```

Android drawing, project storage and local image processing do not depend on network access after the app is installed.

## Release artifacts

After configuring a release key using local Gradle signing properties, generate the Android packages with:

```powershell
npx expo prebuild --platform android
npm run build:apk
npm run build:aab
```

The expected outputs are `android/app/build/outputs/apk/release/app-release.apk` and `android/app/build/outputs/bundle/release/app-release.aab`. Store signing credentials outside source control. An APK/AAB should only be called production-ready once the release AAB is signed and the APK has been installed and exercised on Android.

## Local image privacy

- Gallery access uses Android's system photo picker; the app does not request broad media-library access.
- Camera permission is requested only when the camera screen is opened.
- Document selection uses Android's system document picker.
- Image selection does not initiate network requests. The optional connected AI action sends only the selected working copy after the user's tap.
- Imported images and drawing projects are stored in the app's private local storage/SQLite database and are not modified in the original gallery or document location.
