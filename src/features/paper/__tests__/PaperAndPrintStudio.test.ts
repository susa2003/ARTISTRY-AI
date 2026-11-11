/**
 * ARTISTRY AI — Phase 6: Paper & Print Studio Automated Test Suite
 * Comprehensive verification of all Phase 6 deliverables:
 * 1. Paper Setup: A3, A4, A5, A6, US Letter & Custom in Portrait and Landscape
 * 2. Independent Margins & Printable Safe Area calculations
 * 3. Centered vs Top-Left Grid Alignment & Offsets
 * 4. Multi-Resolution DPI Calibration (150, 200, 300, 600 DPI)
 * 5. Physical Scale to PostScript Point accuracy (72 pt / inch)
 * 6. Genuine ISO 32000-1 PDF Binary Generation:
 *    - %PDF-1.4 header and xref table
 *    - Exact MediaBox dimensions in PostScript points
 *    - Type 1 Helvetica font embedding
 *    - Vector grid lines and alphanumeric labels
 *    - Physical printer advisory warning
 *    - Template modes: Grid, Blank, Reference+Overlays
 *    - Async saving to device cache
 * 7. Printable HTML with CSS @page physical dimensions
 */

import {
  MM_PER_INCH,
  PT_PER_MM,
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
import {
  binaryStringToBase64,
  buildCalibratedPdf,
  mmToPt,
  ptToMm,
} from "../pdf/PdfDocumentBuilder";
import * as FileSystem from "expo-file-system/legacy";

describe("Phase 6: Paper & Print Studio Comprehensive Suite", () => {
  describe("1. Paper Setup & Standard Definitions (including ISO A6)", () => {
    it("should include ISO A6 (105 × 148 mm) in standard definitions", () => {
      expect(STANDARD_PAPER_DEFINITIONS.A6).toBeDefined();
      expect(STANDARD_PAPER_DEFINITIONS.A6.widthMm).toBe(105);
      expect(STANDARD_PAPER_DEFINITIONS.A6.heightMm).toBe(148);
    });

    it("should calculate correct dimensions for A6 in portrait and landscape", () => {
      const portrait = calculatePaperDimensions("A6", "portrait");
      expect(portrait.widthMm).toBe(105);
      expect(portrait.heightMm).toBe(148);

      const landscape = calculatePaperDimensions("A6", "landscape");
      expect(landscape.widthMm).toBe(148);
      expect(landscape.heightMm).toBe(105);
    });

    it("should verify standard ISO and ANSI dimensions across all sizes", () => {
      expect(calculatePaperDimensions("A3", "portrait")).toEqual({ widthMm: 297, heightMm: 420 });
      expect(calculatePaperDimensions("A4", "portrait")).toEqual({ widthMm: 210, heightMm: 297 });
      expect(calculatePaperDimensions("A5", "portrait")).toEqual({ widthMm: 148, heightMm: 210 });
      expect(calculatePaperDimensions("A6", "portrait")).toEqual({ widthMm: 105, heightMm: 148 });
      expect(calculatePaperDimensions("US_LETTER", "portrait")).toEqual({ widthMm: 215.9, heightMm: 279.4 });
    });

    it("should handle custom paper sizes with dimension clamping", () => {
      const custom = calculatePaperDimensions("CUSTOM", "portrait", 150, 250);
      expect(custom.widthMm).toBe(150);
      expect(custom.heightMm).toBe(250);

      // Clamping limits (min 20mm, max 2000mm)
      const clamped = calculatePaperDimensions("CUSTOM", "portrait", 5, 3000);
      expect(clamped.widthMm).toBe(20);
      expect(clamped.heightMm).toBe(2000);
    });
  });

  describe("2. Margins & Printable Safe Area", () => {
    it("should compute printable area with independent Top, Bottom, Left, Right margins", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4", // 210 x 297 mm
        orientation: "portrait",
        spacingXMm: 10,
        marginTopMm: 15,
        marginBottomMm: 20,
        marginLeftMm: 10,
        marginRightMm: 10,
      });

      expect(calc.marginTopMm).toBe(15);
      expect(calc.marginBottomMm).toBe(20);
      expect(calc.marginLeftMm).toBe(10);
      expect(calc.marginRightMm).toBe(10);

      // Printable width: 210 - 10 - 10 = 190 mm
      expect(calc.printableWidthMm).toBe(190);
      // Printable height: 297 - 15 - 20 = 262 mm
      expect(calc.printableHeightMm).toBe(262);
    });

    it("should prevent clipping by enforcing minimum printable area of 10 mm", () => {
      const calc = calculatePaperGrid({
        paperSize: "A6", // 105 x 148 mm
        orientation: "portrait",
        spacingXMm: 10,
        marginTopMm: 100,
        marginBottomMm: 100, // Margins exceed height!
        marginLeftMm: 60,
        marginRightMm: 60, // Margins exceed width!
      });

      expect(calc.printableWidthMm).toBe(10);
      expect(calc.printableHeightMm).toBe(10);
    });

    it("should support fitInsideMargins: true to constrain column/row counts to printable area", () => {
      // Full paper A4: floor(210 / 20) = 10 cols, floor(297 / 20) = 14 rows
      const fullSheetCalc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 20,
        marginLeftMm: 10,
        marginRightMm: 10,
        marginTopMm: 15,
        marginBottomMm: 15,
        fitInsideMargins: false,
      });
      expect(fullSheetCalc.columns).toBe(10);
      expect(fullSheetCalc.rows).toBe(14);

      // Inside margins A4: printableWidth = 190 mm -> floor(190 / 20) = 9 cols
      // printableHeight = 267 mm -> floor(267 / 20) = 13 rows
      const constrainedCalc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 20,
        marginLeftMm: 10,
        marginRightMm: 10,
        marginTopMm: 15,
        marginBottomMm: 15,
        fitInsideMargins: true,
      });
      expect(constrainedCalc.columns).toBe(9);
      expect(constrainedCalc.rows).toBe(13);
      expect(constrainedCalc.totalGridWidthMm).toBe(180);
      expect(constrainedCalc.totalGridHeightMm).toBe(260);
    });
  });

  describe("3. Grid Alignment Modes (Centered vs Top-Left)", () => {
    it("should calculate centered offsets within printable area", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 20,
        marginLeftMm: 10,
        marginRightMm: 10,
        marginTopMm: 10,
        marginBottomMm: 10,
        fitInsideMargins: true,
        alignmentMode: "centered",
      });

      // Printable width = 190 mm, cols = 9, gridWidth = 180 mm, remainder = 10 mm
      // Offset = left (10) + remainder / 2 (5) = 15 mm
      expect(calc.gridOffsetX).toBe(15);

      // Printable height = 277 mm, rows = 13, gridHeight = 260 mm, remainder = 17 mm
      // Offset = top (10) + remainder / 2 (8.5) = 18.5 mm
      expect(calc.gridOffsetY).toBe(18.5);
    });

    it("should calculate top-left aligned offsets", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 20,
        marginLeftMm: 12,
        marginRightMm: 10,
        marginTopMm: 14,
        marginBottomMm: 10,
        fitInsideMargins: true,
        alignmentMode: "top-left",
      });

      expect(calc.gridOffsetX).toBe(12);
      expect(calc.gridOffsetY).toBe(14);
    });
  });

  describe("4. Multi-Resolution DPI Calibration (150, 200, 300, 600 DPI)", () => {
    it("should calculate correct pixel dimensions for A4 at 150 DPI", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 10,
        targetDpi: 150,
      });

      // 210 mm * (150 / 25.4) ~ 1240 px
      // 297 mm * (150 / 25.4) ~ 1754 px
      expect(calc.pixelWidth).toBe(1240);
      expect(calc.pixelHeight).toBe(1754);
      expect(calc.cellWidthPx).toBe(59);
    });

    it("should calculate correct pixel dimensions for A4 at 200 DPI", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 10,
        targetDpi: 200,
      });

      // 210 mm * (200 / 25.4) ~ 1654 px
      // 297 mm * (200 / 25.4) ~ 2339 px
      expect(calc.pixelWidth).toBe(1654);
      expect(calc.pixelHeight).toBe(2339);
      expect(calc.cellWidthPx).toBe(79);
    });

    it("should calculate standard 300 DPI calibrated dimensions for A4 (2480 × 3508 px)", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 10,
        targetDpi: 300,
      });

      expect(calc.pixelWidth).toBe(2480);
      expect(calc.pixelHeight).toBe(3508);
      expect(calc.cellWidthPx).toBe(118);
      // Legacy fields must match
      expect(calc.pixelWidth300Dpi).toBe(2480);
      expect(calc.pixelHeight300Dpi).toBe(3508);
    });

    it("should calculate high-definition 600 DPI dimensions for A4 (4961 × 7016 px)", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 10,
        targetDpi: 600,
      });

      expect(calc.pixelWidth).toBe(4961);
      expect(calc.pixelHeight).toBe(7016);
      expect(calc.cellWidthPx).toBe(236);
    });
  });

  describe("5. Physical Scale to PostScript Points Conversion (72 pt / inch)", () => {
    it("should verify 1 mm = 72 / 25.4 pt (~2.8346 pt)", () => {
      expect(PT_PER_MM).toBeCloseTo(2.83464567, 4);
      expect(mmToPt(25.4)).toBe(72);
      expect(ptToMm(72)).toBe(25.4);
    });

    it("should calculate exact PostScript points for standard paper sizes", () => {
      // US Letter (8.5 x 11 in): exact 612 x 792 pt
      expect(mmToPt(215.9)).toBe(612);
      expect(mmToPt(279.4)).toBe(792);

      // ISO A4 (210 x 297 mm): 595.28 x 841.89 pt
      expect(mmToPt(210)).toBeCloseTo(595.28, 1);
      expect(mmToPt(297)).toBeCloseTo(841.89, 1);

      // ISO A3 (297 x 420 mm): 841.89 x 1190.55 pt
      expect(mmToPt(297)).toBeCloseTo(841.89, 1);
      expect(mmToPt(420)).toBeCloseTo(1190.55, 1);

      // ISO A6 (105 x 148 mm): 297.64 x 419.53 pt
      expect(mmToPt(105)).toBeCloseTo(297.64, 1);
      expect(mmToPt(148)).toBeCloseTo(419.53, 1);
    });

    it("should convert 10 mm grid spacing to exact PostScript points (28.35 pt)", () => {
      expect(mmToPt(10)).toBeCloseTo(28.35, 1);
    });
  });

  describe("6. Genuine ISO 32000-1 Binary PDF Generation", () => {
    it("should generate a valid PDF 1.4 document with header, xref table, and trailer", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 20,
      });

      const pdf = buildCalibratedPdf({
        calculation: calc,
        settings: { templateType: "grid", includeLabels: true, includeRulers: true },
        projectTitle: "ARTISTRY AI Test Document",
      });

      expect(pdf.pdfString.startsWith("%PDF-1.4")).toBe(true);
      expect(pdf.pdfString).toContain("xref");
      expect(pdf.pdfString).toContain("trailer");
      expect(pdf.pdfString).toContain("%%EOF");
      expect(pdf.byteLength).toBeGreaterThan(500);
      expect(pdf.pdfBase64.length).toBeGreaterThan(0);
    });

    it("should set exact physical MediaBox in points for A4 (595.28 × 841.89)", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 20,
      });

      const pdf = buildCalibratedPdf({ calculation: calc });
      expect(pdf.pdfString).toContain(`/MediaBox [0 0 ${pdf.pageWidthPt.toFixed(2)} ${pdf.pageHeightPt.toFixed(2)}]`);
      expect(pdf.pageWidthPt).toBeCloseTo(595.28, 1);
      expect(pdf.pageHeightPt).toBeCloseTo(841.89, 1);
    });

    it("should set exact physical MediaBox in points for A6 (297.64 × 419.53)", () => {
      const calc = calculatePaperGrid({
        paperSize: "A6",
        orientation: "portrait",
        spacingXMm: 10,
      });

      const pdf = buildCalibratedPdf({ calculation: calc });
      expect(pdf.pdfString).toContain(`/MediaBox [0 0 ${pdf.pageWidthPt.toFixed(2)} ${pdf.pageHeightPt.toFixed(2)}]`);
      expect(pdf.pageWidthPt).toBeCloseTo(297.64, 1);
      expect(pdf.pageHeightPt).toBeCloseTo(419.53, 1);
    });

    it("should embed Helvetica Type 1 font dictionary (/Type1 /Helvetica)", () => {
      const calc = calculatePaperGrid({ paperSize: "A4", orientation: "portrait", spacingXMm: 20 });
      const pdf = buildCalibratedPdf({ calculation: calc });

      expect(pdf.pdfString).toContain("/Subtype /Type1");
      expect(pdf.pdfString).toContain("/BaseFont /Helvetica");
    });

    it("should render alphanumeric grid labels (A, B, C... and 1, 2, 3...)", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 30, // 7 cols x 9 rows
      });

      const pdf = buildCalibratedPdf({
        calculation: calc,
        settings: { templateType: "grid", includeLabels: true },
      });

      // Verify letters A, B, C... are present in text operators
      expect(pdf.pdfString).toContain("(A) Tj");
      expect(pdf.pdfString).toContain("(B) Tj");
      expect(pdf.pdfString).toContain("(G) Tj"); // 7th column

      // Verify numbers 1, 2... 9 are present in text operators
      expect(pdf.pdfString).toContain("(1) Tj");
      expect(pdf.pdfString).toContain("(9) Tj");
    });

    it("should burn physical printer scale accuracy advisory into the footer", () => {
      const calc = calculatePaperGrid({ paperSize: "A4", orientation: "portrait", spacingXMm: 20 });
      const pdf = buildCalibratedPdf({ calculation: calc });

      expect(pdf.pdfString).toContain(
        "IMPORTANT FOR PHYSICAL SCALE: Print at 100% or 'Actual Size'"
      );
      expect(pdf.pdfString).toContain("Do NOT choose 'Fit to Page'");
    });

    it("should support blank paper template mode with zero grid lines", () => {
      const calc = calculatePaperGrid({ paperSize: "A4", orientation: "portrait", spacingXMm: 20 });
      const blankPdf = buildCalibratedPdf({
        calculation: calc,
        settings: { templateType: "blank" },
      });

      expect(blankPdf.gridLineCount).toBe(0);
      expect(blankPdf.pdfString).not.toContain("(A) Tj");
      // But it still has paper background, header, and advisory footer
      expect(blankPdf.pdfString).toContain("1.0 1.0 1.0 rg");
      expect(blankPdf.pdfString).toContain("IMPORTANT FOR PHYSICAL SCALE");
    });

    it("should serialize to Base64 and write to device cache via saveToFileAsync", async () => {
      const calc = calculatePaperGrid({ paperSize: "A4", orientation: "portrait", spacingXMm: 20 });
      const pdf = buildCalibratedPdf({ calculation: calc });

      const result = await pdf.saveToFileAsync("test_drawing_grid.pdf");
      expect(result.filename).toBe("test_drawing_grid.pdf");
      expect(result.uri).toContain("test_drawing_grid.pdf");
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });
  });

  describe("7. Base64 Binary Encoder", () => {
    it("should correctly encode ASCII and binary strings into valid Base64", () => {
      expect(binaryStringToBase64("Hello World")).toBe("SGVsbG8gV29ybGQ=");
      expect(binaryStringToBase64("%PDF-1.4")).toBe("JVBERi0xLjQ=");
    });
  });

  describe("8. Standalone Printable HTML Generator with CSS @page", () => {
    it("should generate HTML document with exact millimeter size in CSS @page", () => {
      const calc = calculatePaperGrid({
        paperSize: "A4",
        orientation: "portrait",
        spacingXMm: 20,
      });

      const html = generatePrintableHtml(calc);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("@page {");
      expect(html).toContain("size: 210mm 297mm;");
      expect(html).toContain("width: 210mm;");
      expect(html).toContain("height: 297mm;");
    });
  });
});
