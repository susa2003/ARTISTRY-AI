export type Lesson = {
  id: string;
  number: number;
  title: string;
  category: "fundamentals" | "anatomy" | "loomis" | "shading" | "perspective";
  estimatedMinutes: number;
  objective: string;
  principles: string[];
  exercises: string[];
};

export const ART_LESSONS: Lesson[] = [
  {
    id: "lesson-01",
    number: 1,
    title: "Line Confidence & Ghosting",
    category: "fundamentals",
    estimatedMinutes: 15,
    objective: "Draw clean, deliberate, unhesitant lines from the shoulder instead of the wrist.",
    principles: [
      "Ghost the stroke: trace the motion in the air above the screen 2–3 times before contacting.",
      "Draw with shoulder and elbow joints to maintain straight trajectory.",
      "Avoid 'hairy' scratchy lines; commit to single continuous strokes.",
    ],
    exercises: [
      "Place two dots across the canvas and connect them with one swift stroke.",
      "Draw 10 parallel diagonal hatching lines maintaining uniform 3mm spacing.",
    ],
  },
  {
    id: "lesson-02",
    number: 2,
    title: "The Andrew Loomis Cranium Method",
    category: "loomis",
    estimatedMinutes: 25,
    objective: "Construct the head in 3D space using the ball-and-plane method.",
    principles: [
      "The cranial sphere represents the permanent solid mass of the skull.",
      "The brow line acts as the equator; tilt dictates pitch.",
      "The side plane is cut flat by an ellipse that measures 2/3 the total height.",
    ],
    exercises: [
      "Draw 5 cranium spheres from different yaw and pitch angles.",
      "Add the brow line, centerline, and side plane disc to each.",
    ],
  },
  {
    id: "lesson-03",
    number: 3,
    title: "The 8-Head Human Proportion Cannon",
    category: "anatomy",
    estimatedMinutes: 20,
    objective: "Master canonical body divisions for accurate standing figures.",
    principles: [
      "The height of the head is the fundamental measuring unit.",
      "The groin/pubic arch divides the body exactly into two equal halves (4 heads each).",
      "Shoulder width equals 2 full head heights; pelvic width equals 1.5 head heights.",
    ],
    exercises: [
      "Mark 8 equal vertical divisions on a blank canvas.",
      "Block in head, ribcage, pelvis, and leg joints conforming to the landmarks.",
    ],
  },
  {
    id: "lesson-04",
    number: 4,
    title: "The 5-Value Form Shading Scale",
    category: "shading",
    estimatedMinutes: 20,
    objective: "Organize lighting into five distinct, non-overlapping tonal masses.",
    principles: [
      "Never blend light values into shadow values; keep the terminator crisp.",
      "Reflected light is always darker than the darkest light value.",
      "Group shadows together first before modeling halftones.",
    ],
    exercises: [
      "Shade a sphere using all 5 distinct tonal steps without gradient blurring.",
    ],
  },
  {
    id: "lesson-05",
    number: 5,
    title: "Two-Point Perspective for Objects & Architecture",
    category: "perspective",
    estimatedMinutes: 25,
    objective: "Construct boxes and forms in two-point perspective using vanishing points.",
    principles: [
      "All horizontal edges converge towards either the Left or Right Vanishing Point.",
      "All vertical edges remain parallel to each other and perpendicular to the horizon.",
      "The horizon line strictly represents the artist's eye level.",
    ],
    exercises: [
      "Set two vanishing points on the horizon line and draw three stacked boxes.",
    ],
  },
  {
    id: "lesson-06",
    number: 6,
    title: "Sight-Size Comparison & Contour Verification",
    category: "fundamentals",
    estimatedMinutes: 20,
    objective: "Verify drawing accuracy using horizontal and vertical plumb lines against a reference.",
    principles: [
      "Use plumb lines to check vertical alignment between key landmarks (e.g. tear duct to nostril wing).",
      "Check negative space silhouettes to catch contour deviations before detailing.",
      "Compare drawing in 50/50 split mode to instantly detect proportional drift.",
    ],
    exercises: [
      "Use Reference vs My Drawing split-screen to overlay your sketch over a classical portrait reference.",
      "Inspect the line-accuracy heatmap and correct any red deviating contours.",
    ],
  },
];

export type DailyChallenge = {
  date: string; // YYYY-MM-DD
  dayOfWeek?: number;
  title: string;
  theme: string;
  timeLimitMinutes: number;
  prompt: string;
  rubric: string[];
};

export const DAILY_CHALLENGES = [
  {
    dayOfWeek: 0,
    title: "Sunday Classical Bust Study",
    theme: "Loomis Construction",
    timeLimitMinutes: 20,
    prompt: "Construct a 3/4 turn head study focusing strictly on the cranial sphere and facial thirds.",
    rubric: ["Cranium proportion", "Brow tilt accuracy", "Facial thirds division"],
  },
  {
    dayOfWeek: 1,
    title: "Monday Gesture Sprint",
    theme: "Line Confidence",
    timeLimitMinutes: 10,
    prompt: "Execute 10 swift, single-stroke gesture sketches capturing dynamic silhouette movement.",
    rubric: ["No scratchy lines", "Clear line of action", "Fluid rhythm"],
  },
  {
    dayOfWeek: 2,
    title: "Tuesday 5-Value Sphere Study",
    theme: "Form Shading",
    timeLimitMinutes: 15,
    prompt: "Render a geometric sphere showing Highlight, Halftone, Core Shadow, Reflected Light, and Cast Shadow.",
    rubric: ["Crisp terminator", "Dark reflected light", "Definite cast shadow"],
  },
  {
    dayOfWeek: 3,
    title: "Wednesday Perspective City Block",
    theme: "2-Point Perspective",
    timeLimitMinutes: 20,
    prompt: "Draw three building blocks on a corner using 2 vanishing points with window grid guides.",
    rubric: ["True vertical lines", "Clean convergence to VPs", "Consistent horizon"],
  },
  {
    dayOfWeek: 4,
    title: "Thursday Anatomical Hand Grip",
    theme: "Anatomy",
    timeLimitMinutes: 15,
    prompt: "Study your non-drawing hand holding a cylindrical object. Block in the palm plane first.",
    rubric: ["Palm box proportion", "Knuckle arch alignment", "Foreshortened fingers"],
  },
  {
    dayOfWeek: 5,
    title: "Friday High-Contrast Silhouette",
    theme: "Tracing & Contour",
    timeLimitMinutes: 10,
    prompt: "Practice high-contrast tracing of a profile reference, focusing on negative space shapes.",
    rubric: ["Accurate negative spaces", "Confident outer contour", "Feature placement"],
  },
  {
    dayOfWeek: 6,
    title: "Saturday Master Study Reproduction",
    theme: "Master Studies",
    timeLimitMinutes: 25,
    prompt: "Reproduce the facial structure of a Renaissance sculpture using the Smart Grid for proportion.",
    rubric: ["Proportional grid accuracy", "Value harmony", "Refined contour"],
  },
];

export function getTodayChallenge(): DailyChallenge {
  const dateStr = new Date().toISOString().split("T")[0]!;
  const day = new Date().getDay();
  const selected = DAILY_CHALLENGES[day % DAILY_CHALLENGES.length]!;
  return {
    date: dateStr,
    ...selected,
  };
}
