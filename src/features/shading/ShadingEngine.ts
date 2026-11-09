import { AlphaType, ColorType, Skia } from "@shopify/react-native-skia";

export type ShadingConfig = {
  lightAngle: number;       // 0 to 360 degrees
  lightElevation: number;   // 15 to 75 degrees (angle above horizontal)
  valueSteps: 3 | 5;        // 3-value study or 5-value scale
  showTerminator: boolean;  // Draw core shadow terminator line
  showLightRay: boolean;    // Draw directional light arrow
  contrast: number;         // Contrast boost multiplier (0.8 to 1.6)
};

export const DEFAULT_SHADING_CONFIG: ShadingConfig = {
  lightAngle: 45,
  lightElevation: 45,
  valueSteps: 5,
  showTerminator: true,
  showLightRay: true,
  contrast: 1.15,
};

export const FIVE_VALUES = [
  { level: 1, name: "Highlight", color: "#F7F5EB", range: "220–255" },
  { level: 2, name: "Midtone / Halftone", color: "#C5C2B4", range: "160–219" },
  { level: 3, name: "Core Shadow", color: "#6A675B", range: "90–159" },
  { level: 4, name: "Reflected Light", color: "#8E8B7E", range: "110–140 (In shadow)" },
  { level: 5, name: "Cast Shadow / Occlusion", color: "#22211C", range: "0–89" },
];

const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

function gray(r: number, g: number, b: number) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Quantizes image into 5 canonical drawing values and applies directional form light gradient.
 */
export function processShadingImage(
  source: Uint8Array | Float32Array,
  width: number,
  height: number,
  config: ShadingConfig
): { image: ReturnType<typeof Skia.Image.MakeImage> | null; stats: { shadows: number; midtones: number; highlights: number } } {
  const pixels = new Uint8Array(source.length);
  const rad = (config.lightAngle * Math.PI) / 180;
  const lx = Math.cos(rad);
  const ly = Math.sin(rad);

  let shadowCount = 0;
  let midtoneCount = 0;
  let highlightCount = 0;
  const totalPixels = Math.floor(source.length / 4);

  for (let i = 0; i < source.length; i += 4) {
    const r = source[i]!;
    const g = source[i + 1]!;
    const b = source[i + 2]!;
    let luma = gray(r, g, b);

    // Apply contrast adjustment
    luma = Math.max(0, Math.min(255, (luma - 128) * config.contrast + 128));

    // Directional light bias based on lightAngle
    const px = ((i / 4) % width) / width - 0.5;
    const py = Math.floor(i / 4 / width) / height - 0.5;
    const lightDot = px * lx + py * ly; // -0.7 to +0.7
    const biasedLuma = Math.max(0, Math.min(255, luma + lightDot * 40));

    let val = 128;
    if (config.valueSteps === 5) {
      if (biasedLuma < 60) {
        val = 30; // Cast shadow
        shadowCount++;
      } else if (biasedLuma < 110) {
        val = 85; // Core shadow
        shadowCount++;
      } else if (biasedLuma < 170) {
        val = 145; // Halftone
        midtoneCount++;
      } else if (biasedLuma < 225) {
        val = 205; // Light
        highlightCount++;
      } else {
        val = 250; // Specular highlight
        highlightCount++;
      }
    } else {
      // 3-value posterization
      if (biasedLuma < 90) {
        val = 40;
        shadowCount++;
      } else if (biasedLuma < 185) {
        val = 150;
        midtoneCount++;
      } else {
        val = 245;
        highlightCount++;
      }
    }

    // Warm light on highlights, cool tone on shadows
    if (val > 180) {
      pixels[i] = clampByte(val * 1.02);     // Slightly warm red
      pixels[i + 1] = clampByte(val * 0.98); // Soft gold green
      pixels[i + 2] = clampByte(val * 0.92); // Reduced blue
    } else if (val < 100) {
      pixels[i] = clampByte(val * 0.90);     // Reduced red
      pixels[i + 1] = clampByte(val * 0.94); // Muted green
      pixels[i + 2] = clampByte(val * 1.08); // Cool blue shadow
    } else {
      pixels[i] = val;
      pixels[i + 1] = val;
      pixels[i + 2] = val;
    }
    pixels[i + 3] = 255;
  }

  const imageData = Skia.Data.fromBytes(pixels);
  const image = Skia.Image.MakeImage(
    { width, height, alphaType: AlphaType.Unpremul, colorType: ColorType.RGBA_8888 },
    imageData,
    width * 4
  );

  return {
    image,
    stats: {
      shadows: Math.round((shadowCount / totalPixels) * 100),
      midtones: Math.round((midtoneCount / totalPixels) * 100),
      highlights: Math.round((highlightCount / totalPixels) * 100),
    },
  };
}
