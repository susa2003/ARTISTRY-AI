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
import type { PaperGridCalculation, SpacingUnit } from "./types";
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
import { PaperGridVisualPreview } from "./PaperGridVisualPreview";

interface PaperGridCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  initialPaperSize?: PaperSize;
  initialOrientation?: PaperOrientation;
  initialCustomWidthMm?: number;
  initialCustomHeightMm?: number;
  initialSpacingMm?: number;
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
  onApplyGrid,
}: PaperGridCalculatorModalProps) {
  // State: Paper Selection
  const [paperSize, setPaperSize] = useState<PaperSize>(initialPaperSize);
  const [orientation, setOrientation] = useState<PaperOrientation>(initialOrientation);
  const [customWidthText, setCustomWidthText] = useState(String(initialCustomWidthMm));
  const [customHeightText, setCustomHeightText] = useState(String(initialCustomHeightMm));

  // State: Spacing & Units
  const [unit, setUnit] = useState<SpacingUnit>("mm");
  const [isLinked, setIsLinked] = useState(true); // Linked X & Y for square cells
  const [spacingXText, setSpacingXText] = useState(String(initialSpacingMm));
  const [spacingYText, setSpacingYText] = useState(String(initialSpacingMm));
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
    });
  }, [paperSize, orientation, spacingXMm, spacingYMm, customWidthMm, customHeightMm, unit]);

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

  // Unit change handler (converts current displayed numbers to new unit)
  const handleChangeUnit = (newUnit: SpacingUnit) => {
    if (newUnit === unit) return;
    const currentMmX = unitToMm(parseFloat(spacingXText) || 10, unit);
    const currentMmY = unitToMm(parseFloat(spacingYText) || 10, unit);
    setUnit(newUnit);
    setSpacingXText(String(mmToUnit(currentMmX, newUnit)));
    setSpacingYText(String(mmToUnit(currentMmY, newUnit)));
  };

  const handleApply = () => {
    onApplyGrid(calculation);
    onClose();
  };

  // Export printable SVG / HTML via expo-sharing
  const handleExportPrintable = async () => {
    setExporting(true);
    try {
      const htmlContent = generatePrintableHtml(calculation);
      const filename = `ARTISTRY_Grid_${calculation.paperSize}_${calculation.columns}x${calculation.rows}_${calculation.spacingXMm}mm.html`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/html",
          dialogTitle: "Print Physical Drawing Grid",
          UTI: "public.html",
        });
      } else {
        Alert.alert("Print Template Ready", `Generated HTML printable sheet at:\n${fileUri}`);
      }
    } catch (err) {
      Alert.alert("Export Failed", err instanceof Error ? err.message : "Could not export printable grid.");
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
                {(["A4", "A3", "A5", "US_LETTER", "CUSTOM"] as const).map((s) => {
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

            {/* 2. SMART GRID SPACING & UNITS */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>2. Grid Line Spacing</Text>
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

            {/* 3. SMART RECOMMENDATIONS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Smart Spacing Recommendations</Text>
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

            {/* 4. CALCULATION RESULTS SUMMARY */}
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
                  • Centered Margins: Left/Right ±{calculation.marginXMm} mm · Top/Bottom ±{calculation.marginYMm} mm
                </Text>
                <Text style={styles.summaryDetailText}>
                  • 300 DPI Canvas Resolution: {calculation.pixelWidth300Dpi} × {calculation.pixelHeight300Dpi} px
                </Text>
              </View>
            </View>

            {/* 5. VISUAL PAPER GRID PREVIEW */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Live Physical Paper Preview</Text>
              <PaperGridVisualPreview calculation={calculation} previewHeight={270} />
            </View>
          </ScrollView>

          {/* Footer Action Bar */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleExportPrintable}
              disabled={exporting}
              style={({ pressed }) => [styles.exportBtn, pressed && styles.pressed]}
              accessibilityLabel="Export Printable Template"
            >
              <Text style={styles.exportBtnText}>
                {exporting ? "Generating..." : "📄 Export Printable Sheet"}
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
