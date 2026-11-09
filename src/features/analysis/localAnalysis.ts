import { AlphaType, ColorType, Skia } from "@shopify/react-native-skia";
import type { ToolId } from "../../domain/types";
import { TOOL_STEPS } from "../../domain/features";

export type AnalysisResult = {
  image: ReturnType<typeof Skia.Image.MakeNull> | null;
  note: string;
  palette: string[];
};

const clampByte = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

function grayAt(pixels: Uint8Array | Float32Array, index: number) {
  return pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
}

export function analyzePixels(tool: ToolId, source: Uint8Array | Float32Array, width: number, height: number, originalWidth: number, originalHeight: number): AnalysisResult {
  const pixels = new Uint8Array(source.length);
  for (let i = 0; i < source.length; i++) pixels[i] = clampByte(source[i]);
  const count = Math.floor(source.length / 4);
  let total = 0;
  let deepShadow = 0;
  let highlights = 0;
  const paletteBuckets = new Map<string, number>();

  if (tool === "steps") return { image: null, note: TOOL_STEPS.map((step, i) => `${i + 1}. ${step}`).join("\n"), palette: [] };

  if (tool === "sketch" || tool === "tracing" || tool === "shading" || tool === "analyzer") {
    for (let i = 0; i < source.length; i += 4) {
      const grayRaw = grayAt(source, i);
      const gray = tool === "analyzer" ? grayRaw : Math.round(grayRaw);
      total += gray;
      if (gray < (tool === "analyzer" ? 72 : 76)) deepShadow++;
      if (gray > (tool === "analyzer" ? 212 : 205)) highlights++;

      if (tool === "sketch") {
        const edge = i >= width * 4
          ? Math.abs(gray - grayAt(source, i - width * 4))
          : 0;
        const value = Math.min(255, 242 - gray * 0.42 + edge * 0.72);
        pixels[i] = pixels[i + 1] = pixels[i + 2] = clampByte(value);
      } else if (tool === "tracing") {
        const value = gray < 132 ? 30 : 245;
        pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
      } else {
        pixels[i] = pixels[i + 1] = pixels[i + 2] = clampByte(gray);
        if (tool === "shading") {
          const x = (i / 4) % width;
          const y = Math.floor(i / 4 / width);
          const t = Math.min(1, (x * width + y * height) / Math.max(1, width * width + height * height));
          if (t < 0.48) {
            const alpha = 0.28 * (1 - t / 0.48);
            pixels[i] = clampByte(pixels[i] * (1 - alpha) + 249 * alpha);
            pixels[i + 1] = clampByte(pixels[i + 1] * (1 - alpha) + 204 * alpha);
            pixels[i + 2] = clampByte(pixels[i + 2] * (1 - alpha) + 125 * alpha);
          } else {
            const alpha = 0.20 * ((t - 0.48) / 0.52);
            pixels[i] = clampByte(pixels[i] * (1 - alpha) + 38 * alpha);
            pixels[i + 1] = clampByte(pixels[i + 1] * (1 - alpha) + 56 * alpha);
            pixels[i + 2] = clampByte(pixels[i + 2] * (1 - alpha) + 75 * alpha);
          }
        }
      }
    }
  } else if (tool === "color") {
    const step = Math.max(4, Math.floor(source.length / 12000 / 4) * 4);
    for (let i = 0; i < source.length; i += step) {
      const channels = [source[i], source[i + 1], source[i + 2]].map((value) => Math.min(255, Math.round(value / 32) * 32));
      const hex = `#${channels.map((value) => clampByte(value).toString(16).padStart(2, "0")).join("")}`;
      paletteBuckets.set(hex, (paletteBuckets.get(hex) ?? 0) + 1);
    }
  }

  let note = "";
  let palette: string[] = [];
  if (tool === "analyzer") {
    note = `Image ${originalWidth} × ${originalHeight} px · mean value ${Math.round(total / count)} / 255 · shadow mass ${Math.round(deepShadow / count * 100)}% · light mass ${Math.round(highlights / count * 100)}%. Check the large shapes first, then compare edges and focal contrast.`;
  } else if (tool === "sketch" || tool === "tracing" || tool === "shading") {
    note = `Average value ${Math.round(total / count)} / 255 · ${Math.round(deepShadow / count * 100)}% deep shadow · ${Math.round(highlights / count * 100)}% highlights`;
  } else if (tool === "grid") {
    note = "A 4 × 4 proportional grid is ready. Follow one section at a time, checking where important edges cross the lines.";
  } else if (tool === "loomis") {
    note = "A starter construction guide is placed over the reference. Adjust the sphere and centerline to match the head turn before adding features.";
  } else if (tool === "color") {
    palette = [...paletteBuckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([hex]) => hex);
    note = "Sample a large shape from the image, then choose one warmer or cooler color for the focal area.";
  }

  const filtered = tool === "sketch" || tool === "tracing" || tool === "shading";
  if (!filtered) return { image: null, note, palette };
  const imageData = Skia.Data.fromBytes(pixels);
  const resultImage = Skia.Image.MakeImage(
    { width, height, alphaType: AlphaType.Unpremul, colorType: ColorType.RGBA_8888 },
    imageData,
    width * 4,
  );
  return { image: resultImage, note, palette };
}
