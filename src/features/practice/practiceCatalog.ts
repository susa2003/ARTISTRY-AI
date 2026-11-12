/**
 * ARTISTRY AI — Traditional Drawing Practice Catalog
 * 24 Structured practical exercises across 8 classical skill categories
 * and 3 difficulty tiers (Beginner, Intermediate, Advanced).
 */

import type {
  PracticeCategory,
  PracticeDifficulty,
  PracticeExercise,
} from "./types";

export interface CategoryMetadata {
  id: PracticeCategory;
  title: string;
  shortTitle: string;
  icon: string;
  description: string;
  recommendedOverlay: "grid" | "loomis" | "perspective" | "contour" | "shading" | "proportions";
}

export const PRACTICE_CATEGORIES: CategoryMetadata[] = [
  {
    id: "basic_shapes",
    title: "Basic Shapes & Volume",
    shortTitle: "Shapes",
    icon: "📐",
    description: "Master spheres, cubes, cylinders, and cross-contour volumetric lines.",
    recommendedOverlay: "perspective",
  },
  {
    id: "proportion",
    title: "Proportion & Sighting",
    shortTitle: "Proportion",
    icon: "📏",
    description: "Learn unit-measuring, plumb lines, comparative angles, and negative space.",
    recommendedOverlay: "proportions",
  },
  {
    id: "gesture",
    title: "Gesture & Line of Action",
    shortTitle: "Gesture",
    icon: "⚡",
    description: "Capture fluid movement, anatomical rhythm, and energy in quick timed studies.",
    recommendedOverlay: "proportions",
  },
  {
    id: "facial_construction",
    title: "Facial Construction & Loomis",
    shortTitle: "Faces",
    icon: "👤",
    description: "Build cranium spheres, brow axis lines, jaw planes, and facial features.",
    recommendedOverlay: "loomis",
  },
  {
    id: "anatomy",
    title: "Figure & Anatomical Masses",
    shortTitle: "Anatomy",
    icon: "🦴",
    description: "Construct ribcage eggs, pelvic bowls, joint landmarks, and muscular rhythms.",
    recommendedOverlay: "proportions",
  },
  {
    id: "perspective",
    title: "Linear Perspective & Form",
    shortTitle: "Perspective",
    icon: "🏢",
    description: "Master horizon lines, 1-point and 2-point vanishing convergences in physical space.",
    recommendedOverlay: "perspective",
  },
  {
    id: "light_shadow",
    title: "Light, Shadow & Value Masses",
    shortTitle: "Shading",
    icon: "🌓",
    description: "Establish form terminators, core shadows, cast shadows, and clean value steps.",
    recommendedOverlay: "shading",
  },
  {
    id: "contour",
    title: "Contour & Cross-Contour",
    shortTitle: "Contour",
    icon: "✍️",
    description: "Pure blind contour, modified contour, and surface cross-sectional wrapping lines.",
    recommendedOverlay: "contour",
  },
];

export const PRACTICE_EXERCISES: PracticeExercise[] = [
  // =========================================================================
  // 1. BASIC SHAPES (3 exercises)
  // =========================================================================
  {
    id: "ex-shapes-01",
    title: "Confident Freehand Spheres & Ellipses",
    category: "basic_shapes",
    difficulty: "beginner",
    estimatedDurationMinutes: 10,
    objective: "Draw clean, symmetrical circles and ellipses without hairy lines using whole-arm motion.",
    requiredMaterials: ["HB Graphite pencil", "A4 Sketchbook or loose drawing paper", "Kneaded eraser"],
    instructions: [
      "Ghost the circular stroke in the air 3 to 4 times above your paper before touching the graphite down.",
      "Draw 6 large circles (8 cm diameter) using continuous, fluid shoulder movements.",
      "Inside each circle, draw horizontal and vertical cross-contour ellipses to turn the circle into a 3D sphere.",
      "Vary the tilt angle of the ellipses to represent the sphere viewed from above and below.",
    ],
    recommendedOverlay: "perspective",
    completionCriteria: "Complete 6 distinct spheres with believable elliptical surface curvature and no wrist-cramping.",
    physicalPaperGuidance: "Position paper at a 30° angle on an easel or drafting board so your shoulder can swing freely without forearm friction.",
    selfAssessmentChecklist: [
      "Did I draw from the shoulder rather than the wrist?",
      "Are the outer contours smooth without hesitant breaks?",
      "Do the internal ellipses touch the equator boundary symmetrically?",
    ],
  },
  {
    id: "ex-shapes-02",
    title: "Stacked Prisms & Intersecting Cylinders",
    category: "basic_shapes",
    difficulty: "intermediate",
    estimatedDurationMinutes: 15,
    objective: "Construct interlocking cubes, cylinders, and cones with transparent wireframe visualization.",
    requiredMaterials: ["2H Construction pencil", "2B Refinement pencil", "Ruler (for check only)", "A4 Drawing paper"],
    instructions: [
      "Lightly block out the base prism using 2H pencil, drawing through all hidden rear edges.",
      "Intersect a vertical cylinder through the center top plane of the prism.",
      "Align the minor axis of the cylinder's elliptical caps precisely with its central core axis.",
      "Emphasize visible edges with the darker 2B pencil while leaving the transparent wireframe construction visible.",
    ],
    recommendedOverlay: "perspective",
    completionCriteria: "A clean wireframe rendering of at least 3 interlocking volumetric forms sitting solidly in space.",
    physicalPaperGuidance: "Keep 2H construction lines barely visible so heavy erasing isn't required when switching to 2B.",
    selfAssessmentChecklist: [
      "Are all hidden edges drawn with consistent, light line weight?",
      "Does the cylinder cap ellipse align perpendicular to its spinal axis?",
      "Do the forms appear grounded rather than floating crookedly?",
    ],
  },
  {
    id: "ex-shapes-03",
    title: "Organic Form Deformation & Bending Volumes",
    category: "basic_shapes",
    difficulty: "advanced",
    estimatedDurationMinutes: 20,
    objective: "Bend and twist volumetric sausages and pill capsules in 3D space with overlapping contour hierarchy.",
    requiredMaterials: ["HB pencil", "4B pencil", "Blending stump", "A4 Cartridge paper"],
    instructions: [
      "Draw 5 organic curved shapes that bend, pinch on one side, and stretch on the other.",
      "Wrap cross-contour surface rings around the form every 1.5 cm to indicate volume and direction.",
      "Create clear overlap hierarchy: front surfaces must clearly cut in front of rear segments with line weight contrast.",
      "Add subtle drop shadow beneath the bent segments to establish ground contact.",
    ],
    recommendedOverlay: "contour",
    completionCriteria: "5 fully dimensional twisting forms showing clear compression, tension, and volumetric curvature.",
    physicalPaperGuidance: "Rest your pinky knuckle on a clean scrap sheet of paper to avoid smudging the dark 4B contour accents.",
    selfAssessmentChecklist: [
      "Does the pinched side show folding creases while the opposite side stretches smoothly?",
      "Do cross-contour rings bend around the silhouette cleanly?",
      "Is line weight thickest at points of contact and shadow overlap?",
    ],
  },

  // =========================================================================
  // 2. PROPORTION & SIGHTING (3 exercises)
  // =========================================================================
  {
    id: "ex-prop-01",
    title: "Comparative Pencil Sighting & Unit Measuring",
    category: "proportion",
    difficulty: "beginner",
    estimatedDurationMinutes: 15,
    objective: "Use an outstretched pencil to establish a benchmark measuring unit for still life objects.",
    requiredMaterials: ["Pencil for sighting", "2H/HB Pencils", "A4 Paper", "Dividers (optional verification)"],
    instructions: [
      "Select a still life setup or household object (cup, bottle, or fruit).",
      "Extend your arm completely straight with locked elbow, close one eye, and measure the width of the smallest element using the tip of your pencil and thumb.",
      "Count how many times this unit fits into the height, total width, and major subdivisions.",
      "Transfer these exact proportional ratios onto your physical paper using tick marks before drawing contours.",
    ],
    recommendedOverlay: "proportions",
    completionCriteria: "Accurate physical proportion layout showing verifiable integer or fractional unit ratios.",
    physicalPaperGuidance: "Always hold your sighting arm at identical full extension to avoid perspective measurement shifts.",
    selfAssessmentChecklist: [
      "Did I keep my elbow locked straight during all sighting measurements?",
      "Did I choose a clear, unchanging base unit (e.g. width of cup)?",
      "Do the drawn width-to-height ratios match physical observations?",
    ],
  },
  {
    id: "ex-prop-02",
    title: "Negative Space Silhouette Carving",
    category: "proportion",
    difficulty: "intermediate",
    estimatedDurationMinutes: 15,
    objective: "Capture complex silhouettes by drawing the empty negative spaces surrounding the subject.",
    requiredMaterials: ["2B Pencil", "Kneaded eraser", "A4 Paper"],
    instructions: [
      "Choose an object with holes or irregular silhouettes (a stool, leafy branch, or scissor handles).",
      "Ignore the object itself; focus strictly on the triangular and polygonal negative shapes created between the subject and its boundaries.",
      "Draw each negative envelope shape with precise boundary angles.",
      "Observe how the positive subject magically emerges correctly proportioned as negative spaces lock into place.",
    ],
    recommendedOverlay: "grid",
    completionCriteria: "Accurate outline formed purely through careful negative shape observation with correct angles.",
    physicalPaperGuidance: "Check angles by holding your pencil parallel to the negative edge and transferring that slant to paper.",
    selfAssessmentChecklist: [
      "Did I focus my attention purely on the empty spaces between forms?",
      "Are the negative shape corners and angles sharp and accurate?",
      "Does the resulting positive silhouette look natural and balanced?",
    ],
  },
  {
    id: "ex-prop-03",
    title: "Plumb Lines & Horizontal Alignment Mapping",
    category: "proportion",
    difficulty: "advanced",
    estimatedDurationMinutes: 20,
    objective: "Map vertical plumb lines and horizontal alignments across complex multi-object compositions.",
    requiredMaterials: ["2H pencil", "HB pencil", "Long plastic ruler", "A3 or A4 Drawing paper"],
    instructions: [
      "Drop 4 imaginary vertical plumb lines through key landmark points of your reference setup.",
      "Lightly rule these plumb lines onto your physical paper with 2H pencil.",
      "Check which features fall to the left, right, or directly on each plumb line.",
      "Project horizontal sightlines across the drawing to anchor relative heights of all competing elements.",
    ],
    recommendedOverlay: "grid",
    completionCriteria: "A complex composition accurately aligned using intersecting vertical and horizontal coordinate axes.",
    physicalPaperGuidance: "Keep your drawing surface strictly vertical or perpendicular to line of sight to prevent foreshortening distortion.",
    selfAssessmentChecklist: [
      "Are all vertical plumb lines truly 90° perpendicular to the paper edge?",
      "Did I verify horizontal alignments between distant landmarks?",
      "Do the key intersections match the physical reference setup?",
    ],
  },

  // =========================================================================
  // 3. GESTURE DRAWING (3 exercises)
  // =========================================================================
  {
    id: "ex-gest-01",
    title: "60-Second Dynamic Line of Action",
    category: "gesture",
    difficulty: "beginner",
    estimatedDurationMinutes: 10,
    objective: "Capture the primary sweeping curve and kinetic energy of the human body in under 60 seconds.",
    requiredMaterials: ["Soft graphite (4B or 6B) or vine charcoal", "Newsprint or A4 sketch paper"],
    instructions: [
      "Observe a dynamic figure pose for 5 seconds to identify the single primary 'Line of Action' (C-curve or S-curve).",
      "Sweep the pencil down the paper in one continuous motion from the head through the spine and weighted leg.",
      "Quickly slash in the opposing shoulder and pelvic tilt angles.",
      "Complete the gesture within 60 seconds without drawing fingers, facial features, or small contours.",
    ],
    recommendedOverlay: "proportions",
    completionCriteria: "Complete 8 rapid gesture sketches, each conveying clear bodily momentum and weight distribution.",
    physicalPaperGuidance: "Use broad shoulder strokes and hold the pencil in an overhand grip rather than writing tripod.",
    selfAssessmentChecklist: [
      "Does the sketch clearly convey the direction of movement in 2 seconds?",
      "Did I resist drawing internal details like eyes and fingers?",
      "Is the center of gravity placed realistically over the supporting foot?",
    ],
  },
  {
    id: "ex-gest-02",
    title: "2-Minute Rhythm & Torso Contrapposto",
    category: "gesture",
    difficulty: "intermediate",
    estimatedDurationMinutes: 15,
    objective: "Express torso tilt, twist, and rhythmic pinch/stretch in 2-minute poses.",
    requiredMaterials: ["3B/4B Graphite pencil", "Kneaded eraser", "A4 Sketchbook"],
    instructions: [
      "Identify the weight-bearing hip and note the tilt of the pelvis.",
      "Note the counter-tilt of the shoulders (contrapposto).",
      "Draw the compressed side with short, sharp rhythmic curves.",
      "Draw the stretched side with a long, sweeping, elegant C-curve.",
      "Add quick volumetric egg masses for ribcage and pelvis to anchor the torso volume.",
    ],
    recommendedOverlay: "proportions",
    completionCriteria: "5 contrapposto studies showing clear opposing tilts between shoulder girdle and pelvic basin.",
    physicalPaperGuidance: "Do not stop to erase during timed 2-minute sessions; draw through mistakes with corrected lines.",
    selfAssessmentChecklist: [
      "Are the shoulder and pelvic lines tilting in opposite directions?",
      "Is the pinch on the active side obvious compared to the long stretched flank?",
      "Does the figure look balanced under gravitational weight?",
    ],
  },
  {
    id: "ex-gest-03",
    title: "5-Minute Form Interlocking & Limb Thrusts",
    category: "gesture",
    difficulty: "advanced",
    estimatedDurationMinutes: 20,
    objective: "Integrate kinetic gesture lines with 3D cylindrical limb volumes and joint overlaps.",
    requiredMaterials: ["2B pencil", "4B pencil", "A4 Drawing paper"],
    instructions: [
      "Spend the first minute establishing the line of action and contrapposto torso rhythms.",
      "Spend minutes 2–4 wrapping cylindrical volumes around the gestural limb centerlines.",
      "Emphasize joint overlaps: forearm overlapping upper arm, thigh cutting in front of calf.",
      "Use the final minute to darken contact points and anchor feet securely to the ground plane.",
    ],
    recommendedOverlay: "proportions",
    completionCriteria: "3 balanced, muscularly coherent 5-minute studies with strong spatial depth and dynamism.",
    physicalPaperGuidance: "Maintain energetic rhythm by keeping the pencil tip gliding gently across the paper without gouging grooves.",
    selfAssessmentChecklist: [
      "Did the drawing retain its initial gestural energy even after adding volume?",
      "Do overlapping lines clearly communicate which limb segment is closer to the viewer?",
      "Are joint insertions (knee, elbow, ankle) positioned accurately?",
    ],
  },

  // =========================================================================
  // 4. FACIAL CONSTRUCTION & LOOMIS (3 exercises)
  // =========================================================================
  {
    id: "ex-loom-01",
    title: "The Loomis Cranium Sphere & Side Flattening",
    category: "facial_construction",
    difficulty: "beginner",
    estimatedDurationMinutes: 15,
    objective: "Construct the cranial ball, cut off the side planes, and establish the brow equator.",
    requiredMaterials: ["HB Graphite pencil", "A4 Paper", "Kneaded eraser"],
    instructions: [
      "Draw a clean sphere representing the skull mass.",
      "Cut off 1/6th of the sphere on both sides with an ellipse to establish the flat temporal planes.",
      "Draw the central brow line (equator) following the sphere's 3D curvature.",
      "Drop the vertical central face axis down from the top pole through the brow line.",
      "Mark the crosshair at the center of the side ellipse where the ear sits.",
    ],
    recommendedOverlay: "loomis",
    completionCriteria: "4 cranial spheres drawn at front, 3/4 front, side profile, and slight downward tilt.",
    physicalPaperGuidance: "Rotate your drawing arm in complete circles before touching down to ensure round cranial balls.",
    selfAssessmentChecklist: [
      "Is the side temporal ellipse proportioned to 2/3 of the sphere height?",
      "Does the brow line curve realistically with the head tilt?",
      "Is the ear landmark correctly placed in the rear lower quadrant of the side plane?",
    ],
  },
  {
    id: "ex-loom-02",
    title: "The Rule of Thirds & Jaw Construction",
    category: "facial_construction",
    difficulty: "intermediate",
    estimatedDurationMinutes: 20,
    objective: "Drop the jaw plane from the cranial sphere and divide the face into three canonical thirds.",
    requiredMaterials: ["2H Construction pencil", "2B Refinement pencil", "A4 Paper"],
    instructions: [
      "Construct the Loomis sphere and side ellipse using light 2H pencil.",
      "Measure the distance from hairline to brow line: duplicate this measurement downwards to find the nose base.",
      "Duplicate the unit again downwards to find the bottom of the chin (three equal thirds).",
      "Drop the jawline from the ear intersection down to the chin point, establishing the corner of the mandible.",
      "Refine the chin box, cheekbone arches, and eye socket cavities with 2B pencil.",
    ],
    recommendedOverlay: "loomis",
    completionCriteria: "3 constructed heads in 3/4 view displaying verified equal vertical facial thirds.",
    physicalPaperGuidance: "Keep construction ticks light so facial features can be drawn cleanly over the framework.",
    selfAssessmentChecklist: [
      "Are hairline-to-brow, brow-to-nose, and nose-to-chin equal in height?",
      "Does the jaw angle align with the bottom of the ear and nose line?",
      "Is the chin centered accurately on the vertical facial axis?",
    ],
  },
  {
    id: "ex-loom-03",
    title: "Extreme Head Tilts: Pitch Up & Pitch Down",
    category: "facial_construction",
    difficulty: "advanced",
    estimatedDurationMinutes: 20,
    objective: "Construct heads foreshortened in steep perspective (looking up and looking down).",
    requiredMaterials: ["HB pencil", "3B pencil", "Kneaded eraser", "A4 Drawing paper"],
    instructions: [
      "For looking up: curve the brow line upwards; the chin cuts in front of the neck; nose base exposes nostrils.",
      "For looking down: curve the brow line downwards; cranial top dominates; chin tucks into chest/neck junction.",
      "Adjust the temporal ellipses so their minor axes follow the head pitch.",
      "Ensure facial feature bands (brow, eyes, nose, mouth) remain parallel curved rings wrapping around the cylinder of the face.",
    ],
    recommendedOverlay: "loomis",
    completionCriteria: "Two heads drawn with convincing pitch foreshortening—one bird's-eye and one worm's-eye view.",
    physicalPaperGuidance: "Pay special attention to overlapping planes: in upward tilt, the jawline overlaps the neck completely.",
    selfAssessmentChecklist: [
      "Do the brow, nose, and mouth lines share identical elliptical curvature?",
      "In worm's-eye view, is the underside of the jaw/chin plane clearly visible?",
      "In bird's-eye view, does the top skull dome dominate the overall silhouette?",
    ],
  },

  // =========================================================================
  // 5. ANATOMY & FIGURE MASSES (3 exercises)
  // =========================================================================
  {
    id: "ex-anat-01",
    title: "Torso Bean & Ribcage/Pelvis Volumes",
    category: "anatomy",
    difficulty: "beginner",
    estimatedDurationMinutes: 15,
    objective: "Represent the ribcage and pelvic masses as two solid volumetric blocks connected by a flexible spine.",
    requiredMaterials: ["HB Graphite pencil", "A4 Sketchbook", "Kneaded eraser"],
    instructions: [
      "Draw the ribcage as an upright, tilted 3D egg with an inverted V for the thoracic arch.",
      "Draw the pelvis as a bowl or wedge tilted in the opposite direction.",
      "Connect them with the spinal column line at the back and the abdominal mass in front.",
      "Draw cross-sectional rings around the waist to emphasize the twist between chest and hips.",
    ],
    recommendedOverlay: "proportions",
    completionCriteria: "4 torso studies showing standing, twisting, leaning, and bent postures.",
    physicalPaperGuidance: "Think of the torso as a flour sack or bean that squashes on one side and stretches on the other.",
    selfAssessmentChecklist: [
      "Is the ribcage egg drawn larger than the pelvic bowl?",
      "Does the thoracic arch reach approximately halfway up the chest mass?",
      "Can the viewer clearly tell whether the chest is facing towards or away from them?",
    ],
  },
  {
    id: "ex-anat-02",
    title: "Limb Cylinders & Overlapping Joint Insertion",
    category: "anatomy",
    difficulty: "intermediate",
    estimatedDurationMinutes: 20,
    objective: "Construct upper and lower arms and legs using tapering cylinders that nest into joints.",
    requiredMaterials: ["2H pencil", "2B pencil", "A4 Paper"],
    instructions: [
      "Block in shoulder ball, elbow hinge, and wrist oval with 2H pencil.",
      "Draw the deltoid muscle as an inverted teardrop clasping the upper arm cylinder.",
      "Draw the forearm muscles as an asymmetrical mass tapering down to the narrow wrist.",
      "Construct thighs and calves: ensure outer calf curves sit higher than inner calf curves.",
    ],
    recommendedOverlay: "proportions",
    completionCriteria: "2 full arm and 2 full leg studies demonstrating anatomical asymmetry and interlocking muscle transitions.",
    physicalPaperGuidance: "Remember muscles never attach symmetrically across a bone; high outer curves oppose low inner curves.",
    selfAssessmentChecklist: [
      "Does the deltoid clasp down between the bicep and tricep?",
      "Is the outer calf contour noticeably higher than the inner calf contour?",
      "Do limb segments overlap in correct front-to-back perspective?",
    ],
  },
  {
    id: "ex-anat-03",
    title: "8-Head Proportional Cannon Figure Study",
    category: "anatomy",
    difficulty: "advanced",
    estimatedDurationMinutes: 25,
    objective: "Construct a complete human figure conforming to canonical 8-head height divisions.",
    requiredMaterials: ["2H construction pencil", "2B refinement pencil", "Long ruler for verification", "A3 Drawing paper"],
    instructions: [
      "Draw a vertical line and mark 8 equal vertical intervals (head units).",
      "Unit 1: Head; Unit 2: Nipples; Unit 3: Navel; Unit 4: Pubic symphysis (exact halfway line).",
      "Unit 5: Mid-thigh; Unit 6: Bottom of kneecap; Unit 7: Mid-calf; Unit 8: Soles of feet.",
      "Flesh out the anatomical masses while keeping landmarks anchored to the verified horizontal divisions.",
    ],
    recommendedOverlay: "proportions",
    completionCriteria: "A full standing figure correctly proportioned according to the classical 8-head system.",
    physicalPaperGuidance: "Use a piece of scrap paper as a tick-strip gauge to verify all 8 units remain strictly uniform.",
    selfAssessmentChecklist: [
      "Is the pubic symphysis placed exactly at the 4-head midpoint?",
      "Are the elbows aligned with the bottom of the ribcage / navel line?",
      "Do the wrists fall comfortably below the hip joints?",
    ],
  },

  // =========================================================================
  // 6. PERSPECTIVE (3 exercises)
  // =========================================================================
  {
    id: "ex-persp-01",
    title: "One-Point Perspective Room & Furniture Box",
    category: "perspective",
    difficulty: "beginner",
    estimatedDurationMinutes: 15,
    objective: "Draw a simple interior space with furniture using a single central vanishing point.",
    requiredMaterials: ["HB pencil", "30 cm Ruler", "A4 Paper"],
    instructions: [
      "Rule a horizontal horizon line across the center of your page.",
      "Mark a single vanishing point (VP) near the center of the horizon.",
      "Draw a frontal rectangle representing the back wall of a room.",
      "Project converging orthogonals from the four wall corners through the VP towards the page edges.",
      "Construct a rectangular table inside the room by projecting its top corners toward the same VP.",
    ],
    recommendedOverlay: "perspective",
    completionCriteria: "A clean 1-point perspective interior with at least 2 pieces of furniture converging accurately to the VP.",
    physicalPaperGuidance: "Keep all horizontal lines strictly parallel to the horizon, and all verticals at 90° right angles.",
    selfAssessmentChecklist: [
      "Do all receding depth lines meet at the exact same vanishing point?",
      "Are all front-facing planes true rectangles with no angular distortion?",
      "Does the scale of furniture decrease naturally as it approaches the back wall?",
    ],
  },
  {
    id: "ex-persp-02",
    title: "Two-Point Perspective Building Blocks Above & Below Eye Level",
    category: "perspective",
    difficulty: "intermediate",
    estimatedDurationMinutes: 20,
    objective: "Construct 6 boxes in 2-point perspective situated above, at, and below eye level.",
    requiredMaterials: ["2H construction pencil", "2B pencil", "Long ruler", "A3 or A4 Paper"],
    instructions: [
      "Draw a horizon line across the paper and place Left Vanishing Point (LVP) and Right Vanishing Point (RVP) far apart.",
      "Draw a vertical corner edge below the horizon: project its top and bottom to both LVPs.",
      "Close the box sides with vertical edges and project rear top edges to find the top surface.",
      "Repeat for a box floating above the horizon: notice you see the bottom plane instead of the top.",
      "Repeat for a box resting on the horizon: notice neither top nor bottom planes are visible.",
    ],
    recommendedOverlay: "perspective",
    completionCriteria: "6 crisp volumetric boxes positioned across all 3 vertical zones relative to eye level.",
    physicalPaperGuidance: "Place your vanishing points as far apart as possible near the paper edges to prevent unnatural wide-angle distortion.",
    selfAssessmentChecklist: [
      "Are all vertical corner lines strictly parallel to each other?",
      "Do boxes below eye level reveal their top planes, while boxes above reveal their bottoms?",
      "Do the receding lines converge cleanly without drifting off-target?",
    ],
  },
  {
    id: "ex-persp-03",
    title: "Incline Planes & Roof Pitches in Perspective",
    category: "perspective",
    difficulty: "advanced",
    estimatedDurationMinutes: 25,
    objective: "Calculate pitched roofs and inclined ramps using vertical trace lines and auxiliary vanishing points.",
    requiredMaterials: ["2H pencil", "HB pencil", "Ruler", "A4 Paper"],
    instructions: [
      "Construct a standard rectangular building in 2-point perspective.",
      "Find the center of the gable end wall by drawing an 'X' across its rectangular plane.",
      "Raise a vertical centerline through the 'X' intersection to establish the peak height.",
      "Connect the peak to the wall corners to form the triangular gable.",
      "Project the roof ridge line to the dominant vanishing point on the horizon.",
    ],
    recommendedOverlay: "perspective",
    completionCriteria: "A complex architectural structure with an accurate pitched roof, dormer window, or inclined driveway ramp.",
    physicalPaperGuidance: "Use very light 2H lines for diagonal center-finding crosses so your final structure remains sharp.",
    selfAssessmentChecklist: [
      "Did I find the true geometric center of the wall using diagonal perspective subdivision?",
      "Is the roof ridge line converging to the same vanishing point as the long wall?",
      "Do both roof slope planes appear symmetrical in 3D space?",
    ],
  },

  // =========================================================================
  // 7. LIGHT, SHADOW & VALUE MASSES (3 exercises)
  // =========================================================================
  {
    id: "ex-shad-01",
    title: "5-Step Value Scale & Swatch Uniformity",
    category: "light_shadow",
    difficulty: "beginner",
    estimatedDurationMinutes: 15,
    objective: "Produce a 5-step tonal value scale ranging from pure white paper to maximum graphite black.",
    requiredMaterials: ["2H, HB, 2B, 4B Graphite pencils", "Ruler", "Kneaded eraser", "Smooth drawing paper"],
    instructions: [
      "Rule a 5-box strip, each box 2.5 × 2.5 cm.",
      "Box 1: Pure White (untouched paper).",
      "Box 2: High Light (light, even 2H tone).",
      "Box 3: Midtone (solid, uniform HB tone).",
      "Box 4: Core Shadow (dense 2B hatching).",
      "Box 5: Occlusion Shadow (maximum dark 4B pressure without tearing paper).",
    ],
    recommendedOverlay: "shading",
    completionCriteria: "A clean 5-step scale where each step has a visibly distinct, evenly graded value leap.",
    physicalPaperGuidance: "Hatch in multiple overlapping diagonal layers rather than pressing down hard in a single pass.",
    selfAssessmentChecklist: [
      "Is each of the 5 values clearly distinguishable from its neighbor?",
      "Is the tone inside each box completely uniform without patchy streaks?",
      "Did I keep Box 1 pristine white without fingerprints or graphite smears?",
    ],
  },
  {
    id: "ex-shad-02",
    title: "The Shaded Sphere & Core Shadow Terminator",
    category: "light_shadow",
    difficulty: "intermediate",
    estimatedDurationMinutes: 20,
    objective: "Render all 5 zones of form lighting: Highlight, Halftone, Terminator, Reflected Light, and Cast Shadow.",
    requiredMaterials: ["HB, 2B, 4B Pencils", "Blending stump (paper tortillon)", "Kneaded eraser", "A4 Paper"],
    instructions: [
      "Draw a clean circle and establish a light source angle (top-left, 45°).",
      "Lightly mark the terminator line separating light side from dark side.",
      "Fill the entire shadow side with an even tone—do not worry about reflected light yet.",
      "Darken the core shadow along the terminator boundary where light grazes the curved surface.",
      "Project the elliptical cast shadow onto the ground plane; darken the occlusion contact zone directly under the sphere.",
      "Leave subtle reflected light on the underside, ensuring it remains darker than the lightest halftone.",
    ],
    recommendedOverlay: "shading",
    completionCriteria: "A convincing 3D sphere that appears spherical, solid, and firmly resting on a tabletop.",
    physicalPaperGuidance: "Use a kneaded eraser shaped into a wedge to lift out the bright highlight rather than trying to draw around it.",
    selfAssessmentChecklist: [
      "Is the terminator line clearly visible separating light from shadow?",
      "Is the reflected light strictly darker than the midtones on the lit side?",
      "Is the cast shadow sharpest near the sphere and softer towards its edge?",
    ],
  },
  {
    id: "ex-shad-03",
    title: "Planar Head Shading & Value Grouping",
    category: "light_shadow",
    difficulty: "advanced",
    estimatedDurationMinutes: 25,
    objective: "Group complex facial features into unified light and shadow masses without fragmented rendering.",
    requiredMaterials: ["HB pencil", "3B pencil", "Kneaded eraser", "A4 Cartridge paper"],
    instructions: [
      "Block out a simplified planar Asaro or Loomis head.",
      "Choose a single strong directional light source (Rembrandt lighting from 45°).",
      "Squint at your reference and shade all planes turned away from the light into ONE flat shadow value.",
      "Model subtle halftone variations ONLY inside the light mass.",
      "Deepen ambient occlusion crevices (under the nose, lip crevice, socket corners).",
    ],
    recommendedOverlay: "shading",
    completionCriteria: "A sculptural planar head where all shadow areas read as one coherent, unified value mass.",
    physicalPaperGuidance: "Squint frequently through your eyelashes to blur details and verify the big light/dark value shape reads clearly.",
    selfAssessmentChecklist: [
      "Does the drawing read clearly in two values (light vs shadow) from 2 meters away?",
      "Are shadows kept simple rather than overworked with excessive highlights?",
      "Are occlusion accents placed only at true crevice contact points?",
    ],
  },

  // =========================================================================
  // 8. CONTOUR DRAWING (3 exercises)
  // =========================================================================
  {
    id: "ex-cont-01",
    title: "Pure Blind Contour Drawing of the Hand",
    category: "contour",
    difficulty: "beginner",
    estimatedDurationMinutes: 10,
    objective: "Synchronize eye movement and pencil tip speed by drawing without looking at the paper.",
    requiredMaterials: ["2B or 4B Pencil", "A4 Paper", "Shielding cardboard or book to block paper view"],
    instructions: [
      "Position your non-dominant hand in an interesting pose with bent fingers.",
      "Turn your head completely towards your physical hand, shielding your eyes from the paper.",
      "Touch the pencil to the page. Move your eyes along the skin creases at the speed of a crawling ant.",
      "Move the pencil simultaneously, recording every tiny wrinkle, wrinkle transition, and knuckle curve.",
      "Do not look down at the drawing until the 10 minutes are completely up.",
    ],
    recommendedOverlay: "contour",
    completionCriteria: "A single continuous line recording rich textural observations without glancing at the paper.",
    physicalPaperGuidance: "Taping your paper down with drafting tape prevents it from sliding around while your eyes are averted.",
    selfAssessmentChecklist: [
      "Did I strictly avoid glancing down at the paper even once?",
      "Did my pencil tip move at the exact same crawl speed as my eyes?",
      "Does the drawing show rich microscopic contour detail?",
    ],
  },
  {
    id: "ex-cont-02",
    title: "Modified Contour with Weighted Line Accents",
    category: "contour",
    difficulty: "intermediate",
    estimatedDurationMinutes: 15,
    objective: "Draw an intricate still life object using varying line weights to express light, weight, and depth.",
    requiredMaterials: ["HB, 2B, and 4B Pencils", "Kneaded eraser", "A4 Paper"],
    instructions: [
      "Select an object with complex contours (a crumpled paper bag, a shoe, or houseplant).",
      "Look 90% at the object and 10% at the page to check spatial coordinates.",
      "Use very light, delicate HB line weight for surfaces directly hit by light.",
      "Use medium 2B lines for side edges and internal seams.",
      "Use heavy, confident 4B line weight where surfaces cast shadows or press against the table.",
    ],
    recommendedOverlay: "contour",
    completionCriteria: "A sophisticated contour drawing where form, depth, and lighting are conveyed purely through line weight variation.",
    physicalPaperGuidance: "Vary line weight by rotating the pencil slightly between your fingers to utilize both the sharp point and beveled edge.",
    selfAssessmentChecklist: [
      "Is line weight visibly heavier in dark crevices and underside contact areas?",
      "Are top-lit contours delicate and thin without heavy black outlines?",
      "Does the drawing communicate volume and depth without any internal shading?",
    ],
  },
  {
    id: "ex-cont-03",
    title: "Cross-Contour Volumetric Topography",
    category: "contour",
    difficulty: "advanced",
    estimatedDurationMinutes: 20,
    objective: "Map the complex organic terrain of a piece of fruit or hand using topographic surface cross-contours.",
    requiredMaterials: ["0.3 mm or 0.5 mm Fineliner or sharpened 2B pencil", "A4 Drawing paper"],
    instructions: [
      "Lightly block out the outer silhouette of an organic subject (bell pepper, apple, or closed fist).",
      "Imagine slicing the object with thin parallel laser sheets every 5 millimeters.",
      "Draw cross-contour lines that wrap completely around the surface, rising over hills and plunging into valleys.",
      "Vary the spacing between cross-contour lines: tighter spacing indicates surfaces tilting steeply away from view.",
    ],
    recommendedOverlay: "contour",
    completionCriteria: "A rich topographical wireframe that describes every undulation of the surface volume.",
    physicalPaperGuidance: "Keep your wrist relaxed and follow through with each curve all the way across the form from edge to edge.",
    selfAssessmentChecklist: [
      "Do the cross-contour lines bend and curve over every surface bump and depression?",
      "Does the spacing compress realistically as the surface curves around toward the silhouette?",
      "Does the object look tactile and sculpted in three dimensions?",
    ],
  },
];

/**
 * Returns all available practice exercises.
 */
export function getAllExercises(): PracticeExercise[] {
  return PRACTICE_EXERCISES;
}

/**
 * Finds an exercise by its unique ID.
 */
export function getExerciseById(id: string): PracticeExercise | undefined {
  return PRACTICE_EXERCISES.find((ex) => ex.id === id);
}

/**
 * Filters exercises by skill category.
 */
export function getExercisesByCategory(category: PracticeCategory): PracticeExercise[] {
  return PRACTICE_EXERCISES.filter((ex) => ex.category === category);
}

/**
 * Filters exercises by difficulty level.
 */
export function getExercisesByDifficulty(difficulty: PracticeDifficulty): PracticeExercise[] {
  return PRACTICE_EXERCISES.filter((ex) => ex.difficulty === difficulty);
}

/**
 * Multi-criteria filter for category and difficulty.
 */
export function filterExercises(
  category: PracticeCategory | "all" = "all",
  difficulty: PracticeDifficulty | "all" = "all"
): PracticeExercise[] {
  return PRACTICE_EXERCISES.filter((ex) => {
    const matchCat = category === "all" || ex.category === category;
    const matchDiff = difficulty === "all" || ex.difficulty === difficulty;
    return matchCat && matchDiff;
  });
}

/**
 * Returns a deterministic daily practice exercise based on date.
 * Allows users to have a fresh recommended exercise every day.
 */
export function getDailyExercise(dateStr?: string): PracticeExercise {
  const targetDate = dateStr ?? new Date().toISOString().split("T")[0]!;
  let hash = 0;
  for (let i = 0; i < targetDate.length; i++) {
    hash = (hash << 5) - hash + targetDate.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PRACTICE_EXERCISES.length;
  return PRACTICE_EXERCISES[index] ?? PRACTICE_EXERCISES[0]!;
}

/**
 * Returns metadata for a given practice category.
 */
export function getCategoryMetadata(category: PracticeCategory): CategoryMetadata | undefined {
  return PRACTICE_CATEGORIES.find((cat) => cat.id === category);
}
