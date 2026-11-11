/**
 * ARTISTRY AI — Non-Destructive Crop & Rotate Modal
 * 
 * Enables artists to crop and rotate reference images without altering the underlying source file.
 * Updates the shared coordinate foundation to keep touch tracking, grids, and overlays aligned.
 */

import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ImageCropSettings } from "../../domain/overlayTypes";
import { colors } from "../../theme";

interface CropRotateModalProps {
  visible: boolean;
  onClose: () => void;
  refWidth: number;
  refHeight: number;
  currentCrop: ImageCropSettings;
  currentRotation: 0 | 90 | 180 | 270;
  onApply: (crop: ImageCropSettings, rotation: 0 | 90 | 180 | 270) => void;
}

export function CropRotateModal({
  visible,
  onClose,
  refWidth,
  refHeight,
  currentCrop,
  currentRotation,
  onApply,
}: CropRotateModalProps) {
  const [crop, setCrop] = useState<ImageCropSettings>(
    currentCrop ?? { originX: 0, originY: 0, width: 1, height: 1 }
  );
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(
    currentRotation ?? 0
  );

  const handleRotateLeft = () => {
    setRotation((prev) => {
      const next = (prev - 90 + 360) % 360;
      return next as 0 | 90 | 180 | 270;
    });
  };

  const handleRotateRight = () => {
    setRotation((prev) => {
      const next = (prev + 90) % 360;
      return next as 0 | 90 | 180 | 270;
    });
  };

  const handleResetCrop = () => {
    setCrop({ originX: 0, originY: 0, width: 1, height: 1 });
  };

  const handleResetRotation = () => {
    setRotation(0);
  };

  // Preset aspect ratio calculations
  const applyPresetRatio = (ratioWidth: number, ratioHeight: number) => {
    const targetAspect = ratioWidth / ratioHeight;
    const originalAspect = refWidth / refHeight;

    let newWidth = 1.0;
    let newHeight = 1.0;
    let newOriginX = 0.0;
    let newOriginY = 0.0;

    if (originalAspect > targetAspect) {
      // Source is wider than target: trim width
      newWidth = targetAspect / originalAspect;
      newOriginX = (1.0 - newWidth) / 2;
    } else {
      // Source is taller than target: trim height
      newHeight = originalAspect / targetAspect;
      newOriginY = (1.0 - newHeight) / 2;
    }

    setCrop({
      originX: Math.round(newOriginX * 1000) / 1000,
      originY: Math.round(newOriginY * 1000) / 1000,
      width: Math.round(newWidth * 1000) / 1000,
      height: Math.round(newHeight * 1000) / 1000,
    });
  };

  const handleApply = () => {
    onApply(crop, rotation);
    onClose();
  };

  const effectiveWidthPx = Math.round(refWidth * crop.width);
  const effectiveHeightPx = Math.round(refHeight * crop.height);
  const isRotatedTransposed = rotation === 90 || rotation === 270;
  const finalDisplayWidth = isRotatedTransposed ? effectiveHeightPx : effectiveWidthPx;
  const finalDisplayHeight = isRotatedTransposed ? effectiveWidthPx : effectiveHeightPx;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Crop & Orientation</Text>
              <Text style={styles.subtitle}>
                Non-destructive framing & physical drawing alignment
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.buttonPressed]}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentPadding}>
            {/* Dimensions Summary Badge */}
            <View style={styles.dimensionBadge}>
              <Text style={styles.dimensionLabel}>Output Frame:</Text>
              <Text style={styles.dimensionValue}>
                {finalDisplayWidth} × {finalDisplayHeight} px
              </Text>
              <Text style={styles.rotationBadge}>{rotation}°</Text>
            </View>

            {/* 1. Rotation Section */}
            <Text style={styles.sectionHeader}>Rotation</Text>
            <View style={styles.rotationRow}>
              <Pressable
                onPress={handleRotateLeft}
                style={({ pressed }) => [styles.rotBtn, pressed && styles.buttonPressed]}
                accessibilityLabel="Rotate 90 degrees counter-clockwise"
              >
                <Text style={styles.rotBtnIcon}>↺</Text>
                <Text style={styles.rotBtnText}>Rotate -90°</Text>
              </Pressable>

              <Pressable
                onPress={handleResetRotation}
                style={({ pressed }) => [styles.resetRotBtn, pressed && styles.buttonPressed]}
                accessibilityLabel="Reset rotation to 0 degrees"
              >
                <Text style={styles.resetRotText}>{rotation}° (Reset)</Text>
              </Pressable>

              <Pressable
                onPress={handleRotateRight}
                style={({ pressed }) => [styles.rotBtn, pressed && styles.buttonPressed]}
                accessibilityLabel="Rotate 90 degrees clockwise"
              >
                <Text style={styles.rotBtnIcon}>↻</Text>
                <Text style={styles.rotBtnText}>Rotate +90°</Text>
              </Pressable>
            </View>

            {/* 2. Aspect Ratio Presets */}
            <Text style={styles.sectionHeader}>Aspect Ratio Presets</Text>
            <View style={styles.presetGrid}>
              <Pressable
                onPress={handleResetCrop}
                style={({ pressed }) => [styles.ratioBtn, pressed && styles.buttonPressed]}
              >
                <Text style={styles.ratioBtnText}>Full / Original</Text>
              </Pressable>

              <Pressable
                onPress={() => applyPresetRatio(1, 1)}
                style={({ pressed }) => [styles.ratioBtn, pressed && styles.buttonPressed]}
              >
                <Text style={styles.ratioBtnText}>1:1 Square</Text>
              </Pressable>

              <Pressable
                onPress={() => applyPresetRatio(3, 4)}
                style={({ pressed }) => [styles.ratioBtn, pressed && styles.buttonPressed]}
              >
                <Text style={styles.ratioBtnText}>3:4 Portrait</Text>
              </Pressable>

              <Pressable
                onPress={() => applyPresetRatio(4, 3)}
                style={({ pressed }) => [styles.ratioBtn, pressed && styles.buttonPressed]}
              >
                <Text style={styles.ratioBtnText}>4:3 Landscape</Text>
              </Pressable>

              <Pressable
                onPress={() => applyPresetRatio(16, 9)}
                style={({ pressed }) => [styles.ratioBtn, pressed && styles.buttonPressed]}
              >
                <Text style={styles.ratioBtnText}>16:9 Widescreen</Text>
              </Pressable>

              <Pressable
                onPress={() => applyPresetRatio(210, 297)}
                style={({ pressed }) => [styles.ratioBtn, styles.ratioBtnActive, pressed && styles.buttonPressed]}
              >
                <Text style={[styles.ratioBtnText, styles.ratioBtnActiveText]}>A4 Paper (1:√2)</Text>
              </Pressable>
            </View>

            {/* 3. Crop Inset Steppers */}
            <Text style={styles.sectionHeader}>Fine Margin Adjustments</Text>
            <View style={styles.stepperCard}>
              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Left Inset:</Text>
                <View style={styles.stepperBtns}>
                  <Pressable
                    onPress={() => setCrop((c) => ({ ...c, originX: Math.max(0, c.originX - 0.05), width: Math.min(1 - Math.max(0, c.originX - 0.05), c.width + 0.05) }))}
                    style={styles.insetBtn}
                  >
                    <Text style={styles.insetText}>−</Text>
                  </Pressable>
                  <Text style={styles.insetValue}>{Math.round(crop.originX * 100)}%</Text>
                  <Pressable
                    onPress={() => setCrop((c) => ({ ...c, originX: Math.min(0.45, c.originX + 0.05), width: Math.max(0.1, c.width - 0.05) }))}
                    style={styles.insetBtn}
                  >
                    <Text style={styles.insetText}>＋</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Top Inset:</Text>
                <View style={styles.stepperBtns}>
                  <Pressable
                    onPress={() => setCrop((c) => ({ ...c, originY: Math.max(0, c.originY - 0.05), height: Math.min(1 - Math.max(0, c.originY - 0.05), c.height + 0.05) }))}
                    style={styles.insetBtn}
                  >
                    <Text style={styles.insetText}>−</Text>
                  </Pressable>
                  <Text style={styles.insetValue}>{Math.round(crop.originY * 100)}%</Text>
                  <Pressable
                    onPress={() => setCrop((c) => ({ ...c, originY: Math.min(0.45, c.originY + 0.05), height: Math.max(0.1, c.height - 0.05) }))}
                    style={styles.insetBtn}
                  >
                    <Text style={styles.insetText}>＋</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Crop Width:</Text>
                <View style={styles.stepperBtns}>
                  <Pressable
                    onPress={() => setCrop((c) => ({ ...c, width: Math.max(0.1, c.width - 0.05) }))}
                    style={styles.insetBtn}
                  >
                    <Text style={styles.insetText}>−</Text>
                  </Pressable>
                  <Text style={styles.insetValue}>{Math.round(crop.width * 100)}%</Text>
                  <Pressable
                    onPress={() => setCrop((c) => ({ ...c, width: Math.min(1 - c.originX, c.width + 0.05) }))}
                    style={styles.insetBtn}
                  >
                    <Text style={styles.insetText}>＋</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Crop Height:</Text>
                <View style={styles.stepperBtns}>
                  <Pressable
                    onPress={() => setCrop((c) => ({ ...c, height: Math.max(0.1, c.height - 0.05) }))}
                    style={styles.insetBtn}
                  >
                    <Text style={styles.insetText}>−</Text>
                  </Pressable>
                  <Text style={styles.insetValue}>{Math.round(crop.height * 100)}%</Text>
                  <Pressable
                    onPress={() => setCrop((c) => ({ ...c, height: Math.min(1 - c.originY, c.height + 0.05) }))}
                    style={styles.insetBtn}
                  >
                    <Text style={styles.insetText}>＋</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Controls */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleResetCrop}
              style={({ pressed }) => [styles.resetAllBtn, pressed && styles.buttonPressed]}
            >
              <Text style={styles.resetAllBtnText}>Reset Crop</Text>
            </Pressable>

            <Pressable
              onPress={handleApply}
              style={({ pressed }) => [styles.applyBtn, pressed && styles.buttonPressed]}
            >
              <Text style={styles.applyBtnText}>Apply Changes</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cardContainer: {
    backgroundColor: "#1C221E",
    borderRadius: 18,
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2D3831",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#29332D",
  },
  title: {
    color: "#E2E8E4",
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    color: "#7E9086",
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#26302A",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: "#C5D1CA",
    fontSize: 15,
    fontWeight: "700",
  },
  contentScroll: {
    flexGrow: 0,
  },
  contentPadding: {
    padding: 18,
  },
  dimensionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#242E28",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#324037",
  },
  dimensionLabel: {
    color: "#8FA397",
    fontSize: 12,
  },
  dimensionValue: {
    color: "#52C096",
    fontSize: 13,
    fontWeight: "700",
  },
  rotationBadge: {
    marginLeft: "auto",
    backgroundColor: colors.moss,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sectionHeader: {
    color: "#B4C2BA",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rotationRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  rotBtn: {
    flex: 1,
    backgroundColor: "#242E28",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334138",
    gap: 4,
  },
  rotBtnIcon: {
    fontSize: 18,
    color: "#E2E8E4",
  },
  rotBtnText: {
    color: "#E2E8E4",
    fontSize: 12,
    fontWeight: "600",
  },
  resetRotBtn: {
    flex: 1,
    backgroundColor: "#1F2621",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resetRotText: {
    color: "#7E9086",
    fontSize: 12,
    fontWeight: "600",
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  ratioBtn: {
    backgroundColor: "#242E28",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334138",
  },
  ratioBtnActive: {
    backgroundColor: colors.moss,
    borderColor: colors.moss,
  },
  ratioBtnText: {
    color: "#C5D1CA",
    fontSize: 12,
    fontWeight: "600",
  },
  ratioBtnActiveText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  stepperCard: {
    backgroundColor: "#212824",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2C3730",
    gap: 10,
  },
  stepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepperLabel: {
    color: "#C5D1CA",
    fontSize: 13,
  },
  stepperBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  insetBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#2C3730",
    alignItems: "center",
    justifyContent: "center",
  },
  insetText: {
    color: "#E2E8E4",
    fontSize: 16,
    fontWeight: "700",
  },
  insetValue: {
    color: "#52C096",
    fontSize: 13,
    fontWeight: "700",
    minWidth: 44,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#29332D",
  },
  resetAllBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#27312B",
    alignItems: "center",
    justifyContent: "center",
  },
  resetAllBtnText: {
    color: "#C5D1CA",
    fontSize: 13,
    fontWeight: "600",
  },
  applyBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.moss,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
