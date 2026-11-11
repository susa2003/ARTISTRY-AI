/**
 * ARTISTRY AI — Phase 3 Image Editing & Real Whiteout Shader Test Suite
 * 
 * Verifies:
 * - Independent adjustment state updates
 * - Decoupling of adjustments
 * - Individual reset vs master reset
 * - Whiteout Lightbox Shader uniforms and dark contour protection
 * - 4x5 ColorMatrix fallback generation
 * - Crop and rotation calculations & bounding box transposition
 * - Bidirectional coordinate transformations after crop and rotation
 * - SQLite persistence round-trip and backward compatibility
 */

import { useAppStore } from "../../../state/appStore";
import * as database from "../../../storage/database";
import type { ImageAdjustmentSettings, ProjectDocument } from "../../../domain/types";
import { DEFAULT_IMAGE_ADJUSTMENTS, getGrayscaleFactor } from "../../../domain/overlayTypes";
import {
  computeTransformedDimensions,
  cropToPixelRect,
  pixelRectToCrop,
  croppedNormalizedToSourceNormalized,
  sourceNormalizedToCroppedNormalized,
  rotateNormalizedPoint,
  unrotateNormalizedPoint,
  screenToReference,
  referenceToScreen,
  createForwardMatrix,
} from "../../coordinate/ReferenceTransform";
import {
  createBaseAdjustmentsColorMatrix,
  createContourExtractionColorMatrix,
  createLinearWhiteoutColorMatrix,
  createWhiteoutColorMatrix,
  createWhiteoutUniforms,
  getShaderCapabilityInfo,
  getWhiteoutRuntimeEffect,
  isWhiteoutShaderSupported,
  resetRuntimeEffectCache,
  simulateShaderDarknessResponse,
  WHITEOUT_SKSL,
} from "../../shaders/WhiteoutShader";

describe("Phase 3: Image Editing & Real Whiteout Shader", () => {
  const baseTestProject: ProjectDocument = {
    id: "proj-phase3-test",
    name: "Phase 3 Anatomy Study",
    width: 1200,
    height: 1600,
    layers: [
      { id: "layer-1", name: "Inking", visible: true, opacity: 1, strokes: [] },
    ],
    activeLayerId: "layer-1",
    referenceUri: "file:///test/figure_study.jpg",
    paperSettings: {
      size: "A4",
      orientation: "portrait",
      widthMm: 210,
      heightMm: 297,
      marginMm: 5.0,
      targetDpi: 300,
    },
    imageAdjustments: { ...DEFAULT_IMAGE_ADJUSTMENTS },
    overlays: [],
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  beforeEach(() => {
    useAppStore.setState({
      currentProject: {
        ...baseTestProject,
        imageAdjustments: { ...DEFAULT_IMAGE_ADJUSTMENTS },
      },
    });
    resetRuntimeEffectCache();
  });

  // =========================================================================
  // 1. Independent Adjustment State Updates
  // =========================================================================
  describe("Independent Adjustment State Management", () => {
    it("should update individual adjustment parameters independently without mutating others", () => {
      const store = useAppStore.getState();

      // Update brightness
      store.updateImageAdjustment("brightness", 0.45);
      let adj = useAppStore.getState().currentProject?.imageAdjustments;
      expect(adj?.brightness).toBe(0.45);
      expect(adj?.contrast).toBe(1.0);
      expect(adj?.whiteoutStrength).toBe(0.0);

      // Update contrast
      store.updateImageAdjustment("contrast", 1.75);
      adj = useAppStore.getState().currentProject?.imageAdjustments;
      expect(adj?.brightness).toBe(0.45);
      expect(adj?.contrast).toBe(1.75);
      expect(adj?.whiteoutStrength).toBe(0.0);

      // Update exposure
      store.updateImageAdjustment("exposure", -1.2);
      adj = useAppStore.getState().currentProject?.imageAdjustments;
      expect(adj?.exposure).toBe(-1.2);
      expect(adj?.brightness).toBe(0.45);
      expect(adj?.contrast).toBe(1.75);

      // Update saturation
      store.updateImageAdjustment("saturation", 0.3);
      adj = useAppStore.getState().currentProject?.imageAdjustments;
      expect(adj?.saturation).toBe(0.3);

      // Update whiteout strength
      store.updateImageAdjustment("whiteoutStrength", 0.8);
      adj = useAppStore.getState().currentProject?.imageAdjustments;
      expect(adj?.whiteoutStrength).toBe(0.8);
      expect(adj?.opacity).toBe(1.0); // Image opacity remains independent
    });

    it("should allow resetting a single adjustment to default while preserving others", () => {
      const store = useAppStore.getState();

      store.setImageAdjustments({
        ...DEFAULT_IMAGE_ADJUSTMENTS,
        brightness: 0.35,
        contrast: 1.5,
        exposure: 0.8,
        whiteoutStrength: 0.65,
        opacity: 0.85,
      });

      // Reset brightness only
      store.resetIndividualAdjustment("brightness");
      let adj = useAppStore.getState().currentProject?.imageAdjustments;
      expect(adj?.brightness).toBe(DEFAULT_IMAGE_ADJUSTMENTS.brightness); // 0.0
      expect(adj?.contrast).toBe(1.5);
      expect(adj?.exposure).toBe(0.8);
      expect(adj?.whiteoutStrength).toBe(0.65);
      expect(adj?.opacity).toBe(0.85);

      // Reset whiteout only
      store.resetIndividualAdjustment("whiteoutStrength");
      adj = useAppStore.getState().currentProject?.imageAdjustments;
      expect(adj?.whiteoutStrength).toBe(0.0);
      expect(adj?.contrast).toBe(1.5);
      expect(adj?.exposure).toBe(0.8);
    });

    it("should reset all color adjustments while preserving crop and rotation", () => {
      const store = useAppStore.getState();

      store.setImageAdjustments({
        brightness: 0.5,
        contrast: 1.8,
        exposure: -1.0,
        saturation: 0.2,
        grayscale: 1.0,
        whiteoutStrength: 0.9,
        opacity: 0.5,
        rotation: 90,
        crop: { originX: 0.1, originY: 0.1, width: 0.8, height: 0.8 },
      });

      store.resetImageAdjustments();
      const adj = useAppStore.getState().currentProject?.imageAdjustments;

      // Color adjustments reset to defaults
      expect(adj?.brightness).toBe(0.0);
      expect(adj?.contrast).toBe(1.0);
      expect(adj?.exposure).toBe(0.0);
      expect(adj?.saturation).toBe(1.0);
      expect(adj?.grayscale).toBe(0.0);
      expect(adj?.whiteoutStrength).toBe(0.0);
      expect(adj?.opacity).toBe(1.0);

      // Crop and rotation preserved
      expect(adj?.rotation).toBe(90);
      expect(adj?.crop).toEqual({ originX: 0.1, originY: 0.1, width: 0.8, height: 0.8 });
    });

    it("should correctly handle boolean vs numeric grayscale factor", () => {
      const adjNumeric: ImageAdjustmentSettings = { ...DEFAULT_IMAGE_ADJUSTMENTS, grayscale: 0.75 };
      expect(getGrayscaleFactor(adjNumeric)).toBe(0.75);

      const adjBooleanTrue: ImageAdjustmentSettings = { ...DEFAULT_IMAGE_ADJUSTMENTS, grayscale: true };
      expect(getGrayscaleFactor(adjBooleanTrue)).toBe(1.0);

      const adjBooleanFalse: ImageAdjustmentSettings = { ...DEFAULT_IMAGE_ADJUSTMENTS, grayscale: false };
      expect(getGrayscaleFactor(adjBooleanFalse)).toBe(0.0);
    });
  });

  // =========================================================================
  // 2. Real Whiteout Lightbox Shader & ColorMatrix Fallback
  // =========================================================================
  describe("Whiteout / Lightbox Shader & Math", () => {
    it("should compile or retrieve SkSL runtime effect without crashing", () => {
      const effect = getWhiteoutRuntimeEffect();
      expect(effect).toBeDefined();
      expect(WHITEOUT_SKSL).toContain("u_whiteout");
      expect(WHITEOUT_SKSL).toContain("contourProtection");
      expect(WHITEOUT_SKSL).toContain("exp2(u_exposure)");
    });

    it("should generate correct uniform values within valid bounds", () => {
      const adjustments: ImageAdjustmentSettings = {
        brightness: 0.3,
        contrast: 1.4,
        exposure: -0.5,
        saturation: 1.2,
        grayscale: 0.5,
        whiteoutStrength: 0.85,
        opacity: 0.9,
        rotation: 0,
        crop: { originX: 0, originY: 0, width: 1, height: 1 },
      };

      const uniforms = createWhiteoutUniforms(adjustments);

      expect(uniforms.u_whiteout).toBe(0.85);
      expect(uniforms.u_brightness).toBe(0.3);
      expect(uniforms.u_contrast).toBe(1.4);
      expect(uniforms.u_exposure).toBe(-0.5);
      expect(uniforms.u_saturation).toBe(1.2);
      expect(uniforms.u_grayscale).toBe(0.5);
      expect(uniforms.u_opacity).toBe(0.9);
    });

    it("should compute a valid 4x5 ColorMatrix matching mathematical adjustment specification", () => {
      const matrix = createWhiteoutColorMatrix({
        ...DEFAULT_IMAGE_ADJUSTMENTS,
        brightness: 0.2,
        contrast: 1.5,
        exposure: 1.0, // 2^1.0 = 2.0x exposure multiplier
        saturation: 1.0,
        whiteoutStrength: 0.5,
        opacity: 0.8,
      });

      // Must be exactly 20 elements (4 rows x 5 columns)
      expect(matrix).toHaveLength(20);

      // Verify alpha row is [0, 0, 0, opacity, 0]
      expect(matrix[15]).toBe(0);
      expect(matrix[16]).toBe(0);
      expect(matrix[17]).toBe(0);
      expect(matrix[18]).toBe(0.8); // opacity
      expect(matrix[19]).toBe(0);

      // When whiteout is 0.5, translation offset = baseOffset * (1 - w) + w
      // baseOffset = 0.5 * (1 - 1.5) + 0.2 = -0.05. Offset = -0.05 * 0.5 + 0.5 = 0.475
      expect(matrix[4]).toBeCloseTo(0.475, 3); // R translation
      expect(matrix[9]).toBeCloseTo(0.475, 3); // G translation
      expect(matrix[14]).toBeCloseTo(0.475, 3); // B translation
    });

    it("should generate neutral identity-like ColorMatrix when adjustments are at defaults", () => {
      const matrix = createWhiteoutColorMatrix(DEFAULT_IMAGE_ADJUSTMENTS);
      expect(matrix).toHaveLength(20);

      // At default: contrast=1, exposure=0 (2^0=1), brightness=0, saturation=1, whiteout=0, opacity=1
      // Diagonal elements should be close to 1.0, off-diagonal elements near 0
      expect(matrix[0]).toBeCloseTo(1.0, 3); // R -> R
      expect(matrix[6]).toBeCloseTo(1.0, 3); // G -> G
      expect(matrix[12]).toBeCloseTo(1.0, 3); // B -> B
      expect(matrix[18]).toBeCloseTo(1.0, 3); // A -> A

      // Offsets should be 0
      expect(matrix[4]).toBeCloseTo(0.0, 3); // R offset
      expect(matrix[9]).toBeCloseTo(0.0, 3); // G offset
      expect(matrix[14]).toBeCloseTo(0.0, 3); // B offset
      expect(matrix[19]).toBeCloseTo(0.0, 3); // A offset
    });

    it("should mathematically differentiate non-linear GPU contour preservation from linear fallback bleaching", () => {
      // Test dark drawing line (luma = 0.15) at heavy whiteout (0.80)
      const darkLineSim = simulateShaderDarknessResponse(0.15, 0.80);

      // In the GPU shader, darkness = 1 - 0.15 = 0.85, receiving maximum smoothstep protection (~75%)
      expect(darkLineSim.contourProtectionFactor).toBeCloseTo(0.75, 2);

      // GPU preserves dark lines: bleached luminance is ~0.32 (distinct line)
      expect(darkLineSim.gpuResponse).toBeCloseTo(0.32, 2);

      // Linear single-pass bleaching washes out dark lines completely: 0.15 * 0.2 + 0.8 = 0.83 (faded)
      expect(darkLineSim.linearResponse).toBeCloseTo(0.83, 2);

      // The GPU shader retains over 0.45 units more contrast for the artist than linear bleaching
      expect(darkLineSim.gpuResponse).toBeLessThan(darkLineSim.linearResponse - 0.45);

      // For light areas (luma = 0.85), both GPU and linear response bleach cleanly to paper white
      const highlightSim = simulateShaderDarknessResponse(0.85, 0.80);
      expect(highlightSim.gpuResponse).toBeGreaterThan(0.95);
      expect(highlightSim.linearResponse).toBeGreaterThan(0.95);
    });

    it("should approximate GPU contour protection via the multi-pass pipeline when GPU shader is unavailable", () => {
      const darkLineSim = simulateShaderDarknessResponse(0.15, 0.80);

      // Multi-pass compositing (Base Bleached * Multiply Contour Pass) approximates the GPU response
      expect(darkLineSim.multiPassResponse).toBeCloseTo(darkLineSim.gpuResponse, 1);
      expect(darkLineSim.multiPassResponse).toBeLessThan(darkLineSim.linearResponse - 0.45);
    });

    it("should verify that multi-pass contour extraction matrix isolates dark lines and clamps highlights to white", () => {
      const contourMatrix = createContourExtractionColorMatrix();
      expect(contourMatrix).toHaveLength(20);

      // Compute response for highlight pixel (RGB = 0.75)
      // L = 0.75. L' = 2.0 * 0.75 - 0.2 = 1.30 (clamped to 1.0 white)
      const lr = 0.2126;
      const lg = 0.7152;
      const lb = 0.0722;
      const highlightLuma = 0.75;
      const highlightOut = (contourMatrix[0] * highlightLuma + contourMatrix[1] * highlightLuma + contourMatrix[2] * highlightLuma) + contourMatrix[4];
      expect(highlightOut).toBeGreaterThanOrEqual(1.0); // Will multiply with 1.0 (no darkening on paper)

      // Compute response for dark line pixel (RGB = 0.15)
      // L = 0.15. L' = 2.0 * 0.15 - 0.2 = 0.10 (dark contour)
      const darkLuma = 0.15;
      const darkOut = (contourMatrix[0] * darkLuma + contourMatrix[1] * darkLuma + contourMatrix[2] * darkLuma) + contourMatrix[4];
      expect(darkOut).toBeLessThanOrEqual(0.15); // Will multiply and restore dark contour
    });

    it("should accurately expose shader capability and NOT claim contour protection on linear fallback", () => {
      // 1. With GPU shader present
      const capGpu = getShaderCapabilityInfo(true, false);
      expect(capGpu.hasGpuShader).toBe(true);
      expect(capGpu.hasContourProtection).toBe(true);
      expect(capGpu.contourProtectionQuality).toBe("full_gpu");

      // 2. Multi-pass fallback when GPU shader is unavailable
      const capMultiPass = getShaderCapabilityInfo(true, true);
      expect(capMultiPass.mode).toBe("multi_pass_contour_aware");
      expect(capMultiPass.hasGpuShader).toBe(false);
      expect(capMultiPass.hasContourProtection).toBe(true);
      expect(capMultiPass.contourProtectionQuality).toBe("multi_pass_approximated");

      // 3. Linear ColorMatrix fallback capability check (does NOT claim contour preservation)
      const capLinear = getShaderCapabilityInfo(false, true);
      expect(capLinear.mode).toBe("linear_color_matrix_fallback");
      expect(capLinear.hasGpuShader).toBe(false);
      expect(capLinear.hasContourProtection).toBe(false); // Explicitly FALSE
      expect(capLinear.contourProtectionQuality).toBe("none_linear_fallback");
      expect(capLinear.description).toContain("CANNOT");
    });

    it("should preserve alpha transparency and prevent color bleeding into transparent pixels", () => {
      const matrix = createBaseAdjustmentsColorMatrix({
        ...DEFAULT_IMAGE_ADJUSTMENTS,
        brightness: 0.5,
        contrast: 1.5,
        exposure: 1.0,
        whiteoutStrength: 0.8,
        opacity: 0.65,
      });

      // Alpha row must be [0, 0, 0, opacity, 0]
      expect(matrix[15]).toBe(0);
      expect(matrix[16]).toBe(0);
      expect(matrix[17]).toBe(0);
      expect(matrix[18]).toBe(0.65);
      expect(matrix[19]).toBe(0); // Alpha offset must be 0 to never create false alpha from transparent pixels
    });
  });

  // =========================================================================
  // 3. Crop and Rotation Calculations & Coordinate Foundation
  // =========================================================================
  describe("Crop and Rotation Coordinate Foundation", () => {
    it("should compute transformed dimensions swapping width and height at 90 and 270 degrees", () => {
      const refW = 1200;
      const refH = 1600;

      // 0 degrees
      const dims0 = computeTransformedDimensions(refW, refH, 0);
      expect(dims0).toEqual({ width: 1200, height: 1600 });

      // 90 degrees
      const dims90 = computeTransformedDimensions(refW, refH, 90);
      expect(dims90).toEqual({ width: 1600, height: 1200 });

      // 180 degrees
      const dims180 = computeTransformedDimensions(refW, refH, 180);
      expect(dims180).toEqual({ width: 1200, height: 1600 });

      // 270 degrees
      const dims270 = computeTransformedDimensions(refW, refH, 270);
      expect(dims270).toEqual({ width: 1600, height: 1200 });
    });

    it("should compute effective dimensions with crop applied", () => {
      const refW = 1000;
      const refH = 2000;
      const crop = { originX: 0.1, originY: 0.2, width: 0.5, height: 0.6 };

      // Crop only (0 deg): 1000 * 0.5 = 500, 2000 * 0.6 = 1200
      const dims = computeTransformedDimensions(refW, refH, 0, crop);
      expect(dims).toEqual({ width: 500, height: 1200 });

      // Crop with 90 deg rotation: transposed
      const dimsRot = computeTransformedDimensions(refW, refH, 90, crop);
      expect(dimsRot).toEqual({ width: 1200, height: 500 });
    });

    it("should convert between normalized crop and pixel rect bidirectionally", () => {
      const refW = 1000;
      const refH = 1500;
      const crop = { originX: 0.25, originY: 0.1, width: 0.5, height: 0.8 };

      const pixelRect = cropToPixelRect(crop, refW, refH);
      expect(pixelRect).toEqual({ x: 250, y: 150, width: 500, height: 1200 });

      const reconstructedCrop = pixelRectToCrop(pixelRect, refW, refH);
      expect(reconstructedCrop.originX).toBeCloseTo(crop.originX, 3);
      expect(reconstructedCrop.originY).toBeCloseTo(crop.originY, 3);
      expect(reconstructedCrop.width).toBeCloseTo(crop.width, 3);
      expect(reconstructedCrop.height).toBeCloseTo(crop.height, 3);
    });

    it("should map normalized coordinates bidirectionally between cropped and source space", () => {
      const crop = { originX: 0.2, originY: 0.3, width: 0.5, height: 0.4 };

      // Center of the cropped window (0.5, 0.5)
      const croppedCenter = { x: 0.5, y: 0.5 };
      const sourcePt = croppedNormalizedToSourceNormalized(croppedCenter, crop);

      // Source point should be: 0.2 + 0.5 * 0.5 = 0.45, 0.3 + 0.5 * 0.4 = 0.50
      expect(sourcePt.x).toBeCloseTo(0.45, 4);
      expect(sourcePt.y).toBeCloseTo(0.50, 4);

      // Map back to cropped space
      const backToCropped = sourceNormalizedToCroppedNormalized(sourcePt, crop);
      expect(backToCropped.x).toBeCloseTo(croppedCenter.x, 4);
      expect(backToCropped.y).toBeCloseTo(croppedCenter.y, 4);
    });

    it("should rotate and unrotate normalized points without coordinate drift", () => {
      const original = { x: 0.25, y: 0.75 };

      [0, 90, 180, 270].forEach((rot) => {
        const rotated = rotateNormalizedPoint(original, rot as 0 | 90 | 180 | 270);
        const unrotated = unrotateNormalizedPoint(rotated, rot as 0 | 90 | 180 | 270);

        expect(unrotated.x).toBeCloseTo(original.x, 5);
        expect(unrotated.y).toBeCloseTo(original.y, 5);
      });
    });

    it("should preserve exact screen to reference touch mapping across pan and zoom", () => {
      const params = {
        refWidth: 800,
        refHeight: 1200,
        containerWidth: 400,
        containerHeight: 600,
        zoom: 2.0,
        pan: { x: 50, y: -30 },
      };

      const refPoint = { x: 300, y: 500 };
      const screenPoint = referenceToScreen(refPoint, params);
      const invertedRefPoint = screenToReference(screenPoint, params);

      expect(invertedRefPoint.x).toBeCloseTo(refPoint.x, 1);
      expect(invertedRefPoint.y).toBeCloseTo(refPoint.y, 1);
    });
  });

  // =========================================================================
  // 4. SQLite Persistence & Backward Compatibility
  // =========================================================================
  describe("SQLite Persistence & Backward Compatibility", () => {
    it("should save and restore complete image adjustment settings round-trip", async () => {
      const testProject: ProjectDocument = {
        ...baseTestProject,
        id: "proj-persist-adjustments-01",
        imageAdjustments: {
          brightness: 0.35,
          contrast: 1.45,
          exposure: -0.5,
          saturation: 1.1,
          grayscale: 0.8,
          whiteoutStrength: 0.75,
          opacity: 0.9,
          rotation: 180,
          crop: { originX: 0.15, originY: 0.1, width: 0.7, height: 0.8 },
        },
      };

      await database.saveProject(testProject);
      const loaded = await database.getProject(testProject.id);

      expect(loaded).toBeDefined();
      expect(loaded?.imageAdjustments).toBeDefined();
      expect(loaded?.imageAdjustments?.brightness).toBe(0.35);
      expect(loaded?.imageAdjustments?.contrast).toBe(1.45);
      expect(loaded?.imageAdjustments?.exposure).toBe(-0.5);
      expect(loaded?.imageAdjustments?.saturation).toBe(1.1);
      expect(loaded?.imageAdjustments?.grayscale).toBe(0.8);
      expect(loaded?.imageAdjustments?.whiteoutStrength).toBe(0.75);
      expect(loaded?.imageAdjustments?.opacity).toBe(0.9);
      expect(loaded?.imageAdjustments?.rotation).toBe(180);
      expect(loaded?.imageAdjustments?.crop).toEqual({
        originX: 0.15,
        originY: 0.1,
        width: 0.7,
        height: 0.8,
      });
    });

    it("should gracefully handle legacy records missing adjustments_json with default fallback", async () => {
      const legacyProject: ProjectDocument = {
        ...baseTestProject,
        id: "proj-legacy-01",
        imageAdjustments: undefined,
      };

      await database.saveProject(legacyProject);
      const loaded = await database.getProject("proj-legacy-01");

      expect(loaded).toBeDefined();
      // Should populate defaults gracefully
      expect(loaded?.imageAdjustments).toBeDefined();
      expect(loaded?.imageAdjustments?.brightness).toBe(0.0);
      expect(loaded?.imageAdjustments?.contrast).toBe(1.0);
      expect(loaded?.imageAdjustments?.crop).toEqual(DEFAULT_IMAGE_ADJUSTMENTS.crop);
      expect(loaded?.imageAdjustments?.rotation).toBe(0);
    });
  });
});
