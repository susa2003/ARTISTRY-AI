# ARTISTRY AI — NEW PRODUCT ARCHITECTURE SPECIFICATION
**Product Identity:** The Complete Traditional Drawing Companion  
**Document:** Master Architectural Blueprints & System Design  
**Date:** 2026-11-09  
**Application ID:** `ai.artistry.studio`  
**Location:** `D:\antigravity\artist ai app`

---

## 1. VISION & ARCHITECTURAL PHILOSOPHY

ARTISTRY AI is not just another digital sketchpad; it is **The Complete Traditional Drawing Companion**. Its purpose is to bridge the digital and physical worlds—giving both complete beginners and seasoned professional artists the tools, construction lines, proportions, and lighting guides required to draw with exactness on real, physical paper.

### Core Architectural Pillars
1. **The Reference Image is the Workstation:** The reference image is not a passive background; it is the ground-truth coordinate plane upon which all drawing methods, construction lines, grids, and shading models converge.
2. **Unified Multi-Overlay Engine:** Artists never use only one method. They combine a grid with a Loomis head, drop plumb lines over facial features, and verify anatomy landmarks simultaneously. Overlays must live in a single unified, non-destructive stack.
3. **True Physical Paper Calibration:** A digital pixel must know its physical size. 20 millimetres on an A4 sheet of paper must correspond precisely to 20 millimetres in the digital grid.
4. **Real Whiteout / Lightbox Technology:** Bleaching the image toward pure paper white must happen through GPU shader math without washing out or degrading the artist's structural guidance lines.
5. **Dual Experience Modes:**
   - **Beginner Mode:** A structured, 12-step guided curriculum that demystifies drawing step-by-step without overwhelming the user.
   - **Professional Mode:** An unconstrained, high-precision workstation with multi-overlay stacking, custom guides, and CAD-like precision.
6. **Preservation of Digital Free Drawing:** The digital Free Drawing Studio remains fully intact as a dedicated space for digital sketching, practice, and stroke replay.

---

## 2. THE 9-STUDIO PRODUCT ARCHITECTURE

```
                               ┌──────────────────────────────────────────────────┐
                               │           ARTISTRY AI UNIFIED WORKSTATION        │
                               └─────────────────────────┬────────────────────────┘
                                                         │
         ┌───────────────────────────────────────────────┴───────────────────────────────────────────────┐
         │                                                                                               │
┌────────▼─────────────────────────┐                                                   ┌────────────────▼─────────────────┐
│     BEGINNER EXPERIENCE MODE     │                                                   │   PROFESSIONAL EXPERIENCE MODE   │
│  • 12-Step Progressive Syllabus  │                                                   │  • Multi-Overlay Stacking Engine │
│  • Simplified Single Overlays    │                                                   │  • Sub-millimetre Precision      │
│  • Contextual Hints & Guides     │                                                   │  • Non-destructive Layer Stack   │
└────────────────┬─────────────────┘                                                   └────────────────┬─────────────────┘
                 │                                                                                      │
                 └───────────────────────────────────────┬──────────────────────────────────────────────┘
                                                         │
                                        ┌────────────────▼────────────────┐
                                        │    UNIFIED OVERLAY & LAYER      │
                                        │     TRANSFORMATION ENGINE       │
                                        │  (Shared 3x3 Reference Matrix)  │
                                        └────────────────┬────────────────┘
                                                         │
    ┌──────────────┬──────────────┬─────────────┬────────┴─────┬──────────────┬──────────────┬─────────────┐
    │              │              │             │              │              │              │             │
┌───▼────┐   ┌─────▼────┐   ┌─────▼────┐  ┌─────▼────┐   ┌─────▼────┐   ┌─────▼────┐   ┌─────▼────┐  ┌─────▼────┐
│Studio 1│   │ Studio 2 │   │ Studio 3 │  │ Studio 4 │   │ Studio 5 │   │ Studio 6 │   │ Studio 7 │  │ Studio 8 │
│Reference│  │   Grid   │   │Construct-│  │ Tracing  │   │ Shading  │   │Professional│ │  Paper   │  │  Free    │
│ Studio │   │  Studio  │   │   ion    │  │  Studio  │   │  Studio  │   │  Studio  │   │ & Print  │  │ Drawing  │
│ (Core) │   │          │   │ (Loomis) │  │(Lightbox)│   │(Lighting)│   │  (CAD)   │   │ (A4/A3)  │  │ (Canvas) │
└───┬────┘   └─────┬────┘   └─────┬────┘  └─────┬────┘   └─────┬────┘   └─────┬────┘   └─────┬────┘  └─────┬────┘
    │              │              │             │              │              │              │             │
    └──────────────┴──────────────┴─────────────┴──────────────┴──────────────┴──────────────┴─────────────┘
                                                         │
                                        ┌────────────────▼────────────────┐
                                        │            STUDIO 9             │
                                        │      LEARNING & AI STUDIO       │
                                        │ • 12 Lessons • Daily Challenges │
                                        │ • Voice Assistant (EN / TA)     │
                                        │ • MediaPipe / OpenCV Fallbacks  │
                                        └─────────────────────────────────┘
```

### Studio 1: Reference Studio (The Central Workstation)
- **Role:** The primary screen of ARTISTRY AI.
- **Workflow:** The user selects or captures a reference image. The Reference Studio hosts the master Skia viewport, the unified layer stack panel, and quick toggles for all active drawing overlays.
- **Image Editing Pipeline:** Non-destructive image adjustments (brightness, contrast, exposure, saturation, rotation, freeform crop, and Whiteout shader).

### Studio 2: Grid Studio
- **Role:** High-precision physical and digital gridding.
- **Capabilities:**
  - Square Grids (equal width/height cells regardless of image aspect ratio).
  - Physical Millimetre Grids (e.g., exactly 10 mm, 15 mm, 20 mm cells calibrated for physical paper).
  - Compositional Grids (Rule of Thirds, Golden Ratio, Dynamic Diagonals).
  - Alphanumeric Coordinate Header & Sidebar (A–Z, 1–N) with cell highlighting.
  - Subdivisions (half-cell tick marks for fine measurement transfer).

### Studio 3: Construction Studio (Loomis, Reilly, Bargue)
- **Role:** Structural drawing systems for anatomy, portraits, and figures.
- **Engines:**
  - **Loomis Head Construction:** 8-stage 3D head geometry (yaw, pitch, roll, cranium sphere, brow ellipse, side temple disc, jaw wedge, facial thirds, ear placement).
  - **Reilly Rhythm Abstraction:** Classical curved rhythm lines linking brows, cheekbones, chin, and neck ribbons.
  - **Bargue & Block-In:** Straight-line contour bounding envelopes, plumb line anchors, and proportional tick marks.

### Studio 4: Tracing Studio (Digital Lightbox)
- **Role:** Optical contour extraction and physical paper lightbox simulation.
- **Modes:**
  - **Natural:** Source reference image with fine opacity control.
  - **High-Contrast Binarization:** Isolate dark pencil line work from background tones.
  - **Chalkboard Inversion:** Black canvas with luminous white contours for low-strain viewing.
  - **Optical Lightbox:** Bleaches reference tones while boosting contour edge contrast for tracing through heavy physical drawing paper.

### Studio 5: Shading Studio (Lighting & Tonal Mapping)
- **Role:** Form lighting analysis and tonal value simplification.
- **Capabilities:**
  - **5-Value Tonal Scale:** Highlight (#F7F5EB), Halftone (#C5C2B4), Core Shadow (#6A675B), Reflected Light (#8E8B7E), Cast Shadow (#22211C).
  - **360° Light Direction Dial:** Adjust azimuth (0–360°) and elevation (15–75°) to visualize cast shadow falloff.
  - **Terminator Line:** Highlights the dividing boundary between light and shadow on curved forms.
  - **Graphite Grade Recommendations:** Suggests pencil grades (2H, HB, 2B, 4B, 6B) for each tonal zone.

### Studio 6: Professional Artist Studio
- **Role:** Unconstrained, CAD-like workstation for advanced draftsmen.
- **Capabilities:**
  - Multi-overlay layering: Simultaneously activate Grid + Loomis + Plumb Lines + 5-Value Shading.
  - Interactive Plumb Lines & Proportional Dividers with exact angle and distance readouts.
  - Multi-point perspective convergence (1-point, 2-point, 3-point vanishing points).
  - Saveable Workstation Presets (e.g., "Portrait Setup", "Architectural Setup", "Figure Block-In").

### Studio 7: Paper and Print Studio
- **Role:** True 1:1 physical paper calibration and print preparation.
- **Paper Standard Presets:**
  - ISO A4 (210 × 297 mm)
  - ISO A3 (297 × 420 mm)
  - ISO A5 (148 × 210 mm)
  - US Letter (8.5 × 11.0 in / 215.9 × 279.4 mm)
  - Custom user dimensions (width × height in mm or inches).
- **Physical Calibration:**
  - Aspect ratio preservation with letterbox or crop preview.
  - Printer margin safe zones (standard 5 mm non-printable margin).
  - 300 DPI master raster export with physical dimensions embedded in EXIF/PNG header.
  - Printable Grid Alignment Sheets (prints the matching grid on physical paper).

### Studio 8: Free Drawing Studio
- **Role:** Standalone digital drawing and painting workstation (preserved from Phase 1–6).
- **Capabilities:**
  - React Native Skia canvas with Catmull-Rom stroke smoothing.
  - Multi-layer vector strokes with layer reordering, opacity, visibility, and blending modes.
  - Digital brushes: Pencil, Ink Pen, Soft Brush, and Eraser (`blendMode="clear"`).
  - Stroke Replay: Step-by-step playback with speed controls (0.5x–5x).

### Studio 9: Learning and AI Studio
- **Role:** Educational curriculum and intelligent offline/cloud feedback.
- **Capabilities:**
  - 12-Step Beginner Curriculum with interactive practice exercises.
  - Daily timed drawing challenges with streak tracking in SQLite.
  - Bilingual Voice Assistant (English & Tamil) for hands-free control.
  - AI Assistant engines: Pose Coach, Hand/Foot Coach, Mistake Detector, Art Mentor.

---

## 3. UNIFIED OVERLAY & LAYER ENGINE ARCHITECTURE

### 3.1 Non-Destructive Multi-Layer Stack Specification
Instead of restricting layers to drawing strokes, the new architecture introduces a polymorphic layer interface:

```typescript
export type OverlayLayerType =
  | "REFERENCE_IMAGE"
  | "GRID"
  | "LOOMIS"
  | "REILLY"
  | "BARGUE_BLOCKIN"
  | "PERSPECTIVE"
  | "ANATOMY"
  | "SHADING_MAP"
  | "PLUMB_LINES"
  | "DRAWING_STROKES";

export interface UnifiedLayer<T = any> {
  id: string;
  name: string;
  type: OverlayLayerType;
  visible: boolean;
  opacity: number;        // 0.0 to 1.0
  locked: boolean;         // Prevents accidental touch drag
  blendMode: "srcOver" | "multiply" | "screen" | "overlay";
  config: T;               // Strongly-typed configuration for the overlay
  zIndex: number;          // Rendering order
}
```

### 3.2 Layer Pipeline Execution Order
During every Skia render pass, layers are sorted by `zIndex` and rendered sequentially inside a single parent transformation group:

```
[Background Paper: #FFFFFF or User Color]
   │
   ▼
[Layer 0: Reference Image] ──> (Filtered via Whiteout / Lightbox Shader)
   │
   ▼
[Layer 1: Grid Overlay] ─────> (GridEngine Render Data)
   │
   ▼
[Layer 2: Construction] ─────> (Loomis 3D / Reilly / Perspective)
   │
   ▼
[Layer 3: Anatomy Guides] ───> (Canonical Proportions & Landmarks)
   │
   ▼
[Layer 4: Shading Guides] ───> (Terminator Lines & 5-Value Zones)
   │
   ▼
[Layer 5: Drawing Strokes] ──> (Artist Freehand Strokes / Catmull-Rom)
```

---

## 4. REAL WHITEOUT / LIGHTBOX SHADER ARCHITECTURE

### 4.1 The Mathematical Problem
Standard opacity reduction interpolates between the source pixel and transparent alpha:
$$\text{Output} = \text{Color}_{\text{src}} \times \alpha$$
When rendered over a white canvas, this fades all frequencies equally. The faint line work vanishes at the same rate as the light tones.

### 4.2 Skia Runtime Shader (SkSL) Specification
The true Whiteout/Lightbox engine uses an SkSL shader that non-linearly bleaches the RGB channels toward pure paper white (`#FFFFFF`) while preserving or boosting dark edges:

```glsl
// SkSL Whiteout Shader
uniform shader image;
uniform float u_whiteout;    // 0.0 (original) to 1.0 (pure white)
uniform float u_brightness;  // -1.0 to 1.0 (default 0.0)
uniform float u_contrast;    // 0.5 to 2.0 (default 1.0)
uniform float u_edge_boost;  // 0.0 to 1.0 (protect dark lines)

half4 main(float2 coord) {
    half4 color = image.eval(coord);
    
    // 1. Contrast and Brightness Adjustments
    color.rgb = (color.rgb - 0.5) * u_contrast + 0.5 + u_brightness;
    color.rgb = clamp(color.rgb, 0.0, 1.0);
    
    // 2. Luminance calculation (Rec. 709)
    float luma = dot(color.rgb, half3(0.2126, 0.7152, 0.0722));
    
    // 3. Selective Whiteout Bleaching:
    // Dark lines (low luma) are protected by u_edge_boost,
    // while midtones and highlights smoothly transition to 1.0 (white).
    float protection = (1.0 - luma) * u_edge_boost;
    float effectiveWhiteout = clamp(u_whiteout - protection, 0.0, 1.0);
    
    color.rgb = mix(color.rgb, half3(1.0, 1.0, 1.0), effectiveWhiteout);
    return color;
}
```

### 4.3 Independent Controls Decoupling
The UI exposes five completely decoupled sliders that never cross-contaminate:
1. `Image Brightness`: Scales base RGB offsets.
2. `Image Whiteout Strength`: Controls `effectiveWhiteout` in the shader.
3. `Reference Base Opacity`: Controls outer `<Group opacity={refOpacity}>`.
4. `Grid Line Opacity`: Controls `paint.setAlphaf(gridOpacity)`.
5. `Construction Overlay Opacity`: Controls individual overlay alphas.

---

## 5. SHARED COORDINATE SYSTEM & MATRICES

### 5.1 The Coordinate Hierarchy
To eliminate spatial drift and ensure that zooming, panning, and rotating apply identically to the reference image, the grid, and all 3D overlays:

1. **Ground Truth: Reference Image Space (`[0, 0, imageWidth, imageHeight]`):**
   All engine calculations (Loomis center, grid line coordinates, perspective vanishing points) are stored in normalized reference space (`[0..1, 0..1]`) or pixel reference space.
2. **Physical Paper Space (`[0, 0, paperWidthMm, paperHeightMm]`):**
   Calculated via scaling factor $S_{\text{mm}} = \text{paperWidthMm} / \text{imageWidth}$.
3. **Viewport Screen Space (`[0, 0, screenWidth, screenHeight]`):**
   Governed by a single 3×3 transformation matrix:

$$\mathbf{M}_{\text{viewport}} = \mathbf{T}(\text{pan.x}, \text{pan.y}) \cdot \mathbf{S}(\text{fit} \cdot \text{zoom}) \cdot \mathbf{R}(\theta)$$

### 5.2 Touch Event Inversion
When the user taps on the screen (e.g., to position a Loomis center or drag a vanishing point), the screen touch coordinate $(x_{\text{screen}}, y_{\text{screen}})$ is multiplied by the inverted matrix $\mathbf{M}_{\text{viewport}}^{-1}$ to find the exact point in reference image coordinates:

$$\begin{bmatrix} x_{\text{ref}} \\ y_{\text{ref}} \\ 1 \end{bmatrix} = \mathbf{M}_{\text{viewport}}^{-1} \begin{bmatrix} x_{\text{screen}} \\ y_{\text{screen}} \\ 1 \end{bmatrix}$$

This guarantees zero parallax or drift regardless of the current zoom level (0.4x to 6.0x) or screen resolution.

---

## 6. BEGINNER VS. PROFESSIONAL MODE ARCHITECTURE

```
                               ┌────────────────────────────────┐
                               │     USER EXPERIENCE SELECTOR   │
                               └───────────────┬────────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       │                                               │
         ┌─────────────▼─────────────┐                   ┌─────────────▼─────────────┐
         │       BEGINNER MODE       │                   │     PROFESSIONAL MODE     │
         └─────────────┬─────────────┘                   └─────────────┬─────────────┘
                       │                                               │
       ┌───────────────┴───────────────┐               ┌───────────────┴───────────────┐
       │ • 12-Step Progressive Pathway │               │ • Unconstrained Workstation   │
       │ • One Active Overlay at a Time│               │ • Multi-Overlay Layer Stack   │
       │ • Auto-Calculated Parameters  │               │ • Sub-Millimetre Calibration  │
       │ • On-Screen Guidance Pills    │               │ • Interactive Plumb Dividers  │
       │ • Contextual Audio Hints      │               │ • Custom Paper Dimensions     │
       └───────────────────────────────┘               └───────────────────────────────┘
```

### 6.1 Beginner Mode: The 12-Step Progressive Curriculum
Beginners are guided through a gentle, step-by-step pathway:
1. **Lesson 1:** Line Quality & Relaxed Arm Gestures (Confidence strokes).
2. **Lesson 2:** Basic Geometric Envelopes (Bounding boxes for still life).
3. **Lesson 3:** Proportional Sight-Size (Comparing widths to heights).
4. **Lesson 4:** The 4×4 Grid Method (Square cell transfer to physical paper).
5. **Lesson 5:** Contour Tracing & Optical Lightbox (Hand-eye coordination).
6. **Lesson 6:** 3D Form Construction (Turning circles into spheres and cylinders).
7. **Lesson 7:** Facial Thirds & Symmetry (The classical proportion rule).
8. **Lesson 8:** The Loomis Cranium Sphere (Constructing the head from 3/4 view).
9. **Lesson 9:** Understanding Light Direction (Locating cast shadows).
10. **Lesson 10:** 5-Value Tonal Shading (Smooth pencil gradients from 2H to 6B).
11. **Lesson 11:** Full Reference Study (Step-by-step block-in to render).
12. **Lesson 12:** Drawing from Life / Physical Paper Project (Mastery milestone).

### 6.2 Professional Mode: The Digital Drafting Workstation
For experienced artists, architects, and illustrators:
- Full multi-overlay manager: Stack Grid + Loomis + Plumb Lines + 5-Value Shading.
- Custom grid spacing in exact millimetres (e.g., 12.5 mm).
- Interactive 3-point vanishing point placement outside the canvas bounds.
- 300 DPI print export with EXIF physical calibration metadata.

---

## 7. PHYSICAL PAPER & PRINT PIPELINE SPECIFICATION

```
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│ 1. Paper Format Setup   │     │ 2. Aspect Ratio Fitting │     │ 3. Margin & Safe Area   │
│ • ISO A4 (210 x 297 mm) │────>│ • Scale-to-Fit (Letterbox)────>│ • 5 mm Hardware Margin   │
│ • ISO A3 (297 x 420 mm) │     │ • Scale-to-Fill (Crop)  │     │ • Physical Corner Marks │
│ • ISO A5 (148 x 210 mm) │     │ • Exact 1:1 mm Scale    │     │ • Grid Label Margins    │
└─────────────────────────┘     └─────────────────────────┘     └────────────┬────────────┘
                                                                             │
┌─────────────────────────┐     ┌─────────────────────────┐                  │
│ 5. Physical Print Sheet │     │ 4. 300 DPI Master Export│                  │
│ • AirPrint / Cloud Print│<────│ • Skia Offscreen Surface│<─────────────────┘
│ • PDF Multi-Page Vector │     │ • 2480 x 3508 px (A4)   │
│ • 1:1 Ruler Alignment   │     │ • Lossless PNG / JPEG   │
└─────────────────────────┘     └─────────────────────────┘
```

### 7.1 Mathematical Calibration Formula
To render a true 300 DPI master image for ISO A4 paper (210 mm × 297 mm):
$$\text{Width}_{\text{pixels}} = \frac{210\text{ mm}}{25.4\text{ mm/inch}} \times 300\text{ DPI} = 2480.31 \approx 2480\text{ px}$$
$$\text{Height}_{\text{pixels}} = \frac{297\text{ mm}}{25.4\text{ mm/inch}} \times 300\text{ DPI} = 3507.87 \approx 3508\text{ px}$$

The export engine provisions an off-screen Skia Surface at exactly $2480 \times 3508$ pixels, redraws all active layers and grid lines with anti-aliasing, and writes the lossless bitmap directly to app storage for printing or PDF export.

---

## 8. DATABASE SCHEMA EVOLUTION (SQLite WAL)

To persist multi-overlay states, paper settings, and image adjustments, the `projects` table will be safely evolved without data loss:

```sql
-- Migration: Add workstation columns to existing projects table
ALTER TABLE projects ADD COLUMN paper_size TEXT DEFAULT 'A4';
ALTER TABLE projects ADD COLUMN paper_orientation TEXT DEFAULT 'portrait';
ALTER TABLE projects ADD COLUMN paper_width_mm REAL DEFAULT 210.0;
ALTER TABLE projects ADD COLUMN paper_height_mm REAL DEFAULT 297.0;
ALTER TABLE projects ADD COLUMN whiteout_level REAL DEFAULT 0.0;
ALTER TABLE projects ADD COLUMN image_brightness REAL DEFAULT 0.0;
ALTER TABLE projects ADD COLUMN image_contrast REAL DEFAULT 1.0;
ALTER TABLE projects ADD COLUMN overlays_json TEXT DEFAULT '[]';
ALTER TABLE projects ADD COLUMN experience_mode TEXT DEFAULT 'beginner';
```

---

## 9. NAVIGATION ARCHITECTURE

```
Root Layout (Stack)
├── (Home Hub)
│   ├── index.tsx                 # Project carousel, mode switcher, 9 studios
│   ├── onboarding.tsx            # Experience onboarding & language
│   ├── profile.tsx               # Subscription, streak, offline settings
│   └── subscription.tsx          # Google Play Billing checkout
├── (Workstations)
│   ├── reference-studio/[id].tsx # Central Workstation (Overlays + Reference)
│   ├── studio/[id].tsx           # Standalone Free Drawing Studio (Preserved)
│   ├── print-studio/[id].tsx     # Paper & Print Calibration Studio
│   └── camera.tsx                # Camera capture with composition guides
└── (Auth Modal Stack)
    ├── auth/login.tsx
    ├── auth/register.tsx
    └── auth/forgot-password.tsx
```
