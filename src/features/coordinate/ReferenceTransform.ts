/**
 * ARTISTRY AI — Reference Coordinate Transform Engine
 * Mathematical foundation for multi-overlay spatial synchronization.
 *
 * Coordinates are mapped across four distinct spaces:
 * 1. Normalized Reference Space: [0..1, 0..1] (Resolution & aspect independent)
 * 2. Pixel Reference Space: [0..refWidth, 0..refHeight] (Ground-truth source pixels)
 * 3. Screen Viewport Space: [0..screenWidth, 0..screenHeight] (Interactive UI canvas)
 * 4. Physical Paper Space: [0..widthMm, 0..heightMm] (Real-world metric millimetres)
 */

import type { PaperSettings } from "../../domain/overlayTypes";

export interface Point2D {
  x: number;
  y: number;
}

export interface Rect2D {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportTransformParams {
  refWidth: number;
  refHeight: number;
  containerWidth: number;
  containerHeight: number;
  zoom: number;              // Current user zoom level (0.2x to 10.0x)
  pan: Point2D;              // Pan translation offset in screen pixels
  rotationDeg?: number;      // 0, 90, 180, 270 degrees
}

export interface FitResult {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

/**
 * 3x3 Affine Transformation Matrix in row-major layout:
 * [ m00, m01, m02 ]   [ scaleX, skewX,  transX ]
 * [ m10, m11, m12 ] = [ skewY,  scaleY, transY ]
 * [ m20, m21, m22 ]   [ 0,      0,      1      ]
 */
export type Matrix3x3 = [
  number, number, number,
  number, number, number,
  number, number, number
];

/**
 * Calculates aspect-ratio preserving container fit dimensions (letterbox/pillarbox).
 */
export function computeAspectFit(
  sourceWidth: number,
  sourceHeight: number,
  containerWidth: number,
  containerHeight: number
): FitResult {
  if (sourceWidth <= 0 || sourceHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
    return { width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 };
  }

  const scale = Math.min(containerWidth / sourceWidth, containerHeight / sourceHeight);
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);
  const offsetX = (containerWidth - width) / 2;
  const offsetY = (containerHeight - height) / 2;

  return { width, height, scale, offsetX, offsetY };
}

/**
 * Converts a normalized point [0..1, 0..1] to pixel reference space.
 */
export function normalizedToReference(
  pt: Point2D,
  refWidth: number,
  refHeight: number
): Point2D {
  return {
    x: pt.x * refWidth,
    y: pt.y * refHeight,
  };
}

/**
 * Converts a pixel reference coordinate to normalized space [0..1, 0..1].
 */
export function referenceToNormalized(
  pt: Point2D,
  refWidth: number,
  refHeight: number
): Point2D {
  if (refWidth <= 0 || refHeight <= 0) return { x: 0, y: 0 };
  return {
    x: pt.x / refWidth,
    y: pt.y / refHeight,
  };
}

/**
 * Multiplies a 3x3 matrix by a 2D affine point [x, y, 1].
 */
export function applyMatrixToPoint(matrix: Matrix3x3, pt: Point2D): Point2D {
  const x = matrix[0] * pt.x + matrix[1] * pt.y + matrix[2];
  const y = matrix[3] * pt.x + matrix[4] * pt.y + matrix[5];
  const w = matrix[6] * pt.x + matrix[7] * pt.y + matrix[8];
  const denom = w !== 0 ? w : 1;
  return {
    x: x / denom,
    y: y / denom,
  };
}

/**
 * Inverts a 3x3 affine transformation matrix.
 * Returns null if the matrix is singular (determinant is 0).
 */
export function invertMatrix(m: Matrix3x3): Matrix3x3 | null {
  const det =
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[1] * (m[3] * m[8] - m[5] * m[6]) +
    m[2] * (m[3] * m[7] - m[4] * m[6]);

  if (Math.abs(det) < 1e-12) return null;
  const invDet = 1 / det;

  return [
    (m[4] * m[8] - m[5] * m[7]) * invDet,
    (m[2] * m[7] - m[1] * m[8]) * invDet,
    (m[1] * m[5] - m[2] * m[4]) * invDet,
    (m[5] * m[6] - m[3] * m[8]) * invDet,
    (m[0] * m[8] - m[2] * m[6]) * invDet,
    (m[2] * m[3] - m[0] * m[5]) * invDet,
    (m[3] * m[7] - m[4] * m[6]) * invDet,
    (m[1] * m[6] - m[0] * m[7]) * invDet,
    (m[0] * m[4] - m[1] * m[3]) * invDet,
  ];
}

/**
 * Constructs the forward 3x3 matrix from Reference Image Space to Screen Viewport Space.
 */
export function createForwardMatrix(params: ViewportTransformParams): Matrix3x3 {
  const fit = computeAspectFit(
    params.refWidth,
    params.refHeight,
    params.containerWidth,
    params.containerHeight
  );

  const effectiveScale = fit.scale * params.zoom;
  const transX = fit.offsetX + params.pan.x;
  const transY = fit.offsetY + params.pan.y;

  // Rotation around reference center if specified
  const rotDeg = params.rotationDeg ?? 0;
  if (rotDeg === 0) {
    return [
      effectiveScale, 0, transX,
      0, effectiveScale, transY,
      0, 0, 1,
    ];
  }

  const rad = (rotDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const cx = params.refWidth / 2;
  const cy = params.refHeight / 2;

  // T(trans) * S(scale) * T(center) * R(theta) * T(-center)
  const a = effectiveScale * cos;
  const b = effectiveScale * sin;
  const c = -effectiveScale * sin;
  const d = effectiveScale * cos;

  const tx = transX + effectiveScale * (cx - cx * cos + cy * sin);
  const ty = transY + effectiveScale * (cy - cx * sin - cy * cos);

  return [
    a, c, tx,
    b, d, ty,
    0, 0, 1,
  ];
}

/**
 * Transforms a point from Reference Image Pixel space to Screen Viewport space.
 */
export function referenceToScreen(
  pt: Point2D,
  params: ViewportTransformParams
): Point2D {
  const matrix = createForwardMatrix(params);
  return applyMatrixToPoint(matrix, pt);
}

/**
 * Transforms a touch/screen point back into Reference Image Pixel coordinates.
 * Handles exact inverse pan, zoom, and container letterboxing.
 */
export function screenToReference(
  screenPt: Point2D,
  params: ViewportTransformParams
): Point2D {
  const forward = createForwardMatrix(params);
  const inv = invertMatrix(forward);
  if (!inv) return { x: 0, y: 0 };

  const refPt = applyMatrixToPoint(inv, screenPt);

  // Clamp within reference boundaries
  return {
    x: Math.max(0, Math.min(params.refWidth, refPt.x)),
    y: Math.max(0, Math.min(params.refHeight, refPt.y)),
  };
}

/**
 * Transforms a screen touch point directly to normalized space [0..1, 0..1].
 */
export function screenToNormalized(
  screenPt: Point2D,
  params: ViewportTransformParams
): Point2D {
  const refPt = screenToReference(screenPt, params);
  return referenceToNormalized(refPt, params.refWidth, params.refHeight);
}

/**
 * Formats transformation parameters for Skia's <Group transform={...}> syntax.
 */
export function toSkiaTransformArray(
  params: ViewportTransformParams
): Array<{ translateX: number } | { translateY: number } | { scale: number } | { rotate: number }> {
  const fit = computeAspectFit(
    params.refWidth,
    params.refHeight,
    params.containerWidth,
    params.containerHeight
  );

  const effectiveScale = fit.scale * params.zoom;
  const transX = fit.offsetX + params.pan.x;
  const transY = fit.offsetY + params.pan.y;

  const transforms: Array<
    { translateX: number } | { translateY: number } | { scale: number } | { rotate: number }
  > = [
    { translateX: transX },
    { translateY: transY },
    { scale: effectiveScale },
  ];

  if (params.rotationDeg) {
    transforms.push({ rotate: (params.rotationDeg * Math.PI) / 180 });
  }

  return transforms;
}

/**
 * Maps a reference image pixel coordinate to real-world millimetres on physical paper.
 * Accounts for paper margins and aspect fitting on the physical sheet.
 */
export function referenceToPhysicalMm(
  pt: Point2D,
  refWidth: number,
  refHeight: number,
  paper: PaperSettings
): Point2D {
  const effectiveWidthMm = paper.widthMm - paper.marginMm * 2;
  const effectiveHeightMm = paper.heightMm - paper.marginMm * 2;

  const fit = computeAspectFit(refWidth, refHeight, effectiveWidthMm, effectiveHeightMm);

  const mmX = paper.marginMm + fit.offsetX + (pt.x / refWidth) * fit.width;
  const mmY = paper.marginMm + fit.offsetY + (pt.y / refHeight) * fit.height;

  return {
    x: Math.round(mmX * 100) / 100, // 2 decimal precision (0.01 mm)
    y: Math.round(mmY * 100) / 100,
  };
}

/**
 * Maps a physical millimetre ruler position back to reference pixel coordinates.
 */
export function physicalMmToReference(
  ptMm: Point2D,
  refWidth: number,
  refHeight: number,
  paper: PaperSettings
): Point2D {
  const effectiveWidthMm = paper.widthMm - paper.marginMm * 2;
  const effectiveHeightMm = paper.heightMm - paper.marginMm * 2;

  const fit = computeAspectFit(refWidth, refHeight, effectiveWidthMm, effectiveHeightMm);

  const localMmX = ptMm.x - paper.marginMm - fit.offsetX;
  const localMmY = ptMm.y - paper.marginMm - fit.offsetY;

  const refX = (localMmX / fit.width) * refWidth;
  const refY = (localMmY / fit.height) * refHeight;

  return {
    x: Math.max(0, Math.min(refWidth, Math.round(refX))),
    y: Math.max(0, Math.min(refHeight, Math.round(refY))),
  };
}
