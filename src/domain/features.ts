import type { ToolId } from "./types";

export const FEATURES: Array<{
  id: ToolId;
  title: string;
  detail: string;
  icon: string;
}> = [
  { id: "loomis", title: "AI Loomis Studio", detail: "8-stage head construction with 3D orientation controls.", icon: "target" },
  { id: "steps", title: "Step-by-Step Guide", detail: "Turn a reference into a calm progressive drawing plan.", icon: "list" },
  { id: "sketch", title: "Sketch Converter", detail: "Make a clean tonal pencil study locally.", icon: "pencil" },
  { id: "tracing", title: "Tracing Studio", detail: "High-contrast contour & lightbox tracing on canvas.", icon: "scan" },
  { id: "grid", title: "Smart Grid Studio", detail: "Proportional, diagonals, rule of thirds, and golden grids.", icon: "grid" },
  { id: "analyzer", title: "Drawing Analyzer", detail: "Review value balance, light mass, and shadow ratio.", icon: "chart" },
  { id: "shading", title: "Shading Studio", detail: "360° light direction dial & 5-value form shading scale.", icon: "sun" },
  { id: "color", title: "Color Studio", detail: "Dominant 6-color palette extraction with hex copy.", icon: "palette" },
  { id: "anatomy", title: "Anatomy Academy", detail: "8-head canonical figure, skeletal & facial landmark guides.", icon: "user" },
  { id: "perspective", title: "Perspective Assistant", detail: "1-point, 2-point, and 3-point dynamic converging grids.", icon: "box" },
  { id: "compare", title: "Reference vs Drawing", detail: "Split-screen, onion skinning & error difference heatmap.", icon: "copy" },
  { id: "library", title: "Reference Library", detail: "Curated, copyright-free reference catalog ready to trace.", icon: "image" },
  { id: "learning", title: "Learning & Challenges", detail: "Structured drawing curriculum & daily timed challenges.", icon: "book-open" },
];

export const TOOL_STEPS = [
  "Block in the biggest silhouette.",
  "Mark the center line and major landmarks.",
  "Compare width and height before adding details.",
  "Group the shadow shapes into a few large masses.",
  "Refine only after the proportions feel right.",
];
