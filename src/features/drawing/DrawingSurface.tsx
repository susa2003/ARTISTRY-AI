import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import {
  Canvas, Circle, Group, Image as SkiaImage, ImageFormat, Path, Rect, Skia, useImage, useCanvasRef,
} from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { DrawingLayer, ProjectDocument, Stroke, StrokePoint } from "../../domain/types";
import { smoothStrokePoints } from "./StrokeSmoothing";
import { useAppStore } from "../../state/appStore";
import { colors } from "../../theme";

type Props = { project: ProjectDocument; panMode: boolean };
export type DrawingSurfaceHandle = { export: (format: "png" | "jpg") => Promise<string | null> };

export const DrawingSurface = forwardRef<DrawingSurfaceHandle, Props>(function DrawingSurface({ project, panMode }, ref) {
  const { width: screenWidth, height: safeHeight } = useWindowDimensions();
  const tool = useAppStore((state) => state.tool);
  const color = useAppStore((state) => state.color);
  const brushSize = useAppStore((state) => state.brushSize);
  const smoothing = useAppStore((state) => state.smoothing);
  const commitStroke = useAppStore((state) => state.commitStroke);

  const canvasWidth = Math.max(210, Math.min(screenWidth - 44, (safeHeight - 340) * project.width / project.height, 760));
  const canvasHeight = canvasWidth * project.height / project.width;
  const fit = canvasWidth / project.width;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const panStart = useRef({ x: 0, y: 0 });
  const pinchStart = useRef({ zoom: 1, x: 0, y: 0, focalX: 0, focalY: 0 });
  const visibleRef = useCanvasRef();
  const exportRef = useCanvasRef();
  const referenceImage = useImage(project.referenceUri ?? undefined);

  useImperativeHandle(ref, () => ({
    export: async (format) => {
      const snapshot = await exportRef.current?.makeImageSnapshotAsync();
      if (!snapshot) return null;
      return snapshot.encodeToBase64(format === "png" ? ImageFormat.PNG : ImageFormat.JPEG, format === "jpg" ? 0.92 : undefined);
    },
  }), []);

  const toDocumentPoint = (x: number, y: number): StrokePoint => ({
    x: Math.max(0, Math.min(project.width, (x - pan.x) / (fit * zoom))),
    y: Math.max(0, Math.min(project.height, (y - pan.y) / (fit * zoom))),
  });

  const startDrawing = (x: number, y: number) => {
    if (panMode) { panStart.current = pan; return; }
    const newStroke: Stroke = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      kind: tool,
      color,
      width: Math.max(1, brushSize),
      points: [toDocumentPoint(x, y)],
    };
    activeStrokeRef.current = newStroke;
    setActiveStroke(newStroke);
  };

  const moveDrawing = (x: number, y: number, translationX: number, translationY: number) => {
    if (panMode) {
      setPan({ x: panStart.current.x + translationX, y: panStart.current.y + translationY });
      return;
    }
    const current = activeStrokeRef.current;
    if (!current) return;
    const point = toDocumentPoint(x, y);
    const next = { ...current, points: [...current.points, point] };
    activeStrokeRef.current = next;
    setActiveStroke(next);
  };

  const finishDrawing = () => {
    const finished = activeStrokeRef.current;
    if (finished && finished.points.length > 0) {
      // Apply Catmull-Rom stroke smoothing
      const smoothedPoints = smoothStrokePoints(finished.points, smoothing);
      commitStroke({ ...finished, points: smoothedPoints });
    }
    activeStrokeRef.current = null;
    setActiveStroke(null);
  };

  const fingerPan = useMemo(() => Gesture.Pan()
    .maxPointers(1).minDistance(2).runOnJS(true)
    .onStart((event) => startDrawing(event.x, event.y))
    .onUpdate((event) => moveDrawing(event.x, event.y, event.translationX, event.translationY))
    .onEnd(finishDrawing)
    .onFinalize(() => { if (activeStrokeRef.current) finishDrawing(); }),
    [panMode, pan, zoom, fit, project.width, project.height, tool, color, brushSize, smoothing]);

  const pinch = useMemo(() => Gesture.Pinch().runOnJS(true)
    .onStart((event) => { pinchStart.current = { zoom, ...pan, focalX: event.focalX, focalY: event.focalY }; })
    .onUpdate((event) => {
      const nextZoom = Math.max(0.4, Math.min(6, pinchStart.current.zoom * event.scale));
      const relativeX = event.focalX - canvasWidth / 2;
      const relativeY = event.focalY - canvasHeight / 2;
      const startRelativeX = pinchStart.current.focalX - canvasWidth / 2;
      const startRelativeY = pinchStart.current.focalY - canvasHeight / 2;
      const ratio = nextZoom / pinchStart.current.zoom;
      setPan({
        x: pinchStart.current.x + event.focalX - pinchStart.current.focalX + startRelativeX * (1 - ratio),
        y: pinchStart.current.y + event.focalY - pinchStart.current.focalY + startRelativeY * (1 - ratio),
      });
      setZoom(nextZoom);
    }), [zoom, pan, canvasWidth, canvasHeight]);

  const gestures = useMemo(() => Gesture.Simultaneous(fingerPan, pinch), [fingerPan, pinch]);
  const canvasTransform: Array<{ translateX: number } | { translateY: number } | { scale: number }> = [
    { translateX: pan.x },
    { translateY: pan.y },
    { scale: fit * zoom },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.viewport}>
        <View style={[styles.stage, { width: canvasWidth, height: canvasHeight }]}>
          <GestureDetector gesture={gestures}>
            <View style={StyleSheet.absoluteFill}>
              <Canvas ref={visibleRef} style={StyleSheet.absoluteFill} opaque android={{ surfaceType: "TextureView" }}>
                <Artwork project={project} image={referenceImage} activeStroke={activeStroke} transform={canvasTransform} />
              </Canvas>
            </View>
          </GestureDetector>
          <View pointerEvents="box-none" style={styles.zoomPad}>
            <Pressable onPress={() => setZoom((value) => Math.max(0.4, value / 1.2))} style={styles.zoomButton}><Text style={styles.zoomText}>−</Text></Pressable>
            <Text style={styles.zoomValue}>{Math.round(zoom * 100)}%</Text>
            <Pressable onPress={() => setZoom((value) => Math.min(6, value * 1.2))} style={styles.zoomButton}><Text style={styles.zoomText}>＋</Text></Pressable>
            <Pressable onPress={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={styles.resetZoom}><Text style={styles.resetText}>Fit</Text></Pressable>
          </View>
        </View>
        {panMode ? <View pointerEvents="none" style={styles.panHint}><Text style={styles.panHintText}>PAN MODE · drag to move</Text></View> : null}
      </View>

      <Canvas
        ref={exportRef}
        style={{ position: "absolute", left: -project.width - 20, top: 0, width: project.width, height: project.height }}
        opaque
        android={{ surfaceType: "TextureView" }}
      >
        <Artwork project={project} image={referenceImage} activeStroke={null} />
      </Canvas>
    </View>
  );
});

type ArtworkProps = {
  project: ProjectDocument;
  image: ReturnType<typeof useImage>;
  activeStroke: Stroke | null;
  transform?: Array<{ translateX: number } | { translateY: number } | { scale: number }>;
};

function Artwork({ project, image, activeStroke, transform }: ArtworkProps) {
  const refOpacity = project.referenceOpacity ?? 0.85;

  return (
    <Group transform={transform}>
      <Rect x={0} y={0} width={project.width} height={project.height} color="#FFFEFA" />
      {image ? (
        <Group opacity={refOpacity}>
          <SkiaImage image={image} x={0} y={0} width={project.width} height={project.height} fit="fill" />
        </Group>
      ) : null}
      {project.layers.map((layer) => (
        <LayerDrawing
          key={layer.id}
          layer={layer}
          activeStroke={activeStroke?.kind && project.activeLayerId === layer.id ? activeStroke : null}
        />
      ))}
    </Group>
  );
}

function LayerDrawing({ layer, activeStroke }: { layer: DrawingLayer; activeStroke: Stroke | null }) {
  const paint = useMemo(() => Skia.Paint(), []);
  if (!layer.visible) return null;
  const strokes = activeStroke ? [...layer.strokes, activeStroke] : layer.strokes;
  return (
    <Group layer={paint} opacity={layer.opacity}>
      {strokes.map((stroke) => <StrokeShape key={stroke.id} stroke={stroke} />)}
    </Group>
  );
}

function StrokeShape({ stroke }: { stroke: Stroke }) {
  const path = useMemo(() => {
    const next = Skia.PathBuilder.Make();
    const [first, ...rest] = stroke.points;
    if (!first) return next.build();
    next.moveTo(first.x, first.y);
    rest.forEach((point) => next.lineTo(point.x, point.y));
    return next.build();
  }, [stroke.points]);

  const point = stroke.points[0];
  const isEraser = stroke.kind === "eraser";
  const isPencil = stroke.kind === "pencil";
  const isPen = stroke.kind === "pen";

  return (
    <Group>
      {point && stroke.points.length === 1 ? (
        <Circle
          cx={point.x}
          cy={point.y}
          r={stroke.width / 2}
          color={isEraser ? "#000000" : stroke.color}
          blendMode={isEraser ? "clear" : "srcOver"}
        />
      ) : null}
      {stroke.points.length > 1 ? (
        <Path
          path={path}
          color={isEraser ? "#000000" : stroke.color}
          style="stroke"
          strokeWidth={stroke.width}
          strokeCap="round"
          strokeJoin="round"
          blendMode={isEraser ? "clear" : "srcOver"}
          opacity={isPencil ? 0.72 : isPen ? 0.95 : 1.0}
        />
      ) : null}
    </Group>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, width: "100%" },
  viewport: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  stage: {
    backgroundColor: colors.paper,
    borderRadius: 7,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#17201C",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  zoomPad: {
    position: "absolute",
    zIndex: 3,
    top: 8,
    right: 8,
    minHeight: 34,
    borderRadius: 18,
    paddingHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,254,250,.94)",
    borderWidth: 1,
    borderColor: colors.line,
  },
  zoomButton: { width: 29, height: 28, alignItems: "center", justifyContent: "center" },
  zoomText: { color: colors.ink, fontSize: 18, lineHeight: 21, fontWeight: "700" },
  zoomValue: { minWidth: 37, textAlign: "center", color: colors.muted, fontSize: 9, fontWeight: "800" },
  resetZoom: {
    paddingHorizontal: 8,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: colors.line,
  },
  resetText: { color: colors.moss, fontSize: 10, fontWeight: "800" },
  panHint: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(23,32,28,.68)",
  },
  panHintText: { color: colors.white, fontSize: 9, letterSpacing: 1, fontWeight: "800" },
});
