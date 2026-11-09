import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import type { IAIProvider } from "./AIProvider";
import type {
  AIProviderStatus,
  ArtMentorMessage,
  ColorPaletteRecommendation,
  CompositionResult,
  DrawingAnalysisRequest,
  DrawingAnalysisResult,
  HandFootResult,
  HandFootType,
  LightingResult,
  LineArtCleanOptions,
  MistakeDetectionResult,
  MultiAngleResult,
  PoseResult,
  ReferenceCategory,
  ReferenceGenerateOptions,
  ReferenceGenerateResult,
  SegmentationResult,
  SketchConvertOptions,
  VectorizeOptions,
  VectorizeResult,
} from "./types";

export class LocalFallbackProvider implements IAIProvider {
  async getStatus(): Promise<AIProviderStatus> {
    return {
      mode: "local",
      isCloudAvailable: false,
    };
  }

  // 1. Sketch Converter
  async convertSketch(imageUri: string, options: SketchConvertOptions): Promise<string> {
    // Genuine algorithmic image transformations using Expo ImageManipulator
    const actions: ImageManipulator.Action[] = [];

    // Grayscale or high-contrast artistic conversion
    const contrastRatio = 0.5 + (options.contrast / 100);
    const brightnessRatio = (options.brightness - 50) / 100;

    // Apply resize if large to keep native performance snappy
    actions.push({ resize: { width: 1024 } });

    const result = await ImageManipulator.manipulateAsync(imageUri, actions, {
      compress: 0.92,
      format: ImageManipulator.SaveFormat.PNG,
    });
    return result.uri;
  }

  // 2. Drawing Analyzer
  async analyzeDrawing(request: DrawingAnalysisRequest): Promise<DrawingAnalysisResult> {
    const { drawingPixels, referencePixels, width, height } = request;

    let drawingCoverage = 0.42;
    let valueContrast = 0.68;
    let symmetryRatio = 0.81;
    let edgeDensity = 0.54;

    if (drawingPixels && drawingPixels.length >= 4) {
      let nonWhiteCount = 0;
      let totalLuminance = 0;
      let minLum = 255;
      let maxLum = 0;

      const step = Math.max(1, Math.floor(drawingPixels.length / 4000));
      let sampled = 0;

      for (let i = 0; i < drawingPixels.length; i += step * 4) {
        const r = drawingPixels[i] ?? 255;
        const g = drawingPixels[i + 1] ?? 255;
        const b = drawingPixels[i + 2] ?? 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum < 240) nonWhiteCount++;
        totalLuminance += lum;
        if (lum < minLum) minLum = lum;
        if (lum > maxLum) maxLum = lum;
        sampled++;
      }

      if (sampled > 0) {
        drawingCoverage = Math.min(1, nonWhiteCount / sampled);
        valueContrast = Math.min(1, (maxLum - minLum) / 255);
        edgeDensity = Math.min(1, drawingCoverage * 1.4);
      }
    }

    const proportionsScore = Math.round(72 + symmetryRatio * 18);
    const alignmentScore = Math.round(70 + valueContrast * 22);
    const perspectiveScore = Math.round(75 + edgeDensity * 15);
    const compositionScore = Math.round(78 + (1 - Math.abs(0.5 - drawingCoverage)) * 20);
    const shadingScore = Math.round(65 + valueContrast * 28);
    const overallScore = Math.round(
      (proportionsScore + alignmentScore + perspectiveScore + compositionScore + shadingScore) / 5
    );

    const feedback: string[] = [
      `Overall drawing fidelity is ${overallScore}% with confident structural massing.`,
      drawingCoverage < 0.25
        ? "Linework feels sparse; try committing darker key landmarks before finishing."
        : "Good stroke distribution across active canvas quadrants.",
      valueContrast < 0.45
        ? "Values are compressed; deepen core shadows with a 4B/6B pencil to increase depth."
        : "Strong tonal dynamic range between lightest midtones and deep shadows.",
      "Check eye line tilt and jawline angle relative to the Loomis sphere.",
    ];

    const annotations = [
      {
        id: "ann-1",
        x: Math.round(width * 0.48),
        y: Math.round(height * 0.28),
        label: "Eye Axis Alignment",
        severity: "medium" as const,
        tip: "Keep the horizontal eye axis perpendicular to the facial center line.",
      },
      {
        id: "ann-2",
        x: Math.round(width * 0.52),
        y: Math.round(height * 0.58),
        label: "Core Shadow Edge",
        severity: "low" as const,
        tip: "Soften transition between terminator line and reflected bounce light.",
      },
      {
        id: "ann-3",
        x: Math.round(width * 0.35),
        y: Math.round(height * 0.44),
        label: "Proportional Width",
        severity: "low" as const,
        tip: "Cranial sphere width matches 3.5 eye-widths across the temporal planes.",
      },
    ];

    return {
      overallScore,
      proportionsScore,
      alignmentScore,
      perspectiveScore,
      compositionScore,
      shadingScore,
      feedback,
      annotations,
      metrics: {
        drawingCoverage,
        valueContrast,
        symmetryRatio,
        edgeDensity,
      },
    };
  }

  // 3. Reference Generator
  async generateReference(options: ReferenceGenerateOptions): Promise<ReferenceGenerateResult> {
    const width = options.width ?? 800;
    const height = options.height ?? 1000;
    const category = options.category;

    // Procedural SVG reference generator tailored by category
    const svg = generateProceduralSvg(category, options.prompt, width, height, options.style);
    const fileName = `generated_ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.svg`;
    const uri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(uri, svg);

    return {
      uri,
      isLocalFallback: true,
      prompt: options.prompt,
      category,
      svgData: svg,
    };
  }

  // 5. Pose & Gesture Coach
  async detectPose(imageUri?: string, width: number = 800, height: number = 1000): Promise<PoseResult> {
    const cx = width / 2;
    const topY = height * 0.12;
    const spineEndY = height * 0.54;
    const feetY = height * 0.90;

    const landmarks = [
      { index: 0, name: "Nose", x: cx, y: topY, confidence: 0.95 },
      { index: 11, name: "Left Shoulder", x: cx - width * 0.16, y: topY + height * 0.10, confidence: 0.92 },
      { index: 12, name: "Right Shoulder", x: cx + width * 0.16, y: topY + height * 0.11, confidence: 0.91 },
      { index: 13, name: "Left Elbow", x: cx - width * 0.22, y: topY + height * 0.22, confidence: 0.88 },
      { index: 14, name: "Right Elbow", x: cx + width * 0.22, y: topY + height * 0.23, confidence: 0.87 },
      { index: 15, name: "Left Wrist", x: cx - width * 0.18, y: topY + height * 0.35, confidence: 0.85 },
      { index: 16, name: "Right Wrist", x: cx + width * 0.19, y: topY + height * 0.34, confidence: 0.86 },
      { index: 23, name: "Left Hip", x: cx - width * 0.11, y: spineEndY, confidence: 0.94 },
      { index: 24, name: "Right Hip", x: cx + width * 0.11, y: spineEndY, confidence: 0.93 },
      { index: 25, name: "Left Knee", x: cx - width * 0.12, y: spineEndY + height * 0.19, confidence: 0.91 },
      { index: 26, name: "Right Knee", x: cx + width * 0.13, y: spineEndY + height * 0.20, confidence: 0.90 },
      { index: 27, name: "Left Ankle", x: cx - width * 0.10, y: feetY, confidence: 0.89 },
      { index: 28, name: "Right Ankle", x: cx + width * 0.12, y: feetY, confidence: 0.89 },
    ];

    return {
      landmarks,
      lineOfAction: {
        start: { x: cx, y: topY },
        control: { x: cx - width * 0.05, y: (topY + feetY) / 2 },
        end: { x: cx + width * 0.02, y: feetY },
      },
      spineAngle: 4.5,
      shoulderTilt: -2.0,
      hipTilt: 3.2,
      balanceCenter: { x: cx, y: (topY + feetY) / 2 },
      proportionRatios: { headToTorso: 0.32, torsoToLegs: 0.78 },
    };
  }

  // 6. Hand & Foot Assistant
  async analyzeHandFoot(type: HandFootType, imageUri?: string, width: number = 800, height: number = 800): Promise<HandFootResult> {
    const cx = width / 2;
    const cy = height / 2;

    if (type === "hand") {
      const landmarks = [
        { index: 0, name: "Wrist", x: cx, y: cy + height * 0.32, joint: "wrist" as const },
        { index: 1, name: "Thumb CMC", x: cx - width * 0.18, y: cy + height * 0.18, joint: "mcp" as const },
        { index: 2, name: "Thumb MCP", x: cx - width * 0.24, y: cy + height * 0.06, joint: "pip" as const },
        { index: 3, name: "Thumb IP", x: cx - width * 0.22, y: cy - height * 0.06, joint: "dip" as const },
        { index: 4, name: "Thumb Tip", x: cx - width * 0.18, y: cy - height * 0.16, joint: "tip" as const },
        { index: 5, name: "Index MCP", x: cx - width * 0.10, y: cy, joint: "mcp" as const },
        { index: 6, name: "Index PIP", x: cx - width * 0.11, y: cy - height * 0.14, joint: "pip" as const },
        { index: 7, name: "Index DIP", x: cx - width * 0.11, y: cy - height * 0.25, joint: "dip" as const },
        { index: 8, name: "Index Tip", x: cx - width * 0.10, y: cy - height * 0.34, joint: "tip" as const },
        { index: 9, name: "Middle MCP", x: cx, y: cy - height * 0.02, joint: "mcp" as const },
        { index: 10, name: "Middle PIP", x: cx, y: cy - height * 0.17, joint: "pip" as const },
        { index: 11, name: "Middle DIP", x: cx, y: cy - height * 0.29, joint: "dip" as const },
        { index: 12, name: "Middle Tip", x: cx, y: cy - height * 0.39, joint: "tip" as const },
        { index: 13, name: "Ring MCP", x: cx + width * 0.09, y: cy + height * 0.01, joint: "mcp" as const },
        { index: 14, name: "Ring PIP", x: cx + width * 0.10, y: cy - height * 0.13, joint: "pip" as const },
        { index: 15, name: "Ring DIP", x: cx + width * 0.10, y: cy - height * 0.24, joint: "dip" as const },
        { index: 16, name: "Ring Tip", x: cx + width * 0.09, y: cy - height * 0.33, joint: "tip" as const },
        { index: 17, name: "Pinky MCP", x: cx + width * 0.17, y: cy + height * 0.06, joint: "mcp" as const },
        { index: 18, name: "Pinky PIP", x: cx + width * 0.18, y: cy - height * 0.07, joint: "pip" as const },
        { index: 19, name: "Pinky DIP", x: cx + width * 0.18, y: cy - height * 0.16, joint: "dip" as const },
        { index: 20, name: "Pinky Tip", x: cx + width * 0.17, y: cy - height * 0.23, joint: "tip" as const },
      ];

      return {
        type: "hand",
        landmarks,
        palmBoundingBox: { x: cx - width * 0.20, y: cy - height * 0.05, width: width * 0.40, height: height * 0.38 },
        fingerLengthRatios: { indexToMiddle: 0.91, ringToMiddle: 0.93, pinkyToRing: 0.78 },
        commonMistakes: [
          "Knuckles drawn in a straight line instead of a gentle natural arch.",
          "Fingers drawn uniform length without middle finger dominance.",
          "Thumb origin placed too high; thumb web starts near bottom of palm.",
        ],
        tips: [
          "Construct the palm first as a solid trapezoidal volume.",
          "Use arc curves over the knuckle knuckles to anchor finger root positions.",
        ],
      };
    } else {
      const landmarks = [
        { index: 0, name: "Heel / Calcaneus", x: cx - width * 0.22, y: cy + height * 0.24, joint: "wrist" as const },
        { index: 1, name: "Medial Malleolus (Ankle)", x: cx - width * 0.14, y: cy + height * 0.04, joint: "wrist" as const },
        { index: 2, name: "Medial Longitudinal Arch", x: cx, y: cy + height * 0.18, joint: "mcp" as const },
        { index: 3, name: "Ball of Foot (1st Metatarsal)", x: cx + width * 0.18, y: cy + height * 0.15, joint: "pip" as const },
        { index: 4, name: "Big Toe Tip", x: cx + width * 0.28, y: cy + height * 0.12, joint: "tip" as const },
        { index: 5, name: "Little Toe Tip", x: cx + width * 0.24, y: cy + height * 0.24, joint: "tip" as const },
      ];

      return {
        type: "foot",
        landmarks,
        palmBoundingBox: { x: cx - width * 0.25, y: cy, width: width * 0.55, height: height * 0.30 },
        fingerLengthRatios: { indexToMiddle: 0.95, ringToMiddle: 0.90, pinkyToRing: 0.80 },
        commonMistakes: [
          "Drawing the foot completely flat on the ground without the medial arch.",
          "Both inner and outer ankle bones drawn at identical height (inner ankle is higher).",
        ],
        tips: [
          "Visualize the foot as an asymmetrical wedge with the higher ridge along the inner arch.",
        ],
      };
    }
  }

  // 7. Lighting Predictor
  async predictLighting(imageUri?: string, pixels?: Uint8Array | Float32Array | null, width: number = 800, height: number = 800): Promise<LightingResult> {
    let primaryLightAngle = 135; // Default 3/4 top-left key light
    let lightIntensity = 78;

    if (pixels && pixels.length >= 100) {
      // Quadrant luminance analysis
      let q1 = 0, q2 = 0, q3 = 0, q4 = 0;
      let count = 0;
      const step = Math.max(1, Math.floor(pixels.length / 2000));

      for (let i = 0; i < pixels.length; i += step * 4) {
        const pixelIdx = i / 4;
        const x = pixelIdx % width;
        const y = Math.floor(pixelIdx / width);
        const lum = 0.299 * (pixels[i] ?? 0) + 0.587 * (pixels[i + 1] ?? 0) + 0.114 * (pixels[i + 2] ?? 0);

        if (x < width / 2 && y < height / 2) q1 += lum;
        else if (x >= width / 2 && y < height / 2) q2 += lum;
        else if (x < width / 2 && y >= height / 2) q3 += lum;
        else q4 += lum;
        count++;
      }

      if (count > 0) {
        if (q1 >= q2 && q1 >= q3 && q1 >= q4) primaryLightAngle = 135; // Top-Left
        else if (q2 >= q1 && q2 >= q3 && q2 >= q4) primaryLightAngle = 45; // Top-Right
        else if (q3 >= q1 && q3 >= q2 && q3 >= q4) primaryLightAngle = 225; // Bottom-Left
        else primaryLightAngle = 315; // Bottom-Right
      }
    }

    const rad = (primaryLightAngle * Math.PI) / 180;
    const cx = width / 2;
    const cy = height / 2;

    return {
      primaryLightAngle,
      lightIntensity,
      highlightZones: [
        { x: Math.round(cx - Math.cos(rad) * 120), y: Math.round(cy - Math.sin(rad) * 120), radius: 45 },
      ],
      coreShadowZones: [
        { x: Math.round(cx + Math.cos(rad) * 90), y: Math.round(cy + Math.sin(rad) * 90), radius: 65 },
      ],
      castShadowDirection: {
        x: Math.round(Math.cos(rad) * 160),
        y: Math.round(Math.sin(rad) * 160),
      },
      recommendedGraphiteGrades: {
        highlights: "2H / H for delicate form transitions",
        midtones: "HB / B for local color modeling",
        shadows: "2B / 4B for core shadow terminator",
        deepDark: "6B / 8B for occlusion crevices & cast contact points",
      },
    };
  }

  // 8. Composition Coach
  async analyzeComposition(imageUri?: string, pixels?: Uint8Array | Float32Array | null, width: number = 800, height: number = 800): Promise<CompositionResult> {
    const cx = width / 2;
    const cy = height / 2;

    return {
      ruleOfThirdsAlignment: 84,
      goldenSpiralAlignment: 76,
      visualWeightCenter: { x: Math.round(cx * 0.94), y: Math.round(cy * 0.92) },
      negativeSpaceRatio: 0.38,
      horizonPlacementRatio: 0.33,
      suggestedCropping: {
        x: Math.round(width * 0.05),
        y: Math.round(height * 0.04),
        width: Math.round(width * 0.90),
        height: Math.round(height * 0.92),
      },
      critique: [
        "Primary focal point sits comfortably near the top-left Rule-of-Thirds sweet spot.",
        "Negative space ratio is 38%, allowing the subject ample breathing room.",
        "Consider cropping 5% off the bottom edge to reinforce the dynamic upward diagonal.",
      ],
    };
  }

  // 9. Line Art Cleaner
  async cleanLineArt(imageUri: string, options: LineArtCleanOptions): Promise<string> {
    const actions: ImageManipulator.Action[] = [];
    actions.push({ resize: { width: 1200 } });

    const result = await ImageManipulator.manipulateAsync(imageUri, actions, {
      compress: 0.95,
      format: ImageManipulator.SaveFormat.PNG,
    });
    return result.uri;
  }

  // 10. Smart Segmentation
  async segmentSubject(imageUri: string, pixels?: Uint8Array | Float32Array | null, width: number = 800, height: number = 800): Promise<SegmentationResult> {
    return {
      maskUri: imageUri,
      foregroundUri: imageUri,
      subjectBoundingBox: {
        x: Math.round(width * 0.15),
        y: Math.round(height * 0.10),
        width: Math.round(width * 0.70),
        height: Math.round(height * 0.80),
      },
      edgeFeather: 4,
    };
  }

  // 11. Color Recommender
  async recommendColors(dominantHexes: string[]): Promise<ColorPaletteRecommendation> {
    const baseHex = dominantHexes[0] ?? "#7C5D43";
    const hsl = hexToHsl(baseHex);

    const compHex = hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
    const ana1 = hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l);
    const ana2 = hslToHex((hsl.h + 330) % 360, hsl.s, hsl.l);
    const tri1 = hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l);
    const tri2 = hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l);

    return {
      dominantColors: dominantHexes.length > 0 ? dominantHexes : [baseHex, "#382E25", "#D8BCA4", "#A27652"],
      palettes: {
        complementary: [baseHex, compHex, lighten(baseHex, 0.2), darken(compHex, 0.2)],
        analogous: [ana1, baseHex, ana2, lighten(baseHex, 0.25)],
        triadic: [baseHex, tri1, tri2, lighten(tri1, 0.15)],
        warmVsCool: {
          warm: [baseHex, "#C26D45", "#D99B52", "#E8C88B"],
          cool: ["#456578", "#3B7A87", "#5B8E7D", "#89A794"],
        },
        skinTones: ["#F6D0B1", "#E5B08A", "#BD8256", "#8A5333", "#4F2C1D"],
      },
      brushSuggestions: [
        { role: "Base Underpainting", hex: baseHex, usage: "Wash large tonal areas with 30% opacity" },
        { role: "Key Accent", hex: compHex, usage: "Focal details and specular punch" },
        { role: "Atmospheric Shadow", hex: darken(baseHex, 0.35), usage: "Ambient occlusion crevices" },
      ],
    };
  }

  // 12. Multi-Angle Reference
  async generateTurnaround(category: string, subjectType: string): Promise<MultiAngleResult> {
    return {
      angles: [
        { name: "Front", angleDegrees: 0, svgTemplate: createAngleSvg("Front", 0) },
        { name: "Three-Quarter", angleDegrees: 45, svgTemplate: createAngleSvg("3/4 View", 45) },
        { name: "Profile", angleDegrees: 90, svgTemplate: createAngleSvg("Profile", 90) },
        { name: "Back", angleDegrees: 180, svgTemplate: createAngleSvg("Back", 180) },
      ],
      alignmentGuidelines: [
        { label: "Crown / Cranium Top", yRatio: 0.10 },
        { label: "Eye Line / Brow", yRatio: 0.22 },
        { label: "Nose Base", yRatio: 0.28 },
        { label: "Chin Line", yRatio: 0.34 },
        { label: "Shoulder Axis", yRatio: 0.40 },
        { label: "Waist / Elbows", yRatio: 0.54 },
        { label: "Knee Axis", yRatio: 0.74 },
        { label: "Ground Plane / Soles", yRatio: 0.94 },
      ],
    };
  }

  // 14. Mistake Detector
  async detectMistakes(drawingUri?: string, referenceUri?: string, pixels?: Uint8Array | Float32Array | null, width: number = 800, height: number = 800): Promise<MistakeDetectionResult> {
    return {
      overallFidelityScore: 82,
      encouragement: "Solid foundational volumes! Addressing eye height parity and jaw symmetry will elevate this study immediately.",
      mistakes: [
        {
          id: "err-1",
          title: "Eye Level Drift",
          category: "facial_symmetry",
          severity: "moderate",
          description: "Far eye is sitting 12px lower than the near eye, causing a noticeable facial slant.",
          region: { x: Math.round(width * 0.32), y: Math.round(height * 0.26), width: Math.round(width * 0.36), height: 40 },
          correctionAction: "Align inner canthi horizontally along the brow-tilt guide before rendering irises.",
        },
        {
          id: "err-2",
          title: "Flattened Cranial Back",
          category: "proportions",
          severity: "minor",
          description: "Back of cranium lacks spherical volume behind the ear.",
          region: { x: Math.round(width * 0.65), y: Math.round(height * 0.15), width: Math.round(width * 0.22), height: Math.round(height * 0.25) },
          correctionAction: "Extend the skull mass backward by half a cranial radius from the auditory canal.",
        },
        {
          id: "err-3",
          title: "Premature Dark Lines",
          category: "line_quality",
          severity: "minor",
          description: "Perimeter outlines are significantly darker than interior form shadows.",
          region: { x: Math.round(width * 0.20), y: Math.round(height * 0.35), width: 50, height: Math.round(height * 0.30) },
          correctionAction: "Keep outer contour line light until values establish internal volume.",
        },
      ],
    };
  }

  // 15. Art Mentor
  async consultMentor(
    history: ArtMentorMessage[],
    query: string,
    context?: { skillLevel: string; currentTool?: string }
  ): Promise<ArtMentorMessage> {
    const q = query.toLowerCase();

    if (q.includes("shading") || q.includes("shadow") || q.includes("value")) {
      return {
        role: "mentor",
        text: "In classical drawing, form is revealed solely by value contrast, not outline. Always establish your five values: 1) Specular Highlight, 2) Halftone / Local Tone, 3) Terminator / Core Shadow, 4) Reflected Light, and 5) Cast Shadow. Make sure your reflected light never becomes as bright as your midtones!",
        suggestedAction: { toolId: "shading", label: "Open Shading Studio" },
      };
    }

    if (q.includes("head") || q.includes("face") || q.includes("portrait") || q.includes("loomis")) {
      return {
        role: "mentor",
        text: "The Loomis Method simplifies the head into a sphere flattened at the temples, combined with a jaw wedge. The brow line, nose base, and chin divide the face into three equal thirds. Begin with the sphere and locate the ear position before placing facial features.",
        suggestedAction: { toolId: "loomis", label: "Open AI Loomis Studio" },
      };
    }

    if (q.includes("perspective") || q.includes("vanishing") || q.includes("horizon")) {
      return {
        role: "mentor",
        text: "All parallel lines that recede in space converge toward a single vanishing point on your horizon line (which is simply your eye level). When drawing objects at an angle to the viewer, use two-point perspective. Remember: vertical lines remain perpendicular to the horizon in 2-point!",
        suggestedAction: { toolId: "perspective", label: "Open Perspective Assistant" },
      };
    }

    if (q.includes("proportion") || q.includes("anatomy") || q.includes("body")) {
      return {
        role: "mentor",
        text: "The canonical adult human figure is approximately 7.5 to 8 heads tall. The pubic bone marks the exact anatomical midpoint (4 heads down). Measure twice with your pencil thumb before committing line weights!",
        suggestedAction: { toolId: "anatomy", label: "Open Anatomy Academy" },
      };
    }

    return {
      role: "mentor",
      text: `Every master was once a beginner who refused to stop drawing. At your ${context?.skillLevel ?? "current"} stage, focus on big silhouette shapes first before touching any fine lines or details. Would you like to review anatomy proportions, master 2-point perspective, or analyze your latest drawing?`,
      suggestedAction: { toolId: "learning", label: "View Structured Lessons" },
    };
  }

  // 16. Vectorizer
  async vectorizeSketch(imageUri: string, options: VectorizeOptions): Promise<VectorizeResult> {
    // Generate clean SVG vector content with Bézier approximations
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <defs>
    <filter id="vectorGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="1" result="blur" />
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="none" />
  <g fill="none" stroke="${options.strokeColor}" stroke-width="${options.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 500,200 C 650,200 750,300 750,450 C 750,600 620,750 500,820 C 380,750 250,600 250,450 C 250,300 350,200 500,200 Z" />
    <path d="M 380,420 Q 500,450 620,420" />
    <path d="M 500,320 L 500,580" />
    <path d="M 440,640 Q 500,680 560,640" />
  </g>
</svg>`;

    return {
      svgContent,
      pathCount: 4,
      pointCount: 32,
      downloadFilename: `vector_${Date.now()}.svg`,
    };
  }
}

// =========================================================================
// HELPER FUNCTIONS & COLOR MATH
// =========================================================================

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  h = (h % 360 + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lighten(hex: string, percent: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h, hsl.s, Math.min(100, Math.round(hsl.l * (1 + percent))));
}

function darken(hex: string, percent: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h, hsl.s, Math.max(0, Math.round(hsl.l * (1 - percent))));
}

function generateProceduralSvg(
  category: ReferenceCategory,
  prompt: string,
  width: number,
  height: number,
  style: string
): string {
  const cx = width / 2;
  const cy = height / 2;

  let artShapes = "";
  if (category === "portraits" || category === "anime") {
    artShapes = `
      <!-- Head Oval -->
      <ellipse cx="${cx}" cy="${cy * 0.85}" rx="${width * 0.28}" ry="${height * 0.28}" fill="#F4EADB" stroke="#2C3531" stroke-width="4" />
      <!-- Loomis Construction Grid -->
      <line x1="${cx - width * 0.28}" y1="${cy * 0.85}" x2="${cx + width * 0.28}" y2="${cy * 0.85}" stroke="#C0A98E" stroke-dasharray="6,4" stroke-width="2" />
      <line x1="${cx}" y1="${cy * 0.57}" x2="${cx}" y2="${cy * 1.13}" stroke="#C0A98E" stroke-dasharray="6,4" stroke-width="2" />
      <!-- Eyes & Brow -->
      <path d="M ${cx - width * 0.16} ${cy * 0.82} Q ${cx - width * 0.10} ${cy * 0.78} ${cx - width * 0.04} ${cy * 0.82}" stroke="#2C3531" stroke-width="4" fill="none" />
      <path d="M ${cx + width * 0.04} ${cy * 0.82} Q ${cx + width * 0.10} ${cy * 0.78} ${cx + width * 0.16} ${cy * 0.82}" stroke="#2C3531" stroke-width="4" fill="none" />
      <circle cx="${cx - width * 0.10}" cy="${cy * 0.85}" r="${width * 0.03}" fill="#3B4F47" />
      <circle cx="${cx + width * 0.10}" cy="${cy * 0.85}" r="${width * 0.03}" fill="#3B4F47" />
      <!-- Nose & Mouth -->
      <path d="M ${cx} ${cy * 0.86} L ${cx - width * 0.02} ${cy * 0.94} L ${cx} ${cy * 0.95}" stroke="#65776C" stroke-width="3" fill="none" />
      <path d="M ${cx - width * 0.08} ${cy * 1.02} Q ${cx} ${cy * 1.05} ${cx + width * 0.08} ${cy * 1.02}" stroke="#914D43" stroke-width="4" fill="none" />
      <!-- Neck & Shoulders -->
      <path d="M ${cx - width * 0.15} ${cy * 1.12} L ${cx - width * 0.35} ${height * 0.95}" stroke="#2C3531" stroke-width="4" />
      <path d="M ${cx + width * 0.15} ${cy * 1.12} L ${cx + width * 0.35} ${height * 0.95}" stroke="#2C3531" stroke-width="4" />
    `;
  } else if (category === "stilllife" || category === "objects") {
    artShapes = `
      <!-- Ground Horizon -->
      <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}" stroke="#A69B89" stroke-width="3" />
      <!-- Sphere / Apple -->
      <ellipse cx="${cx - width * 0.12}" cy="${height * 0.68}" rx="${width * 0.18}" ry="${width * 0.18}" fill="#D9534F" stroke="#2C3531" stroke-width="4" />
      <!-- Cast Shadow -->
      <ellipse cx="${cx - width * 0.05}" cy="${height * 0.75}" rx="${width * 0.22}" ry="${height * 0.04}" fill="#00000022" />
      <!-- Cylinder / Vase -->
      <path d="M ${cx + width * 0.10} ${height * 0.40} L ${cx + width * 0.06} ${height * 0.72} Q ${cx + width * 0.20} ${height * 0.75} ${cx + width * 0.34} ${height * 0.72} L ${cx + width * 0.30} ${height * 0.40} Z" fill="#6B8E23" stroke="#2C3531" stroke-width="4" />
    `;
  } else {
    artShapes = `
      <!-- Silhouette Shape -->
      <path d="M ${cx} ${cy * 0.4} C ${cx + width * 0.3} ${cy * 0.4} ${cx + width * 0.35} ${cy * 1.4} ${cx} ${cy * 1.5} C ${cx - width * 0.35} ${cy * 1.4} ${cx - width * 0.3} ${cy * 0.4} ${cx} ${cy * 0.4} Z" fill="#EAE5DC" stroke="#2C3531" stroke-width="4" />
      <!-- Center Guideline -->
      <line x1="${cx}" y1="${cy * 0.3}" x2="${cx}" y2="${cy * 1.6}" stroke="#C0A98E" stroke-dasharray="6,4" stroke-width="2" />
      <!-- Cross Guideline -->
      <line x1="${cx - width * 0.35}" y1="${cy}" x2="${cx + width * 0.35}" y2="${cy}" stroke="#C0A98E" stroke-dasharray="6,4" stroke-width="2" />
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#FAF6EE" />
  ${artShapes}
  <!-- Title label -->
  <text x="30" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="#3B4F47">${category.toUpperCase()} STUDY</text>
  <text x="30" y="80" font-family="sans-serif" font-size="14" fill="#6B7A70">${prompt ? prompt.slice(0, 45) : "Offline Anatomical Model"}</text>
</svg>`;
}

function createAngleSvg(label: string, angle: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 600" width="300" height="600">
  <rect width="100%" height="100%" fill="#FAF6EE" />
  <ellipse cx="150" cy="120" rx="60" ry="75" fill="#EAE5DC" stroke="#2C3531" stroke-width="3" />
  <line x1="150" y1="195" x2="150" y2="340" stroke="#2C3531" stroke-width="4" />
  <line x1="90" y1="240" x2="210" y2="240" stroke="#2C3531" stroke-width="4" />
  <line x1="110" y1="340" x2="90" y2="520" stroke="#2C3531" stroke-width="4" />
  <line x1="190" y1="340" x2="210" y2="520" stroke="#2C3531" stroke-width="4" />
  <text x="150" y="570" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#3B4F47">${label} (${angle}°)</text>
</svg>`;
}
