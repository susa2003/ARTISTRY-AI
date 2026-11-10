import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { OverlayType, UnifiedOverlay } from "../../domain/overlayTypes";
import { colors } from "../../theme";

interface LayerDrawerProps {
  visible: boolean;
  onClose: () => void;
  overlays: UnifiedOverlay[];
  onToggleVisibility: (id: string) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  onToggleLock: (id: string) => void;
  onAddOverlay?: (type: OverlayType) => void;
  onRemoveOverlay?: (id: string) => void;
}

const OVERLAY_TYPE_METADATA: Record<OverlayType, { label: string; icon: string; description: string }> = {
  grid: { label: "Smart Grid", icon: "⌗", description: "Proportional, diagonals, thirds, golden" },
  loomis: { label: "Loomis 3D Head", icon: "⨁", description: "8-stage cranial sphere and facial thirds" },
  reilly: { label: "Reilly Abstraction", icon: "〰", description: "Structural rhythm curves and head loops" },
  bargue: { label: "Bargue Block-In", icon: "⬡", description: "Straight-line contour bounding envelope" },
  perspective: { label: "Perspective Rays", icon: "◬", description: "1, 2, and 3-point vanishing points" },
  anatomy: { label: "Anatomy Guides", icon: "♟", description: "8-head canonical figure landmarks" },
  shading: { label: "5-Value Shading", icon: "◑", description: "Tonal zones and directional light dial" },
  plumb: { label: "Plumb Lines", icon: "┼", description: "Vertical and horizontal alignment guides" },
  measurement: { label: "Sight-Size Calipers", icon: "↔", description: "Proportional measurement dividers" },
  tracing: { label: "Lightbox Contours", icon: "◻", description: "Optical edge extraction and tracing" },
};

export function LayerDrawer({
  visible,
  onClose,
  overlays,
  onToggleVisibility,
  onOpacityChange,
  onToggleLock,
  onAddOverlay,
  onRemoveOverlay,
}: LayerDrawerProps) {
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
              <Text style={styles.title}>Overlays & Guides</Text>
              <Text style={styles.subtitle}>
                {overlays.length} active {overlays.length === 1 ? "layer" : "layers"} on this reference
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              accessibilityLabel="Close Layer Drawer"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Active Overlay List */}
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {overlays.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>◫</Text>
                <Text style={styles.emptyTitle}>No Active Overlays</Text>
                <Text style={styles.emptyText}>
                  Add traditional drawing guides (such as Grids, Loomis heads, or Plumb lines) to overlay on this reference image.
                </Text>
              </View>
            ) : (
              overlays.map((layer, index) => {
                const meta = OVERLAY_TYPE_METADATA[layer.type] ?? {
                  label: layer.name,
                  icon: "❖",
                  description: layer.type,
                };

                return (
                  <View key={layer.id} style={styles.layerCard}>
                    {/* Layer Header Row */}
                    <View style={styles.layerHeaderRow}>
                      <View style={styles.layerIconBox}>
                        <Text style={styles.layerIconText}>{meta.icon}</Text>
                      </View>

                      <View style={styles.layerInfo}>
                        <View style={styles.layerTitleRow}>
                          <Text style={styles.layerName}>{layer.name || meta.label}</Text>
                          <Text style={styles.layerTypeBadge}>{layer.type.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.layerDesc}>{meta.description}</Text>
                      </View>

                      {/* Controls */}
                      <View style={styles.actionButtons}>
                        {/* Lock Toggle */}
                        <Pressable
                          onPress={() => onToggleLock(layer.id)}
                          style={[styles.iconButton, layer.locked && styles.iconButtonActive]}
                          accessibilityLabel={layer.locked ? "Unlock Overlay" : "Lock Overlay"}
                        >
                          <Text style={styles.actionIcon}>{layer.locked ? "🔒" : "🔓"}</Text>
                        </Pressable>

                        {/* Visibility Toggle */}
                        <Pressable
                          onPress={() => onToggleVisibility(layer.id)}
                          style={[styles.iconButton, layer.visible && styles.iconButtonActive]}
                          accessibilityLabel={layer.visible ? "Hide Overlay" : "Show Overlay"}
                        >
                          <Text style={styles.actionIcon}>{layer.visible ? "👁" : "🕶"}</Text>
                        </Pressable>

                        {/* Delete/Remove */}
                        {onRemoveOverlay ? (
                          <Pressable
                            onPress={() => onRemoveOverlay(layer.id)}
                            style={styles.iconButton}
                            accessibilityLabel="Remove Overlay"
                          >
                            <Text style={styles.deleteIcon}>🗑</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>

                    {/* Opacity Control Row */}
                    <View style={styles.opacityRow}>
                      <Text style={styles.opacityLabel}>Opacity</Text>
                      <View style={styles.opacityPills}>
                        {[0.25, 0.5, 0.75, 1.0].map((step) => {
                          const isActive = Math.abs(layer.opacity - step) < 0.13;
                          return (
                            <Pressable
                              key={step}
                              onPress={() => onOpacityChange(layer.id, step)}
                              style={[styles.opacityPill, isActive && styles.opacityPillActive]}
                            >
                              <Text style={[styles.opacityPillText, isActive && styles.opacityPillTextActive]}>
                                {Math.round(step * 100)}%
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            {/* Quick Add Overlay Section */}
            {onAddOverlay ? (
              <View style={styles.addSection}>
                <Text style={styles.addSectionTitle}>ADD TRADITIONAL OVERLAY</Text>
                <View style={styles.addGrid}>
                  {(["grid", "loomis", "perspective", "anatomy", "shading", "plumb"] as OverlayType[]).map((type) => {
                    const meta = OVERLAY_TYPE_METADATA[type];
                    return (
                      <Pressable
                        key={type}
                        onPress={() => onAddOverlay(type)}
                        style={({ pressed }) => [styles.addCard, pressed && styles.pressed]}
                      >
                        <Text style={styles.addCardIcon}>{meta.icon}</Text>
                        <Text style={styles.addCardLabel}>{meta.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 13, 11, 0.65)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: "#181D1A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#2B342E",
    maxHeight: "75%",
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#262F29",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5F3EC",
  },
  subtitle: {
    fontSize: 12,
    color: "#8B958D",
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#242D26",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: "#DCD9D0",
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.75,
  },
  list: {
    paddingHorizontal: 20,
  },
  listContent: {
    paddingVertical: 14,
    gap: 12,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: {
    fontSize: 34,
    color: "#4B564E",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E2DFD6",
  },
  emptyText: {
    fontSize: 13,
    color: "#828D85",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  layerCard: {
    backgroundColor: "#202723",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2D3730",
    gap: 10,
  },
  layerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  layerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#29332D",
    justifyContent: "center",
    alignItems: "center",
  },
  layerIconText: {
    fontSize: 18,
    color: "#CB7857",
  },
  layerInfo: {
    flex: 1,
  },
  layerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  layerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F4F1E8",
  },
  layerTypeBadge: {
    fontSize: 9,
    fontWeight: "700",
    color: "#7E8C82",
    backgroundColor: "#181F1B",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  layerDesc: {
    fontSize: 11,
    color: "#859288",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#28322B",
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonActive: {
    backgroundColor: "#2C4A3C",
  },
  actionIcon: {
    fontSize: 14,
  },
  deleteIcon: {
    fontSize: 13,
    color: "#A74335",
  },
  opacityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#263028",
  },
  opacityLabel: {
    fontSize: 12,
    color: "#93A096",
    fontWeight: "500",
  },
  opacityPills: {
    flexDirection: "row",
    gap: 6,
  },
  opacityPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#28332C",
  },
  opacityPillActive: {
    backgroundColor: "#28594B",
  },
  opacityPillText: {
    fontSize: 11,
    color: "#A1ADA4",
    fontWeight: "600",
  },
  opacityPillTextActive: {
    color: "#FFFFFF",
  },
  addSection: {
    marginTop: 14,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#263028",
    gap: 10,
  },
  addSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#77857A",
    letterSpacing: 0.8,
  },
  addGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  addCard: {
    width: "31%",
    backgroundColor: "#202723",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2B352E",
    gap: 4,
  },
  addCardIcon: {
    fontSize: 18,
    color: "#D5A844",
  },
  addCardLabel: {
    fontSize: 11,
    color: "#E2DFD6",
    fontWeight: "600",
    textAlign: "center",
  },
});
