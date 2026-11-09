import type { Stroke, StrokePoint } from "../../domain/types";

export type AnatomyMode = "proportions" | "skeletal" | "muscular" | "facial";

export type AnatomyGender = "neutral" | "heroic" | "female";

export type AnatomyConfig = {
  mode: AnatomyMode;
  gender: AnatomyGender; // Canonical 8-head (neutral/female) vs 8.5-head (heroic)
  heightRatio: number;   // Total figure height relative to canvas (e.g. 0.85)
  centerX: number;       // Figure center X (0.1 to 0.9)
  centerY: number;       // Figure top head Y (0.05 to 0.5)
  color: string;         // Guide line color
  opacity: number;       // 0.2 to 1.0
  showMuscles?: boolean; // Toggle muscle overlay in all modes
};

export const DEFAULT_ANATOMY_CONFIG: AnatomyConfig = {
  mode: "proportions",
  gender: "neutral",
  heightRatio: 0.82,
  centerX: 0.5,
  centerY: 0.08,
  color: "#28594B",
  opacity: 0.85,
  showMuscles: true,
};

export type HeadDivision = {
  index: number;
  label: string;
  landmark: string;
  y: number;
  fraction: string;
};

export type BoneLandmark = {
  name: string;
  points: Array<{ x: number; y: number }>;
  type: "line" | "ellipse" | "joint";
  radius?: number;
};

export type MuscleLandmark = {
  name: string;
  group: "chest" | "shoulders" | "arms" | "torso" | "legs" | "neck";
  points: Array<{ x: number; y: number }>;
};

export type AnatomyRenderData = {
  divisions: HeadDivision[];
  centerLine: [{ x: number; y: number }, { x: number; y: number }];
  widthGuides: Array<{ label: string; line: [{ x: number; y: number }, { x: number; y: number }] }>;
  skeletalLines: BoneLandmark[];
  muscles: MuscleLandmark[];
  facialProportions: Array<{ label: string; line: [{ x: number; y: number }, { x: number; y: number }] }>;
};

export type AnatomyTutorialStep = {
  step: number;
  title: string;
  canon: string;
  focusMode: AnatomyMode;
  instruction: string;
  tip: string;
  landmarks: string[];
};

export const ANATOMY_TUTORIAL_STEPS: AnatomyTutorialStep[] = [
  {
    step: 1,
    title: "The 8-Head Proportional Canon",
    canon: "Canonical Figure Height",
    focusMode: "proportions",
    instruction: "Classical art canon establishes the adult figure as exactly 8 head units tall. Division 1 ends at the chin, Division 2 at the nipples, Division 3 at the navel, and Division 4 at the pubic arch.",
    tip: "Notice that the pubic arch (Division 4) is the exact vertical midpoint of the entire human body. Upper body and legs each occupy 4 heads.",
    landmarks: ["Cranium", "Chin (1)", "Nipples (2)", "Navel (3)", "Pubic Arch (4)", "Knees (6)", "Feet (8)"],
  },
  {
    step: 2,
    title: "Skeletal Framework & Contrapposto",
    canon: "Bony Landmarks",
    focusMode: "skeletal",
    instruction: "Build the figure starting from bony landmarks: Cranium, the curving Spine line of action, the Thoracic ribcage oval, and the Pelvic bucket. Shoulders are 2 heads wide; pelvis is 1.5 heads wide.",
    tip: "In natural standing poses, when one hip rises (bearing weight), the shoulder line tilts in the opposite direction. This opposing tilt is Contrapposto.",
    landmarks: ["Clavicles", "Thoracic Oval", "Spine Line", "Pelvic Basin", "Knee Joints", "Ankles"],
  },
  {
    step: 3,
    title: "Primary Muscle Volumes & Silhouettes",
    canon: "Muscular Anatomy",
    focusMode: "muscular",
    instruction: "Drape major muscle groups over the skeleton: Deltoid shoulder caps wrap over clavicles; Pectoralis major plates anchor to the sternum; Rectus abdominis fills the waist; Quadriceps taper down to the knee.",
    tip: "Always think in overlapping 3D volumes rather than outlines. Notice how the deltoid inserts between the bicep and tricep.",
    landmarks: ["Deltoids", "Pectorals", "Six-Pack Abdominals", "External Obliques", "Quadriceps", "Calf Gastrocnemius"],
  },
  {
    step: 4,
    title: "Facial Proportions & The 5-Eyes Rule",
    canon: "Portrait Proportions",
    focusMode: "facial",
    instruction: "A human head viewed from the front is exactly 5 eye-widths across. The eye line sits halfway down the cranium. The nose base is located at the 2/3 mark, and the mouth sits 1/3 between nose and chin.",
    tip: "The distance between the inner corners of both eyes equals exactly one eye unit. The outer ear attachment spans from eye level down to the base of the nose.",
    landmarks: ["Eye Line (Halfway)", "5 Equal Eye Units", "Nose Base", "Mouth Line", "Ear Height"],
  },
];

/**
 * Calculates canonical 8-head anatomical figure proportions, bone landmarks, and muscle masses.
 */
export function calculateAnatomy(
  canvasWidth: number,
  canvasHeight: number,
  config: AnatomyConfig
): AnatomyRenderData {
  const totalHeight = canvasHeight * config.heightRatio;
  const topY = canvasHeight * config.centerY;
  const bottomY = topY + totalHeight;
  const headCount = config.gender === "heroic" ? 8.5 : config.gender === "female" ? 7.5 : 8;
  const headHeight = totalHeight / headCount;
  const cx = canvasWidth * config.centerX;

  // 8 Canonical Head Divisions
  const divisions: HeadDivision[] = [];
  const landmarks = [
    "Top of Cranium",
    "Chin / Jaw Base (1 Head)",
    "Nipples / Sternum (2 Heads)",
    "Navel / Elbows (3 Heads)",
    "Crotch / Pubic Arch / Wrists (4 Heads)",
    "Mid-Thigh / Fingertips (5 Heads)",
    "Bottom of Kneecaps (6 Heads)",
    "Lower Calf / Soles (7 Heads)",
    "Base of Feet / Soles (8 Heads)",
  ];

  for (let i = 0; i <= Math.ceil(headCount); i++) {
    const y = topY + i * headHeight;
    divisions.push({
      index: i,
      label: `Head ${i}`,
      landmark: landmarks[i] ?? `Division ${i}`,
      y,
      fraction: `${i}/${Math.round(headCount)}`,
    });
  }

  // Vertical symmetry centerline
  const centerLine: [{ x: number; y: number }, { x: number; y: number }] = [
    { x: cx, y: topY - 15 },
    { x: cx, y: bottomY + 15 },
  ];

  // Canonical shoulder and pelvic width guides
  const shoulderWidth = headHeight * (config.gender === "heroic" ? 2.2 : config.gender === "female" ? 1.8 : 2.0);
  const pelvicWidth = headHeight * (config.gender === "female" ? 1.6 : 1.5);
  const shoulderY = topY + headHeight * 1.33; // Mid neck to collarbone
  const pelvicY = topY + headHeight * 4.0;

  const widthGuides = [
    {
      label: `Shoulder Breadth (${(shoulderWidth / headHeight).toFixed(1)} Heads)`,
      line: [
        { x: cx - shoulderWidth / 2, y: shoulderY },
        { x: cx + shoulderWidth / 2, y: shoulderY },
      ] as [{ x: number; y: number }, { x: number; y: number }],
    },
    {
      label: `Pelvis Breadth (${(pelvicWidth / headHeight).toFixed(1)} Heads)`,
      line: [
        { x: cx - pelvicWidth / 2, y: pelvicY },
        { x: cx + pelvicWidth / 2, y: pelvicY },
      ] as [{ x: number; y: number }, { x: number; y: number }],
    },
  ];

  // Skeletal abstraction
  const ribcageY = topY + headHeight * 1.5;
  const ribcageHeight = headHeight * 1.4;
  const ribcageWidth = headHeight * 1.5;

  const skeletalLines: BoneLandmark[] = [
    {
      name: "Cranium",
      type: "ellipse",
      radius: headHeight * 0.42,
      points: [{ x: cx, y: topY + headHeight * 0.45 }],
    },
    {
      name: "Spine Column",
      type: "line",
      points: [
        { x: cx, y: topY + headHeight },
        { x: cx, y: topY + headHeight * 4.0 },
      ],
    },
    {
      name: "Clavicle",
      type: "line",
      points: [
        { x: cx - shoulderWidth / 2, y: shoulderY },
        { x: cx, y: shoulderY + 8 },
        { x: cx + shoulderWidth / 2, y: shoulderY },
      ],
    },
    {
      name: "Thoracic Cage",
      type: "ellipse",
      radius: ribcageWidth / 2,
      points: [{ x: cx, y: ribcageY + ribcageHeight / 2 }],
    },
    {
      name: "Pelvis Basin",
      type: "line",
      points: [
        { x: cx - pelvicWidth / 2, y: pelvicY - headHeight * 0.4 },
        { x: cx + pelvicWidth / 2, y: pelvicY - headHeight * 0.4 },
        { x: cx + pelvicWidth * 0.35, y: pelvicY },
        { x: cx, y: pelvicY + headHeight * 0.1 },
        { x: cx - pelvicWidth * 0.35, y: pelvicY },
        { x: cx - pelvicWidth / 2, y: pelvicY - headHeight * 0.4 },
      ],
    },
    {
      name: "Left Leg (Femur & Tibia)",
      type: "line",
      points: [
        { x: cx - pelvicWidth * 0.35, y: pelvicY },
        { x: cx - pelvicWidth * 0.28, y: topY + headHeight * 6.0 }, // Knee
        { x: cx - pelvicWidth * 0.22, y: bottomY }, // Ankle
      ],
    },
    {
      name: "Right Leg (Femur & Tibia)",
      type: "line",
      points: [
        { x: cx + pelvicWidth * 0.35, y: pelvicY },
        { x: cx + pelvicWidth * 0.28, y: topY + headHeight * 6.0 }, // Knee
        { x: cx + pelvicWidth * 0.22, y: bottomY }, // Ankle
      ],
    },
  ];

  // Muscular Volume Contours
  const muscles: MuscleLandmark[] = [
    // 1. Deltoid Shoulders (Left & Right)
    {
      name: "Left Deltoid Cap",
      group: "shoulders",
      points: [
        { x: cx - shoulderWidth * 0.42, y: shoulderY - headHeight * 0.1 },
        { x: cx - shoulderWidth * 0.58, y: shoulderY + headHeight * 0.15 },
        { x: cx - shoulderWidth * 0.52, y: shoulderY + headHeight * 0.5 },
        { x: cx - shoulderWidth * 0.42, y: shoulderY + headHeight * 0.45 },
        { x: cx - shoulderWidth * 0.42, y: shoulderY - headHeight * 0.1 },
      ],
    },
    {
      name: "Right Deltoid Cap",
      group: "shoulders",
      points: [
        { x: cx + shoulderWidth * 0.42, y: shoulderY - headHeight * 0.1 },
        { x: cx + shoulderWidth * 0.58, y: shoulderY + headHeight * 0.15 },
        { x: cx + shoulderWidth * 0.52, y: shoulderY + headHeight * 0.5 },
        { x: cx + shoulderWidth * 0.42, y: shoulderY + headHeight * 0.45 },
        { x: cx + shoulderWidth * 0.42, y: shoulderY - headHeight * 0.1 },
      ],
    },
    // 2. Pectoralis Major (Chest Plates)
    {
      name: "Left Pectoral Plate",
      group: "chest",
      points: [
        { x: cx, y: shoulderY + 8 },
        { x: cx - shoulderWidth * 0.4, y: shoulderY + 6 },
        { x: cx - shoulderWidth * 0.38, y: topY + headHeight * 2.05 },
        { x: cx - 4, y: topY + headHeight * 2.05 },
        { x: cx, y: shoulderY + 8 },
      ],
    },
    {
      name: "Right Pectoral Plate",
      group: "chest",
      points: [
        { x: cx, y: shoulderY + 8 },
        { x: cx + shoulderWidth * 0.4, y: shoulderY + 6 },
        { x: cx + shoulderWidth * 0.38, y: topY + headHeight * 2.05 },
        { x: cx + 4, y: topY + headHeight * 2.05 },
        { x: cx, y: shoulderY + 8 },
      ],
    },
    // 3. Rectus Abdominis (Six-Pack Core Column)
    {
      name: "Rectus Abdominis (Core)",
      group: "torso",
      points: [
        { x: cx - headHeight * 0.35, y: topY + headHeight * 2.1 },
        { x: cx + headHeight * 0.35, y: topY + headHeight * 2.1 },
        { x: cx + headHeight * 0.32, y: topY + headHeight * 3.0 },
        { x: cx + headHeight * 0.25, y: topY + headHeight * 3.9 },
        { x: cx - headHeight * 0.25, y: topY + headHeight * 3.9 },
        { x: cx - headHeight * 0.32, y: topY + headHeight * 3.0 },
        { x: cx - headHeight * 0.35, y: topY + headHeight * 2.1 },
      ],
    },
    // 4. External Obliques (Waist Contours)
    {
      name: "Left Oblique Flank",
      group: "torso",
      points: [
        { x: cx - headHeight * 0.6, y: topY + headHeight * 2.4 },
        { x: cx - headHeight * 0.5, y: topY + headHeight * 3.0 },
        { x: cx - pelvicWidth * 0.5, y: topY + headHeight * 3.7 },
      ],
    },
    {
      name: "Right Oblique Flank",
      group: "torso",
      points: [
        { x: cx + headHeight * 0.6, y: topY + headHeight * 2.4 },
        { x: cx + headHeight * 0.5, y: topY + headHeight * 3.0 },
        { x: cx + pelvicWidth * 0.5, y: topY + headHeight * 3.7 },
      ],
    },
    // 5. Quadriceps / Thigh Muscles
    {
      name: "Left Quadriceps Volume",
      group: "legs",
      points: [
        { x: cx - pelvicWidth * 0.45, y: pelvicY },
        { x: cx - pelvicWidth * 0.48, y: topY + headHeight * 5.0 },
        { x: cx - pelvicWidth * 0.35, y: topY + headHeight * 5.9 },
        { x: cx - pelvicWidth * 0.15, y: topY + headHeight * 5.9 },
        { x: cx - pelvicWidth * 0.12, y: pelvicY + headHeight * 0.2 },
      ],
    },
    {
      name: "Right Quadriceps Volume",
      group: "legs",
      points: [
        { x: cx + pelvicWidth * 0.45, y: pelvicY },
        { x: cx + pelvicWidth * 0.48, y: topY + headHeight * 5.0 },
        { x: cx + pelvicWidth * 0.35, y: topY + headHeight * 5.9 },
        { x: cx + pelvicWidth * 0.15, y: topY + headHeight * 5.9 },
        { x: cx + pelvicWidth * 0.12, y: pelvicY + headHeight * 0.2 },
      ],
    },
    // 6. Gastrocnemius (Calf Bulges)
    {
      name: "Left Calf Muscle",
      group: "legs",
      points: [
        { x: cx - pelvicWidth * 0.35, y: topY + headHeight * 6.1 },
        { x: cx - pelvicWidth * 0.42, y: topY + headHeight * 6.7 },
        { x: cx - pelvicWidth * 0.25, y: topY + headHeight * 7.5 },
        { x: cx - pelvicWidth * 0.18, y: topY + headHeight * 6.7 },
        { x: cx - pelvicWidth * 0.25, y: topY + headHeight * 6.1 },
      ],
    },
    {
      name: "Right Calf Muscle",
      group: "legs",
      points: [
        { x: cx + pelvicWidth * 0.35, y: topY + headHeight * 6.1 },
        { x: cx + pelvicWidth * 0.42, y: topY + headHeight * 6.7 },
        { x: cx + pelvicWidth * 0.25, y: topY + headHeight * 7.5 },
        { x: cx + pelvicWidth * 0.18, y: topY + headHeight * 6.7 },
        { x: cx + pelvicWidth * 0.25, y: topY + headHeight * 6.1 },
      ],
    },
  ];

  // Facial Proportion Guides (The Rule of 5 Eyes)
  const faceEyeY = topY + headHeight * 0.5;
  const faceNoseY = topY + headHeight * 0.72;
  const faceMouthY = topY + headHeight * 0.85;
  const eyeUnit = (headHeight * 0.7) / 5;

  const facialProportions = [
    {
      label: "Eye Line (Halfway down cranium)",
      line: [
        { x: cx - eyeUnit * 2.5, y: faceEyeY },
        { x: cx + eyeUnit * 2.5, y: faceEyeY },
      ] as [{ x: number; y: number }, { x: number; y: number }],
    },
    {
      label: "Nose Base",
      line: [
        { x: cx - eyeUnit * 0.8, y: faceNoseY },
        { x: cx + eyeUnit * 0.8, y: faceNoseY },
      ] as [{ x: number; y: number }, { x: number; y: number }],
    },
    {
      label: "Mouth Line",
      line: [
        { x: cx - eyeUnit * 1.1, y: faceMouthY },
        { x: cx + eyeUnit * 1.1, y: faceMouthY },
      ] as [{ x: number; y: number }, { x: number; y: number }],
    },
  ];

  return { divisions, centerLine, widthGuides, skeletalLines, muscles, facialProportions };
}

/**
 * Converts anatomy guides to vector strokes for direct project canvas layering.
 */
export function convertAnatomyToStrokes(
  canvasWidth: number,
  canvasHeight: number,
  config: AnatomyConfig
): Stroke[] {
  const data = calculateAnatomy(canvasWidth, canvasHeight, config);
  const strokes: Stroke[] = [];
  const makeId = () => `anat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  // Centerline
  strokes.push({
    id: makeId(),
    kind: "pencil",
    color: "#CB7857",
    width: 2.0,
    points: [data.centerLine[0], data.centerLine[1]],
  });

  // Division bands
  data.divisions.forEach((div) => {
    strokes.push({
      id: makeId(),
      kind: "pencil",
      color: config.color,
      width: div.index % 2 === 0 ? 1.8 : 1.2,
      points: [
        { x: canvasWidth * 0.15, y: div.y },
        { x: canvasWidth * 0.85, y: div.y },
      ],
    });
  });

  // Skeletal lines (if in skeletal mode or proportions mode)
  if (config.mode === "skeletal" || config.mode === "proportions") {
    data.skeletalLines.forEach((skel) => {
      if (skel.type === "line") {
        strokes.push({
          id: makeId(),
          kind: "pencil",
          color: "#596A94",
          width: 2.2,
          points: skel.points,
        });
      } else if (skel.type === "ellipse" && skel.radius) {
        const circlePts: StrokePoint[] = [];
        const steps = 24;
        const origin = skel.points[0]!;
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          circlePts.push({
            x: origin.x + Math.cos(angle) * skel.radius,
            y: origin.y + Math.sin(angle) * skel.radius,
          });
        }
        strokes.push({
          id: makeId(),
          kind: "pencil",
          color: "#596A94",
          width: 1.8,
          points: circlePts,
        });
      }
    });
  }

  // Muscular contours (if in muscular mode or showMuscles enabled)
  if (config.mode === "muscular" || config.showMuscles) {
    data.muscles.forEach((m) => {
      strokes.push({
        id: makeId(),
        kind: "pencil",
        color: "#28594B",
        width: 1.8,
        points: m.points,
      });
    });
  }

  // Facial proportions
  if (config.mode === "facial") {
    data.facialProportions.forEach((face) => {
      strokes.push({
        id: makeId(),
        kind: "pencil",
        color: "#8B4F69",
        width: 1.6,
        points: [face.line[0], face.line[1]],
      });
    });
  }

  return strokes;
}
