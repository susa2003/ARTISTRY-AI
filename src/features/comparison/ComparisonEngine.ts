import { AlphaType, ColorType, Skia } from "@shopify/react-native-skia";

export type ComparisonMode = "split" | "onion" | "difference" | "plumb";

export type ComparisonConfig = {
  mode: ComparisonMode;
  splitPosition: number; // 0.0 to 1.0 (divider line position)
  onionOpacity: number;  // 0.0 to 1.0 (transparency of reference over drawing)
  showPlumbLines: boolean;
  plumbX: number;        // Plumb line X (0.0 to 1.0)
  plumbY: number;        // Plumb line Y (0.0 to 1.0)
};

export const DEFAULT_COMPARISON_CONFIG: ComparisonConfig = {
  mode: "split",
  splitPosition: 0.5,
  onionOpacity: 0.5,
  showPlumbLines: true,
  plumbX: 0.5,
  plumbY: 0.45,
};

/**
 * Calculates visual difference map between reference contours and artist's drawn strokes.
 * Non-matching regions are highlighted in terracotta/red to indicate line drift.
 */
export function calculateDifferenceMap(
  referencePixels: Uint8Array | Float32Array,
  drawingPixels: Uint8Array | Float32Array,
  width: number,
  height: number
): { image: ReturnType<typeof Skia.Image.MakeImage> | null; matchScore: number } {
  const length = Math.min(referencePixels.length, drawingPixels.length);
  const diffPixels = new Uint8Array(length);
  let totalDrawn = 0;
  let matchingDrawn = 0;

  for (let i = 0; i < length; i += 4) {
    const rRef = referencePixels[i]!;
    const gRef = referencePixels[i + 1]!;
    const bRef = referencePixels[i + 2]!;
    const lumaRef = 0.299 * rRef + 0.587 * gRef + 0.114 * bRef;

    const rDraw = drawingPixels[i]!;
    const gDraw = drawingPixels[i + 1]!;
    const bDraw = drawingPixels[i + 2]!;
    const aDraw = drawingPixels[i + 3]!;
    const lumaDraw = 0.299 * rDraw + 0.587 * gDraw + 0.114 * bDraw;

    // Check if user drew a stroke here (dark pixels with alpha)
    const isDrawn = aDraw > 50 && lumaDraw < 200;
    const isRefEdge = lumaRef < 120; // Reference feature edge

    if (isDrawn) {
      totalDrawn++;
      if (isRefEdge) {
        matchingDrawn++;
        // Green: accurate stroke
        diffPixels[i] = 40;
        diffPixels[i + 1] = 160;
        diffPixels[i + 2] = 80;
        diffPixels[i + 3] = 255;
      } else {
        // Red/Terracotta: stroke deviates from reference edge
        diffPixels[i] = 210;
        diffPixels[i + 1] = 60;
        diffPixels[i + 2] = 50;
        diffPixels[i + 3] = 255;
      }
    } else {
      // Background: faded reference
      diffPixels[i] = Math.round(lumaRef * 0.85);
      diffPixels[i + 1] = Math.round(lumaRef * 0.85);
      diffPixels[i + 2] = Math.round(lumaRef * 0.85);
      diffPixels[i + 3] = 180;
    }
  }

  const matchScore = totalDrawn > 0 ? Math.round((matchingDrawn / totalDrawn) * 100) : 100;
  const imageData = Skia.Data.fromBytes(diffPixels);
  const image = Skia.Image.MakeImage(
    { width, height, alphaType: AlphaType.Unpremul, colorType: ColorType.RGBA_8888 },
    imageData,
    width * 4
  );

  return { image, matchScore };
}
