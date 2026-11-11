/**
 * ARTISTRY AI — Paper & Print Studio Automated Test Suite
 * Comprehensive tests for the Smart Paper-Based Grid Spacing Calculator:
 * 1. Paper selection (A3, A4, A5, US Letter, Custom) in Portrait & Landscape
 * 2. Unit conversions (mm, cm, in) and decimal precision
 * 3. Automatic row/column calculations using floor(paper / spacing)
 * 4. Remaining edge space & symmetric margin offsets
 * 5. Independent horizontal vs. vertical spacing
 * 6. Smart grid recommendations engine
 * 7. 300 DPI print calibration (2480x3508 px for A4)
 * 8. Millimetre-accurate SVG & HTML printable export generation
 * 9. Integration with GridOverlayConfig and Reference Studio
 */

import {
  GRID_SPACING_PRESETS,
  STANDARD_DPI,
  STANDARD_PAPER_DEFINITIONS,
  calculatePaperDimensions,
  calculatePaperGrid,
  generatePrintableHtml,
  generatePrintableSvg,
  getColumnLetter,
  getSmartRecommendations,
  mmToUnit,
  unitToMm,
} from "../paperGridCalculator";
import type { PaperGridCalculation } from "../types";
import type { GridOverlayConfig, PaperSettings } from "../../../domain/overlayTypes";

describe("Smart Paper-Based Grid Spacing Calculator (Paper & Print Studio)", () => {
  describe("1. Paper Dimensions & Orientation Handling", () => {
    it("should calculate correct dimensions for ISO A4 in portrait and landscape", () => {
      const portrait = calculatePaperDimensions("A4", "portrait");
      expect(portrait.widthMm).toBe(210);
      expect(portrait.heightMm).toBe(297);

      const landscape = calculatePaperDimensions("A4", "landscape");
      expect(landscape.widthMm).toBe(297);
      expect(landscape.heightMm).toBe(210);
    });

    it("should calculate correct dimensions for ISO A3 in portrait and landscape", () => {
      const portrait = calculatePaperDimensions("A3", "portrait");
      expect(portrait.widthMm).toBe(297);
      expect(portrait.heightMm).toBe(420);

      const landscape = calculatePaperDimensions("A3", "landscape");
      expect(landscape.widthMm).toBe(420);
      expect(landscape.heightMm).toBe(297);
    });

    it("should calculate correct dimensions for ISO A5 in portrait and landscape", () => {
      const portrait = calculatePaperDimensions("A5", "portrait");
      expect(portrait.widthMm).toBe(148);
      expect(portrait.heightMm).toBe(210);

      const landscape = calculatePaperDimensions("A5", "landscape");
      expect(landscape.widthMm).toBe(210);
      expect(landscape.heightMm).toBe(148);
    });

    it("should calculate correct dimensions for US Letter in portrait and landscape", () => {
      const portrait = calculatePaperDimensions("US_LETTER", "portrait");
      expect(portrait.widthMm).toBe(215.9);
      expect(portrait.heightMm).toBe(279.4);

      const landscape = calculatePaperDimensions("US_LETTER", "landscape");
      expect(landscape.widthMm).toBe(279.4);
      expect(landscape.heightMm).toBe(215.9);
    });

    it("should support custom paper width and height with orientation safety", () => {
      const customPortrait = calculatePaperDimensions("CUSTOM", "portrait", 180, 260);
      expect(customPortrait.widthMm).toBe(180);
      expect(customPortrait.heightMm).toBe(260);

      const customLandscape = calculatePaperDimensions("CUSTOM", "landscape", 180, 260);
      expect(customLandscape.widthMm).toBe(260);
      expect(customLandscape.heightMm).toBe(180);
    });

    it("should clamp invalid custom paper dimensions safely", () => {
      const customClamped = calculatePaperDimensions("CUSTOM", "portrait", 5, 5000);
      expect(customClamped.widthMm).toBe(20);
      expect(customClamped.heightMm).toBe(2000);
    });
  });

  describe("2. Unit Conversions (mm, cm, in)", () => {
    it("should convert millimetres (1:1)", () => {
      expect(unitToMm(10, "mm")).toBe(10);
      expect(unitToMm(12.5, "mm")).toBe(12.5);
    });

    it("should convert centimetres to millimetres (1 cm = 10 mm)", () => {
      expect(unitToMm(1, "cm")).toBe(10);
      expect(unitToMm(2.5, "cm")).toBe(25);
      expect(unitToMm(0.5, "cm")).toBe(5);
    });

    it("should convert inches to millimetres (1 in = 25.4 mm)", () => {
      expect(unitToMm(1, "in")).toBe(25.4);
      expect(unitToMm(0.5, "in")).toBe(12.7);
      expect(unitToMm(2, "in")).toBe(50.8);
    });

    it("should convert millimetres back to display units", () => {
      expect(mmToUnit(10, "cm")).toBe(1);
      expect(mmToUnit(25.4, "in")).toBe(1);
      expect(mmToUnit(12.7, "in")).toBe(0.5);
      expect(mmToUnit(15, "mm")).toBe(15);
    });

    it("should handle non-positive or NaN values safely", () => {
      expect(unitToMm(-5, "mm")).toBe(10);
      expect(unitToMm(NaN, "cm")).toBe(10);
      expect(mmToUnit(0, "cm")).toBe(0);
    });
  });

  describe("3. Automatic Row & Column Calculation (Floor Formula)", () => {
    it("should calculate exact A4 portrait grid with 1 cm (10 mm) spacing", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 10,
      });

      // columns = floor(210 / 10) = 21
      expect(calc.columns).toBe(21);
      // rows = floor(297 / 10) = 29
      expect(calc.rows).toBe(29);
      expect(calc.totalCells).toBe(609);

      // Remaining edge space
      expect(calc.totalGridWidthMm).toBe(210);
      expect(calc.remainderXMm).toBe(0);
      expect(calc.marginXMm).toBe(0);

      expect(calc.totalGridHeightMm).toBe(290);
      expect(calc.remainderYMm).toBe(7);
      expect(calc.marginYMm).toBe(3.5);
    });

    it("should calculate exact A4 portrait grid with 2 cm (20 mm) spacing", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 20,
      });

      // columns = floor(210 / 20) = 10
      expect(calc.columns).toBe(10);
      // rows = floor(297 / 20) = 14
      expect(calc.rows).toBe(14);
      expect(calc.totalCells).toBe(140);

      expect(calc.totalGridWidthMm).toBe(200);
      expect(calc.remainderXMm).toBe(10);
      expect(calc.marginXMm).toBe(5);

      expect(calc.totalGridHeightMm).toBe(280);
      expect(calc.remainderYMm).toBe(17);
      expect(calc.marginYMm).toBe(8.5);
    });

    it("should calculate exact A4 portrait grid with 3 cm (30 mm) spacing", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 30,
      });

      // columns = floor(210 / 30) = 7
      expect(calc.columns).toBe(7);
      // rows = floor(297 / 30) = 9
      expect(calc.rows).toBe(9);
      expect(calc.totalCells).toBe(63);

      expect(calc.remainderXMm).toBe(0);
      expect(calc.remainderYMm).toBe(27);
      expect(calc.marginXMm).toBe(0);
      expect(calc.marginYMm).toBe(13.5);
    });

    it("should calculate exact A4 portrait grid with 5 cm (50 mm) spacing", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 50,
      });

      // columns = floor(210 / 50) = 4
      expect(calc.columns).toBe(4);
      // rows = floor(297 / 50) = 5
      expect(calc.rows).toBe(5);
      expect(calc.totalCells).toBe(20);

      expect(calc.totalGridWidthMm).toBe(200);
      expect(calc.remainderXMm).toBe(10);
      expect(calc.marginXMm).toBe(5);

      expect(calc.totalGridHeightMm).toBe(250);
      expect(calc.remainderYMm).toBe(47);
      expect(calc.marginYMm).toBe(23.5);
    });

    it("should calculate custom decimal spacing (e.g. 12.5 mm on A4)", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 12.5,
      });

      // columns = floor(210 / 12.5) = 16
      expect(calc.columns).toBe(16);
      // rows = floor(297 / 12.5) = 23
      expect(calc.rows).toBe(23);

      expect(calc.totalGridWidthMm).toBe(200);
      expect(calc.remainderXMm).toBe(10);
      expect(calc.marginXMm).toBe(5);

      expect(calc.totalGridHeightMm).toBe(287.5);
      expect(calc.remainderYMm).toBe(9.5);
      expect(calc.marginYMm).toBe(4.75);
    });
  });

  describe("4. Independent Horizontal & Vertical Spacing (Unlinked Mode)", () => {
    it("should calculate rectangular grid cells when spacingX != spacingY", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 15,
        spacingYMm: 25,
      });

      expect(calc.isSquare).toBe(false);
      expect(calc.cellWidthMm).toBe(15);
      expect(calc.cellHeightMm).toBe(25);

      // columns = floor(210 / 15) = 14
      expect(calc.columns).toBe(14);
      // rows = floor(297 / 25) = 11
      expect(calc.rows).toBe(11);

      expect(calc.totalGridWidthMm).toBe(210);
      expect(calc.remainderXMm).toBe(0);

      expect(calc.totalGridHeightMm).toBe(275);
      expect(calc.remainderYMm).toBe(22);
      expect(calc.marginYMm).toBe(11);
    });
  });

  describe("5. Smart Recommendations Engine", () => {
    it("should provide smart recommendations for A4 portrait matching specifications", () => {
      const recs = getSmartRecommendations(210, 297);
      expect(recs.length).toBeGreaterThanOrEqual(4);

      const r1 = recs.find((r) => r.presetMm === 10);
      expect(r1).toBeDefined();
      expect(r1?.columns).toBe(21);
      expect(r1?.rows).toBe(29);
      expect(r1?.remainderXMm).toBe(0);
      expect(r1?.remainderYMm).toBe(7);

      const r2 = recs.find((r) => r.presetMm === 20);
      expect(r2).toBeDefined();
      expect(r2?.columns).toBe(10);
      expect(r2?.rows).toBe(14);
      expect(r2?.remainderXMm).toBe(10);
      expect(r2?.remainderYMm).toBe(17);

      const r3 = recs.find((r) => r.presetMm === 30);
      expect(r3).toBeDefined();
      expect(r3?.columns).toBe(7);
      expect(r3?.rows).toBe(9);
      expect(r3?.remainderXMm).toBe(0);
      expect(r3?.remainderYMm).toBe(27);

      const r4 = recs.find((r) => r.presetMm === 50);
      expect(r4).toBeDefined();
      expect(r4?.columns).toBe(4);
      expect(r4?.rows).toBe(5);
      expect(r4?.remainderXMm).toBe(10);
      expect(r4?.remainderYMm).toBe(47);
    });

    it("should adapt recommendations for small paper sizes (e.g. A5: 148x210)", () => {
      const recs = getSmartRecommendations(148, 210);
      expect(recs.length).toBeGreaterThanOrEqual(3);

      const r1 = recs.find((r) => r.presetMm === 10);
      expect(r1?.columns).toBe(14);
      expect(r1?.rows).toBe(21);

      const r2 = recs.find((r) => r.presetMm === 20);
      expect(r2?.columns).toBe(7);
      expect(r2?.rows).toBe(10);
    });
  });

  describe("6. 300 DPI Print Calibration & Standard Resolutions", () => {
    it("should compute exact standard 300 DPI pixel dimensions for A4 (2480 × 3508 px)", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 10,
        targetDpi: 300,
      });

      // Global standard A4 @ 300 DPI: 2480 x 3508 px
      expect(calc.pixelWidth300Dpi).toBe(2480);
      expect(calc.pixelHeight300Dpi).toBe(3508);

      // Cell width at 300 DPI for 10mm: round(10 / 25.4 * 300) = 118 px
      expect(calc.cellWidthPx300Dpi).toBe(118);
    });

    it("should compute exact standard 300 DPI pixel dimensions for A3 (3508 × 4961 px)", () => {
      const calc = calculatePaperGrid({
        paperSize: "A3",
        orientation: "portrait",
        spacingXMm: 20,
        targetDpi: 300,
      });

      // Global standard A3 @ 300 DPI: 3508 x 4961 px
      expect(calc.pixelWidth300Dpi).toBe(3508);
      expect(calc.pixelHeight300Dpi).toBe(4961);
    });
  });

  describe("7. Column Lettering Utility", () => {
    it("should return single letters A through Z for first 26 columns", () => {
      expect(getColumnLetter(0)).toBe("A");
      expect(getColumnLetter(1)).toBe("B");
      expect(getColumnLetter(25)).toBe("Z");
    });

    it("should return double letters AA, AB... for columns beyond 26", () => {
      expect(getColumnLetter(26)).toBe("AA");
      expect(getColumnLetter(27)).toBe("AB");
      expect(getColumnLetter(51)).toBe("AZ");
      expect(getColumnLetter(52)).toBe("BA");
    });
  });

  describe("8. Millimetre-Accurate SVG & HTML Export", () => {
    const calc = calculatePaperGrid({
      paperSize: "A4",
      orientation: "portrait",
      spacingXMm: 20,
    });

    it("should generate clean, valid SVG with physical millimetre units", () => {
      const svg = generatePrintableSvg(calc);

      expect(svg).toContain('width="210mm"');
      expect(svg).toContain('height="297mm"');
      expect(svg).toContain('viewBox="0 0 210 297"');
      expect(svg).toContain('id="grid-lines"');
      expect(svg).toContain('id="grid-labels"');
      expect(svg).toContain('300 DPI Print Calibrated');
    });

    it("should generate HTML document with CSS @page millimeter dimensions", () => {
      const html = generatePrintableHtml(calc);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("@page {");
      expect(html).toContain("size: 210mm 297mm;");
      expect(html).toContain("margin: 0;");
      expect(html).toContain('<div class="sheet-wrapper">');
    });
  });

  describe("9. Integration with GridOverlayConfig & Reference Studio", () => {
    it("should map calculation output to valid millimetre GridOverlayConfig", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 20,
      });

      const overlay: GridOverlayConfig = {
        id: "test-grid-overlay",
        type: "grid",
        name: "Paper Calibrated Grid",
        visible: true,
        opacity: 0.8,
        locked: false,
        zIndex: 1,
        mode: "standard",
        cellMode: "millimetre",
        cellSpacingMm: calc.spacingXMm,
        cellSpacingMmX: calc.spacingXMm,
        cellSpacingMmY: calc.spacingYMm,
        divisions: calc.columns,
        gridColumns: calc.columns,
        gridRows: calc.rows,
        paperMarginXMm: calc.marginXMm,
        paperMarginYMm: calc.marginYMm,
        color: "#28594B",
        strokeWidth: 1.5,
        showLabels: true,
        showDiagonals: false,
        showSubdivisions: false,
      };

      expect(overlay.cellMode).toBe("millimetre");
      expect(overlay.cellSpacingMmX).toBe(20);
      expect(overlay.gridColumns).toBe(10);
      expect(overlay.gridRows).toBe(14);
      expect(overlay.paperMarginXMm).toBe(5);
      expect(overlay.paperMarginYMm).toBe(8.5);
    });

    it("should verify preset list covers all 8 required options", () => {
      const values = GRID_SPACING_PRESETS.map((p) => p.valueMm);
      expect(values).toEqual([5, 10, 15, 20, 25, 30, 40, 50]);
    });
  });
});
