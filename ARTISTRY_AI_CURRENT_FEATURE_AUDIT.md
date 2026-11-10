# ARTISTRY AI — CURRENT FEATURE & SOURCE CODE AUDIT
**Project Name:** ARTISTRY AI (Package: `ai.artistry.studio`)  
**Audit Date:** 2026-11-09  
**Auditor:** Senior Android Architect, React Native Engineer, Graphics Engine Developer & Traditional Drawing Specialist  
**Project Path:** `D:\antigravity\artist ai app`  
**Target Platform:** Native Android (React Native 0.76.7 + Expo SDK 52 + React Native Skia 1.5.0 + Hermes + New Architecture enabled)

---

## 1. EXECUTIVE AUDIT SUMMARY

An exhaustive, read-only architectural and source code audit was conducted on the ARTISTRY AI codebase. The audit inspected the client React Native application (`src/`), the Node.js Express backend (`backend/`), the Python FastAPI computer vision engine (`ai-engine/`), and the native Android packaging (`android/`).

### Core Findings
1. **Rich Algorithmic Foundation:** The application already possesses sophisticated mathematical and computer-vision engines implemented in TypeScript for React Native Skia (`LoomisEngine`, `GridEngine`, `AnatomyEngine`, `PerspectiveEngine`, `ShadingEngine`, `TracingEngine`, `ComparisonEngine`, `PoseCoachEngine`, etc.).
2. **The "Tool Silo" Problem:** All 27 tools are rendered inside a monolithic, 2,431-line screen file (`src/app/tools/[id].tsx`). Each tool operates in complete isolation on a single screen. Overlays cannot be layered together over a single reference image.
3. **Studio Disconnect:** The Free Drawing Studio (`src/app/studio/[id].tsx`, 723 lines) provides a Skia canvas with Catmull-Rom stroke smoothing, multi-layer drawing, and color palettes, but it does **not** import, render, or synchronize with any of the 27 studio tools or overlays.
4. **Missing True Whiteout / Lightbox Shader:** In `DrawingSurface.tsx`, the reference image opacity is simply controlled via `<Group opacity={refOpacity}>`, fading pixels toward the background canvas color (`#FFFEFA`). There is no Skia color filter or GLSL shader that bleaches pixels toward pure paper white (`#FFFFFF`) while keeping dark guide lines intact.
5. **No Physical Paper & Print Mapping:** The current grid and canvas operate purely on digital pixel divisions (e.g., 4×4 or 8×8 divisions). There is zero physical millimetre calibration for real paper sizes (A4: 210×297 mm, A3, A5), no printer margin calculation, and no true 300 DPI physical print rendering engine.
6. **Dual-Mode Disparity:** The application state tracks `experienceMode: "beginner" | "professional"`, but it currently only toggles home screen card filters rather than altering the core workstation UX.
7. **Production Verification:** All 21 client Jest test suites (56 tests) and all 10 backend Jest test suites (70 tests) pass with 100% success. The native Android build has been verified for `arm64-v8a` physical hardware (`app-artistry-arm64.apk`, 130.9 MB).

---

## 2. COMPLETE PROJECT STRUCTURE AUDIT

```
D:\antigravity\artist ai app\
├── android\                     # Native Android project configuration (AGP 8.8.2, Gradle 8.10.2)
│   ├── app\
│   │   ├── build.gradle         # applicationId: ai.artistry.studio, minSdk: 24, targetSdk: 35
│   │   ├── proguard-rules.pro   # ProGuard & R8 optimization rules
│   │   └── src\main\
│   │       ├── AndroidManifest.xml # Camera, Internet, Vibrate permissions (Storage scoped)
│   │       └── java\ai\artistry\studio\MainActivity.kt, MainApplication.kt
│   ├── gradle.properties        # reactNativeArchitectures=arm64-v8a, newArchEnabled=true, hermesEnabled=true
│   └── release-upload.keystore  # Google Play release upload key
├── backend\                     # Node.js + Express + TypeScript API server
│   ├── src\
│   │   ├── controllers\         # Auth, Billing, Credits, Subscriptions, AI, Voice, Admin
│   │   ├── middleware\          # JWT auth, Rate limiting, Admin RBAC, Error handler
│   │   ├── models\              # MongoDB Mongoose schemas (User, Subscription, Credit, Audit)
│   │   ├── routes\              # /api/v1/ auth, billing, credits, subscriptions, voice, admin
│   │   ├── services\            # AIBridgeService, AuthService, BillingService, CreditService
│   │   └── server.ts            # Express server entrypoint
│   └── tests\                   # 10 Jest test suites (70 passing tests)
├── ai-engine\                   # Python 3.12 FastAPI microservice (OpenCV, MediaPipe)
│   ├── app\
│   │   ├── api\v1\routes.py     # FastAPI endpoints (/drawing/analyze, /segmentation, etc.)
│   │   ├── processors\          # OpenCV line cleaner, sketch filter, vectorizer
│   │   ├── services\            # Landmark service (MediaPipe pose, hand, face)
│   │   └── main.py              # FastAPI app definition
│   ├── Dockerfile               # Containerized deployment with libgl1 & libglib
│   └── requirements.txt         # fastapi, uvicorn, opencv-python-headless, mediapipe
├── src\                         # React Native Expo application source
│   ├── app\                     # Expo Router file-based screens
│   │   ├── _layout.tsx          # Root Stack layout, theme provider, auth/app hydration
│   │   ├── index.tsx            # Home hub: project carousel, reference banner, tool catalog
│   │   ├── reference.tsx        # Reference image inspector (rotate, crop, resize, restore)
│   │   ├── projects.tsx         # Saved project browser and management
│   │   ├── camera.tsx           # Native camera capture with level & composition grid
│   │   ├── onboarding.tsx       # Onboarding questionnaire & experience level selection
│   │   ├── profile.tsx          # User profile, subscription status, streak counter
│   │   ├── subscription.tsx     # Tier selection, Google Play in-app billing checkout
│   │   ├── auth\                # Login, Register, Forgot Password
│   │   ├── studio\[id].tsx      # Free Drawing Studio screen (723 lines)
│   │   └── tools\[id].tsx       # Monolithic tool workspace screen (2,431 lines)
│   ├── components\              # Reusable UI primitives (AppHeader, Button, Card, Eyebrow)
│   ├── domain\                  # Domain models, constants, and feature descriptors
│   │   ├── features.ts          # Catalog of 27 studio tools and step configurations
│   │   └── types.ts             # Domain interfaces (ProjectDocument, Stroke, DrawingLayer)
│   ├── features\                # Modular algorithmic drawing engines
│   │   ├── analysis\            # localAnalysis.ts (pixel sampling, dominant colors)
│   │   ├── analyzer\            # DrawingAnalyzerEngine.ts (proportion & symmetry scoring)
│   │   ├── anatomy\             # AnatomyEngine.ts & AnatomySkiaOverlay.tsx (8-head figure)
│   │   ├── colorrec\            # ColorRecommendationEngine.ts (harmonic palettes)
│   │   ├── comparison\          # ComparisonEngine.ts & ComparisonSkiaOverlay.tsx (heatmaps)
│   │   ├── composition\         # CompositionCoachEngine.ts (rule of thirds, golden spiral)
│   │   ├── drawing\             # DrawingSurface.tsx, StrokeSmoothing.ts (Catmull-Rom)
│   │   ├── generator\           # ReferenceGeneratorEngine.ts (offline SVG reference vectors)
│   │   ├── grid\                # GridEngine.ts & GridSkiaOverlay.tsx (standard, thirds, golden)
│   │   ├── handfoot\            # HandFootEngine.ts (21 hand joints, foot arch geometry)
│   │   ├── images\              # pickImage.ts (photo picker, document picker, camera)
│   │   ├── learning\            # LearningCenter.ts (curriculum & daily challenges)
│   │   ├── library\             # ReferenceLibrary.ts (bundled offline reference library)
│   │   ├── lighting\            # LightingPredictorEngine.ts (directional light vectors)
│   │   ├── linecleaner\         # LineArtCleanerEngine.ts (binarization & artifact cleanup)
│   │   ├── loomis\              # LoomisEngine.ts & LoomisSkiaOverlay.tsx (8-stage 3D head)
│   │   ├── mentor\              # ArtMentorEngine.ts (rule-based conversational mentor)
│   │   ├── mistakes\            # MistakeDetectorEngine.ts (drift & facial asymmetry alerts)
│   │   ├── perspective\         # PerspectiveEngine.ts & PerspectiveSkiaOverlay.tsx (1/2/3-pt)
│   │   ├── pose\                # PoseCoachEngine.ts (33 skeletal landmarks, line of action)
│   │   ├── progress\            # DrawingProgressEngine.ts (5-axis skill radar)
│   │   ├── replay\              # StrokeReplayEngine.ts (timelapse stroke replay)
│   │   ├── segmentation\        # ObjectSeparationEngine.ts (foreground/background separation)
│   │   ├── shading\             # ShadingEngine.ts (5-value tonal quantization, 360° light dial)
│   │   ├── sketch\              # SketchConverterEngine.ts (8 artistic filter styles)
│   │   ├── tracing\             # TracingEngine.ts (contrast, natural, inverted, lightbox)
│   │   ├── turnaround\          # MultiAngleEngine.ts (front, 3/4, profile, back model sheets)
│   │   ├── vectorizer\          # VectorConverterEngine.ts (raster to SVG Bézier paths)
│   │   └── voice\               # VoiceAssistantEngine.ts (offline regex + remote fallback)
│   ├── i18n\                    # Bilingual localization (English & Tamil dictionaries)
│   ├── services\ai\             # AIServiceManager, CloudHttpProvider, LocalFallbackProvider
│   ├── state\                   # Zustand state stores (appStore.ts, authStore.ts)
│   └── storage\                 # SQLite database (artistry-ai.db) & file system manager
```

---

## 3. AUDIT OF ALL 27 STUDIO TOOLS & 16 AI CAPABILITIES

Each tool in `src/domain/features.ts` was audited against its engine implementation, UI rendering in `src/app/tools/[id].tsx`, test suite, offline operation, and reusability.

### Status Definitions:
- **FULLY IMPLEMENTED:** Complete mathematical engine, dedicated Skia overlay/view, user control sliders, test suite, and functioning local fallback.
- **PARTIALLY IMPLEMENTED:** Functional calculation logic exists, but UI controls are limited, isolated in `tools/[id].tsx`, or lack physical calibration.
- **UI ONLY:** Visual mock or generic fallback without functional domain-specific processing.
- **NOT IMPLEMENTED:** Planned or stubbed; no underlying execution code found.
- **UNABLE TO VERIFY:** External network/cloud service required and credentials are not present locally.

---

### Category A: Core Traditional Drawing Tools (11 Tools)

| # | Tool ID | Feature Name | Source Path | Status | Offline? | Test Suite | Reusability |
|---|---|---|---|---|---|---|---|
| 1 | `loomis` | AI Loomis Studio | `src/features/loomis/LoomisEngine.ts`<br>`src/features/loomis/LoomisSkiaOverlay.tsx` | **FULLY IMPLEMENTED** | Yes (100% Math) | Covered in UI & Integration | **KEEP AS-IS / REUSE**: 8-stage 3D head geometry (yaw, pitch, roll, discs, jaw wedge) is mathematically rigorous. |
| 2 | `steps` | Step-by-Step Guide | `src/app/tools/[id].tsx` (lines 2125-2139) | **PARTIALLY IMPLEMENTED** | Yes | Implicit | **REFACTOR**: Generates a 4-step generic text plan based on aspect ratio. Needs curriculum coupling. |
| 3 | `tracing` | Tracing Studio | `src/features/tracing/TracingEngine.ts` | **PARTIALLY IMPLEMENTED** | Yes | Engine tests | **REFACTOR**: Pixel binarization works, but processes via JS array buffers rather than GPU shaders. |
| 4 | `grid` | Smart Grid Studio | `src/features/grid/GridEngine.ts`<br>`src/features/grid/GridSkiaOverlay.tsx` | **FULLY IMPLEMENTED** | Yes | Engine tests | **REUSE WITH MODIFICATIONS**: Excellent standard/thirds/golden grids, but lacks physical mm/paper scaling. |
| 5 | `shading` | Shading Studio | `src/features/shading/ShadingEngine.ts` | **FULLY IMPLEMENTED** | Yes | `ShadingEngine.test.ts` (PASS) | **REUSE WITH MODIFICATIONS**: 5-value tonal quantization and 360° light dial work cleanly; needs Skia shader acceleration. |
| 6 | `color` | Color Studio | `src/features/analysis/localAnalysis.ts` | **PARTIALLY IMPLEMENTED** | Yes | Indirect | **REFACTOR**: Extracts dominant 6 colors, but lacks harmony theory (delegated to `colorrec`). |
| 7 | `anatomy` | Anatomy Academy | `src/features/anatomy/AnatomyEngine.ts`<br>`src/features/anatomy/AnatomySkiaOverlay.tsx` | **FULLY IMPLEMENTED** | Yes | `AnatomyEngine.test.ts` (PASS) | **KEEP AS-IS / REUSE**: 8-head canonical proportions, skeletal landmarks, and muscle guides are complete. |
| 8 | `perspective` | Perspective Assistant | `src/features/perspective/PerspectiveEngine.ts`<br>`src/features/perspective/PerspectiveSkiaOverlay.tsx` | **FULLY IMPLEMENTED** | Yes | `PerspectiveEngine.test.ts` (PASS) | **KEEP AS-IS / REUSE**: 1, 2, and 3-point vanishing point rays, horizon line, and interactive hit targets. |
| 9 | `compare` | Reference vs Drawing | `src/features/comparison/ComparisonEngine.ts`<br>`src/features/comparison/ComparisonSkiaOverlay.tsx` | **FULLY IMPLEMENTED** | Yes | `ComparisonEngine.test.ts` (PASS) | **REUSE WITH MODIFICATIONS**: Split-screen, onion skinning, plumb lines, and error heatmap. |
| 10 | `library` | Reference Library | `src/features/library/ReferenceLibrary.ts` | **FULLY IMPLEMENTED** | Yes | `ReferenceLibrary.test.ts` (PASS) | **KEEP AS-IS**: Curated copyright-free references across portraits, figures, and still lifes. |
| 11 | `learning` | Learning & Challenges | `src/features/learning/LearningCenter.ts` | **FULLY IMPLEMENTED** | Yes | `LearningCenter.test.ts` (PASS) | **REUSE WITH MODIFICATIONS**: 12 structured lessons and daily timed challenges with SQLite persistence. |

---

### Category B: AI Studio Tools (4 Tools)

| # | Tool ID | Feature Name | Source Path | Status | Offline? | Test Suite | Reusability |
|---|---|---|---|---|---|---|---|
| 12 | `sketch` | AI Sketch Converter | `src/features/sketch/SketchConverterEngine.ts`<br>`src/services/ai/LocalFallbackProvider.ts` | **FULLY IMPLEMENTED** | Yes (Fallback)<br>Cloud (Opt-in) | `SketchConverterEngine.test.ts` (PASS) | **REUSE WITH MODIFICATIONS**: 8 artistic styles (Graphite, Charcoal, Ink, Watercolor). Uses ImageManipulator locally. |
| 13 | `analyzer` | AI Drawing Analyzer | `src/features/analyzer/DrawingAnalyzerEngine.ts`<br>`src/services/ai/LocalFallbackProvider.ts` | **FULLY IMPLEMENTED** | Yes (Fallback)<br>Cloud (Opt-in) | `DrawingAnalyzerEngine.test.ts` (PASS) | **REUSE WITH MODIFICATIONS**: Scores proportion, alignment, perspective, composition, shading. |
| 14 | `generator` | AI Reference Generator | `src/features/generator/ReferenceGeneratorEngine.ts` | **FULLY IMPLEMENTED** | Yes (SVG Vectors)<br>Cloud (Imagen) | `ReferenceGeneratorEngine.test.ts` (PASS) | **KEEP AS-IS**: Generates references across 11 categories with 100% offline procedural SVG fallbacks. |
| 15 | `progress` | Drawing Progress AI | `src/features/progress/DrawingProgressEngine.ts`<br>`src/features/progress/DrawingProgressView.tsx` | **FULLY IMPLEMENTED** | Yes | `DrawingProgressEngine.test.ts` (PASS) | **KEEP AS-IS**: Skill radar, milestone timeline, and targeted exercise recommendations. |

---

### Category C: Assistant Tools (4 Tools)

| # | Tool ID | Feature Name | Source Path | Status | Offline? | Test Suite | Reusability |
|---|---|---|---|---|---|---|---|
| 16 | `pose` | AI Pose & Gesture Coach | `src/features/pose/PoseCoachEngine.ts`<br>`src/features/pose/PoseCoachSkiaOverlay.tsx` | **FULLY IMPLEMENTED** | Yes (Fallback)<br>Cloud (MediaPipe) | `PoseCoachEngine.test.ts` (PASS) | **KEEP AS-IS / REUSE**: 33-point skeletal landmark detection, line of action, and proportion alerts. |
| 17 | `handfoot` | AI Hand & Foot Assistant | `src/features/handfoot/HandFootEngine.ts`<br>`src/features/handfoot/HandFootSkiaOverlay.tsx` | **FULLY IMPLEMENTED** | Yes (Fallback)<br>Cloud (MediaPipe) | `HandFootEngine.test.ts` (PASS) | **KEEP AS-IS / REUSE**: 21 hand joints, foot arch geometry, bone length ratios, mistake warnings. |
| 18 | `lighting` | AI Lighting Predictor | `src/features/lighting/LightingPredictorEngine.ts`<br>`src/features/lighting/LightingSkiaOverlay.tsx` | **FULLY IMPLEMENTED** | Yes (Fallback)<br>Cloud (Opt-in) | `LightingPredictorEngine.test.ts` (PASS) | **KEEP AS-IS / REUSE**: Directional light vectors, value zones, and pencil grade (2H to 6B) guides. |
| 19 | `composition` | AI Composition Coach | `src/features/composition/CompositionCoachEngine.ts`<br>`src/features/composition/CompositionSkiaOverlay.tsx` | **FULLY IMPLEMENTED** | Yes (Fallback)<br>Cloud (Opt-in) | `CompositionCoachEngine.test.ts` (PASS) | **KEEP AS-IS / REUSE**: Rule of thirds, golden spiral, visual balance center, and negative space boundaries. |

---

### Category D: Processing Tools (4 Tools)

| # | Tool ID | Feature Name | Source Path | Status | Offline? | Test Suite | Reusability |
|---|---|---|---|---|---|---|---|
| 20 | `linecleaner` | AI Line Art Cleaner | `src/features/linecleaner/LineArtCleanerEngine.ts`<br>`ai-engine/app/processors/line_cleaner.py` | **FULLY IMPLEMENTED** | Yes (Fallback)<br>Cloud (OpenCV) | Integrated | **REUSE WITH MODIFICATIONS**: Removes paper texture, grain, and scan artifacts. Local mode uses contrast filters. |
| 21 | `segmentation` | AI Smart Segmentation | `src/features/segmentation/ObjectSeparationEngine.ts`<br>`ai-engine/app/processors/segmentation_processor.py` | **FULLY IMPLEMENTED** | Yes (Fallback)<br>Cloud (OpenCV) | Integrated | **REUSE WITH MODIFICATIONS**: Separates foreground subject from background with alpha cutout. |
| 22 | `colorrec` | AI Color Recommender | `src/features/colorrec/ColorRecommendationEngine.ts`<br>`src/features/colorrec/ColorRecommendationView.tsx` | **FULLY IMPLEMENTED** | Yes | `ColorRecommendationEngine.test.ts` (PASS) | **KEEP AS-IS**: Harmonious palette extraction (complementary, analogous, triadic, skin tones). |
| 23 | `turnaround` | AI Multi-Angle Creator | `src/features/turnaround/MultiAngleEngine.ts`<br>`src/features/turnaround/MultiAngleView.tsx` | **FULLY IMPLEMENTED** | Yes (Procedural)<br>Cloud (Diffusion) | Integrated | **REUSE WITH MODIFICATIONS**: Front, 3/4, profile, and back turnaround sheets with alignment guides. |

---

### Category E: Pro Tools & System Capabilities (4 Tools + System)

| # | Tool ID | Feature Name | Source Path | Status | Offline? | Test Suite | Reusability |
|---|---|---|---|---|---|---|---|
| 24 | `replay` | Smart Stroke Replay | `src/features/replay/StrokeReplayEngine.ts`<br>`src/features/replay/StrokeReplayView.tsx` | **FULLY IMPLEMENTED** | Yes | `StrokeReplayEngine.test.ts` (PASS) | **KEEP AS-IS**: Timestamped stroke replay, speed multiplier (0.5x to 5x), scrubbing timeline. |
| 25 | `mistakes` | AI Mistake Detector | `src/features/mistakes/MistakeDetectorEngine.ts`<br>`src/features/mistakes/MistakeDetectorView.tsx` | **FULLY IMPLEMENTED** | Yes (Geometric)<br>Cloud (Vision) | Integrated | **REUSE WITH MODIFICATIONS**: Checks eye alignment, facial tilt, perspective convergence drift. |
| 26 | `mentor` | AI Art Mentor | `src/features/mentor/ArtMentorEngine.ts`<br>`src/features/mentor/ArtMentorView.tsx` | **FULLY IMPLEMENTED** | Yes (Rule-based)<br>Cloud (Gemini) | Integrated | **REUSE WITH MODIFICATIONS**: Step-by-step artistic critique, technique explanations, and lesson hints. |
| 27 | `vectorizer` | Sketch-to-Vector Converter | `src/features/vectorizer/VectorConverterEngine.ts`<br>`src/features/vectorizer/VectorConverterView.tsx` | **FULLY IMPLEMENTED** | Yes (Fallback)<br>Cloud (Potrace) | `VectorConverterEngine.test.ts` (PASS) | **KEEP AS-IS**: Converts raster sketches into scalable SVG Bézier path strings. |
| 28 | `voice` | Bilingual Voice Assistant | `src/features/voice/VoiceAssistantEngine.ts`<br>`src/features/voice/VoiceAssistantModal.tsx` | **FULLY IMPLEMENTED** | Yes (Regex)<br>Cloud (Whisper) | `VoiceAssistantEngine.test.ts` (PASS) | **KEEP AS-IS**: Hands-free drawing commands in English & Tamil (pencil, eraser, undo, zoom). |

---

## 4. REFERENCE IMAGE EDITING SYSTEM AUDIT

### 4.1 Image Import
- **Gallery Selection:** Implemented via `expo-image-picker` (`src/features/images/pickImage.ts`, line 9). Supports JPEG, PNG, WEBP.
- **Document Picker:** Implemented via `expo-document-picker` (`src/features/images/pickImage.ts`, line 28). Copies directly to app cache.
- **Camera Capture:** Implemented in `src/app/camera.tsx` using `expo-camera`. Includes an interactive overlay with leveling sensors and a rule-of-thirds grid.
- **Texture Size Constraints:** Verified in `src/storage/imageFiles.ts` (lines 45-63). Images exceeding 2048px on either dimension are automatically downsampled via `expo-image-manipulator` to protect against Android GPU out-of-memory crashes (`GL_MAX_TEXTURE_SIZE`).
- **File Isolation:** App creates an immutable original (`${id}-original.ext`) and a distinct mutable working copy (`${id}-working.ext`).

### 4.2 Image Adjustments
- **Current Support in `src/app/reference.tsx`:**
  - Rotate 90° Clockwise / Counterclockwise: Supported via `ImageManipulator.manipulateAsync`.
  - Resize: Supported with width constraints.
  - Center Crop: Fixed hardcoded 10% inset; no interactive freeform crop handles.
- **Missing Adjustments:**
  - Brightness adjustment: Missing from reference editor.
  - Contrast adjustment: Missing from reference editor.
  - Exposure adjustment: Missing from reference editor.
  - Saturation adjustment: Missing from reference editor.
  - Grayscale / B&W toggle: Missing from reference editor (only exists inside Tracing tool).
  - Freeform interactive crop box: Missing.

### 4.3 Whiteout / Lightbox Effect Analysis
- **Current Implementation:** In `DrawingSurface.tsx` (lines 163-167):
  ```tsx
  {image ? (
    <Group opacity={refOpacity}>
      <SkiaImage image={image} x={0} y={0} width={project.width} height={project.height} fit="fill" />
    </Group>
  ) : null}
  ```
- **Flaw:** Reducing `refOpacity` simply makes the image transparent against the canvas background (`#FFFEFA`). Dark reference lines fade away at the exact same rate as light areas.
- **Traditional Drawing Requirement:** True whiteout/lightbox bleaching increases image luminosity toward white (`#FFFFFF`) while maintaining edge contrast, so the artist can clearly see contours while physical paper underneath remains illuminated and easy to draw on.
- **Architectural Solution Required:** A Skia ColorFilter or SkSL Runtime Shader:
  $$\text{Color}_{\text{out}} = \text{lerp}(\text{Color}_{\text{in}}, (1, 1, 1, 1), \text{WhiteoutLevel})$$
  Applied directly to the reference image Skia draw call, completely decoupled from overlay opacity.

---

## 5. UNIFIED OVERLAY & LAYER ENGINE AUDIT

### 5.1 Layer Capabilities in Current Codebase
- In `src/features/drawing/DrawingSurface.tsx` (lines 168-175), the application supports drawing stroke layers (`DrawingLayer`):
  - Add layer
  - Toggle layer visibility (`visible: boolean`)
  - Layer opacity slider (`opacity: number`)
  - Delete, rename, duplicate, and clear layer
- **Critical Limitation:** These layers only hold freehand drawn vector brush strokes (`Stroke[]`). They **cannot** hold tool overlays (such as a Grid, Loomis sphere, Perspective rays, or Anatomy landmarks).

### 5.2 Coordinate Synchronization Audit
- In `src/app/tools/[id].tsx`, gestures (zoom and pan) are calculated locally using screen coordinates (`useWindowDimensions()`).
- In `src/features/drawing/DrawingSurface.tsx`, canvas gestures use:
  ```ts
  const canvasTransform = [
    { translateX: pan.x },
    { translateY: pan.y },
    { scale: fit * zoom },
  ];
  ```
- **The Drift Problem:** Because tools exist on different screens with different scale factors (`fit = canvasWidth / project.width` vs `stageWidth / reference.width`), coordinates defined in a tool cannot simply be pasted into the Drawing Studio without spatial warping.
- **Architectural Solution Required:** A unified 3×3 Affine Transform matrix anchored to the **Reference Image Coordinate Space** (`[0, 0, imageWidth, imageHeight]`). All overlays (Grid, Loomis, Reilly, Tracing, Anatomy, Drawing strokes) must be rendered in this shared coordinate space so that panning, zooming, and rotation apply identically to all layers.

---

## 6. GRID SYSTEM AUDIT

- **Supported Modes:** Standard divisions, Diagonals, Rule of Thirds (3×3 with 4 intersection points), Golden Ratio (phi = 0.6180339887).
- **Alphanumeric Labeling:** Columns labeled A–Z, rows labeled 1–N.
- **Current Flaw 1 (Cell Aspect Warping):** In `GridEngine.ts` (lines 119-120):
  ```ts
  const colStep = width / divisions;
  const rowStep = height / divisions;
  ```
  If an image is 1200×1600 (3:4 ratio), each grid "square" becomes a 300×400 rectangle! Traditional artists require **true square cells** (e.g., 20mm × 20mm or 100px × 100px) across the entire surface.
- **Current Flaw 2 (No Physical Dimensions):** There is no mapping from pixel coordinates to real-world units (millimetres, inches). An artist cannot request a "15 mm grid" to match their physical ruler.

---

## 7. TRADITIONAL DRAWING METHODS AUDIT

| Traditional Method | Implemented? | Code Location | Status & Notes |
|---|---|---|---|
| **Loomis Method** | **YES** | `src/features/loomis/LoomisEngine.ts` | 8-stage head construction, 3D cranium sphere, brow ellipse, jawline wedge, facial thirds, ear placement. Outstanding implementation. |
| **Reilly Abstraction** | **NO** | `src/domain/types.ts` (stub) | Not implemented. Requires rhythm lines (brow curve, cheek arcs, chin-to-nasal loops, neck ribbons). |
| **Bargue Method** | **NO** | None | Not implemented. Requires sight-size alignment, plumb line drop, envelope block-in, and two-value shadow mapping. |
| **Sight-Size Method** | **PARTIAL** | `src/features/comparison/ComparisonEngine.ts` | Plumb lines and split comparison exist, but 1:1 physical paper calibration is missing. |
| **Comparative Measurement**| **PARTIAL** | `src/features/comparison/ComparisonEngine.ts` | Measurement plumb lines exist; proportional dividers need to be built. |
| **Block-In Method** | **PARTIAL** | `src/features/composition/CompositionCoachEngine.ts` | Convex hull boundaries exist; interactive polygon envelope tool needed. |
| **Negative Space** | **YES** | `src/features/composition/CompositionCoachEngine.ts` | Boundary silhouette analysis and negative space isolation. |
| **Plumb Lines** | **YES** | `src/features/comparison/ComparisonEngine.ts` | Interactive horizontal and vertical guide crosshairs with coordinate readout. |
| **Gesture & Line of Action**| **YES** | `src/features/pose/PoseCoachEngine.ts` | Line of action curve through torso and pelvis, spine curvature indicator. |
| **Anatomy & Landmarks** | **YES** | `src/features/anatomy/AnatomyEngine.ts` | 8-head canonical figure, skeletal joints, muscle groups, facial proportion thirds. |
| **Perspective (1/2/3 Point)**| **YES** | `src/features/perspective/PerspectiveEngine.ts` | Radiating vanishing point convergence lines, horizon line adjustment, vertical guides. |
| **5-Value Tonal Shading** | **YES** | `src/features/shading/ShadingEngine.ts` | Highlight, Midtone, Core Shadow, Reflected Light, Cast Shadow with 360° light dial. |

---

## 8. PHYSICAL PAPER & PRINT STUDIO AUDIT

- **Paper Sizes:** Currently, `createProject` in `appStore.ts` hardcodes canvas height to 1400px and derives width from reference aspect ratio. There is **no** concept of standard physical paper sizes (ISO A4: 210×297 mm, A3: 297×420 mm, A5: 148×210 mm, US Letter: 8.5×11 in).
- **Physical Accuracy:** The app lacks DPI (Dots Per Inch) or PPCM (Pixels Per Centimetre) metadata.
- **Export Resolution:** `DrawingSurfaceHandle.export()` captures an on-screen Skia snapshot (`exportRef.current.makeImageSnapshotAsync()`) at screen canvas dimensions. It does not generate a true 300 DPI high-resolution master file suitable for physical paper printing.
- **Print Alignment:** No printable boundary margins (standard 5 mm printer margins) or cut/bleed marks exist.

---

## 9. PROJECT MANAGEMENT & DATA PERSISTENCE AUDIT

### 9.1 SQLite Schema (`artistry-ai.db`)
- `projects`: `id, name, width, height, layers_json, active_layer_id, reference_uri, created_at, updated_at`.
- `references_local`: `id, name, uri, original_uri, width, height, is_edited, updated_at`.
- `app_metadata`: Key-value configuration storage.
- `lesson_progress`: `lesson_id, completed, completed_at`.
- `challenge_completions`: `id, challenge_title, completed_date, completed_at, project_id`.
- `streak_data`: `id, current_streak, longest_streak, last_active_date`.
- `drawing_analyses`: Multi-factor AI assessment history.
- `generated_references`: Offline SVG / AI generation records.
- `saved_palettes`: User extracted color swatches.
- `stroke_replays`: Timestamped stroke telemetry.

### 9.2 Data Safety & Integrity
- **WAL Mode:** Enabled (`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`). Protects against corruption during app termination.
- **Critical Persistence Gaps:**
  1. The `projects` table does not persist active overlays (Grid settings, Loomis params, Perspective VPs). Exiting a tool loses all slider positions!
  2. Paper dimensions (A4/A3/A5, mm dimensions) are not stored in the project record.
  3. Image adjustments (brightness, contrast, whiteout percentage) are not stored in the project schema.

---

## 10. REUSE VS. REBUILD RECOMMENDATION

| Architectural Component | Decision | Technical Rationale |
|---|---|---|
| **Loomis Engine** | **KEEP AS-IS** | Complete, robust 8-stage 3D projection math with zero regressions. |
| **Anatomy Engine** | **KEEP AS-IS** | Rich 8-head skeletal and muscular canonical datasets. |
| **Perspective Engine** | **KEEP AS-IS** | Accurate 1/2/3-point vanishing point ray calculations. |
| **Pose & Hand/Foot Coaches** | **KEEP AS-IS** | Offline geometric fallback + MediaPipe landmark integration works reliably. |
| **Reference Generator** | **KEEP AS-IS** | 100% offline procedural SVG vector generator is fast and self-contained. |
| **Color Recommender** | **KEEP AS-IS** | Color theory math (complementary, analogous, triadic) is clean and fast. |
| **Voice Assistant** | **KEEP AS-IS** | Offline bilingual regex parser for English and Tamil works seamlessly. |
| **Catmull-Rom Smoothing** | **KEEP AS-IS** | Smooth stroke interpolation algorithm in `StrokeSmoothing.ts` is production-ready. |
| **SQLite WAL Persistence** | **REUSE WITH EXTENSION** | Database infrastructure is sound; needs schema migration for overlay/paper metadata. |
| **Grid Engine** | **REUSE WITH MODIFICATIONS** | Add true square cells and physical mm/inch scaling. |
| **Shading Engine** | **REUSE WITH MODIFICATIONS** | Add GPU Skia shader execution for real-time 360° light feedback. |
| **Tracing Engine** | **REFACTOR** | Replace CPU-bound JS array iteration with Skia GPU ColorFilters. |
| **Monolithic `tools/[id].tsx`** | **REPLACE** | Break 2,431-line monolithic tool file into a unified, multi-overlay workstation. |
| **Reference Studio** | **BUILD NEW** | Create central workstation screen where multiple overlays stack over one reference. |
| **Paper & Print Studio** | **BUILD NEW** | Real-world mm dimensions, A4/A3/A5 aspect locks, and 300 DPI export pipeline. |
| **Real Whiteout Shader** | **BUILD NEW** | Skia ColorFilter/RuntimeShader for independent image bleaching. |
