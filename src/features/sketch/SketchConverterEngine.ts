import type { Stroke } from "../../domain/types";
import { aiService } from "../../services/ai/AIServiceManager";
import type { SketchConvertOptions, SketchStyle } from "../../services/ai/types";
import { createId } from "../../storage/imageFiles";

export const SKETCH_STYLES: Array<{ id: SketchStyle; name: string; description: string }> = [
  { id: "graphite", name: "Graphite Pencil", description: "Soft 2B/4B tonal transitions with cross-hatching." },
  { id: "charcoal", name: "Raw Charcoal", description: "Deep matte black values and smudged velvety darks." },
  { id: "ink", name: "Dip Pen & Ink", description: "High-contrast clean contour lines and stippling." },
  { id: "lineart", name: "Clean Line Art", description: "Uniform digital ink outlines ready for coloring." },
  { id: "coloredpencil", name: "Colored Pencil", description: "Vibrant polychromos wax grain with layered color." },
  { id: "watercolor", name: "Watercolor Wash", description: "Pigment pooling, soft wet-on-wet tonal blooms." },
  { id: "cartoon", name: "Graphic Cartoon", description: "Bold dynamic cel boundaries with flat tonal shapes." },
  { id: "realistic", name: "Academic Study", description: "Precise anatomical edge control with 5-step shading." },
];

export const DEFAULT_SKETCH_OPTIONS: SketchConvertOptions = {
  style: "graphite",
  intensity: 75,
  contrast: 60,
  brightness: 50,
  detailLevel: 70,
  edgeStrength: 65,
  grayscale: true,
  paperTexture: true,
};

export async function processSketch(imageUri: string, options: SketchConvertOptions = DEFAULT_SKETCH_OPTIONS): Promise<string> {
  return aiService.convertSketch(imageUri, options);
}

export function convertSketchGuideToStrokes(width: number, height: number, style: SketchStyle = "graphite"): Stroke[] {
  const strokes: Stroke[] = [];
  const color = style === "charcoal" ? "#1A1A1A" : style === "ink" ? "#0F1412" : "#4A4D4A";
  const strokeWidth = style === "charcoal" ? 4 : style === "ink" ? 2 : 2.5;

  // Outer form framing strokes
  strokes.push({
    id: createId(),
    kind: "pencil",
    color,
    width: strokeWidth,
    points: [
      { x: width * 0.2, y: height * 0.2 },
      { x: width * 0.8, y: height * 0.2 },
      { x: width * 0.8, y: height * 0.8 },
      { x: width * 0.2, y: height * 0.8 },
      { x: width * 0.2, y: height * 0.2 },
    ],
  });

  // Cross hatching lines for tone
  for (let i = 0; i < 5; i++) {
    const offset = i * (width * 0.08);
    strokes.push({
      id: createId(),
      kind: "pencil",
      color,
      width: Math.max(1, strokeWidth - 1),
      points: [
        { x: width * 0.25 + offset, y: height * 0.65 },
        { x: width * 0.35 + offset, y: height * 0.78 },
      ],
    });
  }

  return strokes;
}
