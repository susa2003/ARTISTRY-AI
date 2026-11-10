# ARTISTRY AI — REDESIGN & IMPLEMENTATION ROADMAP
**Document:** 10-Phase Systematic Implementation Roadmap  
**Product Identity:** The Complete Traditional Drawing Companion  
**Application ID:** `ai.artistry.studio`  
**Date:** 2026-11-09  
**Execution Strategy:** Non-destructive evolutionary refactoring (Preserve all Phase 1–7 verified functionality)

---

## ROADMAP OVERVIEW & TIMELINE MATRIX

```
Phase 0: Safety & Baseline Audit ───┐
Phase 1: Shared Core Foundation ────┼──> Phase 2: Reference Studio ──> Phase 3: Whiteout & Overlays
                                    │                                           │
Phase 4: Traditional Drawing Methods│<──────────────────────────────────────────┘
           │
           ├──> Phase 5: Beginner & Professional Modes
           │
           ├──> Phase 6: Paper & Print Studio (A4/A3/A5, 300 DPI)
           │
           ├──> Phase 7: Learning & AI Studio Integration
           │
           ├──> Phase 8: UI/UX Polish & Free Drawing Studio Sync
           │
           └──> Phase 9: QA, Performance Profiling & Release Packaging
```

---

## PHASE 0: BACKUP, SAFETY & BASELINE VERIFICATION

- **Objectives:** Guarantee 100% project safety, zero file loss, and establish immutable regression baselines before making architectural changes.
- **Features / Tasks:**
  1. Verify complete Git repository cleanliness (`git status`).
  2. Create an isolated architectural checkpoint branch (`redesign/traditional-companion`).
  3. Verify existing test suites: 21 client Jest suites (56 tests) and 10 backend Jest suites (70 tests).
  4. Verify the existing `arm64-v8a` debug APK (`app-artistry-arm64.apk`, 130.9 MB) is safely preserved.
- **Existing Components to Reuse:** Existing test runners, Gradle configuration, SQLite database file.
- **New Components Required:** Backup verification script, automated regression test harness.
- **Dependencies:** None.
- **Risks:** Accidental file modification during audit/prep.
- **Acceptance Criteria:**
  - Git working directory verified clean.
  - All 126 existing automated tests pass with 0 failures.
  - APK integrity checksum recorded and locked.

---

## PHASE 1: ARCHITECTURE & SHARED FOUNDATION

- **Objectives:** Establish the core types, unified coordinate systems, and database schema migrations necessary for multi-overlay composition.
- **Features / Tasks:**
  1. Define polymorphic `UnifiedLayer` and `OverlayConfig` interfaces in `src/domain/types.ts`.
  2. Implement `ReferenceCoordinateTransform`: A 3×3 matrix utility that normalizes pan, zoom, and rotation relative to the source reference image.
  3. Execute non-destructive SQLite migration on `projects` table (add `paper_size`, `paper_width_mm`, `paper_height_mm`, `whiteout_level`, `overlays_json`).
  4. Extend `appStore.ts` to manage the active multi-overlay layer stack.
- **Existing Components to Reuse:** `src/storage/database.ts`, `src/domain/types.ts`, `src/state/appStore.ts`.
- **New Components Required:** `src/features/coordinate/ReferenceTransform.ts`, `src/domain/overlayTypes.ts`.
- **Dependencies:** Phase 0 completion.
- **Risks:** SQLite schema migration breaking previous user project records.
- **Acceptance Criteria:**
  - Automated migration test verifies existing user projects load without data loss.
  - Coordinate transform passes unit tests for 0.4x to 6.0x zoom and arbitrary pan offsets.

---

## PHASE 2: REFERENCE STUDIO (CENTRAL WORKSTATION)

- **Objectives:** Build the primary workstation screen where the reference image and its active overlays live.
- **Features / Tasks:**
  1. Create `src/app/reference-studio/[id].tsx` as the core workstation surface.
  2. Implement an edge-to-edge Skia Canvas powered by `ReferenceCoordinateTransform`.
  3. Build a floating, collapsible Layer Manager Drawer displaying active overlays with visibility toggles, opacity sliders, and reorder handles.
  4. Build a top HUD showing reference metadata, physical paper aspect indicator, and zoom level.
  5. Provide quick-access bottom pill navigation for switching between active drawing methods.
- **Existing Components to Reuse:** `src/features/images/pickImage.ts`, `src/components/AppUI.tsx`, `src/theme/index.ts`.
- **New Components Required:** `src/features/workstation/WorkstationViewport.tsx`, `src/features/workstation/LayerStackDrawer.tsx`.
- **Dependencies:** Phase 1 completion.
- **Risks:** Memory pressure when rendering high-resolution reference images on low-end Android hardware.
- **Acceptance Criteria:**
  - Reference image renders smoothly at 60 FPS under continuous pan and pinch gestures.
  - Layer stack drawer opens and closes without canvas stutter or frame drops.

---

## PHASE 3: IMAGE EDITING & REAL WHITEOUT SHADER

- **Objectives:** Implement GPU-accelerated non-destructive image adjustments and the true Whiteout/Lightbox shader.
- **Features / Tasks:**
  1. Author and compile the Skia SkSL `WhiteoutShader` to bleach reference pixels toward pure paper white while protecting dark lines.
  2. Implement independent brightness (-1.0 to +1.0) and contrast (0.5 to 2.0) GPU ColorFilters.
  3. Build interactive image editing controls in the Reference Studio: Freeform crop bounding box, 90° rotation, and reset to original.
  4. Decouple controls: Verify that adjusting Whiteout level does NOT affect grid opacity or overlay visibility.
- **Existing Components to Reuse:** `src/features/tracing/TracingEngine.ts`, `src/storage/imageFiles.ts`.
- **New Components Required:** `src/features/shaders/WhiteoutShader.ts`, `src/features/images/InteractiveCropOverlay.tsx`.
- **Dependencies:** Phase 2 completion.
- **Risks:** Shader compilation failure on older Android Mali/Adreno GPU chipsets.
- **Acceptance Criteria:**
  - Whiteout slider smoothly transitions image from 0% (natural) to 100% (pure paper white) while dark lines remain distinctly visible.
  - SkSL shader falls back gracefully to a standard Skia ColorMatrix if hardware shader compilation fails.

---

## PHASE 4: TRADITIONAL DRAWING METHODS INTEGRATION

- **Objectives:** Connect all existing traditional drawing engines into the unified multi-overlay workstation.
- **Features / Tasks:**
  1. **Smart Grid:** Upgrade `GridEngine.ts` to support true square cells and millimetre calibration (e.g., 10mm, 20mm squares).
  2. **Loomis Head:** Mount `LoomisSkiaOverlay.tsx` into the unified layer stack with 3D yaw, pitch, roll controls.
  3. **Perspective:** Mount `PerspectiveSkiaOverlay.tsx` with interactive vanishing points draggable beyond canvas boundaries.
  4. **Anatomy Guides:** Mount `AnatomySkiaOverlay.tsx` (canonical 8-head proportions, skeletal and muscular landmarks).
  5. **Shading & Light Dial:** Mount 5-value tonal quantization with real-time 360° light direction dial.
  6. **Plumb Lines:** Create standalone `PlumbLineOverlay` for vertical/horizontal alignment checks.
  7. **Multi-Overlay Stacking:** Verify that an artist can activate Grid + Loomis + Plumb Lines simultaneously on one reference.
- **Existing Components to Reuse:** `LoomisEngine.ts`, `GridEngine.ts`, `PerspectiveEngine.ts`, `AnatomyEngine.ts`, `ShadingEngine.ts`, `ComparisonEngine.ts`.
- **New Components Required:** `src/features/overlays/UnifiedOverlayRenderer.tsx`, `src/features/overlays/PlumbLineOverlay.tsx`.
- **Dependencies:** Phase 2 and Phase 3 completion.
- **Risks:** Touch gesture contention between canvas pan/zoom and overlay handle dragging.
- **Acceptance Criteria:**
  - 3 simultaneous overlays render without visual artifacts or coordinate drift.
  - Overlay drag handles (Loomis center, vanishing points) respond accurately to touch.

---

## PHASE 5: BEGINNER & PROFESSIONAL EXPERIENCES

- **Objectives:** Deliver tailored, distinct workflows for complete novices and seasoned draftsmen.
- **Features / Tasks:**
  1. **Beginner Experience (12-Step Pathway):**
     - Step-by-step curriculum player with progressive overlay disclosure.
     - Automatically locks complex parameters and reveals one fundamental concept per lesson (e.g., Lesson 4: Grid only; Lesson 8: Loomis sphere only).
     - Contextual audio and text guidance pills explaining *why* each line is drawn.
  2. **Professional Experience (Drafting CAD Workstation):**
     - Unconstrained access to all 9 studios and multi-overlay manager.
     - Sub-millimetre grid measurements, custom caliper dividers, and multi-point perspective.
     - Workstation preset saving/loading (e.g., "Portrait Setup", "Still Life Setup").
- **Existing Components to Reuse:** `src/features/learning/LearningCenter.ts`, `src/state/appStore.ts`.
- **New Components Required:** `src/features/learning/CurriculumPlayer.tsx`, `src/features/workstation/WorkstationPresets.ts`.
- **Dependencies:** Phase 4 completion.
- **Risks:** Interface clutter in Beginner Mode causing cognitive overload.
- **Acceptance Criteria:**
  - Switching between Beginner and Professional modes instantly reconfigures the UI without losing project state.
  - Beginners complete Lesson 1–4 without encountering advanced CAD sliders.

---

## PHASE 6: PHYSICAL PAPER & PRINT STUDIO (A4/A3/A5, 300 DPI)

- **Objectives:** Empower artists to transfer their digital workstation setups with sub-millimetre precision onto real physical paper.
- **Features / Tasks:**
  1. Implement paper format selection: ISO A4 (210×297 mm), ISO A3 (297×420 mm), ISO A5 (148×210 mm), and custom dimensions.
  2. Implement paper orientation toggle (Portrait / Landscape) with automatic aspect-ratio fit.
  3. Implement printable safe area margins (standard 5 mm hardware margin) with alignment crosshairs.
  4. Implement an offscreen 300 DPI Skia export pipeline that renders crisp $2480 \times 3508$ px master files for A4 paper.
  5. Add "Print Grid Alignment Sheet" export: Generates a matching physical grid sheet to place under drawing paper.
- **Existing Components to Reuse:** `src/storage/imageFiles.ts`, `src/features/grid/GridEngine.ts`.
- **New Components Required:** `src/app/print-studio/[id].tsx`, `src/features/print/HighDpiExporter.ts`.
- **Dependencies:** Phase 4 completion.
- **Risks:** Memory spike (OOM) during 300 DPI bitmap allocation on low-RAM devices (e.g., 3GB/4GB phones).
- **Acceptance Criteria:**
  - Exported A4 file measures exactly $2480 \times 3508$ pixels at 300 DPI.
  - Physical ruler measurement on printed paper matches the digital grid cell size to within ±0.5 mm.

---

## PHASE 7: LEARNING & AI STUDIO INTEGRATION

- **Objectives:** Connect all offline and cloud AI capabilities cleanly into the redesigned workstation.
- **Features / Tasks:**
  1. Embed AI Art Mentor critique drawer directly into Reference Studio.
  2. Embed AI Mistake Detector badges (facial tilt, eye alignment, perspective drift).
  3. Ensure 100% offline functionality: Verify that when offline, all 16 AI capabilities seamlessly use `LocalFallbackProvider.ts`.
  4. Verify cloud AI calls strictly occur upon explicit user button tap with clear loading and error feedback.
  5. Maintain bilingual Voice Assistant (English & Tamil) accessible via a floating mic pill.
- **Existing Components to Reuse:** `src/services/ai/AIServiceManager.ts`, `src/services/ai/LocalFallbackProvider.ts`, `src/features/voice/VoiceAssistantEngine.ts`.
- **New Components Required:** Floating AI Companion widget.
- **Dependencies:** Phase 2, 4, and 5 completion.
- **Risks:** Slow network requests causing UI freeze if not properly aborted.
- **Acceptance Criteria:**
  - AI analysis displays results in <500 ms in local mode.
  - Voice commands in English and Tamil successfully toggle tools and adjust brush size hands-free.

---

## PHASE 8: UI/UX POLISH & FREE DRAWING STUDIO INTEGRATION

- **Objectives:** Unify visual styling, refine animations, and guarantee the standalone Free Drawing Studio remains robust and unhindered.
- **Features / Tasks:**
  1. Audit and preserve `src/app/studio/[id].tsx` (Free Drawing Studio) as Studio 8.
  2. Ensure drawing strokes created in Free Drawing Studio can optionally be imported into Reference Studio as an overlay layer.
  3. Polish theme consistency (Warm Charcoal `#1C211D`, Forest Green `#28594B`, Terracotta `#CB7857`, Soft Canvas `#FFFEFA`).
  4. Verify responsive layout across phone screens and 10-inch Android tablets.
  5. Add haptic feedback for grid snapping and overlay milestone alignments.
- **Existing Components to Reuse:** `src/app/studio/[id].tsx`, `src/theme/index.ts`, `src/components/AppUI.tsx`.
- **New Components Required:** Shared design system token refinements.
- **Dependencies:** Phase 2 through 7 completion.
- **Risks:** Regressions in freehand brush stroke smoothing or eraser blend modes.
- **Acceptance Criteria:**
  - Free Drawing Studio functions with 0 regressions.
  - Catmull-Rom stroke smoothing maintains latency <16 ms per frame (60 FPS).

---

## PHASE 9: TESTING, PERFORMANCE OPTIMIZATION & BETA PACKAGING

- **Objectives:** Comprehensive automated test coverage, native performance profiling, and production release packaging.
- **Features / Tasks:**
  1. Run complete unit test suite (client, backend, AI engine); write unit tests for all new components.
  2. Profile native Android memory consumption (target: steady state <250 MB RAM under multi-overlay rendering).
  3. Profile GPU frame rendering using Android Systrace / React Native Performance monitor.
  4. Execute clean Gradle build for `arm64-v8a` release AAB (`:app:bundleRelease`) and debug APK.
  5. Verify APK signature, R8 code shrinking, and resource optimization.
- **Existing Components to Reuse:** Jest suites, `android/release-upload.keystore`, `proguard-rules.pro`.
- **New Components Required:** Integration test suite for multi-overlay composition and print export.
- **Dependencies:** Phases 1 through 8 completion.
- **Risks:** R8 shrinking stripping necessary Skia or GestureHandler native reflection classes.
- **Acceptance Criteria:**
  - 100% test pass rate across all suites.
  - AAB bundle passes Google Play bundletool validation.
  - Physical Android installation test confirms 0 crashes on launch and during multi-overlay drawing.
