/**
 * ARTISTRY AI — Unified Overlay Render Context
 * Provides dimensional and spatial parameters to all overlay renderers
 * inside Reference Studio.
 */

import type { ImageAdjustmentSettings, PaperSettings } from "../../domain/overlayTypes";

export interface OverlayRenderContext {
  /**
   * Effective visible width of the reference image in pixels
   * (accounting for crop and 90°/270° orientation rotation).
   */
  refWidth: number;

  /**
   * Effective visible height of the reference image in pixels.
   */
  refHeight: number;

  /**
   * Original uncropped reference image dimensions.
   */
  originalWidth: number;
  originalHeight: number;

  /**
   * Physical paper settings (A4, A3, mm dimensions, printable margins, DPI).
   */
  paper: PaperSettings;

  /**
   * Current interactive viewport zoom factor (for scale-dependent line adjustments).
   */
  zoom: number;

  /**
   * Image adjustments including crop and rotation.
   */
  adjustments?: ImageAdjustmentSettings;
}
