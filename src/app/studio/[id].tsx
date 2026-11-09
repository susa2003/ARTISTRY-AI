import { useEffect, useRef, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { AppHeader, Button, Screen } from "../../components/AppUI";
import { DrawingSurface, type DrawingSurfaceHandle } from "../../features/drawing/DrawingSurface";
import type { BrushKind } from "../../domain/types";
import type { SmoothingLevel } from "../../features/drawing/StrokeSmoothing";
import { useAppStore } from "../../state/appStore";
import { copyProjectExport } from "../../storage/imageFiles";
import { colors } from "../../theme";

const colorSet = ["#1C211D", "#28594B", "#CB7857", "#D5A844", "#596A94", "#8B4F69", "#9B9B91", "#FFFFFF"];

export default function StudioScreen() {
  const { id: routeId, challengeTimer, challengeTitle } = useLocalSearchParams<{
    id: string;
    challengeTimer?: string;
    challengeTitle?: string;
  }>();
  const project = useAppStore((state) => state.currentProject);
  const openProject = useAppStore((state) => state.openProject);
  const saveCurrentProject = useAppStore((state) => state.saveCurrentProject);
  const completeDailyChallenge = useAppStore((state) => state.completeDailyChallenge);
  const tool = useAppStore((state) => state.tool);
  const setTool = useAppStore((state) => state.setTool);
  const color = useAppStore((state) => state.color);
  const setColor = useAppStore((state) => state.setColor);
  const brushSize = useAppStore((state) => state.brushSize);
  const setBrushSize = useAppStore((state) => state.setBrushSize);
  const smoothing = useAppStore((state) => state.smoothing);
  const setSmoothing = useAppStore((state) => state.setSmoothing);
  const undo = useAppStore((state) => state.undo);
  const redo = useAppStore((state) => state.redo);
  const canUndo = useAppStore((state) => state.past.length > 0);
  const canRedo = useAppStore((state) => state.future.length > 0);
  const addLayer = useAppStore((state) => state.addLayer);
  const deleteLayer = useAppStore((state) => state.deleteLayer);
  const toggleLayer = useAppStore((state) => state.toggleLayer);
  const selectLayer = useAppStore((state) => state.selectLayer);
  const renameLayer = useAppStore((state) => state.renameLayer);
  const setLayerOpacity = useAppStore((state) => state.setLayerOpacity);
  const moveLayer = useAppStore((state) => state.moveLayer);
  const duplicateLayer = useAppStore((state) => state.duplicateLayer);
  const clearLayer = useAppStore((state) => state.clearLayer);

  const [panMode, setPanMode] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState(color);
  const [layerNameDraft, setLayerNameDraft] = useState("");
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // Daily Challenge Countdown Timer
  const [timerSeconds, setTimerSeconds] = useState<number | null>(() =>
    challengeTimer ? Math.max(30, Number(challengeTimer) * 60) : null
  );
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [challengeCompleted, setChallengeCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (timerSeconds === null || !timerActive || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  useEffect(() => {
    if (timerSeconds === 0 && !challengeCompleted) {
      setChallengeCompleted(true);
      setTimerActive(false);
      void completeDailyChallenge(challengeTitle ?? "Daily Drawing Challenge", project?.id).then((streak) => {
        Alert.alert(
          "⏱ Time's Up!",
          `Great drawing sprint! Challenge completed. Your daily streak is now ${streak} day(s) in a row!\n\nReview your drawing against the self-critique rubric or continue detailing.`,
          [{ text: "Continue Drawing" }]
        );
      });
    }
  }, [timerSeconds, challengeCompleted, challengeTitle, completeDailyChallenge, project?.id]);
  const surfaceRef = useRef<DrawingSurfaceHandle>(null);
  const { width } = useWindowDimensions();
  const currentId = Array.isArray(routeId) ? routeId[0] : routeId;
  const current = project?.id === currentId ? project : null;

  useEffect(() => {
    if (currentId && project?.id !== currentId) {
      void openProject(currentId).catch((error) => {
        setLoadFailed(true);
        Alert.alert(
          "Project unavailable",
          error instanceof Error ? error.message : "This local drawing could not be opened.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      });
    }
  }, [currentId, project?.id, openProject]);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => {
      void saveCurrentProject();
    }, 700);
    return () => {
      clearTimeout(timer);
      void saveCurrentProject();
    };
  }, [current, saveCurrentProject]);

  const exportDrawing = async (format: "png" | "jpg") => {
    try {
      const base64 = await surfaceRef.current?.export(format);
      if (!base64) throw new Error("The canvas is not ready to export.");
      await saveCurrentProject();
      const uri = await copyProjectExport(base64, format);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: format === "png" ? "image/png" : "image/jpeg",
          dialogTitle: `Export ${current?.name ?? "drawing"}`,
        });
      } else {
        Alert.alert("Drawing exported", uri);
      }
    } catch (error) {
      Alert.alert("Export unavailable", error instanceof Error ? error.message : "Try again.");
    }
  };

  if (!current) {
    return (
      <Screen>
        <Text style={styles.loading}>{loadFailed ? "Returning to your projects…" : "Opening local canvas…"}</Text>
      </Screen>
    );
  }

  const tools: Array<{ id: BrushKind; label: string; glyph: string }> = [
    { id: "brush", label: "Brush", glyph: "●" },
    { id: "pencil", label: "Pencil", glyph: "✎" },
    { id: "pen", label: "Ink Pen", glyph: "✒" },
    { id: "eraser", label: "Eraser", glyph: "⌫" },
  ];

  const smoothingOptions: SmoothingLevel[] = ["off", "low", "medium", "high"];

  const cycleSmoothing = () => {
    const idx = smoothingOptions.indexOf(smoothing);
    const next = smoothingOptions[(idx + 1) % smoothingOptions.length]!;
    setSmoothing(next);
  };

  const selectedLayer = current.layers.find((layer) => layer.id === current.activeLayerId);

  const applyHexColor = () => {
    const clean = hexDraft.startsWith("#") ? hexDraft : `#${hexDraft}`;
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) setColor(clean.toUpperCase());
    else Alert.alert("Use a six-digit color", "Enter a color such as #28594B.");
  };

  return (
    <Screen scroll={false}>
      <View style={styles.editor}>
        <AppHeader
          title={current.name}
          onBack={() => router.back()}
          right={
            <View style={styles.historyButtons}>
              <Pressable
                onPress={undo}
                disabled={!canUndo}
                style={[styles.historyButton, !canUndo && styles.disabled]}
              >
                <Text style={styles.historyGlyph}>↶</Text>
              </Pressable>
              <Pressable
                onPress={redo}
                disabled={!canRedo}
                style={[styles.historyButton, !canRedo && styles.disabled]}
              >
                <Text style={styles.historyGlyph}>↷</Text>
              </Pressable>
            </View>
          }
        />

        {/* --- DAILY CHALLENGE COUNTDOWN TIMER BANNER --- */}
        {timerSeconds !== null && (
          <View style={styles.timerBanner}>
            <View
              style={[
                styles.timerPill,
                timerSeconds <= 30
                  ? styles.timerAlert
                  : timerSeconds <= 120
                  ? styles.timerWarning
                  : null,
              ]}
            >
              <Text style={styles.timerGlyph}>⏱</Text>
              <Text style={styles.timerDigits}>
                {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:
                {String(timerSeconds % 60).padStart(2, "0")}
              </Text>
              <Pressable
                onPress={() => setTimerActive((v) => !v)}
                style={styles.timerToggle}
              >
                <Text style={styles.timerToggleText}>
                  {timerActive ? "❚❚ Pause" : "▶ Resume"}
                </Text>
              </Pressable>
            </View>
            <Text numberOfLines={1} style={styles.timerTitle}>
              {challengeTitle ?? "Daily Drawing Sprint"}
            </Text>
          </View>
        )}

        {/* --- TOOLS & PAN / LAYERS ROW --- */}
        <View style={styles.toolRow}>
          {tools.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                setTool(item.id);
                setPanMode(false);
              }}
              style={[styles.toolButton, tool === item.id && !panMode && styles.toolButtonActive]}
            >
              <Text style={[styles.toolGlyph, tool === item.id && !panMode && styles.toolActiveText]}>
                {item.glyph}
              </Text>
              <Text style={[styles.toolLabel, tool === item.id && !panMode && styles.toolActiveText]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setPanMode((value) => !value)}
            style={[styles.toolButton, panMode && styles.panActive]}
          >
            <Text style={[styles.toolGlyph, panMode && styles.toolActiveText]}>✥</Text>
            <Text style={[styles.toolLabel, panMode && styles.toolActiveText]}>Move</Text>
          </Pressable>

          {/* Stroke Stabilizer Toggle */}
          <Pressable onPress={cycleSmoothing} style={styles.stabilizerBtn} accessibilityLabel="Toggle stroke stabilizer">
            <Text style={styles.stabilizerIcon}>⚡</Text>
            <Text style={styles.stabilizerLabel}>
              {smoothing.toUpperCase()}
            </Text>
          </Pressable>

          <View style={styles.spacer} />
          <Pressable onPress={() => setLayersOpen(true)} style={styles.layersButton}>
            <Text style={styles.layersGlyph}>▤</Text>
            <Text style={styles.layersText}>Layers ({current.layers.length})</Text>
          </Pressable>
        </View>

        {/* --- HARDWARE-ACCELERATED SKIA CANVAS HOST --- */}
        <View style={styles.canvasHost}>
          <DrawingSurface ref={surfaceRef} project={current} panMode={panMode} />
        </View>

        {/* --- BOTTOM BRUSH CONTROLS & PALETTE --- */}
        <View style={styles.controlPanel}>
          <View style={styles.sizeRow}>
            <Text style={styles.controlCaption}>{tool === "eraser" ? "ERASER" : tool.toUpperCase()}</Text>
            <Pressable onPress={() => setBrushSize(brushSize - 2)} style={styles.sizeButton}>
              <Text style={styles.sizeGlyph}>−</Text>
            </Pressable>
            <View style={styles.sizePreview}>
              <View
                style={[
                  styles.sizeDot,
                  {
                    width: Math.min(23, brushSize),
                    height: Math.min(23, brushSize),
                    borderRadius: Math.min(23, brushSize) / 2,
                  },
                ]}
              />
            </View>
            <Text style={styles.sizeValue}>{brushSize}px</Text>
            <Pressable onPress={() => setBrushSize(brushSize + 2)} style={styles.sizeButton}>
              <Text style={styles.sizeGlyph}>＋</Text>
            </Pressable>
            <View style={styles.panelDivider} />
            <Text style={styles.layerShort} numberOfLines={1}>
              {selectedLayer?.name ?? "Layer"} ({Math.round((selectedLayer?.opacity ?? 1) * 100)}%)
            </Text>
          </View>
          <View style={styles.colorRow}>
            <Text style={[styles.controlCaption, styles.colorCaption]}>COLOR</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorControls}>
              {colorSet.map((swatch) => (
                <Pressable
                  key={swatch}
                  onPress={() => {
                    setColor(swatch);
                    setHexDraft(swatch);
                  }}
                  style={[styles.colorSwatch, { backgroundColor: swatch }, color === swatch && styles.selectedSwatch]}
                  accessibilityLabel={`Choose ${swatch}`}
                />
              ))}
              <TextInput
                value={hexDraft}
                onChangeText={setHexDraft}
                onSubmitEditing={applyHexColor}
                autoCapitalize="characters"
                maxLength={7}
                placeholder="#1C211D"
                style={styles.hexInput}
              />
              <Pressable onPress={applyHexColor} style={styles.applyColor}>
                <Text style={styles.applyColorText}>Set</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>

        {/* --- BOTTOM EXPORT / SAVE BAR --- */}
        <View style={styles.bottomRow}>
          <View style={styles.saveStatus}>
            <View style={styles.savedDot} />
            <Text style={styles.savedText}>Autosaves locally · 60fps Skia</Text>
          </View>
          <View style={styles.exportButtons}>
            {width > 560 ? (
              <Button title="PNG" icon="↓" tone="line" onPress={() => void exportDrawing("png")} style={styles.exportButton} />
            ) : null}
            <Button
              title={width > 560 ? "Export JPG" : "Export"}
              icon="⇩"
              onPress={() =>
                Alert.alert("Export drawing", "Choose image format.", [
                  { text: "PNG (Transparent)", onPress: () => void exportDrawing("png") },
                  { text: "JPG (White Background)", onPress: () => void exportDrawing("jpg") },
                  { text: "Cancel", style: "cancel" },
                ])
              }
              style={styles.exportButton}
            />
          </View>
        </View>
      </View>

      {/* =========================================================================
          MULTI-LAYER MANAGER SHEET (MODAL)
          ========================================================================= */}
      <Modal visible={layersOpen} animationType="slide" transparent onRequestClose={() => setLayersOpen(false)}>
        <View style={styles.modalScrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setLayersOpen(false)} />
          <View style={[styles.layerSheet, width > 720 && styles.layerSheetTablet]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Drawing Layers</Text>
                <Text style={styles.sheetCopy}>
                  Manage, reorder, adjust opacity, and duplicate layers independently.
                </Text>
              </View>
              <Pressable onPress={() => setLayersOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeGlyph}>×</Text>
              </Pressable>
            </View>

            <Button title="Add a new blank layer" icon="＋" onPress={addLayer} style={styles.addLayerButton} />

            <ScrollView style={styles.layerList}>
              {[...current.layers].reverse().map((layer, reverseIdx) => {
                const actualIdx = current.layers.length - 1 - reverseIdx;
                const isTop = actualIdx === current.layers.length - 1;
                const isBottom = actualIdx === 0;

                return (
                  <View
                    key={layer.id}
                    style={[styles.layerRow, layer.id === current.activeLayerId && styles.layerRowActive]}
                  >
                    <Pressable onPress={() => selectLayer(layer.id)} style={styles.layerMain}>
                      <Text style={styles.layerIcon}>▤</Text>
                      <View style={{ flex: 1 }}>
                        {editingLayerId === layer.id ? (
                          <TextInput
                            autoFocus
                            value={layerNameDraft}
                            onChangeText={setLayerNameDraft}
                            onSubmitEditing={() => {
                              renameLayer(layer.id, layerNameDraft);
                              setEditingLayerId(null);
                            }}
                            onBlur={() => {
                              if (layerNameDraft.trim()) renameLayer(layer.id, layerNameDraft);
                              setEditingLayerId(null);
                            }}
                            style={styles.layerNameInput}
                          />
                        ) : (
                          <Text numberOfLines={1} style={styles.layerName}>
                            {layer.name}
                          </Text>
                        )}
                        <Text style={styles.layerMarks}>
                          {layer.strokes.length} {layer.strokes.length === 1 ? "stroke" : "strokes"} ·{" "}
                          {Math.round(layer.opacity * 100)}% opacity
                        </Text>
                      </View>
                    </Pressable>

                    {/* Opacity Cycle (100% -> 75% -> 50% -> 25%) */}
                    <Pressable
                      onPress={() => {
                        const nextOpacity = layer.opacity <= 0.3 ? 1.0 : layer.opacity - 0.25;
                        setLayerOpacity(layer.id, nextOpacity);
                      }}
                      style={styles.layerSmallBtn}
                      accessibilityLabel="Adjust layer opacity"
                    >
                      <Text style={styles.layerSmallBtnText}>{Math.round(layer.opacity * 100)}%</Text>
                    </Pressable>

                    {/* Move Up / Down */}
                    <Pressable
                      onPress={() => moveLayer(layer.id, "up")}
                      disabled={isTop}
                      style={[styles.layerSmallBtn, isTop && styles.disabled]}
                    >
                      <Text style={styles.layerSmallBtnText}>▲</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => moveLayer(layer.id, "down")}
                      disabled={isBottom}
                      style={[styles.layerSmallBtn, isBottom && styles.disabled]}
                    >
                      <Text style={styles.layerSmallBtnText}>▼</Text>
                    </Pressable>

                    {/* Duplicate Layer */}
                    <Pressable
                      onPress={() => duplicateLayer(layer.id)}
                      style={styles.layerSmallBtn}
                      accessibilityLabel="Duplicate layer"
                    >
                      <Text style={styles.layerSmallBtnText}>⧉</Text>
                    </Pressable>

                    {/* Rename Layer */}
                    <Pressable
                      onPress={() => {
                        selectLayer(layer.id);
                        setLayerNameDraft(layer.name);
                        setEditingLayerId(layer.id);
                      }}
                      style={styles.layerAction}
                      accessibilityLabel={`Rename ${layer.name}`}
                    >
                      <Text style={styles.layerActionGlyph}>✎</Text>
                    </Pressable>

                    {/* Visibility Toggle */}
                    <Pressable onPress={() => toggleLayer(layer.id)} style={styles.layerAction}>
                      <Text style={styles.layerActionGlyph}>{layer.visible ? "◉" : "○"}</Text>
                    </Pressable>

                    {/* Delete Layer */}
                    <Pressable
                      onPress={() => deleteLayer(layer.id)}
                      style={styles.layerAction}
                      disabled={current.layers.length <= 1}
                    >
                      <Text style={[styles.layerDeleteGlyph, current.layers.length <= 1 && styles.disabled]}>
                        ⌫
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>

            <Button title="Done" onPress={() => setLayersOpen(false)} style={styles.doneButton} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  editor: { flex: 1, minHeight: 500 },
  loading: { color: colors.muted, marginTop: 35, textAlign: "center" },
  historyButtons: { flexDirection: "row", gap: 5 },
  historyButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  historyGlyph: { fontSize: 21, lineHeight: 25, color: colors.ink },
  disabled: { opacity: 0.3 },
  toolRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 9 },
  toolButton: {
    minWidth: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 6,
  },
  toolButtonActive: { backgroundColor: colors.moss, borderColor: colors.moss },
  panActive: { backgroundColor: "#F1E3DB", borderColor: "#E5C6B8" },
  toolGlyph: { color: colors.muted, fontSize: 16, lineHeight: 18 },
  toolLabel: { color: colors.muted, fontSize: 8, fontWeight: "700", marginTop: 1 },
  toolActiveText: { color: colors.white },
  stabilizerBtn: {
    height: 48,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7ECE1",
    borderWidth: 1,
    borderColor: colors.line,
  },
  stabilizerIcon: { fontSize: 13, color: colors.moss },
  stabilizerLabel: { fontSize: 8, fontWeight: "800", color: colors.moss, marginTop: 1 },
  spacer: { flex: 1 },
  layersButton: {
    height: 44,
    paddingHorizontal: 11,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    backgroundColor: colors.mossLight,
  },
  layersGlyph: { color: colors.moss, fontSize: 16 },
  layersText: { color: colors.moss, fontSize: 11, fontWeight: "800" },
  canvasHost: {
    flex: 1,
    minHeight: 210,
    borderRadius: 20,
    backgroundColor: "#EAE9E1",
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  controlPanel: { paddingTop: 9, paddingBottom: 5, gap: 7 },
  sizeRow: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 32 },
  controlCaption: { color: colors.muted, fontSize: 8, fontWeight: "800", letterSpacing: 1.3, width: 62 },
  sizeButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sizeGlyph: { color: colors.ink, fontSize: 17, lineHeight: 20 },
  sizePreview: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  sizeDot: { backgroundColor: colors.ink, minWidth: 3, minHeight: 3 },
  sizeValue: { width: 36, color: colors.muted, fontSize: 10 },
  panelDivider: { height: 20, width: 1, backgroundColor: colors.line, marginHorizontal: 3 },
  layerShort: { color: colors.moss, fontSize: 10, fontWeight: "700", flex: 1 },
  colorRow: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 32 },
  colorCaption: { width: 52 },
  colorControls: { alignItems: "center", gap: 8, paddingRight: 5 },
  colorSwatch: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: "rgba(23,32,28,.13)" },
  selectedSwatch: { borderWidth: 2.5, borderColor: colors.moss, transform: [{ scale: 1.12 }] },
  hexInput: {
    width: 70,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: 7,
    color: colors.ink,
    fontSize: 9,
  },
  applyColor: {
    paddingHorizontal: 7,
    height: 29,
    borderRadius: 8,
    backgroundColor: colors.mossLight,
    alignItems: "center",
    justifyContent: "center",
  },
  applyColorText: { color: colors.moss, fontSize: 9, fontWeight: "800" },
  bottomRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 2,
    paddingTop: 7,
  },
  saveStatus: { flexDirection: "row", alignItems: "center", gap: 6 },
  savedDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: colors.moss },
  savedText: { color: colors.muted, fontSize: 9 },
  exportButtons: { flexDirection: "row", gap: 7 },
  exportButton: { minHeight: 36, borderRadius: 12, paddingHorizontal: 12 },
  modalScrim: { flex: 1, backgroundColor: "rgba(17,23,20,.45)", justifyContent: "flex-end", alignItems: "center" },
  layerSheet: {
    width: "100%",
    maxWidth: 680,
    maxHeight: "84%",
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    padding: 21,
    paddingBottom: 25,
  },
  layerSheetTablet: { borderRadius: 27, marginBottom: 25 },
  sheetHandle: { width: 42, height: 4, borderRadius: 4, backgroundColor: "#C8C9C0", alignSelf: "center", marginBottom: 15 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sheetTitle: { color: colors.ink, fontFamily: "Georgia", fontSize: 26 },
  sheetCopy: { color: colors.muted, fontSize: 11, marginTop: 4 },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  closeGlyph: { color: colors.muted, fontSize: 24, lineHeight: 27 },
  addLayerButton: { alignSelf: "flex-start", minHeight: 40, marginBottom: 11 },
  layerList: { maxHeight: 360 },
  layerRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 6,
    gap: 4,
  },
  layerRowActive: { borderColor: colors.moss, backgroundColor: "#F6F8F1" },
  layerMain: { flex: 1, minHeight: 54, flexDirection: "row", alignItems: "center", gap: 8 },
  layerIcon: { color: colors.moss, fontSize: 18, width: 22, textAlign: "center" },
  layerName: { color: colors.ink, fontSize: 12, fontWeight: "700" },
  layerNameInput: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderColor: colors.moss,
  },
  layerMarks: { color: colors.muted, fontSize: 9, marginTop: 2 },
  layerSmallBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#ECEFE6",
    alignItems: "center",
    justifyContent: "center",
  },
  layerSmallBtnText: { fontSize: 10, fontWeight: "800", color: colors.ink },
  layerAction: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  layerActionGlyph: { color: colors.moss, fontSize: 16 },
  layerDeleteGlyph: { color: colors.danger, fontSize: 15 },
  timerBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F4EDE2",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2D7C8",
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dark,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  timerAlert: { backgroundColor: colors.clay },
  timerWarning: { backgroundColor: "#D5A844" },
  timerGlyph: { fontSize: 13, color: colors.white },
  timerDigits: { fontSize: 13, fontWeight: "800", color: colors.white, letterSpacing: 0.8 },
  timerToggle: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  timerToggleText: { fontSize: 10, fontWeight: "700", color: colors.white },
  timerTitle: { flex: 1, marginLeft: 10, fontSize: 11, fontWeight: "700", color: colors.ink },
  doneButton: { marginTop: 15 },
});
