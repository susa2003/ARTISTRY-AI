import type { ToolId } from "./types";

export const FEATURES: Array<{
  id: ToolId;
  title: string;
  detail: string;
  icon: string;
  category?: "core" | "ai-studio" | "assistant" | "processing" | "pro";
}> = [
  // Original Core Studios
  { id: "loomis", title: "AI Loomis Studio", detail: "8-stage head construction with 3D orientation controls.", icon: "target", category: "core" },
  { id: "steps", title: "Step-by-Step Guide", detail: "Turn a reference into a calm progressive drawing plan.", icon: "list", category: "core" },
  { id: "tracing", title: "Tracing Studio", detail: "High-contrast contour & lightbox tracing on canvas.", icon: "scan", category: "core" },
  { id: "grid", title: "Smart Grid Studio", detail: "Proportional, diagonals, rule of thirds, and golden grids.", icon: "grid", category: "core" },
  { id: "shading", title: "Shading Studio", detail: "360° light direction dial & 5-value form shading scale.", icon: "sun", category: "core" },
  { id: "color", title: "Color Studio", detail: "Dominant 6-color palette extraction with hex copy.", icon: "palette", category: "core" },
  { id: "anatomy", title: "Anatomy Academy", detail: "8-head canonical figure, skeletal & facial landmark guides.", icon: "user", category: "core" },
  { id: "perspective", title: "Perspective Assistant", detail: "1-point, 2-point, and 3-point dynamic converging grids.", icon: "box", category: "core" },
  { id: "compare", title: "Reference vs Drawing", detail: "Split-screen, onion skinning & error difference heatmap.", icon: "copy", category: "core" },
  { id: "library", title: "Reference Library", detail: "Curated, copyright-free reference catalog ready to trace.", icon: "image", category: "core" },
  { id: "learning", title: "Learning & Challenges", detail: "Structured drawing curriculum & daily timed challenges.", icon: "book-open", category: "core" },

  // Group A — Original Four AI Features
  { id: "sketch", title: "AI Sketch Converter", detail: "8 artistic styles (Graphite, Charcoal, Ink, Watercolor) with granular sliders.", icon: "pencil", category: "ai-studio" },
  { id: "analyzer", title: "AI Drawing Analyzer", detail: "Multi-factor assessment: proportions, alignment, perspective, composition & shading.", icon: "chart", category: "ai-studio" },
  { id: "generator", title: "AI Reference Generator", detail: "Generate artistic references across 11 categories with offline vector fallbacks.", icon: "sparkles", category: "ai-studio" },
  { id: "progress", title: "Drawing Progress AI", detail: "Skill development radar, milestone timeline & weakness-targeted exercise plans.", icon: "trending-up", category: "ai-studio" },

  // Group B — Advanced AI Drawing Features
  { id: "pose", title: "AI Pose & Gesture Coach", detail: "33-point skeletal landmark detection, line of action, & proportion guides.", icon: "activity", category: "assistant" },
  { id: "handfoot", title: "AI Hand & Foot Assistant", detail: "21 hand landmarks, foot arches, bone segment proportions & mistake alerts.", icon: "hand", category: "assistant" },
  { id: "lighting", title: "AI Lighting Predictor", detail: "Directional light vector detection, tonal map & graphite grade recommendations.", icon: "sun-dim", category: "assistant" },
  { id: "composition", title: "AI Composition Coach", detail: "Rule of thirds, golden spiral, visual balance & negative-space analysis.", icon: "layout", category: "assistant" },

  // Group C — Smart Image Processing
  { id: "linecleaner", title: "AI Line Art Cleaner", detail: "Eliminate paper grain, scan artifacts & isolate crisp line work.", icon: "feather", category: "processing" },
  { id: "segmentation", title: "AI Smart Segmentation", detail: "Separate subject from background into an isolated, transparent layer.", icon: "scissors", category: "processing" },
  { id: "colorrec", title: "AI Color Recommender", detail: "Extract harmonic palettes: complementary, analogous, triadic & skin tones.", icon: "droplet", category: "processing" },
  { id: "turnaround", title: "AI Multi-Angle Creator", detail: "Front, 3/4, profile and rear turnaround model sheets with height guides.", icon: "refresh-cw", category: "processing" },

  // Group D — Professional Artist Tools
  { id: "replay", title: "Smart Stroke Replay", detail: "Step-by-step playback with speed controls (0.5x–5x) and timelapse scrub.", icon: "play-circle", category: "pro" },
  { id: "mistakes", title: "AI Mistake Detector", detail: "Identify uneven eyes, facial tilt, perspective drift & anatomy flaws.", icon: "alert-circle", category: "pro" },
  { id: "mentor", title: "AI Art Mentor", detail: "Personalized advice, technique explanations & adaptive curriculum.", icon: "award", category: "pro" },
  { id: "vectorizer", title: "Sketch-to-Vector Converter", detail: "Convert raster sketches to scalable Bézier SVG vector paths.", icon: "vector", category: "pro" },
];

export const TOOL_STEPS = [
  "Block in the biggest silhouette.",
  "Mark the center line and major landmarks.",
  "Compare width and height before adding details.",
  "Group the shadow shapes into a few large masses.",
  "Refine only after the proportions feel right.",
];
