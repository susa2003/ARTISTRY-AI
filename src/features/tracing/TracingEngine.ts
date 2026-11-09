import { AlphaType, ColorType, Skia } from "@shopify/react-native-skia";

export type TracingMode = "natural" | "contrast" | "inverted" | "lightbox";

export type TracingConfig = {
  mode: TracingMode;
  opacity: number;         // 0.05 to 1.0 (default 0.5)
  threshold: number;       // 30 to 220 (default 128)
  invert: boolean;         // Invert black/white
  edgeBoost: boolean;      // Sobel / difference edge enhancement
};

export const DEFAULT_TRACING_CONFIG: TracingConfig = {
  mode: "contrast",
  opacity: 0.55,
  threshold: 128,
  invert: false,
  edgeBoost: true,
};

const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

function gray(r: number, g: number, b: number) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Processes source image pixels for high-clarity tracing.
 */
export function processTracingImage(
  source: Uint8Array | Float32Array,
  width: number,
  height: number,
  config: TracingConfig
): ReturnType<typeof Skia.Image.MakeImage> | null {
  const pixels = new Uint8Array(source.length);

  for (let i = 0; i < source.length; i += 4) {
    const r = source[i]!;
    const g = source[i + 1]!;
    const b = source[i + 2]!;
    const a = source[i + 3]!;
    const luma = gray(r, g, b);

    if (config.mode === "natural") {
      // Natural copy
      pixels[i] = clampByte(r);
      pixels[i + 1] = clampByte(g);
      pixels[i + 2] = clampByte(b);
      pixels[i + 3] = clampByte(a);
    } else if (config.mode === "contrast") {
      // High-contrast binarization
      let edgeBonus = 0;
      if (config.edgeBoost && i >= width * 4) {
        const topLuma = gray(source[i - width * 4]!, source[i - width * 4 + 1]!, source[i - width * 4 + 2]!);
        edgeBonus = Math.abs(luma - topLuma) * 0.8;
      }

      const effectiveLuma = luma - edgeBonus;
      const isDark = effectiveLuma < config.threshold;
      let val = isDark ? 25 : 245;
      if (config.invert) val = 255 - val;

      pixels[i] = val;
      pixels[i + 1] = val;
      pixels[i + 2] = val;
      pixels[i + 3] = isDark ? 255 : 30; // Transparent background for light areas
    } else if (config.mode === "inverted") {
      // Chalkboard inverted lines
      const val = 255 - clampByte(luma);
      pixels[i] = val;
      pixels[i + 1] = val;
      pixels[i + 2] = val;
      pixels[i + 3] = 255;
    } else if (config.mode === "lightbox") {
      // Lightbox: high key with boosted dark lines
      const boosted = luma < 90 ? luma * 0.4 : Math.min(255, luma * 1.35 + 20);
      pixels[i] = clampByte(boosted);
      pixels[i + 1] = clampByte(boosted);
      pixels[i + 2] = clampByte(boosted);
      pixels[i + 3] = 255;
    }
  }

  const imageData = Skia.Data.fromBytes(pixels);
  return Skia.Image.MakeImage(
    { width, height, alphaType: AlphaType.Unpremul, colorType: ColorType.RGBA_8888 },
    imageData,
    width * 4
  );
}
