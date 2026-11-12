/**
 * ARTISTRY AI — AI Drawing Assistant & Reference Analysis Engine
 * Analyzes reference images for composition, geometric construction,
 * proportion landmarks, and directional lighting, and provides contextual
 * drawing coaching for physical traditional drawing.
 */

import type {
  CoachQuestionAnswer,
  CompositionAnalysis,
  ConstructionAnalysis,
  DrawingMethodType,
  LightingAnalysis,
  RecommendedMethod,
  ReferenceAnalysisResult,
  SubjectCategory,
} from "./types";
import { generateDrawingSequence } from "./DrawingSequenceGenerator";
import { getRemoteAIConsent } from "./ConsentManager";
import { aiService } from "../../services/ai/AIServiceManager";

export interface AnalyzeOptions {
  allowCloud?: boolean;
  projectId?: string;
  pixels?: Uint8Array | Float32Array | null;
  width?: number;
  height?: number;
  categoryHint?: SubjectCategory;
}

export class AIDrawingAssistantEngine {
  /**
   * Analyzes a reference image. Enforces privacy-first explicit consent
   * before remote processing and falls back gracefully to offline heuristics.
   */
  static async analyzeReference(
    imageUri: string,
    options: AnalyzeOptions = {}
  ): Promise<ReferenceAnalysisResult> {
    if (!imageUri || typeof imageUri !== "string" || imageUri.trim().length === 0) {
      throw new Error("Invalid reference image: URI must be a non-empty string.");
    }

    const { allowCloud = false, width = 800, height = 1000, categoryHint } = options;
    const now = Date.now();
    const analysisId = `ref-an-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    // Verify explicit consent for remote cloud processing
    let runCloud = false;
    if (allowCloud) {
      const hasConsented = await getRemoteAIConsent();
      if (hasConsented) {
        const status = await aiService.getStatus();
        runCloud = status.isCloudAvailable;
      }
    }

    if (runCloud) {
      try {
        return await this.performCloudAnalysis(analysisId, imageUri, width, height, categoryHint);
      } catch {
        // Safe and transparent fallback to local on-device analysis
      }
    }

    return this.performLocalAnalysis(analysisId, imageUri, width, height, categoryHint);
  }

  /**
   * Offline on-device reference analysis using algorithmic heuristics
   * and classical traditional art principles.
   */
  static performLocalAnalysis(
    analysisId: string,
    imageUri: string,
    width: number,
    height: number,
    categoryHint?: SubjectCategory
  ): ReferenceAnalysisResult {
    const aspectRatio = width / Math.max(1, height);

    // Infer subject category based on aspect ratio and hints
    let category: SubjectCategory = categoryHint ?? "still_life";
    if (!categoryHint) {
      if (aspectRatio < 0.85) {
        category = "portrait";
      } else if (aspectRatio >= 0.85 && aspectRatio <= 1.25) {
        category = "still_life";
      } else {
        category = "landscape";
      }
    }

    // A. Composition Analysis
    const composition: CompositionAnalysis = this.analyzeLocalComposition(category, aspectRatio);

    // B. Construction & Proportions Analysis
    const construction: ConstructionAnalysis = this.analyzeLocalConstruction(category, aspectRatio);

    // C. Lighting & Values Analysis
    const lighting: LightingAnalysis = this.analyzeLocalLighting(category);

    // D. Recommended Methods
    const recommendedMethods = this.determineRecommendedMethods(category);

    // E. Physical Drawing Sequence
    const methodTypes = recommendedMethods.map((m) => m.method);
    const drawingSequence = generateDrawingSequence(
      category,
      composition,
      construction,
      lighting,
      methodTypes
    );

    return {
      id: analysisId,
      imageUri,
      timestamp: Date.now(),
      composition,
      construction,
      lighting,
      recommendedMethods,
      drawingSequence,
      isLocalFallback: true,
    };
  }

  /**
   * Remote cloud analysis using backend endpoints when consent is granted.
   */
  private static async performCloudAnalysis(
    analysisId: string,
    imageUri: string,
    width: number,
    height: number,
    categoryHint?: SubjectCategory
  ): Promise<ReferenceAnalysisResult> {
    const compResult = await aiService.analyzeComposition(imageUri, undefined, width, height);
    const lightResult = await aiService.predictLighting(imageUri, undefined, width, height);

    const aspectRatio = width / Math.max(1, height);
    const category: SubjectCategory = categoryHint ?? (aspectRatio < 0.85 ? "portrait" : "still_life");

    const placementDesc =
      compResult.ruleOfThirdsAlignment > 70
        ? "Aligned with Rule of Thirds grid"
        : `Weight centered at (${Math.round(compResult.visualWeightCenter.x * 100)}%, ${Math.round(compResult.visualWeightCenter.y * 100)}%)`;

    const composition: CompositionAnalysis = {
      mainSubject: compResult.critique[0] ?? "Primary Focal Mass",
      category,
      subjectPlacement: placementDesc,
      majorShapes: [
        `Visual weight center (${(compResult.visualWeightCenter.x * 100).toFixed(0)}%, ${(compResult.visualWeightCenter.y * 100).toFixed(0)}%)`,
        `Negative space ratio ~${(compResult.negativeSpaceRatio * 100).toFixed(0)}%`,
      ],
      overallComposition:
        compResult.critique.join(" ") || "Harmonious compositional balance with directional focus.",
      aspectRatioEstimate: aspectRatio,
    };

    const construction = this.analyzeLocalConstruction(category, aspectRatio);

    const lightAngle = lightResult.primaryLightAngle;
    const lightDirDesc =
      lightAngle >= 315 || lightAngle < 45
        ? "Right-side directional light"
        : lightAngle >= 45 && lightAngle < 135
        ? "Top-down directional light"
        : lightAngle >= 135 && lightAngle < 225
        ? "Left-side directional light"
        : "Bottom-up low-angle lighting";

    const lighting: LightingAnalysis = {
      lightSourceDirection: `${lightDirDesc} (~${lightAngle}°)`,
      highlightRegions:
        lightResult.highlightZones.length > 0
          ? lightResult.highlightZones.map((z, i) => `Highlight Zone ${i + 1} (${z.x.toFixed(0)}, ${z.y.toFixed(0)})`)
          : ["Primary specular crest"],
      midtones: [
        `Halftone modeling range (${lightResult.recommendedGraphiteGrades.midtones})`,
      ],
      coreShadows:
        lightResult.coreShadowZones.length > 0
          ? lightResult.coreShadowZones.map((z, i) => `Core Shadow Zone ${i + 1} (${z.x.toFixed(0)}, ${z.y.toFixed(0)})`)
          : ["Terminator core shadow"],
      castShadows: [
        `Cast shadow vector [dx: ${lightResult.castShadowDirection.x.toFixed(2)}, dy: ${lightResult.castShadowDirection.y.toFixed(2)}]`,
      ],
      recommendedTonalSteps: 5,
    };

    const recommendedMethods = this.determineRecommendedMethods(category);
    const methodTypes = recommendedMethods.map((m) => m.method);
    const drawingSequence = generateDrawingSequence(
      category,
      composition,
      construction,
      lighting,
      methodTypes
    );

    return {
      id: analysisId,
      imageUri,
      timestamp: Date.now(),
      composition,
      construction,
      lighting,
      recommendedMethods,
      drawingSequence,
      isLocalFallback: false,
    };
  }

  private static analyzeLocalComposition(
    category: SubjectCategory,
    aspectRatio: number
  ): CompositionAnalysis {
    switch (category) {
      case "portrait":
        return {
          mainSubject: "Human Head & Facial Feature Complex",
          category: "portrait",
          subjectPlacement: "Upper-central dominant with vertical symmetry",
          majorShapes: ["Cranial sphere", "Triangular nose wedge", "Mandibular jaw block"],
          overallComposition: "Pyramidal balance anchored by neck and shoulders below.",
          aspectRatioEstimate: aspectRatio,
        };
      case "figure":
        return {
          mainSubject: "Full Human Figure in Gravitational Balance",
          category: "figure",
          subjectPlacement: "Vertical column centered along line of gravity",
          majorShapes: ["Ribcage egg mass", "Pelvic bowl wedge", "Limb cylindrical columns"],
          overallComposition: "Dynamic contrapposto with opposing shoulder and pelvic tilts.",
          aspectRatioEstimate: aspectRatio,
        };
      case "still_life":
      default:
        return {
          mainSubject: "Arranged Physical Still Life Grouping",
          category: "still_life",
          subjectPlacement: "Ground plane supported with staggered depth overlap",
          majorShapes: ["Elliptical cylinders", "Spherical volumes", "Rectangular bounding boxes"],
          overallComposition: "Stable horizontal grounding with overlapping foreground and background silhouettes.",
          aspectRatioEstimate: aspectRatio,
        };
    }
  }

  private static analyzeLocalConstruction(
    category: SubjectCategory,
    aspectRatio: number
  ): ConstructionAnalysis {
    const disclaimer = "Approximate visual estimates; verify key points with physical sighting on your drawing paper.";

    switch (category) {
      case "portrait":
        return {
          basicGeometricConstruction: [
            "Primary cranial sphere (solid skull mass)",
            "Flat side temporal plane ellipse (approx 2/3 sphere height)",
            "Dropping jaw wedge from ear landmark to chin apex",
          ],
          proportionRelationships: [
            "Total width is approx ~0.72x to 0.78x total height",
            "Brow line sits at approximately 1/2 of full head height",
            "Face divides into equal vertical thirds: hairline, brow, nose base, chin",
          ],
          mainAxesAndAlignment: [
            "Primary vertical facial centerline (slight tilt ~5°)",
            "Transverse brow axis perpendicular to facial centerline",
            "Mouth cleft aligned with bottom third division",
          ],
          approximateLandmarks: [
            "Glabella center point (between brows)",
            "Ear root crosshair (temporal plane disc)",
            "Mental protuberance (chin apex)",
          ],
          perspectiveDirection: "Slight three-quarter turn with subtle downward perspective eye level.",
          calibrationNote: disclaimer,
        };
      case "figure":
        return {
          basicGeometricConstruction: [
            "Torso bean uniting ribcage egg and pelvic basin",
            "Cylindrical upper and lower limb segments",
            "Joint spheres anchoring knees, elbows, and ankles",
          ],
          proportionRelationships: [
            "Full height conforms to classical 7.5 to 8-head height cannon",
            "Pubic arch marks the halfway midpoint (4 heads)",
            "Elbows align horizontally with navel and lowest rib landmark",
          ],
          mainAxesAndAlignment: [
            "Sweeping spinal line of action",
            "Shoulder tilt opposing weight-bearing pelvic tilt (contrapposto)",
            "Gravitational plumb line from jugular notch through supporting ankle",
          ],
          approximateLandmarks: [
            "Pit of the neck (suprasternal notch)",
            "Anterior superior iliac spines (pelvic points)",
            "Patella landmarks (kneecaps)",
          ],
          perspectiveDirection: "Eye level positioned near waist height; limbs foreshortened in ground perspective.",
          calibrationNote: disclaimer,
        };
      case "still_life":
      default:
        return {
          basicGeometricConstruction: [
            "Rectangular ground envelope bounding box",
            "Intersecting volumetric prisms and cylinders",
            "Circular/elliptical contact base planes",
          ],
          proportionRelationships: [
            `Overall grouping width-to-height ratio is ~${aspectRatio.toFixed(2)}:1`,
            "Primary foreground subject occupies approx 40% of horizontal field",
          ],
          mainAxesAndAlignment: [
            "Horizontal tabletop horizon line",
            "Strictly vertical plumb edges at 90° to ground plane",
            "Orthogonal convergence to left and right vanishing points",
          ],
          approximateLandmarks: [
            "Ground contact plane seam",
            "Highest vertical rim apex",
            "Leftmost and rightmost silhouette tangents",
          ],
          perspectiveDirection: "Two-point linear perspective with eye level situated above objects looking down.",
          calibrationNote: disclaimer,
        };
    }
  }

  private static analyzeLocalLighting(category: SubjectCategory): LightingAnalysis {
    return {
      lightSourceDirection: "Directional light source from upper-left at approximately 45° angle",
      highlightRegions: [
        "Upper-left curved surface crest",
        "Apex of primary volumetric form",
      ],
      midtones: [
        "Gradual halftone band wrapping around curved planes",
        "Form transitions perpendicular to light rays",
      ],
      coreShadows: [
        "Crisp terminator line running along form boundary",
        "Underside planes facing away from illumination",
      ],
      castShadows: [
        "Distinct elliptical cast shadow projected to bottom-right",
        "Dark ambient occlusion shadow directly beneath contact point",
      ],
      recommendedTonalSteps: 5,
    };
  }

  private static determineRecommendedMethods(category: SubjectCategory): RecommendedMethod[] {
    const methods: RecommendedMethod[] = [];

    if (category === "portrait") {
      methods.push({
        method: "loomis",
        title: "Andrew Loomis Ball-and-Plane Method",
        rationale: "Ideal for constructing the head, establishing skull tilt, and dividing facial thirds.",
        overlayId: "loomis",
      });
      methods.push({
        method: "shading",
        title: "5-Step Value Modeling",
        rationale: "Organizes complex facial planes into clean light vs shadow value masses.",
        overlayId: "shading",
      });
      methods.push({
        method: "grid",
        title: "Paper Grid Overlay",
        rationale: "Ensures exact feature spacing and proportional transfer onto physical paper.",
        overlayId: "grid",
      });
    } else if (category === "figure") {
      methods.push({
        method: "anatomy",
        title: "Figure Proportion & Massing",
        rationale: "Aligns the 8-head proportional cannon and dynamic contrapposto posture.",
        overlayId: "proportions",
      });
      methods.push({
        method: "bargue",
        title: "Charles Bargue Contour & Sight-Size",
        rationale: "Expresses muscular rhythm and overlapping anatomical contours.",
        overlayId: "contour",
      });
      methods.push({
        method: "shading",
        title: "Core Shadow Mapping",
        rationale: "Defines torso and limb muscle volumes by grouping shadow shapes.",
        overlayId: "shading",
      });
    } else {
      methods.push({
        method: "perspective",
        title: "Two-Point Linear Perspective",
        rationale: "Constructs boxes and cylinders with vanishing points anchored to eye level.",
        overlayId: "perspective",
      });
      methods.push({
        method: "grid",
        title: "Smart Grid Spacing",
        rationale: "Provides millimeter-accurate reference transfer for still life and architecture.",
        overlayId: "grid",
      });
      methods.push({
        method: "shading",
        title: "Form Shading & Cast Shadows",
        rationale: "Separates highlights, form terminators, and ground cast shadows.",
        overlayId: "shading",
      });
    }

    return methods;
  }

  /**
   * Contextual Drawing Coach responding to artist queries on the reference.
   */
  static askDrawingCoach(
    analysis: ReferenceAnalysisResult,
    question: string
  ): CoachQuestionAnswer {
    const q = question.toLowerCase();

    if (q.includes("start") || q.includes("begin") || q.includes("first step")) {
      const step1 = analysis.drawingSequence[0];
      return {
        question,
        answer: `Start on your physical paper by sketching the outer bounding envelope with a light 2H pencil. ${step1?.action ?? "Observe the overall height and width ratio before drawing internal features."}`,
        suggestedOverlay: analysis.recommendedMethods[0]?.overlayId,
      };
    }

    if (q.includes("centerline") || q.includes("axis") || q.includes("center")) {
      const axis = analysis.construction.mainAxesAndAlignment[0] ?? "Vertical centerline";
      return {
        question,
        answer: `Establish the ${axis}. On physical paper, keep this line light and continuous from top to bottom; all facial features and bilateral proportions will align symmetrically to this guide.`,
        suggestedOverlay: "loomis",
      };
    }

    if (q.includes("loomis") || q.includes("head") || q.includes("face")) {
      return {
        question,
        answer: "Construct the cranial ball first, then cut off the flat temporal side plane (measuring 2/3 the ball height). Use the brow line equator to establish the head tilt before dropping the jawline.",
        suggestedOverlay: "loomis",
      };
    }

    if (q.includes("light") || q.includes("shadow") || q.includes("shade") || q.includes("terminator")) {
      return {
        question,
        answer: `The primary illumination is ${analysis.lighting.lightSourceDirection}. Squint at your reference and map the terminator line separating light from shadow first before adding any midtones.`,
        suggestedOverlay: "shading",
      };
    }

    if (q.includes("grid") || q.includes("spacing") || q.includes("scale")) {
      return {
        question,
        answer: "For an A4 physical paper sheet, a 20 mm (2 cm) grid spacing provides the optimal balance between landmark precision and clean paper visibility. Use 2H pencil with light pressure for easy erasure.",
        suggestedOverlay: "grid",
      };
    }

    if (q.includes("angle") || q.includes("measure") || q.includes("proportion")) {
      return {
        question,
        answer: `Extend your arm straight with locked elbow and use the tip of your pencil to measure a base unit. Note: ${analysis.construction.calibrationNote}`,
        suggestedOverlay: "proportions",
      };
    }

    if (q.includes("pencil") || q.includes("eraser") || q.includes("material")) {
      return {
        question,
        answer: "Use 2H or H for light construction wireframes and centerline guides, HB for refined contours and feature placement, and 2B/4B for deep core shadows and occlusion accents. Keep a kneaded eraser for lifting highlights.",
      };
    }

    // Default friendly coach advice
    return {
      question,
      answer: `For this ${analysis.composition.category} study, focus on establishing major geometric volumes before rendering surface details. Remember to keep construction lines whisper-light with 2H graphite and step back frequently to check proportions.`,
      suggestedOverlay: analysis.recommendedMethods[0]?.overlayId,
    };
  }
}
