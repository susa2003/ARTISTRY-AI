/**
 * ARTISTRY AI — Traditional Drawing Sequence Generator
 * Transforms reference analysis into step-by-step physical drawing sequences.
 * Tailors instructions to the subject category and recommended overlay tools.
 */

import type {
  CompositionAnalysis,
  ConstructionAnalysis,
  DrawingMethodType,
  DrawingSequenceStep,
  LightingAnalysis,
  SubjectCategory,
} from "./types";

export function generateDrawingSequence(
  category: SubjectCategory,
  composition: CompositionAnalysis,
  construction: ConstructionAnalysis,
  lighting: LightingAnalysis,
  recommendedMethods: DrawingMethodType[]
): DrawingSequenceStep[] {
  switch (category) {
    case "portrait":
      return [
        {
          stepNumber: 1,
          title: "Visual Observation & Outer Envelope",
          action: `Examine the head boundary (${composition.subjectPlacement}). Observe overall height-to-width ratio (~${composition.aspectRatioEstimate.toFixed(2)}:1). Lightly block in the outer bounding rectangle.`,
          physicalPaperGuidance: "Rest your drawing board at a 30° angle. Use whole-arm strokes without resting wrist on the paper.",
          recommendedPencilGrade: "2H",
          companionTool: "measurement",
        },
        {
          stepNumber: 2,
          title: "Cranial Ball & Temporal Planes",
          action: "Draw the cranial sphere representing the solid skull mass. Cut off the side plane with an ellipse to establish the temporal bone flat planes.",
          physicalPaperGuidance: "Ghost the circular curve in the air twice before touching down. Keep lines whisper-light so they erase cleanly.",
          recommendedPencilGrade: "2H",
          companionTool: "loomis",
        },
        {
          stepNumber: 3,
          title: "Brow Line Equator & Facial Centerline",
          action: `Establish the central facial axis (${construction.mainAxesAndAlignment[0] ?? "Vertical centerline"}). Curve the brow line equator across the cranium sphere according to head tilt.`,
          physicalPaperGuidance: "Ensure the ear crosshair landmark is marked at the center of the side temporal disc.",
          recommendedPencilGrade: "2H",
          companionTool: "loomis",
        },
        {
          stepNumber: 4,
          title: "Rule of Thirds & Jaw Construction",
          action: "Measure the three equal vertical facial thirds: hairline to brow, brow to nose base, and nose to chin point. Drop the angled jawline from the ear intersection to the chin.",
          physicalPaperGuidance: "Use your pencil as a comparative sighting gauge with outstretched locked arm to verify the three intervals.",
          recommendedPencilGrade: "H",
          companionTool: "measurement",
        },
        {
          stepNumber: 5,
          title: "Eye Sockets, Nose Box & Lip Planes",
          action: "Carve out the orbital eye sockets beneath the brow ridge. Block in the nose as a 3D tapering prism and establish the central mouth cleft.",
          physicalPaperGuidance: "Do not draw eyelashes or iris detail yet; focus on the planar masses and eye-to-eye spacing (one eye-width apart).",
          recommendedPencilGrade: "HB",
          companionTool: "loomis",
        },
        {
          stepNumber: 6,
          title: "Terminator Line & Shadow Separation",
          action: `Identify the main light direction (${lighting.lightSourceDirection}). Map the sharp terminator boundary separating the lit side of the face from shadow areas.`,
          physicalPaperGuidance: "Squint through your eyelashes at your reference to blur details and spot the big shape of the shadow pattern.",
          recommendedPencilGrade: "HB",
          companionTool: "shading",
        },
        {
          stepNumber: 7,
          title: "Unified Form Shadow Tone",
          action: `Fill all core shadow zones (${lighting.coreShadows.slice(0, 2).join(", ")}) and cast shadows with an even, unbroken tone.`,
          physicalPaperGuidance: "Hatch in parallel diagonal strokes with a flat lead bevel. Do not blend or smudge with fingers.",
          recommendedPencilGrade: "2B",
          companionTool: "shading",
        },
        {
          stepNumber: 8,
          title: "Midtones, Occlusion Accents & Highlights",
          action: `Model subtle halftones inside the light mass. Accent dark occlusion crevices (${lighting.castShadows[0] ?? "under chin"}) and lift bright highlights (${lighting.highlightRegions[0] ?? "forehead"}) with a kneaded eraser.`,
          physicalPaperGuidance: "Rest your hand on a clean slip-sheet of paper to prevent dragging graphite across finished light tones.",
          recommendedPencilGrade: "4B",
          companionTool: "shading",
        },
      ];

    case "figure":
      return [
        {
          stepNumber: 1,
          title: "60-Second Dynamic Line of Action",
          action: "Capture the sweeping gravitational curve from the base of the skull down through the spine and primary weight-bearing foot.",
          physicalPaperGuidance: "Hold your pencil with an overhand grip. Sweep with broad shoulder motion in a continuous fluid stroke.",
          recommendedPencilGrade: "2H",
          companionTool: "measurement",
        },
        {
          stepNumber: 2,
          title: "8-Head Proportional Height Division",
          action: "Mark 8 equal vertical divisions. Anchor the pubic arch at the 4-head halfway mark, and kneecaps at unit 6.",
          physicalPaperGuidance: "Use a scrap paper tick-strip to verify all 8 units are identical before drawing anatomical volumes.",
          recommendedPencilGrade: "2H",
          companionTool: "grid",
        },
        {
          stepNumber: 3,
          title: "Contrapposto Torso Tilt & Volumes",
          action: "Note the opposing angles between shoulder girdle and pelvic bowl. Construct the ribcage egg and pelvic basin with interlocking centerlines.",
          physicalPaperGuidance: "Draw the pinch on the weight-bearing side with sharp curves, and the stretched flank with an elongated curve.",
          recommendedPencilGrade: "H",
          companionTool: "anatomy",
        },
        {
          stepNumber: 4,
          title: "Limb Cylinders & Joint Nesting",
          action: "Wrap tapering volumetric cylinders around limb axes. Ensure joints interlock with high outer curves opposing low inner curves.",
          physicalPaperGuidance: "Draw through hidden lines to confirm limbs connect solidly into the pelvic and shoulder sockets.",
          recommendedPencilGrade: "HB",
          companionTool: "anatomy",
        },
        {
          stepNumber: 5,
          title: "Contour Hierarchy & Overlap",
          action: "Refine anatomical silhouettes. Darken contours where foreground masses overlap background forms (thigh overlapping knee).",
          physicalPaperGuidance: "Vary line weight: thicker at contact points and crevices, delicate on top-lit surfaces.",
          recommendedPencilGrade: "2B",
          companionTool: "bargue",
        },
        {
          stepNumber: 6,
          title: "Tonal Massing & Directional Lighting",
          action: `Establish the terminator along the body's major muscle planes following the light direction (${lighting.lightSourceDirection}). Shade shadow masses uniformly.`,
          physicalPaperGuidance: "Keep shadows unified and dark; avoid overworking internal highlights inside the shadow side.",
          recommendedPencilGrade: "4B",
          companionTool: "shading",
        },
      ];

    case "still_life":
    case "architecture":
    default:
      return [
        {
          stepNumber: 1,
          title: "Bounding Envelope & Benchmark Unit",
          action: `Observe the overall composition (${composition.subjectPlacement}). Establish a base measuring unit and mark the outer envelope bounding box.`,
          physicalPaperGuidance: "Extend arm fully with locked elbow when sighting. Transfer relative proportional units with tick marks.",
          recommendedPencilGrade: "2H",
          companionTool: "measurement",
        },
        {
          stepNumber: 2,
          title: "Horizon Line & Vanishing Points",
          action: `Locate eye level (horizon). Trace converging edges (${construction.perspectiveDirection ?? "Linear perspective convergence"}) toward left and right vanishing points.`,
          physicalPaperGuidance: "Use a long plastic ruler to verify that receding parallel lines converge toward common points on the horizon.",
          recommendedPencilGrade: "2H",
          companionTool: "perspective",
        },
        {
          stepNumber: 3,
          title: "Geometric Wireframe Construction",
          action: `Construct forms using basic 3D volumes (${construction.basicGeometricConstruction.slice(0, 2).join(", ")}). Draw through all transparent hidden edges.`,
          physicalPaperGuidance: "Keep wireframe lines light and crisp. Ensure ellipses align perpendicular to their cylinder core axes.",
          recommendedPencilGrade: "H",
          companionTool: "perspective",
        },
        {
          stepNumber: 4,
          title: "Plumb Lines & Negative Space Check",
          action: "Drop vertical plumb lines through key landmarks. Compare the negative shapes formed between objects to verify spacing.",
          physicalPaperGuidance: "Hold your pencil vertically against the reference and check which corners align with the plumb line.",
          recommendedPencilGrade: "HB",
          companionTool: "grid",
        },
        {
          stepNumber: 5,
          title: "Terminator & Cast Shadow Mapping",
          action: `Trace the core shadow terminator and project cast shadow boundaries (${lighting.castShadows[0] ?? "onto ground plane"}) based on the light source (${lighting.lightSourceDirection}).`,
          physicalPaperGuidance: "Ensure cast shadows are sharpest nearest to the contact point and softer further away.",
          recommendedPencilGrade: "2B",
          companionTool: "shading",
        },
        {
          stepNumber: 6,
          title: "5-Step Value Modeling & Final Accents",
          action: "Shade from darkest darks to lightest midtones. Add deep ambient occlusion at contact points and lift specular highlights.",
          physicalPaperGuidance: "Keep Box 1 white paper untouched for the brightest specular highlights.",
          recommendedPencilGrade: "4B",
          companionTool: "shading",
        },
      ];
  }
}
