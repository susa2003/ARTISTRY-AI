/**
 * ARTISTRY AI — Comparison Transform Engine
 * Mathematical foundation for manual image alignment, translation,
 * rotation, scaling, and non-destructive overlay positioning.
 */

import { DEFAULT_ALIGNMENT_SETTINGS, ImageAlignmentSettings } from "./types";

export interface Point2D {
  x: number;
  y: number;
}

export class ComparisonTransform {
  /**
   * Clamps alignment parameters within safe, usable boundaries.
   */
  static sanitizeAlignment(settings: Partial<ImageAlignmentSettings>): ImageAlignmentSettings {
    const rawScale = settings.scale ?? DEFAULT_ALIGNMENT_SETTINGS.scale;
    const rawRot = settings.rotationDeg ?? DEFAULT_ALIGNMENT_SETTINGS.rotationDeg;
    const rawX = settings.translateX ?? DEFAULT_ALIGNMENT_SETTINGS.translateX;
    const rawY = settings.translateY ?? DEFAULT_ALIGNMENT_SETTINGS.translateY;
    const rawTiltX = settings.perspectiveTiltX ?? DEFAULT_ALIGNMENT_SETTINGS.perspectiveTiltX ?? 0;
    const rawTiltY = settings.perspectiveTiltY ?? DEFAULT_ALIGNMENT_SETTINGS.perspectiveTiltY ?? 0;

    return {
      scale: Math.max(0.2, Math.min(5.0, Number.isFinite(rawScale) ? rawScale : 1.0)),
      rotationDeg: Math.max(-180, Math.min(180, Number.isFinite(rawRot) ? rawRot : 0)),
      translateX: Math.max(-2000, Math.min(2000, Number.isFinite(rawX) ? rawX : 0)),
      translateY: Math.max(-2000, Math.min(2000, Number.isFinite(rawY) ? rawY : 0)),
      flipHorizontal: Boolean(settings.flipHorizontal),
      preserveAspectRatio: settings.preserveAspectRatio ?? true,
      perspectiveTiltX: Math.max(-30, Math.min(30, Number.isFinite(rawTiltX) ? rawTiltX : 0)),
      perspectiveTiltY: Math.max(-30, Math.min(30, Number.isFinite(rawTiltY) ? rawTiltY : 0)),
    };
  }

  /**
   * Resets alignment to standard initial state.
   */
  static resetAlignment(): ImageAlignmentSettings {
    return { ...DEFAULT_ALIGNMENT_SETTINGS };
  }

  /**
   * Adjusts zoom factor centered on viewport.
   */
  static applyZoom(current: ImageAlignmentSettings, delta: number): ImageAlignmentSettings {
    const newScale = current.scale * delta;
    return this.sanitizeAlignment({ ...current, scale: newScale });
  }

  /**
   * Applies pan translation in viewport coordinates.
   */
  static applyPan(current: ImageAlignmentSettings, dx: number, dy: number): ImageAlignmentSettings {
    return this.sanitizeAlignment({
      ...current,
      translateX: current.translateX + dx,
      translateY: current.translateY + dy,
    });
  }

  /**
   * Rotates alignment by degrees (supports 90° step snaps or fine rotation).
   */
  static applyRotation(current: ImageAlignmentSettings, degreesDelta: number): ImageAlignmentSettings {
    let newRot = current.rotationDeg + degreesDelta;
    if (newRot > 180) newRot -= 360;
    if (newRot < -180) newRot += 360;
    return this.sanitizeAlignment({ ...current, rotationDeg: newRot });
  }

  /**
   * Calculates React Native transform array for drawing layer positioning.
   */
  static getTransformStyles(settings: ImageAlignmentSettings) {
    const s = this.sanitizeAlignment(settings);
    return [
      { translateX: s.translateX },
      { translateY: s.translateY },
      { rotate: `${s.rotationDeg}deg` },
      { scaleX: s.flipHorizontal ? -s.scale : s.scale },
      { scaleY: s.scale },
    ];
  }

  /**
   * Transforms a 2D point from raw drawing coordinates into aligned overlay space.
   */
  static transformPoint(pt: Point2D, settings: ImageAlignmentSettings, center: Point2D): Point2D {
    const s = this.sanitizeAlignment(settings);
    // 1. Shift to center origin
    let x = pt.x - center.x;
    let y = pt.y - center.y;

    // 2. Horizontal flip
    if (s.flipHorizontal) {
      x = -x;
    }

    // 3. Rotation
    const rad = (s.rotationDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;

    // 4. Scale & Translation
    const fx = rx * s.scale + center.x + s.translateX;
    const fy = ry * s.scale + center.y + s.translateY;

    return { x: fx, y: fy };
  }

  /**
   * Calculates auto-fit scale to fit a drawing onto a target reference container
   * while preserving natural aspect ratio.
   */
  static calculateFitScale(
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number
  ): number {
    if (sourceWidth <= 0 || sourceHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
      return 1.0;
    }
    const scaleX = targetWidth / sourceWidth;
    const scaleY = targetHeight / sourceHeight;
    return Math.min(scaleX, scaleY);
  }
}
