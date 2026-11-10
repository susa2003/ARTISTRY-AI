import {
  computeAspectFit,
  normalizedToReference,
  referenceToNormalized,
  referenceToScreen,
  screenToReference,
  screenToNormalized,
  referenceToPhysicalMm,
  physicalMmToReference,
  createForwardMatrix,
  invertMatrix,
  toSkiaTransformArray,
  type ViewportTransformParams,
} from "../ReferenceTransform";
import { DEFAULT_PAPER_SETTINGS, type PaperSettings } from "../../../domain/overlayTypes";

describe("ReferenceTransform — Spatial Synchronization Engine", () => {
  const baseParams: ViewportTransformParams = {
    refWidth: 1000,
    refHeight: 800,
    containerWidth: 500,
    containerHeight: 400,
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    rotationDeg: 0,
  };

  describe("computeAspectFit", () => {
    it("should correctly compute scale and center offsets for letterboxing", () => {
      // 1000x800 into 500x500 container -> scale is 0.5 (500x400) -> offsetY = 50
      const fit = computeAspectFit(1000, 800, 500, 500);
      expect(fit.scale).toBe(0.5);
      expect(fit.width).toBe(500);
      expect(fit.height).toBe(400);
      expect(fit.offsetX).toBe(0);
      expect(fit.offsetY).toBe(50);
    });

    it("should correctly compute scale and center offsets for pillarboxing", () => {
      // 800x1000 into 500x500 container -> scale is 0.5 (400x500) -> offsetX = 50
      const fit = computeAspectFit(800, 1000, 500, 500);
      expect(fit.scale).toBe(0.5);
      expect(fit.width).toBe(400);
      expect(fit.height).toBe(500);
      expect(fit.offsetX).toBe(50);
      expect(fit.offsetY).toBe(0);
    });

    it("should handle 0 dimensions safely without NaN", () => {
      const fit = computeAspectFit(0, 0, 500, 500);
      expect(fit.scale).toBe(1);
      expect(fit.width).toBe(0);
      expect(fit.height).toBe(0);
    });
  });

  describe("Normalized <-> Reference Coordinate Conversions", () => {
    it("should convert normalized coordinate to reference pixel space", () => {
      const pt = normalizedToReference({ x: 0.5, y: 0.25 }, 1200, 800);
      expect(pt.x).toBe(600);
      expect(pt.y).toBe(200);
    });

    it("should convert reference pixel coordinate to normalized space", () => {
      const pt = referenceToNormalized({ x: 300, y: 600 }, 1200, 800);
      expect(pt.x).toBe(0.25);
      expect(pt.y).toBe(0.75);
    });

    it("should round-trip between normalized and reference space with zero loss", () => {
      const initial = { x: 0.333333, y: 0.666667 };
      const ref = normalizedToReference(initial, 1920, 1080);
      const roundTrip = referenceToNormalized(ref, 1920, 1080);
      expect(roundTrip.x).toBeCloseTo(initial.x, 5);
      expect(roundTrip.y).toBeCloseTo(initial.y, 5);
    });
  });

  describe("Forward and Inverse Screen Transformation", () => {
    it("should map origin [0,0] to container offset at 1.0x zoom", () => {
      const screenPt = referenceToScreen({ x: 0, y: 0 }, baseParams);
      // Container 500x400 with ref 1000x800 -> fit scale is 0.5 -> offsets are 0
      expect(screenPt.x).toBe(0);
      expect(screenPt.y).toBe(0);
    });

    it("should map center point correctly to screen center", () => {
      const screenPt = referenceToScreen({ x: 500, y: 400 }, baseParams);
      expect(screenPt.x).toBe(250);
      expect(screenPt.y).toBe(200);
    });

    it("should correctly handle zoom and pan translation", () => {
      const params: ViewportTransformParams = {
        ...baseParams,
        zoom: 2.0,
        pan: { x: 40, y: -20 },
      };

      // Reference center (500, 400)
      // Fit scale = 0.5, effectiveScale = 0.5 * 2 = 1.0
      // Screen = 500 * 1.0 + 40 = 540, 400 * 1.0 - 20 = 380
      const screenPt = referenceToScreen({ x: 500, y: 400 }, params);
      expect(screenPt.x).toBe(540);
      expect(screenPt.y).toBe(380);
    });

    it("should accurately invert touch point from screen to reference coordinates", () => {
      const params: ViewportTransformParams = {
        ...baseParams,
        zoom: 1.75,
        pan: { x: 65, y: -45 },
      };

      const originalRefPt = { x: 730, y: 520 };
      const screenPt = referenceToScreen(originalRefPt, params);
      const invertedRefPt = screenToReference(screenPt, params);

      expect(invertedRefPt.x).toBeCloseTo(originalRefPt.x, 3);
      expect(invertedRefPt.y).toBeCloseTo(originalRefPt.y, 3);
    });

    it("should map screen touch directly to normalized coordinates", () => {
      const params: ViewportTransformParams = {
        ...baseParams,
        zoom: 1.0,
        pan: { x: 0, y: 0 },
      };

      const screenPt = { x: 250, y: 200 }; // Center of 500x400 viewport
      const normPt = screenToNormalized(screenPt, params);

      expect(normPt.x).toBeCloseTo(0.5, 4);
      expect(normPt.y).toBeCloseTo(0.5, 4);
    });

    it("should clamp inverted coordinates within valid reference bounds", () => {
      const screenPtOutOfBounds = { x: -200, y: 1500 };
      const clamped = screenToReference(screenPtOutOfBounds, baseParams);

      expect(clamped.x).toBe(0);
      expect(clamped.y).toBe(800);
    });
  });

  describe("Matrix Inversion and Skia Formats", () => {
    it("should invert affine matrix correctly", () => {
      const matrix = createForwardMatrix(baseParams);
      const inv = invertMatrix(matrix);
      expect(inv).not.toBeNull();

      // Matrix multiplied by its inverse should yield Identity
      if (inv) {
        // [0][0] = m00*inv00 + m01*inv10 + m02*inv20
        const id00 = matrix[0] * inv[0] + matrix[1] * inv[3] + matrix[2] * inv[6];
        expect(id00).toBeCloseTo(1, 5);
      }
    });

    it("should format valid Skia transform arrays", () => {
      const skiaTransforms = toSkiaTransformArray({
        ...baseParams,
        zoom: 1.5,
        pan: { x: 20, y: 30 },
      });

      expect(skiaTransforms).toHaveLength(3);
      expect(skiaTransforms[0]).toEqual({ translateX: 20 });
      expect(skiaTransforms[1]).toEqual({ translateY: 30 });
      expect(skiaTransforms[2]).toEqual({ scale: 0.5 * 1.5 });
    });
  });

  describe("Physical Paper Millimetre Calculations", () => {
    const a4Paper: PaperSettings = {
      ...DEFAULT_PAPER_SETTINGS,
      widthMm: 210,
      heightMm: 297,
      marginMm: 5.0,
    };

    it("should accurately map reference pixels to millimetres on A4 paper", () => {
      // Top-left pixel (0, 0) should be at least within margin bounds (>= 5mm)
      const mmPt = referenceToPhysicalMm({ x: 0, y: 0 }, 1000, 1000, a4Paper);
      expect(mmPt.x).toBeGreaterThanOrEqual(5.0);
      expect(mmPt.y).toBeGreaterThanOrEqual(5.0);

      // Bottom-right pixel (1000, 1000) should be within printable bounds (<= 205mm X, <= 292mm Y)
      const mmBottomRight = referenceToPhysicalMm({ x: 1000, y: 1000 }, 1000, 1000, a4Paper);
      expect(mmBottomRight.x).toBeLessThanOrEqual(205.0);
      expect(mmBottomRight.y).toBeLessThanOrEqual(292.0);
    });

    it("should round-trip between physical millimetres and reference pixels", () => {
      const initialPixel = { x: 450, y: 620 };
      const physicalMm = referenceToPhysicalMm(initialPixel, 1000, 800, a4Paper);
      const recoveredPixel = physicalMmToReference(physicalMm, 1000, 800, a4Paper);

      expect(recoveredPixel.x).toBeCloseTo(initialPixel.x, 0);
      expect(recoveredPixel.y).toBeCloseTo(initialPixel.y, 0);
    });
  });
});
