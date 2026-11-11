/**
 * ARTISTRY AI — Smart Paper-Based Grid Spacing Calculator Modal
 * Interactive workstation modal providing:
 * - Real-time paper selection (A3, A4, A5, US Letter, Custom) with orientation toggle
 * - Preset & custom decimal spacing with unit conversion (mm, cm, in)
 * - Independent horizontal & vertical spacing link/unlink toggle
 * - Immediate calculation of columns, rows, cell dimensions, and remaining margins
 * - Live aspect-accurate visual paper grid preview
 * - Smart paper-size-aware recommendations (e.g. A4: 1cm -> 21x29, 2cm -> 10x14, etc.)
 * - 1-tap "Apply Grid to Reference Studio" and printable export
 */

import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import type { PaperOrientation, PaperSize } from "../../domain/overlayTypes";
import type {
  ExportDpi,
  ExportTemplateType,
  GridAlignmentMode,
  PaperGridCalculation,
  SpacingUnit,
} from "./types";
import {
  GRID_SPACING_PRESETS,
  STANDARD_PAPER_DEFINITIONS,
  calculatePaperGrid,
  generatePrintableHtml,
  generatePrintableSvg,
  getSmartRecommendations,
  mmToUnit,
  unitToMm,
} from "./paperGridCalculator";
import { buildCalibratedPdf } from "./pdf/PdfDocumentBuilder";
import { PaperGridVisualPreview } from "./PaperGridVisualPreview";

interface PaperGridCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  initialPaperSize?: PaperSize;
  initialOrientation?: PaperOrientation;
  initialCustomWidthMm?: number;
  initialCustomHeightMm?: number;
  initialSpacingMm?: number;
  initialMarginTopMm?: number;
  initialMarginBottomMm?: number;
  initialMarginLeftMm?: number;
  initialMarginRightMm?: number;
  onApplyGrid: (calculation: PaperGridCalculation) => void;
}

export function PaperGridCalculatorModal({
  visible,
  onClose,
  initialPaperSize = "A4",
  initialOrientation = "portrait",
  initialCustomWidthMm = 210,
  initialCustomHeightMm = 297,
  initialSpacingMm = 20,
  initialMarginTopMm = 5,
  initialMarginBottomMm = 5,
  initialMarginLeftMm = 5,
  initialMarginRightMm = 5,
  onApplyGrid,
}: PaperGridCalculatorModalProps) {
  // State: Paper Selection
  const [paperSize, setPaperSize] = useState<PaperSize>(initialPaperSize);
  const [orientation, setOrientation] = useState<PaperOrientation>(initialOrientation);
  const [customWidthText, setCustomWidthText] = useState(String(initialCustomWidthMm));
  const [customHeightText, setCustomHeightText] = useState(String(initialCustomHeightMm));

  // State: Margins
  const [marginTopText, setMarginTopText] = useState(String(initialMarginTopMm));
  const [marginBottomText, setMarginBottomText] = useState(String(initialMarginBottomMm));
  const [marginLeftText, setMarginLeftText] = useState(String(initialMarginLeftMm));
  const [marginRightText, setMarginRightText] = useState(String(initialMarginRightMm));
  const [marginsLinked, setMarginsLinked] = useState(true);
  const [alignmentMode, setAlignmentMode] = useState<GridAlignmentMode>("centered");
  const [fitInsideMargins, setFitInsideMargins] = useState(false);

  // State: Spacing & Units
  const [unit, setUnit] = useState<SpacingUnit>("mm");
  const [isLinked, setIsLinked] = useState(true); // Linked X & Y for square cells
  const [spacingXText, setSpacingXText] = useState(String(initialSpacingMm));
  const [spacingYText, setSpacingYText] = useState(String(initialSpacingMm));

  // State: Export Options
  const [exportFormat, setExportFormat] = useState<"pdf" | "html">("pdf");
  const [templateType, setTemplateType] = useState<ExportTemplateType>("grid");
  const [exportDpi, setExportDpi] = useState<ExportDpi>(300);
  const [includeLabels, setIncludeLabels] = useState(true);
  const [includeMargins, setIncludeMargins] = useState(true);
  const [includeRulers, setIncludeRulers] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Parse numeric values safely
  const customWidthMm = Math.max(20, parseFloat(customWidthText) || 210);
  const customHeightMm = Math.max(20, parseFloat(customHeightText) || 297);

  const parsedSpacingX = Math.max(0.1, parseFloat(spacingXText) || 10);
  const parsedSpacingY = isLinked
    ? parsedSpacingX
    : Math.max(0.1, parseFloat(spacingYText) || parsedSpacingX);

  // Convert inputs to millimetres for calculations
  const spacingXMm = unitToMm(parsedSpacingX, unit);
  const spacingYMm = unitToMm(parsedSpacingY, unit);

  const marginTopMm = unitToMm(Math.max(0, parseFloat(marginTopText) || 0), unit);
  const marginBottomMm = unitToMm(Math.max(0, parseFloat(marginBottomText) || 0), unit);
  const marginLeftMm = unitToMm(Math.max(0, parseFloat(marginLeftText) || 0), unit);
  const marginRightMm = unitToMm(Math.max(0, parseFloat(marginRightText) || 0), unit);

  // Real-time calculation output
  const calculation = useMemo(() => {
    return calculatePaperGrid({
      paperSize,
      orientation,
      spacingXMm,
      spacingYMm,
      customWidthMm,
      customHeightMm,
      selectedUnit: unit,
      targetDpi: exportDpi,
      marginTopMm,
      marginBottomMm,
      marginLeftMm,
      marginRightMm,
      alignmentMode,
      fitInsideMargins,
    });
  }, [
    paperSize,
    orientation,
    spacingXMm,
    spacingYMm,
    customWidthMm,
    customHeightMm,
    unit,
    exportDpi,
    marginTopMm,
    marginBottomMm,
    marginLeftMm,
    marginRightMm,
    alignmentMode,
    fitInsideMargins,
  ]);

  // Smart recommendations for current paper size
  const recommendations = useMemo(() => {
    return getSmartRecommendations(calculation.paperWidthMm, calculation.paperHeightMm);
  }, [calculation.paperWidthMm, calculation.paperHeightMm]);

  // Apply a preset directly
  const handleSelectPreset = (presetMm: number) => {
    const converted = mmToUnit(presetMm, unit);
    setSpacingXText(String(converted));
    setSpacingYText(String(converted));
  };

  // Margin Handlers
  const handleUpdateMargin = (field: "top" | "bottom" | "left" | "right", val: string) => {
    if (marginsLinked) {
      setMarginTopText(val);
      setMarginBottomText(val);
      setMarginLeftText(val);
      setMarginRightText(val);
    } else {
      if (field === "top") setMarginTopText(val);
      if (field === "bottom") setMarginBottomText(val);
      if (field === "left") setMarginLeftText(val);
      if (field === "right") setMarginRightText(val);
    }
  };

  // Unit change handler (converts current displayed numbers to new unit)
  const handleChangeUnit = (newUnit: SpacingUnit) => {
    if (newUnit === unit) return;
    const currentMmX = unitToMm(parseFloat(spacingXText) || 10, unit);
    const currentMmY = unitToMm(parseFloat(spacingYText) || 10, unit);
    setUnit(newUnit);
    setSpacingXText(String(mmToUnit(currentMmX, newUnit)));
    setSpacingYText(String(mmToUnit(currentMmY, newUnit)));

    const curTopMm = unitToMm(parseFloat(marginTopText) || 5, unit);
    setMarginTopText(String(mmToUnit(curTopMm, newUnit)));
    setMarginBottomText(String(mmToUnit(curTopMm, newUnit)));
    setMarginLeftText(String(mmToUnit(curTopMm, newUnit)));
    setMarginRightText(String(mmToUnit(curTopMm, newUnit)));
  };

  const handleApply = () => {
    onApplyGrid(calculation);
    onClose();
  };

  // Export Document (PDF or HTML) via expo-sharing
  const handleExportDocument = async () => {
    setExporting(true);
    try {
      if (exportFormat === "pdf") {
        const result = buildCalibratedPdf({
          calculation,
          settings: {
            templateType,
            dpi: exportDpi,
            includeLabels,
            includeMargins,
            includeRulers,
            color: "#28594B",
          },
          projectTitle: "ARTISTRY AI — Physical Drawing Template",
        });

        const { uri } = await result.saveToFileAsync();

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: "Print Physical Drawing Grid",
            UTI: "com.adobe.pdf",
          });
        } else {
          Alert.alert("PDF Export Ready", `Generated calibrated PDF (${result.byteLength} bytes) at:\n${uri}`);
        }
      } else {
        const htmlContent = generatePrintableHtml(calculation);
        const filename = `ARTISTRY_Grid_${calculation.paperSize}_${calculation.columns}x${calculation.rows}_${calculation.spacingXMm}mm.html`;
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;

        await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "text/html",
            dialogTitle: "Print Physical Drawing Grid",
            UTI: "public.html",
          });
        } else {
          Alert.alert("Print Template Ready", `Generated HTML printable sheet at:\n${fileUri}`);
        }
      }
    } catch (err) {
      Alert.alert("Export Failed", err instanceof Error ? err.message : "Could not export document.");
    } finally {
      setExporting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.headerTag}>
                <Text style={styles.headerTagText}>PAPER & PRINT STUDIO</Text>
              </View>
              <Text style={styles.title}>Smart Paper Grid Calculator</Text>
              <Text style={styles.subtitle}>
                Metric paper sizing & calibrated physical drawing grids
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              accessibilityLabel="Close Calculator"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* 1. PAPER SELECTION & ORIENTATION */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>1. Target Paper Size</Text>
                <View style={styles.orientationToggleGroup}>
                  <Pressable
                    onPress={() => setOrientation("portrait")}
                    style={[
                      styles.orientBtn,
                      orientation === "portrait" && styles.orientBtnActive,
                    ]}
                  >
                    <Text style={[styles.orientBtnText, orientation === "portrait" && styles.orientBtnTextActive]}>
                      ↕ Portrait
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setOrientation("landscape")}
                    style={[
                      styles.orientBtn,
                      orientation === "landscape" && styles.orientBtnActive,
                    ]}
                  >
                    <Text style={[styles.orientBtnText, orientation === "landscape" && styles.orientBtnTextActive]}>
                      ↔ Landscape
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Standard Paper Tabs */}
              <View style={styles.paperTabs}>
                {(["A4", "A3", "A5", "A6", "US_LETTER", "CUSTOM"] as const).map((s) => {
                  const isSelected = paperSize === s;
                  const label =
                    s === "US_LETTER"
                      ? "US Letter"
                      : s === "CUSTOM"
                      ? "Custom"
                      : `ISO ${s}`;
                  const dims =
                    s === "CUSTOM"
                      ? `${customWidthMm}×${customHeightMm}mm`
                      : `${STANDARD_PAPER_DEFINITIONS[s].widthMm}×${STANDARD_PAPER_DEFINITIONS[s].heightMm}mm`;

                  return (
                    <Pressable
                      key={s}
                      onPress={() => setPaperSize(s)}
                      style={[styles.paperTab, isSelected && styles.paperTabActive]}
                    >
                      <Text style={[styles.paperTabTitle, isSelected && styles.paperTabTitleActive]}>
                        {label}
                      </Text>
                      <Text style={styles.paperTabDims}>{dims}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Custom Size Numeric Inputs */}
              {paperSize === "CUSTOM" && (
                <View style={styles.customDimsRow}>
                  <View style={styles.customInputGroup}>
                    <Text style={styles.inputLabel}>Width (mm):</Text>
                    <TextInput
                      style={styles.numericInput}
                      value={customWidthText}
                      onChangeText={setCustomWidthText}
                      keyboardType="numeric"
                      placeholder="210"
                      placeholderTextColor="#68776E"
                    />
                  </View>
                  <View style={styles.customInputGroup}>
                    <Text style={styles.inputLabel}>Height (mm):</Text>
                    <TextInput
                      style={styles.numericInput}
                      value={customHeightText}
                      onChangeText={setCustomHeightText}
                      keyboardType="numeric"
                      placeholder="297"
                      placeholderTextColor="#68776E"
                    />
                  </View>
                </View>
              )}
            </View>

            {/* 2. MARGINS & PRINTABLE AREA */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>2. Margins & Printable Safe Area</Text>
                  <Text style={styles.sectionHint}>
                    Printable: {calculation.printableWidthMm} × {calculation.printableHeightMm} mm
                  </Text>
                </View>

                <Pressable
                  onPress={() => setMarginsLinked(!marginsLinked)}
                  style={[styles.linkToggleBtn, marginsLinked && styles.linkToggleBtnActive]}
                >
                  <Text style={styles.linkToggleText}>{marginsLinked ? "🔗 Margins Linked" : "🔓 Independent"}</Text>
                </Pressable>
              </View>

              <View style={styles.marginsGridRow}>
                <View style={styles.marginInputGroup}>
                  <Text style={styles.marginFieldLabel}>Top ({unit})</Text>
                  <TextInput
                    style={styles.marginNumericInput}
                    value={marginTopText}
                    onChangeText={(t) => handleUpdateMargin("top", t)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.marginInputGroup}>
                  <Text style={styles.marginFieldLabel}>Bottom ({unit})</Text>
                  <TextInput
                    style={styles.marginNumericInput}
                    value={marginBottomText}
                    onChangeText={(t) => handleUpdateMargin("bottom", t)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.marginInputGroup}>
                  <Text style={styles.marginFieldLabel}>Left ({unit})</Text>
                  <TextInput
                    style={styles.marginNumericInput}
                    value={marginLeftText}
                    onChangeText={(t) => handleUpdateMargin("left", t)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.marginInputGroup}>
                  <Text style={styles.marginFieldLabel}>Right ({unit})</Text>
                  <TextInput
                    style={styles.marginNumericInput}
                    value={marginRightText}
                    onChangeText={(t) => handleUpdateMargin("right", t)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.alignmentOptionsRow}>
                <View style={styles.unitSelector}>
                  <Pressable
                    onPress={() => setAlignmentMode("centered")}
                    style={[styles.unitBtn, alignmentMode === "centered" && styles.unitBtnActive]}
                  >
                    <Text style={[styles.unitBtnText, alignmentMode === "centered" && styles.unitBtnTextActive]}>
                      Centered
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setAlignmentMode("top-left")}
                    style={[styles.unitBtn, alignmentMode === "top-left" && styles.unitBtnActive]}
                  >
                    <Text style={[styles.unitBtnText, alignmentMode === "top-left" && styles.unitBtnTextActive]}>
                      Top-Left
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => setFitInsideMargins(!fitInsideMargins)}
                  style={[styles.fitToggleBtn, fitInsideMargins && styles.fitToggleBtnActive]}
                >
                  <Text style={[styles.fitToggleBtnText, fitInsideMargins && styles.fitToggleBtnTextActive]}>
                    {fitInsideMargins ? "✓ Fit Inside Margins" : "Full Paper Sheet"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 3. SMART GRID SPACING & UNITS */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>3. Grid Line Spacing</Text>
                {/* Unit Switcher */}
                <View style={styles.unitSelector}>
                  {(["mm", "cm", "in"] as const).map((u) => (
                    <Pressable
                      key={u}
                      onPress={() => handleChangeUnit(u)}
                      style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                    >
                      <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>
                        {u}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Preset Spacing Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsScroll}
              >
                {GRID_SPACING_PRESETS.map((p) => {
                  const isCurrent = Math.abs(spacingXMm - p.valueMm) < 0.1 && isLinked;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => handleSelectPreset(p.valueMm)}
                      style={[styles.presetPill, isCurrent && styles.presetPillActive]}
                    >
                      <Text style={[styles.presetPillText, isCurrent && styles.presetPillTextActive]}>
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Spacing Inputs with Link/Unlink */}
              <View style={styles.spacingControlsCard}>
                <View style={styles.spacingInputBlock}>
                  <Text style={styles.spacingInputLabel}>
                    {isLinked ? "Square Spacing" : "Horizontal Spacing (X)"}
                  </Text>
                  <View style={styles.inputStepperRow}>
                    <Pressable
                      onPress={() => {
                        const next = Math.max(1, parsedSpacingX - (unit === "in" ? 0.25 : unit === "cm" ? 0.5 : 5));
                        setSpacingXText(String(Math.round(next * 10) / 10));
                        if (isLinked) setSpacingYText(String(Math.round(next * 10) / 10));
                      }}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>−</Text>
                    </Pressable>

                    <TextInput
                      style={styles.spacingTextInput}
                      value={spacingXText}
                      onChangeText={(t) => {
                        setSpacingXText(t);
                        if (isLinked) setSpacingYText(t);
                      }}
                      keyboardType="numeric"
                    />

                    <Text style={styles.spacingUnitTag}>{unit}</Text>

                    <Pressable
                      onPress={() => {
                        const next = parsedSpacingX + (unit === "in" ? 0.25 : unit === "cm" ? 0.5 : 5);
                        setSpacingXText(String(Math.round(next * 10) / 10));
                        if (isLinked) setSpacingYText(String(Math.round(next * 10) / 10));
                      }}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Link Toggle Button */}
                <Pressable
                  onPress={() => {
                    const nextLinked = !isLinked;
                    setIsLinked(nextLinked);
                    if (nextLinked) {
                      setSpacingYText(spacingXText);
                    }
                  }}
                  style={[styles.linkToggleBtn, isLinked && styles.linkToggleBtnActive]}
                  accessibilityLabel="Toggle linked square cells"
                >
                  <Text style={styles.linkToggleIcon}>{isLinked ? "🔗" : "🔓"}</Text>
                  <Text style={styles.linkToggleText}>
                    {isLinked ? "Linked (Square)" : "Independent"}
                  </Text>
                </Pressable>

                {/* Vertical Spacing when unlinked */}
                {!isLinked && (
                  <View style={[styles.spacingInputBlock, { marginTop: 10 }]}>
                    <Text style={styles.spacingInputLabel}>Vertical Spacing (Y)</Text>
                    <View style={styles.inputStepperRow}>
                      <Pressable
                        onPress={() => {
                          const next = Math.max(1, parsedSpacingY - (unit === "in" ? 0.25 : unit === "cm" ? 0.5 : 5));
                          setSpacingYText(String(Math.round(next * 10) / 10));
                        }}
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>−</Text>
                      </Pressable>

                      <TextInput
                        style={styles.spacingTextInput}
                        value={spacingYText}
                        onChangeText={setSpacingYText}
                        keyboardType="numeric"
                      />

                      <Text style={styles.spacingUnitTag}>{unit}</Text>

                      <Pressable
                        onPress={() => {
                          const next = parsedSpacingY + (unit === "in" ? 0.25 : unit === "cm" ? 0.5 : 5);
                          setSpacingYText(String(Math.round(next * 10) / 10));
                        }}
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* 4. SMART RECOMMENDATIONS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Smart Spacing Recommendations</Text>
              <Text style={styles.sectionHint}>
                Optimal grid spacing calibrated specifically for {calculation.paperSize} {calculation.orientation}:
              </Text>

              <View style={styles.recsGrid}>
                {recommendations.map((rec) => {
                  const isCurrent = Math.abs(spacingXMm - rec.presetMm) < 0.1 && isLinked;
                  return (
                    <Pressable
                      key={rec.id}
                      onPress={() => handleSelectPreset(rec.presetMm)}
                      style={[styles.recCard, isCurrent && styles.recCardActive]}
                    >
                      <View style={styles.recHeaderRow}>
                        <View style={styles.recLabelPill}>
                          <Text style={styles.recLabelText}>{rec.label}</Text>
                        </View>
                        <Text style={styles.recTierText}>
                          {rec.tier === "fine" ? "🎯 Fine" : rec.tier === "balanced" ? "⚖️ Balanced" : "⚡ Coarse"}
                        </Text>
                      </View>

                      <Text style={styles.recCounts}>
                        {rec.columns} cols × {rec.rows} rows
                      </Text>

                      <Text style={styles.recRemainder}>
                        Margins: X ±{(rec.remainderXMm / 2).toFixed(1)}mm · Y ±{(rec.remainderYMm / 2).toFixed(1)}mm
                      </Text>

                      <Text style={styles.recDesc}>{rec.description}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 5. CALCULATION RESULTS SUMMARY */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryValue}>{calculation.columns}</Text>
                  <Text style={styles.summaryLabel}>Columns</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryValue}>{calculation.rows}</Text>
                  <Text style={styles.summaryLabel}>Rows</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryValue}>{calculation.totalCells}</Text>
                  <Text style={styles.summaryLabel}>Total Cells</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryValue}>
                    {calculation.cellWidthMm}×{calculation.cellHeightMm}
                  </Text>
                  <Text style={styles.summaryLabel}>Cell (mm)</Text>
                </View>
              </View>

              <View style={styles.summaryDetails}>
                <Text style={styles.summaryDetailText}>
                  • Total Grid Area: {calculation.totalGridWidthMm} × {calculation.totalGridHeightMm} mm
                </Text>
                <Text style={styles.summaryDetailText}>
                  • Active Grid Offsets: Left/Right ±{calculation.marginXMm} mm · Top/Bottom ±{calculation.marginYMm} mm
                </Text>
                <Text style={styles.summaryDetailText}>
                  • PDF MediaBox: {calculation.pageWidthPt} × {calculation.pageHeightPt} pt ({calculation.targetDpi} DPI: {calculation.pixelWidth} × {calculation.pixelHeight} px)
                </Text>
              </View>
            </View>

            {/* 6. VISUAL PAPER GRID PREVIEW */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Live Physical Paper Preview</Text>
              <PaperGridVisualPreview calculation={calculation} previewHeight={270} />
            </View>

            {/* 7. PRINT-READY EXPORT OPTIONS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Print-Ready PDF & Sheet Export</Text>
              <Text style={styles.sectionHint}>
                Genuine ISO 32000-1 binary PDF export with exact physical PostScript dimensions.
              </Text>

              {/* Format Selection */}
              <View style={[styles.unitSelector, { marginTop: 10 }]}>
                <Pressable
                  onPress={() => setExportFormat("pdf")}
                  style={[styles.unitBtn, exportFormat === "pdf" && styles.unitBtnActive]}
                >
                  <Text style={[styles.unitBtnText, exportFormat === "pdf" && styles.unitBtnTextActive]}>
                    📄 PDF (ISO 32000-1)
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setExportFormat("html")}
                  style={[styles.unitBtn, exportFormat === "html" && styles.unitBtnActive]}
                >
                  <Text style={[styles.unitBtnText, exportFormat === "html" && styles.unitBtnTextActive]}>
                    🌐 HTML (@page)
                  </Text>
                </Pressable>
              </View>

              {/* Template Mode */}
              <Text style={[styles.marginFieldLabel, { marginTop: 12 }]}>Template Type:</Text>
              <View style={styles.unitSelector}>
                {(["grid", "blank", "reference-overlays"] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setTemplateType(t)}
                    style={[styles.unitBtn, templateType === t && styles.unitBtnActive]}
                  >
                    <Text style={[styles.unitBtnText, templateType === t && styles.unitBtnTextActive]}>
                      {t === "grid" ? "Grid" : t === "blank" ? "Blank Paper" : "Photo+Grid"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* DPI Selection */}
              <Text style={[styles.marginFieldLabel, { marginTop: 12 }]}>Print Resolution (DPI):</Text>
              <View style={styles.unitSelector}>
                {([150, 200, 300, 600] as const).map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setExportDpi(d)}
                    style={[styles.unitBtn, exportDpi === d && styles.unitBtnActive]}
                  >
                    <Text style={[styles.unitBtnText, exportDpi === d && styles.unitBtnTextActive]}>
                      {d} DPI
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Toggle Options */}
              <View style={styles.optionsGrid}>
                <Pressable
                  onPress={() => setIncludeLabels(!includeLabels)}
                  style={[styles.optionPill, includeLabels && styles.optionPillActive]}
                >
                  <Text style={[styles.optionPillText, includeLabels && styles.optionPillTextActive]}>
                    {includeLabels ? "✓ Labels (A-Z, 1-N)" : "No Labels"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setIncludeMargins(!includeMargins)}
                  style={[styles.optionPill, includeMargins && styles.optionPillActive]}
                >
                  <Text style={[styles.optionPillText, includeMargins && styles.optionPillTextActive]}>
                    {includeMargins ? "✓ Margin Bounds" : "No Margin"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setIncludeRulers(!includeRulers)}
                  style={[styles.optionPill, includeRulers && styles.optionPillActive]}
                >
                  <Text style={[styles.optionPillText, includeRulers && styles.optionPillTextActive]}>
                    {includeRulers ? "✓ Metric Rulers" : "No Rulers"}
                  </Text>
                </Pressable>
              </View>

              {/* Physical Print Advisory Warning */}
              <View style={styles.modalAdvisoryCard}>
                <Text style={styles.modalAdvisoryText}>
                  ⚠️ IMPORTANT PHYSICAL ACCURACY: Always choose "100%" or "Actual Size" in printer settings. Do NOT select "Fit to Page" or scale to page.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Action Bar */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleExportDocument}
              disabled={exporting}
              style={({ pressed }) => [styles.exportBtn, pressed && styles.pressed]}
              accessibilityLabel="Export Document"
            >
              <Text style={styles.exportBtnText}>
                {exporting ? "Compiling..." : `📥 Export ${exportFormat.toUpperCase()}`}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleApply}
              style={({ pressed }) => [styles.applyBtn, pressed && styles.pressed]}
              accessibilityLabel="Apply Grid to Reference Studio"
            >
              <Text style={styles.applyBtnText}>✓ Apply Grid ({calculation.columns}×{calculation.rows})</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: "#131815",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: "92%",
    borderWidth: 1,
    borderColor: "#222D26",
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2922",
  },
  headerTag: {
    alignSelf: "flex-start",
    backgroundColor: "#1F3127",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#2D4B3B",
  },
  headerTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#74DAA2",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  subtitle: {
    fontSize: 12,
    color: "#8B9A90",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1F2822",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2B3730",
  },
  closeBtnText: {
    fontSize: 14,
    color: "#C5D0C8",
    fontWeight: "700",
  },
  scrollArea: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E8E6DF",
  },
  sectionHint: {
    fontSize: 11,
    color: "#88988D",
    marginBottom: 10,
  },
  orientationToggleGroup: {
    flexDirection: "row",
    backgroundColor: "#1A221E",
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: "#26322B",
  },
  orientBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  orientBtnActive: {
    backgroundColor: "#28594B",
  },
  orientBtnText: {
    fontSize: 11,
    color: "#85978C",
    fontWeight: "600",
  },
  orientBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  paperTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paperTab: {
    backgroundColor: "#19221D",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#26352C",
    minWidth: 95,
  },
  paperTabActive: {
    backgroundColor: "#203429",
    borderColor: "#4EA87D",
  },
  paperTabTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#D0DCD3",
  },
  paperTabTitleActive: {
    color: "#6CD498",
  },
  paperTabDims: {
    fontSize: 10,
    color: "#77877D",
    marginTop: 2,
  },
  customDimsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    backgroundColor: "#1A231E",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A3830",
  },
  customInputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: "#8B9B90",
    fontWeight: "600",
    marginBottom: 4,
  },
  numericInput: {
    backgroundColor: "#121714",
    borderWidth: 1,
    borderColor: "#2F4036",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#F6F5EE",
    fontSize: 14,
    fontWeight: "700",
  },
  unitSelector: {
    flexDirection: "row",
    backgroundColor: "#1A221E",
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: "#26322B",
  },
  unitBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unitBtnActive: {
    backgroundColor: "#28594B",
  },
  unitBtnText: {
    fontSize: 11,
    color: "#85978C",
    fontWeight: "700",
  },
  unitBtnTextActive: {
    color: "#FFFFFF",
  },
  presetsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  presetPill: {
    backgroundColor: "#1A241F",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A3A30",
  },
  presetPillActive: {
    backgroundColor: "#26483B",
    borderColor: "#4EA87D",
  },
  presetPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B4C4BA",
  },
  presetPillTextActive: {
    color: "#6CD498",
  },
  spacingControlsCard: {
    backgroundColor: "#18221D",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#26352C",
  },
  spacingInputBlock: {
    gap: 6,
  },
  spacingInputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D0DDD3",
  },
  inputStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepBtn: {
    width: 38,
    height: 38,
    backgroundColor: "#202E26",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2E4237",
  },
  stepBtnText: {
    fontSize: 18,
    color: "#E2EDE6",
    fontWeight: "700",
  },
  spacingTextInput: {
    flex: 1,
    backgroundColor: "#121714",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#2B3A31",
  },
  spacingUnitTag: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7DAE93",
    width: 24,
  },
  linkToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#1F2B24",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#2C3E33",
  },
  linkToggleBtnActive: {
    backgroundColor: "#223B2F",
    borderColor: "#3D6953",
  },
  linkToggleIcon: {
    fontSize: 12,
  },
  linkToggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#C2D4C8",
  },
  recsGrid: {
    gap: 8,
  },
  recCard: {
    backgroundColor: "#19221D",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#26362C",
    gap: 4,
  },
  recCardActive: {
    backgroundColor: "#1F3327",
    borderColor: "#4EA87D",
  },
  recHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recLabelPill: {
    backgroundColor: "#24372B",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recLabelText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6CD498",
  },
  recTierText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D0DCD3",
  },
  recCounts: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F6F5EE",
  },
  recRemainder: {
    fontSize: 11,
    color: "#E2934D",
    fontWeight: "600",
  },
  recDesc: {
    fontSize: 11,
    color: "#839589",
  },
  summaryCard: {
    backgroundColor: "#19221C",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#2A4537",
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryCol: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#6CD498",
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#85978C",
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#27372D",
  },
  summaryDetails: {
    borderTopWidth: 1,
    borderTopColor: "#25342B",
    paddingTop: 10,
    gap: 4,
  },
  summaryDetailText: {
    fontSize: 11,
    color: "#B4C4BA",
    lineHeight: 16,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#1F2922",
    backgroundColor: "#131815",
  },
  exportBtn: {
    flex: 1,
    backgroundColor: "#202E26",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2D4236",
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A8BEB1",
  },
  marginsGridRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  marginInputGroup: {
    flex: 1,
  },
  marginFieldLabel: {
    fontSize: 11,
    color: "#8FA396",
    fontWeight: "600",
    marginBottom: 4,
  },
  marginNumericInput: {
    backgroundColor: "#121714",
    borderWidth: 1,
    borderColor: "#2F4036",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: "#F6F5EE",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  alignmentOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  fitToggleBtn: {
    backgroundColor: "#1A221E",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#28392F",
  },
  fitToggleBtnActive: {
    backgroundColor: "#223B2F",
    borderColor: "#4EA87D",
  },
  fitToggleBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8FA396",
  },
  fitToggleBtnTextActive: {
    color: "#FFFFFF",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  optionPill: {
    backgroundColor: "#18221C",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#26352C",
  },
  optionPillActive: {
    backgroundColor: "#203B2D",
    borderColor: "#4EA87D",
  },
  optionPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8FA396",
  },
  optionPillTextActive: {
    color: "#FFFFFF",
  },
  modalAdvisoryCard: {
    backgroundColor: "#2A2117",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#553F26",
  },
  modalAdvisoryText: {
    fontSize: 11,
    color: "#E5BE94",
    fontWeight: "600",
    lineHeight: 16,
  },
  applyBtn: {
    flex: 1.4,
    backgroundColor: "#28594B",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.8,
  },
});
