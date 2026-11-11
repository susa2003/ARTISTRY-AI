/**
 * ARTISTRY AI — Real GPU-Based Whiteout / Lightbox Shader & Multi-Pass Fallback
 * 
 * Provides hardware-accelerated reference image adjustments and a specialized
 * Lightbox / Whiteout effect designed specifically for traditional artists drawing on physical paper.
 * 
 * ARCHITECTURE OVERVIEW:
 * 1. Primary GPU Pipeline (SkSL Runtime Effect):
 *    - Per-pixel non-linear dark contour protection using smoothstep curve on pixel darkness.
 *    - Dark edges (pencil graphite, pen ink, linework) resist bleaching by up to 75%.
 *    - Paper background and midtones bleach towards pure paper-white (1.0, 1.0, 1.0).
 *    - Performed directly on the GPU in a single pass.
 * 
 * 2. Secondary Multi-Pass Fallback Pipeline (Supported Alternative):
 *    - When SkSL RuntimeEffect compilation fails or is unsupported on older GPUs/drivers.
 *    - Uses a two-pass compositing approach on the Skia Canvas:
 *      * Pass 1: Base adjusted image bleached with linear whiteout.
 *      * Pass 2: High-contrast contour-extraction pass blended with Skia `BlendMode.Multiply`.
 *    - Approximates non-linear contour protection by multiplying extracted dark lines back
 *      onto the bleached ground, leaving pure white paper areas unaffected.
 * 
 * 3. Conservative Linear Fallback (Single-Pass ColorMatrix):
 *    - Used when multi-pass composition is disabled or unavailable.
 *    - CAUTION: A single 4x5 ColorMatrix is a LINEAR affine transform. It applies uniform
 *      scalar bleaching across all pixels and CANNOT evaluate per-pixel non-linear contour
 *      protection. It has REDUCED contour-protection quality compared to the GPU shader.
 *    - Fully supports brightness, contrast, exposure (EV), saturation, grayscale, and opacity.
 */

import { Skia, type SkRuntimeEffect } from "@shopify/react-native-skia";
import type { ImageAdjustmentSettings } from "../../domain/overlayTypes";
import { getGrayscaleFactor } from "../../domain/overlayTypes";

export type WhiteoutPipelineMode =
  | "gpu_contour_aware"
  | "multi_pass_contour_aware"
  | "linear_color_matrix_fallback";

export type ContourProtectionQuality =
  | "full_gpu"
  | "multi_pass_approximated"
  | "none_linear_fallback";

export interface ShaderCapabilityInfo {
  mode: WhiteoutPipelineMode;
  hasGpuShader: boolean;
  hasContourProtection: boolean;
  contourProtectionQuality: ContourProtectionQuality;
  description: string;
}

export const WHITEOUT_SKSL = `
uniform shader image;
uniform float u_whiteout;      // 0.0 (natural) to 1.0 (pure bleached paper)
uniform float u_brightness;    // -1.0 to 1.0 (default 0.0)
uniform float u_contrast;      // 0.5 to 2.0 (default 1.0)
uniform float u_exposure;      // -2.0 to 2.0 (default 0.0, 2^exposure)
uniform float u_saturation;    // 0.0 to 2.0 (default 1.0)
uniform float u_grayscale;     // 0.0 to 1.0 (0-100%)
uniform float u_opacity;       // 0.0 to 1.0 (reference alpha)

half4 main(float2 coord) {
    half4 color = image.eval(coord);
    if (color.a <= 0.0) {
        return half4(0.0);
    }

    // Un-premultiply alpha for true color grading
    half3 rgb = color.rgb / max(color.a, 0.0001);

    // 1. Photographic exposure (f-stops: 2^exposure)
    rgb = rgb * exp2(u_exposure);

    // 2. Brightness offset
    rgb = rgb + half3(u_brightness);

    // 3. Contrast adjustment centered at 0.5 midpoint
    rgb = (rgb - 0.5) * u_contrast + 0.5;

    // 4. Perceptual luminance calculation (ITU-R BT.709)
    half luma = dot(rgb, half3(0.2126, 0.7152, 0.0722));

    // 5. Saturation & Grayscale
    half3 satRgb = mix(half3(luma), rgb, u_saturation);
    rgb = mix(satRgb, half3(luma), u_grayscale);

    // 6. Real Whiteout with Dark Contour Protection:
    // Calculate pixel darkness [0.0..1.0]
    half darkness = clamp(1.0 - luma, 0.0, 1.0);
    // Dark edges (graphite, ink, outlines) resist whiteout fading by up to 75%
    half contourProtection = smoothstep(0.20, 0.85, darkness) * 0.75;
    half effectiveWhiteout = clamp(u_whiteout * (1.0 - contourProtection), 0.0, 1.0);

    // Bleach towards physical drawing paper white
    rgb = mix(rgb, half3(1.0, 1.0, 1.0), effectiveWhiteout);
    rgb = clamp(rgb, 0.0, 1.0);

    // 7. Reference Image Opacity (distinct from overlay opacities)
    half finalAlpha = color.a * clamp(u_opacity, 0.0, 1.0);

    // Re-premultiply alpha for Skia renderer
    return half4(rgb * finalAlpha, finalAlpha);
}
`;

let cachedEffect: SkRuntimeEffect | null = null;
let effectAttempted = false;

/**
 * Retrieves the compiled SkSL runtime effect, caching the instance.
 * Gracefully returns null if Skia or runtime effects are unavailable.
 */
export function getWhiteoutRuntimeEffect(): SkRuntimeEffect | null {
  if (effectAttempted) {
    return cachedEffect;
  }
  effectAttempted = true;

  try {
    if (Skia?.RuntimeEffect?.Make) {
      cachedEffect = Skia.RuntimeEffect.Make(WHITEOUT_SKSL);
    }
  } catch {
    cachedEffect = null;
  }

  return cachedEffect;
}

/**
 * Checks whether the GPU-based SkSL whiteout shader is supported and compiled.
 */
export function isWhiteoutShaderSupported(): boolean {
  return getWhiteoutRuntimeEffect() !== null;
}

/**
 * Resets the runtime effect cache (useful for automated testing and driver re-init).
 */
export function resetRuntimeEffectCache(): void {
  cachedEffect = null;
  effectAttempted = false;
}

/**
 * Returns diagnostic metadata regarding current shader pipeline capabilities.
 */
export function getShaderCapabilityInfo(
  preferMultiPass: boolean = true,
  simulateGpuUnavailable: boolean = false
): ShaderCapabilityInfo {
  const hasGpu = !simulateGpuUnavailable && isWhiteoutShaderSupported();
  if (hasGpu) {
    return {
      mode: "gpu_contour_aware",
      hasGpuShader: true,
      hasContourProtection: true,
      contourProtectionQuality: "full_gpu",
      description: "Hardware GPU SkSL shader active with per-pixel non-linear smoothstep contour protection.",
    };
  }

  if (preferMultiPass) {
    return {
      mode: "multi_pass_contour_aware",
      hasGpuShader: false,
      hasContourProtection: true,
      contourProtectionQuality: "multi_pass_approximated",
      description: "Multi-pass canvas compositing fallback active (Base Bleach + Multiply Contour Pass).",
    };
  }

  return {
    mode: "linear_color_matrix_fallback",
    hasGpuShader: false,
    hasContourProtection: false,
    contourProtectionQuality: "none_linear_fallback",
    description: "Single-pass linear 4x5 ColorMatrix fallback. Uniform scalar bleaching CANNOT evaluate per-pixel contour protection (reduced contour-protection quality).",
  };
}

/**
 * Creates uniform dictionary matching the SkSL shader parameters.
 */
export function createWhiteoutUniforms(adjustments: ImageAdjustmentSettings): Record<string, number> {
  return {
    u_whiteout: Math.max(0.0, Math.min(1.0, adjustments.whiteoutStrength ?? 0.0)),
    u_brightness: Math.max(-1.0, Math.min(1.0, adjustments.brightness ?? 0.0)),
    u_contrast: Math.max(0.1, Math.min(3.0, adjustments.contrast ?? 1.0)),
    u_exposure: Math.max(-3.0, Math.min(3.0, adjustments.exposure ?? 0.0)),
    u_saturation: Math.max(0.0, Math.min(3.0, adjustments.saturation ?? 1.0)),
    u_grayscale: getGrayscaleFactor(adjustments),
    u_opacity: Math.max(0.0, Math.min(1.0, adjustments.opacity ?? 1.0)),
  };
}

/**
 * Computes base 4x5 ColorMatrix (20 floats) that models
 * exposure, contrast, brightness, saturation, grayscale, and linear whiteout bleaching.
 * Used for Pass 1 of the multi-pass pipeline or conservative single-pass fallback.
 */
export function createBaseAdjustmentsColorMatrix(
  adjustments: ImageAdjustmentSettings,
  includeLinearBleach: boolean = true
): number[] {
  const brightness = Math.max(-1.0, Math.min(1.0, adjustments.brightness ?? 0.0));
  const contrast = Math.max(0.1, Math.min(3.0, adjustments.contrast ?? 1.0));
  const exposure = Math.max(-3.0, Math.min(3.0, adjustments.exposure ?? 0.0));
  const saturation = Math.max(0.0, Math.min(3.0, adjustments.saturation ?? 1.0));
  const grayscale = getGrayscaleFactor(adjustments);
  const whiteout = includeLinearBleach ? Math.max(0.0, Math.min(1.0, adjustments.whiteoutStrength ?? 0.0)) : 0.0;
  const opacity = Math.max(0.0, Math.min(1.0, adjustments.opacity ?? 1.0));

  // Photographic exposure factor (2^exposure)
  const expScale = Math.pow(2, exposure);

  // Effective saturation after grayscale factor
  const effectiveSat = saturation * (1.0 - grayscale);

  // ITU-R BT.709 photometric luminance coefficients
  const lr = 0.2126;
  const lg = 0.7152;
  const lb = 0.0722;

  // Saturation matrix elements
  const sr0 = (1.0 - effectiveSat) * lr + effectiveSat;
  const sr1 = (1.0 - effectiveSat) * lg;
  const sr2 = (1.0 - effectiveSat) * lb;

  const sg0 = (1.0 - effectiveSat) * lr;
  const sg1 = (1.0 - effectiveSat) * lg + effectiveSat;
  const sg2 = (1.0 - effectiveSat) * lb;

  const sb0 = (1.0 - effectiveSat) * lr;
  const sb1 = (1.0 - effectiveSat) * lg;
  const sb2 = (1.0 - effectiveSat) * lb + effectiveSat;

  // Multiplier combining contrast and exposure
  const scale = contrast * expScale;

  // Base translation from contrast centering at 0.5 and brightness
  const baseOffset = 0.5 * (1.0 - contrast) + brightness;

  // Linear whiteout bleaching scalar: rgb = rgb * (1 - w) + w
  const wMult = 1.0 - whiteout;
  const wAdd = whiteout;

  const r0 = sr0 * scale * wMult;
  const r1 = sr1 * scale * wMult;
  const r2 = sr2 * scale * wMult;
  const rOffset = baseOffset * wMult + wAdd;

  const g0 = sg0 * scale * wMult;
  const g1 = sg1 * scale * wMult;
  const g2 = sg2 * scale * wMult;
  const gOffset = baseOffset * wMult + wAdd;

  const b0 = sb0 * scale * wMult;
  const b1 = sb1 * scale * wMult;
  const b2 = sb2 * scale * wMult;
  const bOffset = baseOffset * wMult + wAdd;

  // 4x5 row-major ColorMatrix
  return [
    r0, r1, r2, 0, rOffset,
    g0, g1, g2, 0, gOffset,
    b0, b1, b2, 0, bOffset,
    0,  0,  0,  opacity, 0,
  ];
}

/**
 * Computes a contour-extraction 4x5 ColorMatrix for Pass 2 of the multi-pass fallback.
 * Maps highlights and midtones to pure white (1.0, 1.0, 1.0) while isolating dark contours (< 0.4).
 * When rendered with Skia BlendMode.Multiply, dark lines darken the bleached ground while
 * highlights do not alter the bleached paper-white surface.
 */
export function createContourExtractionColorMatrix(adjustments?: ImageAdjustmentSettings): number[] {
  // ITU-R BT.709 photometric coefficients
  const lr = 0.2126;
  const lg = 0.7152;
  const lb = 0.0722;

  // Slope and offset to threshold highlights to >= 1.0 (white) and keep dark lines < 0.4
  // Formula: L' = 2.0 * L - 0.2
  // L = 0.15 (dark line) -> 2 * 0.15 - 0.2 = 0.10 (dark)
  // L = 0.60 (midtone)   -> 2 * 0.60 - 0.2 = 1.00 (white)
  // L = 0.85 (highlight) -> 2 * 0.85 - 0.2 = 1.50 -> clamped to 1.0 (white)
  const slope = 2.0;
  const offset = -0.2;

  const r0 = slope * lr;
  const r1 = slope * lg;
  const r2 = slope * lb;

  return [
    r0, r1, r2, 0, offset,
    r0, r1, r2, 0, offset,
    r0, r1, r2, 0, offset,
    0,  0,  0,  1, 0,
  ];
}

/**
 * Computes a conservative single-pass 4x5 ColorMatrix (20 floats).
 * CAUTION: This linear color matrix applies uniform scalar bleaching across all pixels.
 * It CANNOT perform non-linear pixel-dependent contour preservation (smoothstep protection).
 * Exposes reduced contour-protection quality compared to the GPU shader.
 */
export function createLinearWhiteoutColorMatrix(adjustments: ImageAdjustmentSettings): number[] {
  return createBaseAdjustmentsColorMatrix(adjustments, true);
}

/**
 * Backward-compatible alias for createLinearWhiteoutColorMatrix.
 */
export const createWhiteoutColorMatrix = createLinearWhiteoutColorMatrix;

/**
 * Mathematical simulation utility: calculates the theoretical bleached luminance
 * response for a given pixel luminance and whiteout strength across all 3 pipelines.
 * Used for automated verification and regression prevention.
 */
export function simulateShaderDarknessResponse(
  luma: number,
  whiteout: number
): {
  gpuResponse: number;
  multiPassResponse: number;
  linearResponse: number;
  contourProtectionFactor: number;
} {
  const clampedLuma = Math.max(0, Math.min(1, luma));
  const clampedW = Math.max(0, Math.min(1, whiteout));

  // 1. GPU SkSL non-linear smoothstep response
  const darkness = Math.max(0, Math.min(1, 1 - clampedLuma));
  const t = Math.max(0, Math.min(1, (darkness - 0.2) / (0.85 - 0.2)));
  const contourProtection = t * t * (3 - 2 * t) * 0.75;
  const effectiveWhiteoutGpu = Math.max(0, Math.min(1, clampedW * (1 - contourProtection)));
  const gpuResponse = clampedLuma * (1 - effectiveWhiteoutGpu) + effectiveWhiteoutGpu;

  // 2. Linear ColorMatrix response (uniform scalar bleaching)
  const linearResponse = clampedLuma * (1 - clampedW) + clampedW;

  // 3. Multi-Pass composite response (Pass 1 Bleached * Pass 2 Contour Multiply)
  const pass1 = clampedLuma * (1 - clampedW) + clampedW;
  const pass2Raw = 2.0 * clampedLuma - 0.2;
  const pass2 = Math.max(0, Math.min(1, pass2Raw));
  const contourOpacity = Math.max(0, Math.min(1, clampedW * 0.85));
  const pass2Blended = pass2 * contourOpacity + 1.0 * (1 - contourOpacity);
  const multiPassResponse = Math.max(0, Math.min(1, pass1 * pass2Blended));

  return {
    gpuResponse,
    multiPassResponse,
    linearResponse,
    contourProtectionFactor: contourProtection,
  };
}
