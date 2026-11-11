import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Canvas,
  ColorMatrix,
  Group,
  Image as SkiaImage,
  ImageShader,
  Rect,
  Shader,
  useImage,
} from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  computeAspectFit,
  computeTransformedDimensions,
  croppedNormalizedToSourceNormalized,
  normalizedToReference,
  rotateNormalizedPoint,
  screenToNormalized,
  screenToReference,
  toSkiaTransformArray,
  unrotateNormalizedPoint,
  type Point2D,
  type ViewportTransformParams,
} from "../coordinate/ReferenceTransform";
import type { ImageAdjustmentSettings } from "../../domain/overlayTypes";
import { DEFAULT_IMAGE_ADJUSTMENTS } from "../../domain/overlayTypes";
import {
  createBaseAdjustmentsColorMatrix,
  createContourExtractionColorMatrix,
  createWhiteoutColorMatrix,
  createWhiteoutUniforms,
  getWhiteoutRuntimeEffect,
} from "../shaders/WhiteoutShader";
import { colors } from "../../theme";

interface ReferenceCanvasProps {
  referenceUri?: string | null;
  referenceWidth?: number;
  referenceHeight?: number;
  adjustments?: ImageAdjustmentSettings;
  onImportPress?: () => void;
  onPointTap?: (refPoint: Point2D, normPoint: Point2D) => void;
  onTransformChange?: (params: ViewportTransformParams) => void;
  interactive?: boolean;
}

export function ReferenceCanvas({
  referenceUri,
  referenceWidth = 1000,
  referenceHeight = 1000,
  adjustments,
  onImportPress,
  onPointTap,
  onTransformChange,
  interactive = true,
}: ReferenceCanvasProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Container viewport sizing
  const containerWidth = Math.max(280, windowWidth);
  const containerHeight = Math.max(300, windowHeight - 210);

  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState<Point2D>({ x: 0, y: 0 });

  const panStart = useRef<Point2D>({ x: 0, y: 0 });
  const pinchStart = useRef<{ zoom: number; x: number; y: number; focalX: number; focalY: number }>({
    zoom: 1.0,
    x: 0,
    y: 0,
    focalX: 0,
    focalY: 0,
  });

  const skiaImage = useImage(referenceUri ?? undefined);

  const currentAdjustments = adjustments ?? DEFAULT_IMAGE_ADJUSTMENTS;
  const currentRotation = currentAdjustments.rotation ?? 0;
  const currentCrop = currentAdjustments.crop ?? DEFAULT_IMAGE_ADJUSTMENTS.crop;

  // Compute effective visible dimensions accounting for crop and 90° rotation
  const { width: effectiveWidth, height: effectiveHeight } = useMemo(() => {
    return computeTransformedDimensions(
      referenceWidth,
      referenceHeight,
      currentRotation,
      currentCrop
    );
  }, [referenceWidth, referenceHeight, currentRotation, currentCrop]);

  // Compute aspect-ratio preserving container fit
  const fit = useMemo(() => {
    return computeAspectFit(
      effectiveWidth,
      effectiveHeight,
      containerWidth,
      containerHeight
    );
  }, [effectiveWidth, effectiveHeight, containerWidth, containerHeight]);

  const transformParams: ViewportTransformParams = useMemo(() => {
    return {
      refWidth: effectiveWidth,
      refHeight: effectiveHeight,
      containerWidth,
      containerHeight,
      zoom,
      pan,
      rotationDeg: 0,
    };
  }, [effectiveWidth, effectiveHeight, containerWidth, containerHeight, zoom, pan]);

  // Skia transform array for the group
  const canvasTransform = useMemo(() => {
    return toSkiaTransformArray(transformParams);
  }, [transformParams]);

  // Whiteout SkSL runtime shader effect and fallback color matrices
  const whiteoutEffect = useMemo(() => getWhiteoutRuntimeEffect(), []);
  const whiteoutUniforms = useMemo(
    () => createWhiteoutUniforms(currentAdjustments),
    [currentAdjustments]
  );
  const baseAdjustmentsMatrix = useMemo(
    () => createBaseAdjustmentsColorMatrix(currentAdjustments, true),
    [currentAdjustments]
  );
  const contourExtractionMatrix = useMemo(
    () => createContourExtractionColorMatrix(currentAdjustments),
    [currentAdjustments]
  );

  // Transform matrix for cropped and rotated reference source
  const imageTransform = useMemo(() => {
    const cropPixelW = Math.max(1, Math.round(referenceWidth * currentCrop.width));
    const cropPixelH = Math.max(1, Math.round(referenceHeight * currentCrop.height));

    const transforms: Array<
      { translateX: number } | { translateY: number } | { rotate: number }
    > = [];

    if (currentRotation === 90) {
      transforms.push({ translateX: cropPixelH });
      transforms.push({ rotate: Math.PI / 2 });
    } else if (currentRotation === 180) {
      transforms.push({ translateX: cropPixelW });
      transforms.push({ translateY: cropPixelH });
      transforms.push({ rotate: Math.PI });
    } else if (currentRotation === 270) {
      transforms.push({ translateY: cropPixelW });
      transforms.push({ rotate: (3 * Math.PI) / 2 });
    }

    const cropOffsetX = Math.round(currentCrop.originX * referenceWidth);
    const cropOffsetY = Math.round(currentCrop.originY * referenceHeight);
    if (cropOffsetX !== 0) transforms.push({ translateX: -cropOffsetX });
    if (cropOffsetY !== 0) transforms.push({ translateY: -cropOffsetY });

    return transforms;
  }, [referenceWidth, referenceHeight, currentCrop, currentRotation]);

  // Pan gesture for moving reference around
  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .maxPointers(1)
      .minDistance(3)
      .runOnJS(true)
      .onStart(() => {
        panStart.current = pan;
      })
      .onUpdate((event) => {
        if (!interactive) return;
        const nextPan = {
          x: panStart.current.x + event.translationX,
          y: panStart.current.y + event.translationY,
        };
        setPan(nextPan);
        if (onTransformChange) {
          onTransformChange({ ...transformParams, pan: nextPan });
        }
      });
  }, [interactive, pan, transformParams, onTransformChange]);

  // Pinch gesture for zoom
  const pinchGesture = useMemo(() => {
    return Gesture.Pinch()
      .runOnJS(true)
      .onStart((event) => {
        pinchStart.current = {
          zoom,
          ...pan,
          focalX: event.focalX,
          focalY: event.focalY,
        };
      })
      .onUpdate((event) => {
        if (!interactive) return;
        const nextZoom = Math.max(0.4, Math.min(6.0, pinchStart.current.zoom * event.scale));
        const ratio = nextZoom / pinchStart.current.zoom;

        const startRelativeX = pinchStart.current.focalX - containerWidth / 2;
        const startRelativeY = pinchStart.current.focalY - containerHeight / 2;

        const nextPan = {
          x: pinchStart.current.x + event.focalX - pinchStart.current.focalX + startRelativeX * (1 - ratio),
          y: pinchStart.current.y + event.focalY - pinchStart.current.focalY + startRelativeY * (1 - ratio),
        };

        setZoom(nextZoom);
        setPan(nextPan);
        if (onTransformChange) {
          onTransformChange({ ...transformParams, zoom: nextZoom, pan: nextPan });
        }
      });
  }, [interactive, zoom, pan, containerWidth, containerHeight, transformParams, onTransformChange]);

  // Tap gesture to query reference coordinates
  const tapGesture = useMemo(() => {
    return Gesture.Tap()
      .runOnJS(true)
      .onEnd((event) => {
        if (!onPointTap) return;
        const screenPt: Point2D = { x: event.x, y: event.y };
        const effectiveRefPt = screenToReference(screenPt, transformParams);
        const effectiveNormPt = screenToNormalized(screenPt, transformParams);

        // Map back to uncropped source coordinates
        let sourceNormPt = croppedNormalizedToSourceNormalized(effectiveNormPt, currentCrop);
        if (currentRotation) {
          sourceNormPt = unrotateNormalizedPoint(sourceNormPt, currentRotation as 0 | 90 | 180 | 270);
        }
        const sourceRefPt = normalizedToReference(sourceNormPt, referenceWidth, referenceHeight);

        onPointTap(sourceRefPt, effectiveNormPt);
      });
  }, [onPointTap, transformParams, currentCrop, currentRotation, referenceWidth, referenceHeight]);

  const gestures = useMemo(() => {
    return Gesture.Simultaneous(panGesture, pinchGesture, tapGesture);
  }, [panGesture, pinchGesture, tapGesture]);

  const handleResetFit = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(6.0, prev * 1.25));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.4, prev / 1.25));
  };

  // 1. Empty state when no reference image is provided
  if (!referenceUri) {
    return (
      <View style={[styles.emptyContainer, { width: containerWidth, height: containerHeight }]}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>🖼️</Text>
          </View>
          <Text style={styles.emptyTitle}>No Reference Image</Text>
          <Text style={styles.emptySubtitle}>
            Import a photograph, scan, or life study to begin applying grids, Loomis construction, and traditional drawing guides.
          </Text>

          <Pressable
            onPress={onImportPress}
            style={({ pressed }) => [styles.importButton, pressed && styles.buttonPressed]}
            accessibilityLabel="Import Reference Image"
          >
            <Text style={styles.importButtonText}>＋ Import Reference</Text>
          </Pressable>

          <View style={styles.badgeRow}>
            <Text style={styles.badge}>JPG</Text>
            <Text style={styles.badge}>PNG</Text>
            <Text style={styles.badge}>WEBP</Text>
            <Text style={styles.badge}>Stored Locally</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.canvasWrapper, { width: containerWidth, height: containerHeight }]}>
      <GestureDetector gesture={gestures}>
        <View style={StyleSheet.absoluteFill}>
          <Canvas
            style={StyleSheet.absoluteFill}
            opaque
            android={{ surfaceType: "TextureView" }}
          >
            {/* Dark Studio Background */}
            <Rect x={0} y={0} width={containerWidth} height={containerHeight} color="#121513" />

            {/* Reference Image with aspect fitting, zoom, and pan */}
            {skiaImage ? (
              <Group transform={canvasTransform}>
                {/* Paper matting backing behind image */}
                <Rect
                  x={0}
                  y={0}
                  width={effectiveWidth}
                  height={effectiveHeight}
                  color="#FFFEFA"
                />

                {/* Cropped & Rotated Image Surface with Hardware Whiteout Shader */}
                <Group clip={{ x: 0, y: 0, width: effectiveWidth, height: effectiveHeight }}>
                  <Group transform={imageTransform}>
                    {whiteoutEffect ? (
                      // Primary Pipeline: Hardware GPU SkSL Shader with per-pixel non-linear contour protection
                      <Rect
                        x={0}
                        y={0}
                        width={referenceWidth}
                        height={referenceHeight}
                      >
                        <Shader source={whiteoutEffect} uniforms={whiteoutUniforms}>
                          <ImageShader
                            image={skiaImage}
                            x={0}
                            y={0}
                            width={referenceWidth}
                            height={referenceHeight}
                            fit="fill"
                            tx="clamp"
                            ty="clamp"
                          />
                        </Shader>
                      </Rect>
                    ) : (
                      // Fallback Pipeline: Multi-Pass Contour-Aware Canvas Compositing
                      // Pass 1: Base adjusted and bleached image
                      // Pass 2: High-contrast contour pass blended with Multiply to restore dark pencil/ink lines
                      <Group opacity={currentAdjustments.opacity}>
                        <SkiaImage
                          image={skiaImage}
                          x={0}
                          y={0}
                          width={referenceWidth}
                          height={referenceHeight}
                          fit="fill"
                        >
                          <ColorMatrix matrix={baseAdjustmentsMatrix} />
                        </SkiaImage>

                        {currentAdjustments.whiteoutStrength > 0.05 ? (
                          <SkiaImage
                            image={skiaImage}
                            x={0}
                            y={0}
                            width={referenceWidth}
                            height={referenceHeight}
                            fit="fill"
                            blendMode="multiply"
                            opacity={Math.min(1.0, currentAdjustments.whiteoutStrength * 0.85)}
                          >
                            <ColorMatrix matrix={contourExtractionMatrix} />
                          </SkiaImage>
                        ) : null}
                      </Group>
                    )}
                  </Group>
                </Group>
              </Group>
            ) : null}
          </Canvas>

          {/* Loading indicator while Skia decodes texture */}
          {!skiaImage ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.moss} />
              <Text style={styles.loadingText}>Preparing reference image…</Text>
            </View>
          ) : null}
        </View>
      </GestureDetector>

      {/* Floating Zoom & Fit Controls Pad */}
      <View style={styles.zoomControlPad} pointerEvents="box-none">
        <Pressable
          onPress={handleZoomOut}
          style={({ pressed }) => [styles.zoomBtn, pressed && styles.buttonPressed]}
          accessibilityLabel="Zoom Out"
        >
          <Text style={styles.zoomBtnText}>−</Text>
        </Pressable>

        <Pressable
          onPress={handleResetFit}
          style={({ pressed }) => [styles.zoomPercentBtn, pressed && styles.buttonPressed]}
          accessibilityLabel="Reset Fit"
        >
          <Text style={styles.zoomPercentText}>{Math.round(zoom * 100)}%</Text>
        </Pressable>

        <Pressable
          onPress={handleZoomIn}
          style={({ pressed }) => [styles.zoomBtn, pressed && styles.buttonPressed]}
          accessibilityLabel="Zoom In"
        >
          <Text style={styles.zoomBtnText}>＋</Text>
        </Pressable>

        <Pressable
          onPress={handleResetFit}
          style={({ pressed }) => [styles.fitBtn, pressed && styles.buttonPressed]}
          accessibilityLabel="Fit Image to Viewport"
        >
          <Text style={styles.fitBtnText}>Fit</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvasWrapper: {
    backgroundColor: "#121513",
    overflow: "hidden",
    position: "relative",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(18, 21, 19, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#EAE7DF",
    fontSize: 13,
    fontWeight: "500",
  },
  emptyContainer: {
    backgroundColor: "#121513",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyCard: {
    backgroundColor: "#1A1F1C",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    maxWidth: 420,
    width: "100%",
    borderWidth: 1,
    borderColor: "#2B332E",
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#242C27",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#F4F2EC",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#969F98",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 22,
  },
  importButton: {
    backgroundColor: "#28594B",
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 18,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  importButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  badge: {
    fontSize: 11,
    color: "#7E8881",
    backgroundColor: "#222924",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  zoomControlPad: {
    position: "absolute",
    right: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(22, 27, 24, 0.88)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#2B332E",
    paddingHorizontal: 4,
    paddingVertical: 3,
    gap: 2,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomBtnText: {
    color: "#E2DFD6",
    fontSize: 17,
    fontWeight: "600",
  },
  zoomPercentBtn: {
    paddingHorizontal: 6,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomPercentText: {
    color: "#CB7857",
    fontSize: 12,
    fontWeight: "700",
  },
  fitBtn: {
    backgroundColor: "#2A352F",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    marginLeft: 2,
  },
  fitBtnText: {
    color: "#D0CDC4",
    fontSize: 11,
    fontWeight: "600",
  },
});
