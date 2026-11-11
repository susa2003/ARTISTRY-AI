/**
 * ARTISTRY AI — Reference Studio Image Adjustment Panel
 * 
 * Provides interactive, independent adjustment controls for:
 * - Brightness (-1.0 to +1.0)
 * - Contrast (0.5 to 2.0)
 * - Exposure (-2.0 to +2.0 EV)
 * - Saturation (0.0 to 2.0)
 * - Grayscale (0% to 100%)
 * - Image Opacity (0% to 100%)
 * - Whiteout Strength / Lightbox (0% to 100%)
 * 
 * Features:
 * - Real-time preview on the canvas
 * - Independent adjustments (mutually decoupled)
 * - Individual reset buttons for each parameter
 * - "Reset All Adjustments" master button
 * - Quick artist presets (Normal, Lightbox Tracing, High Contrast B&W, Value Study)
 */

import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ImageAdjustmentSettings } from "../../domain/overlayTypes";
import { DEFAULT_IMAGE_ADJUSTMENTS, getGrayscaleFactor } from "../../domain/overlayTypes";
import { colors } from "../../theme";

interface ImageAdjustmentPanelProps {
  visible: boolean;
  onClose: () => void;
  adjustments: ImageAdjustmentSettings;
  onChange: (adjustments: ImageAdjustmentSettings) => void;
  onResetIndividual?: (key: keyof ImageAdjustmentSettings) => void;
  onResetAll?: () => void;
}

interface SliderRowProps {
  label: string;
  icon: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  displayValue: string;
  onValueChange: (val: number) => void;
  onReset: () => void;
}

function AdjustmentRow({
  label,
  icon,
  value,
  min,
  max,
  step,
  defaultValue,
  displayValue,
  onValueChange,
  onReset,
}: SliderRowProps) {
  const isDefault = Math.abs(value - defaultValue) < 0.001;

  const handleStepDown = () => {
    const next = Math.max(min, Math.round((value - step) * 100) / 100);
    onValueChange(next);
  };

  const handleStepUp = () => {
    const next = Math.min(max, Math.round((value + step) * 100) / 100);
    onValueChange(next);
  };

  // Normalized fill bar (0% to 100%)
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <View style={styles.rowCard}>
      <View style={styles.rowHeader}>
        <View style={styles.rowLabelContainer}>
          <Text style={styles.rowIcon}>{icon}</Text>
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        <View style={styles.valueRow}>
          <Text style={styles.valueText}>{displayValue}</Text>
          <Pressable
            onPress={onReset}
            disabled={isDefault}
            style={({ pressed }) => [
              styles.resetIndividualBtn,
              isDefault && styles.btnDisabled,
              pressed && styles.buttonPressed,
            ]}
            accessibilityLabel={`Reset ${label}`}
          >
            <Text style={[styles.resetIndividualText, isDefault && styles.textDisabled]}>
              ↺
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Visual meter bar */}
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${percentage}%` }]} />
      </View>

      {/* Stepper buttons for quick adjustments */}
      <View style={styles.stepperContainer}>
        <Pressable
          onPress={handleStepDown}
          disabled={value <= min}
          style={({ pressed }) => [
            styles.stepBtn,
            value <= min && styles.btnDisabled,
            pressed && styles.buttonPressed,
          ]}
          accessibilityLabel={`Decrease ${label}`}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>

        <Pressable
          onPress={() => onValueChange(defaultValue)}
          style={({ pressed }) => [styles.centerBtn, pressed && styles.buttonPressed]}
          accessibilityLabel={`Set ${label} to default`}
        >
          <Text style={styles.centerBtnText}>Default</Text>
        </Pressable>

        <Pressable
          onPress={handleStepUp}
          disabled={value >= max}
          style={({ pressed }) => [
            styles.stepBtn,
            value >= max && styles.btnDisabled,
            pressed && styles.buttonPressed,
          ]}
          accessibilityLabel={`Increase ${label}`}
        >
          <Text style={styles.stepBtnText}>＋</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ImageAdjustmentPanel({
  visible,
  onClose,
  adjustments,
  onChange,
  onResetIndividual,
  onResetAll,
}: ImageAdjustmentPanelProps) {
  const current = adjustments ?? DEFAULT_IMAGE_ADJUSTMENTS;

  const handleUpdate = <K extends keyof ImageAdjustmentSettings>(
    key: K,
    val: ImageAdjustmentSettings[K]
  ) => {
    onChange({
      ...current,
      [key]: val,
    });
  };

  const handleReset = (key: keyof ImageAdjustmentSettings) => {
    if (onResetIndividual) {
      onResetIndividual(key);
    } else {
      onChange({
        ...current,
        [key]: DEFAULT_IMAGE_ADJUSTMENTS[key],
      });
    }
  };

  const handleMasterReset = () => {
    if (onResetAll) {
      onResetAll();
    } else {
      onChange({
        ...DEFAULT_IMAGE_ADJUSTMENTS,
        crop: current.crop,
        rotation: current.rotation,
      });
    }
  };

  // Quick Artist Presets
  const applyPreset = (preset: "normal" | "lightbox" | "highContrast" | "valueStudy") => {
    switch (preset) {
      case "normal":
        onChange({
          ...DEFAULT_IMAGE_ADJUSTMENTS,
          crop: current.crop,
          rotation: current.rotation,
        });
        break;
      case "lightbox":
        // Optimized for physical paper tracing: bleach to paper-white with dark contour boost
        onChange({
          ...current,
          whiteoutStrength: 0.75,
          contrast: 1.4,
          exposure: 0.2,
          grayscale: 1.0,
          saturation: 0.0,
          brightness: 0.1,
          opacity: 1.0,
        });
        break;
      case "highContrast":
        onChange({
          ...current,
          contrast: 1.6,
          saturation: 0.0,
          grayscale: 1.0,
          whiteoutStrength: 0.0,
          brightness: 0.0,
          exposure: 0.0,
          opacity: 1.0,
        });
        break;
      case "valueStudy":
        // Pure grayscale with slightly enhanced contrast for tonal mapping
        onChange({
          ...current,
          contrast: 1.25,
          saturation: 0.0,
          grayscale: 1.0,
          whiteoutStrength: 0.0,
          brightness: 0.0,
          exposure: 0.0,
          opacity: 1.0,
        });
        break;
    }
  };

  const grayscaleVal = getGrayscaleFactor(current);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Image Adjustments</Text>
              <Text style={styles.sheetSubtitle}>
                Non-destructive reference filters & Lightbox shader
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.buttonPressed]}
              accessibilityLabel="Close image adjustments"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Quick Presets Bar */}
          <View style={styles.presetsBar}>
            <Text style={styles.presetLabel}>Presets:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
              <Pressable
                onPress={() => applyPreset("normal")}
                style={({ pressed }) => [styles.presetChip, pressed && styles.buttonPressed]}
              >
                <Text style={styles.presetChipText}>Normal</Text>
              </Pressable>

              <Pressable
                onPress={() => applyPreset("lightbox")}
                style={({ pressed }) => [styles.presetChip, styles.presetChipActive, pressed && styles.buttonPressed]}
              >
                <Text style={[styles.presetChipText, styles.presetChipTextActive]}>
                  ☀️ Lightbox
                </Text>
              </Pressable>

              <Pressable
                onPress={() => applyPreset("valueStudy")}
                style={({ pressed }) => [styles.presetChip, pressed && styles.buttonPressed]}
              >
                <Text style={styles.presetChipText}>Tonal Study</Text>
              </Pressable>

              <Pressable
                onPress={() => applyPreset("highContrast")}
                style={({ pressed }) => [styles.presetChip, pressed && styles.buttonPressed]}
              >
                <Text style={styles.presetChipText}>High Contrast</Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* Sliders ScrollView */}
          <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
            {/* 1. Whiteout / Lightbox Strength (The Headline Traditional Tool) */}
            <View style={styles.featuredSection}>
              <AdjustmentRow
                label="Whiteout (Lightbox Paper Fade)"
                icon="☀️"
                value={current.whiteoutStrength}
                min={0.0}
                max={1.0}
                step={0.05}
                defaultValue={0.0}
                displayValue={`${Math.round(current.whiteoutStrength * 100)}%`}
                onValueChange={(val) => handleUpdate("whiteoutStrength", val)}
                onReset={() => handleReset("whiteoutStrength")}
              />
              <Text style={styles.featuredTip}>
                Bleaches the background toward physical paper white while protecting dark drawing contours.
              </Text>
            </View>

            {/* 2. Brightness */}
            <AdjustmentRow
              label="Brightness"
              icon="💡"
              value={current.brightness}
              min={-1.0}
              max={1.0}
              step={0.05}
              defaultValue={0.0}
              displayValue={current.brightness > 0 ? `+${current.brightness.toFixed(2)}` : current.brightness.toFixed(2)}
              onValueChange={(val) => handleUpdate("brightness", val)}
              onReset={() => handleReset("brightness")}
            />

            {/* 3. Contrast */}
            <AdjustmentRow
              label="Contrast"
              icon="◐"
              value={current.contrast}
              min={0.5}
              max={2.0}
              step={0.05}
              defaultValue={1.0}
              displayValue={`${current.contrast.toFixed(2)}x`}
              onValueChange={(val) => handleUpdate("contrast", val)}
              onReset={() => handleReset("contrast")}
            />

            {/* 4. Exposure */}
            <AdjustmentRow
              label="Exposure"
              icon="⚡"
              value={current.exposure}
              min={-2.0}
              max={2.0}
              step={0.1}
              defaultValue={0.0}
              displayValue={`${current.exposure > 0 ? `+${current.exposure.toFixed(1)}` : current.exposure.toFixed(1)} EV`}
              onValueChange={(val) => handleUpdate("exposure", val)}
              onReset={() => handleReset("exposure")}
            />

            {/* 5. Saturation */}
            <AdjustmentRow
              label="Saturation"
              icon="🎨"
              value={current.saturation}
              min={0.0}
              max={2.0}
              step={0.05}
              defaultValue={1.0}
              displayValue={`${Math.round(current.saturation * 100)}%`}
              onValueChange={(val) => handleUpdate("saturation", val)}
              onReset={() => handleReset("saturation")}
            />

            {/* 6. Grayscale */}
            <AdjustmentRow
              label="Grayscale"
              icon="⬛"
              value={grayscaleVal}
              min={0.0}
              max={1.0}
              step={0.05}
              defaultValue={0.0}
              displayValue={`${Math.round(grayscaleVal * 100)}%`}
              onValueChange={(val) => handleUpdate("grayscale", val)}
              onReset={() => handleReset("grayscale")}
            />

            {/* 7. Image Opacity */}
            <AdjustmentRow
              label="Reference Opacity"
              icon="👁️"
              value={current.opacity}
              min={0.0}
              max={1.0}
              step={0.05}
              defaultValue={1.0}
              displayValue={`${Math.round(current.opacity * 100)}%`}
              onValueChange={(val) => handleUpdate("opacity", val)}
              onReset={() => handleReset("opacity")}
            />

            {/* Master Reset Button */}
            <View style={styles.footerContainer}>
              <Pressable
                onPress={handleMasterReset}
                style={({ pressed }) => [styles.resetAllBtn, pressed && styles.buttonPressed]}
                accessibilityLabel="Reset all adjustments to default"
              >
                <Text style={styles.resetAllBtnText}>↺ Reset All Adjustments</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#1A1F1C",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "82%",
    paddingTop: 16,
    paddingBottom: 28,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A332E",
  },
  sheetTitle: {
    color: "#E2E8E4",
    fontSize: 18,
    fontWeight: "700",
  },
  sheetSubtitle: {
    color: "#7E9086",
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#242C27",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: "#C5D1CA",
    fontSize: 16,
    fontWeight: "700",
  },
  presetsBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#232B26",
  },
  presetLabel: {
    color: "#8FA397",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 10,
  },
  presetScroll: {
    flexDirection: "row",
    gap: 8,
  },
  presetChip: {
    backgroundColor: "#252E28",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#333E37",
  },
  presetChipActive: {
    backgroundColor: colors.moss,
    borderColor: colors.moss,
  },
  presetChipText: {
    color: "#B4C2BA",
    fontSize: 12,
    fontWeight: "600",
  },
  presetChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  scrollList: {
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  featuredSection: {
    marginBottom: 8,
    padding: 2,
    borderRadius: 14,
    backgroundColor: "rgba(40, 89, 75, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(40, 89, 75, 0.4)",
  },
  featuredTip: {
    color: "#8FA397",
    fontSize: 11,
    fontStyle: "italic",
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  rowCard: {
    backgroundColor: "#212824",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2E3831",
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rowLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowIcon: {
    fontSize: 16,
  },
  rowLabel: {
    color: "#E2E8E4",
    fontSize: 14,
    fontWeight: "600",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  valueText: {
    color: "#52C096",
    fontSize: 13,
    fontWeight: "700",
    minWidth: 55,
    textAlign: "right",
  },
  resetIndividualBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2C3630",
    alignItems: "center",
    justifyContent: "center",
  },
  resetIndividualText: {
    color: "#9BB0A3",
    fontSize: 14,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.35,
  },
  textDisabled: {
    color: "#5E6C63",
  },
  meterTrack: {
    height: 6,
    backgroundColor: "#161B18",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 10,
  },
  meterFill: {
    height: "100%",
    backgroundColor: colors.moss,
    borderRadius: 3,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  stepBtn: {
    flex: 1,
    height: 38,
    backgroundColor: "#2B352F",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#38453D",
  },
  stepBtnText: {
    color: "#E2E8E4",
    fontSize: 18,
    fontWeight: "700",
  },
  centerBtn: {
    flex: 1.5,
    height: 38,
    backgroundColor: "#222B25",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  centerBtnText: {
    color: "#7E9086",
    fontSize: 12,
    fontWeight: "600",
  },
  footerContainer: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  resetAllBtn: {
    width: "100%",
    height: 46,
    backgroundColor: "#2C342F",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3D4841",
  },
  resetAllBtnText: {
    color: "#E5987A",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
