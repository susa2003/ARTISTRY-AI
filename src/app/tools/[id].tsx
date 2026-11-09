import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import * as Sharing from "expo-sharing";
import { Canvas, Image as SkiaImage, ImageFormat, Skia, useCanvasRef, useImage } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { AppHeader, Button, Eyebrow, InfoCard, Screen } from "../../components/AppUI";
import { FEATURES } from "../../domain/features";
import type { DrawingAnalysisRecord, ToolId } from "../../domain/types";
import { analyzePixels } from "../../features/analysis/localAnalysis";
import { chooseImageFromDocuments, choosePhotoFromSystemPicker } from "../../features/images/pickImage";
import {
  DEFAULT_LOOMIS_PARAMS,
  LOOMIS_STAGES,
  convertLoomisToStrokes,
  type LoomisParams,
} from "../../features/loomis/LoomisEngine";
import { LoomisSkiaOverlay } from "../../features/loomis/LoomisSkiaOverlay";
import {
  DEFAULT_GRID_CONFIG,
  convertGridToStrokes,
  type GridConfig,
  type GridMode,
} from "../../features/grid/GridEngine";
import { GridSkiaOverlay } from "../../features/grid/GridSkiaOverlay";
import {
  DEFAULT_TRACING_CONFIG,
  processTracingImage,
  type TracingConfig,
  type TracingMode,
} from "../../features/tracing/TracingEngine";
import {
  ANATOMY_TUTORIAL_STEPS,
  DEFAULT_ANATOMY_CONFIG,
  calculateAnatomy,
  convertAnatomyToStrokes,
  type AnatomyConfig,
  type AnatomyGender,
  type AnatomyMode,
  type AnatomyTutorialStep,
} from "../../features/anatomy/AnatomyEngine";
import { AnatomySkiaOverlay } from "../../features/anatomy/AnatomySkiaOverlay";
import {
  DEFAULT_PERSPECTIVE_CONFIG,
  convertPerspectiveToStrokes,
  type PerspectiveConfig,
  type PerspectiveMode,
} from "../../features/perspective/PerspectiveEngine";
import { PerspectiveSkiaOverlay } from "../../features/perspective/PerspectiveSkiaOverlay";
import {
  DEFAULT_SHADING_CONFIG,
  FIVE_VALUES,
  processShadingImage,
  type ShadingConfig,
} from "../../features/shading/ShadingEngine";
import {
  DEFAULT_COMPARISON_CONFIG,
  calculateDifferenceMap,
  type ComparisonConfig,
  type ComparisonMode,
} from "../../features/comparison/ComparisonEngine";
import { ComparisonSkiaOverlay } from "../../features/comparison/ComparisonSkiaOverlay";
import {
  REFERENCE_LIBRARY,
  getReferenceImageUri,
  type LibraryCategory,
  type ReferenceItem,
} from "../../features/library/ReferenceLibrary";
import {
  ART_LESSONS,
  getTodayChallenge,
  type DailyChallenge,
  type Lesson,
} from "../../features/learning/LearningCenter";
import { ReferenceGeneratorView } from "../../features/generator/ReferenceGeneratorView";
import { DrawingProgressView } from "../../features/progress/DrawingProgressView";
import { ArtMentorView } from "../../features/mentor/ArtMentorView";
import { StrokeReplayView } from "../../features/replay/StrokeReplayView";
import { MultiAngleView } from "../../features/turnaround/MultiAngleView";
import { ColorRecommendationView } from "../../features/colorrec/ColorRecommendationView";
import { MistakeDetectorView } from "../../features/mistakes/MistakeDetectorView";
import { VectorConverterView } from "../../features/vectorizer/VectorConverterView";
import { LineArtCleanerView } from "../../features/linecleaner/LineArtCleanerView";
import { ObjectSeparationView } from "../../features/segmentation/ObjectSeparationView";
import {
  DEFAULT_SKETCH_OPTIONS,
  SKETCH_STYLES,
  convertSketchGuideToStrokes,
  processSketch,
} from "../../features/sketch/SketchConverterEngine";
import {
  POSE_PRESETS,
  convertPoseToStrokes,
  detectPoseLandmarks,
} from "../../features/pose/PoseCoachEngine";
import { PoseCoachSkiaOverlay } from "../../features/pose/PoseCoachSkiaOverlay";
import {
  analyzeHandOrFoot,
  convertHandFootToStrokes,
} from "../../features/handfoot/HandFootEngine";
import { HandFootSkiaOverlay } from "../../features/handfoot/HandFootSkiaOverlay";
import {
  convertLightingToStrokes,
  detectLighting,
} from "../../features/lighting/LightingPredictorEngine";
import { LightingSkiaOverlay } from "../../features/lighting/LightingSkiaOverlay";
import {
  analyzeCompositionFidelity,
  convertCompositionToStrokes,
} from "../../features/composition/CompositionCoachEngine";
import { CompositionSkiaOverlay } from "../../features/composition/CompositionSkiaOverlay";
import {
  fetchAnalysisHistory,
  runDrawingAnalysis,
} from "../../features/analyzer/DrawingAnalyzerEngine";
import type {
  CompositionResult,
  HandFootResult,
  LightingResult,
  PoseResult,
  SketchConvertOptions,
} from "../../services/ai/types";
import { useAppStore } from "../../state/appStore";
import { cacheSelectedImage, copyProjectExport } from "../../storage/imageFiles";
import { colors } from "../../theme";

const validIds: ToolId[] = [
  "loomis",
  "steps",
  "sketch",
  "tracing",
  "grid",
  "analyzer",
  "shading",
  "color",
  "anatomy",
  "perspective",
  "compare",
  "library",
  "learning",
  "generator",
  "progress",
  "pose",
  "handfoot",
  "lighting",
  "composition",
  "linecleaner",
  "segmentation",
  "colorrec",
  "turnaround",
  "replay",
  "mistakes",
  "mentor",
  "vectorizer",
];

const AI_ENDPOINT = process.env.EXPO_PUBLIC_AI_API_URL?.trim();

export default function ToolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tool = validIds.includes(id as ToolId) ? (id as ToolId) : "loomis";
  const feature = FEATURES.find((item) => item.id === tool) ?? FEATURES[0]!;

  const reference = useAppStore((state) => state.reference);
  const setReference = useAppStore((state) => state.setReference);
  const createProject = useAppStore((state) => state.createProject);
  const setColor = useAppStore((state) => state.setColor);
  const importStrokesToLayer = useAppStore((state) => state.importStrokesToLayer);
  const setReferenceOpacity = useAppStore((state) => state.setReferenceOpacity);
  const currentProject = useAppStore((state) => state.currentProject);
  const projects = useAppStore((state) => state.projects);
  const streak = useAppStore((state) => state.streak);
  const lessonProgress = useAppStore((state) => state.lessonProgress);
  const toggleLessonCompletion = useAppStore((state) => state.toggleLessonCompletion);
  const loadLearningProgress = useAppStore((state) => state.loadLearningProgress);
  const experienceMode = useAppStore((state) => state.experienceMode);
  const setExperienceMode = useAppStore((state) => state.setExperienceMode);
  const { width: screenWidth } = useWindowDimensions();

  useEffect(() => {
    void loadLearningProgress();
  }, [loadLearningProgress]);

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [requestedReferenceId, setRequestedReferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiResponse, setAiResponse] = useState<{ message?: string; tips?: string[]; resultUrl?: string } | null>(null);
  const canvasRef = useCanvasRef();

  // --- STUDIO STATES ---
  const [loomisStage, setLoomisStage] = useState<number>(1);
  const [loomisParams, setLoomisParams] = useState<LoomisParams>(DEFAULT_LOOMIS_PARAMS);
  const [gridConfig, setGridConfig] = useState<GridConfig>(DEFAULT_GRID_CONFIG);
  const [tracingConfig, setTracingConfig] = useState<TracingConfig>(DEFAULT_TRACING_CONFIG);
  const [anatomyConfig, setAnatomyConfig] = useState<AnatomyConfig>(DEFAULT_ANATOMY_CONFIG);
  const [perspectiveConfig, setPerspectiveConfig] = useState<PerspectiveConfig>(DEFAULT_PERSPECTIVE_CONFIG);
  const [shadingConfig, setShadingConfig] = useState<ShadingConfig>(DEFAULT_SHADING_CONFIG);
  const [comparisonConfig, setComparisonConfig] = useState<ComparisonConfig>(DEFAULT_COMPARISON_CONFIG);

  // Phase 4 states
  const [sketchOptions, setSketchOptions] = useState<SketchConvertOptions>(DEFAULT_SKETCH_OPTIONS);
  const [poseResult, setPoseResult] = useState<PoseResult | null>(null);
  const [poseShowLoa, setPoseShowLoa] = useState(true);
  const [handFootResult, setHandFootResult] = useState<HandFootResult | null>(null);
  const [handFootType, setHandFootType] = useState<"hand" | "foot">("hand");
  const [lightingResult, setLightingResult] = useState<LightingResult | null>(null);
  const [compositionResult, setCompositionResult] = useState<CompositionResult | null>(null);
  const [compositionGridMode, setCompositionGridMode] = useState<"thirds" | "golden_spiral" | "diagonal">("thirds");
  const [drawingAnalysis, setDrawingAnalysis] = useState<DrawingAnalysisRecord | null>(null);

  // Comparison & Difference states
  const [compareDrawingUri, setCompareDrawingUri] = useState<string | null>(null);
  const compareDrawingImage = useImage(compareDrawingUri ?? undefined);
  const [differenceImage, setDifferenceImage] = useState<ReturnType<typeof Skia.Image.MakeImage> | null>(null);
  const [matchScore, setMatchScore] = useState<number | undefined>(undefined);
  const [analyzingDiff, setAnalyzingDiff] = useState(false);
  const [selectedCompareProject, setSelectedCompareProject] = useState<string | null>(null);

  // Perspective interactive drag state
  const [activePerspectiveDrag, setActivePerspectiveDrag] = useState<"vp1" | "vp2" | "vp3" | "horizon" | null>(null);

  // Anatomy Interactive Tutorial state
  const [selectedTutorialStep, setSelectedTutorialStep] = useState<number>(1);

  // Library & Learning states
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState<LibraryCategory>("portraits");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const todayChallenge = useMemo(() => getTodayChallenge(), []);

  const allowsBlankPractice = [
    "loomis",
    "grid",
    "anatomy",
    "perspective",
    "generator",
    "progress",
    "pose",
    "handfoot",
    "lighting",
    "composition",
    "turnaround",
    "replay",
    "mentor",
    "vectorizer",
    "colorrec",
    "sketch",
    "analyzer",
    "mistakes",
  ].includes(tool);
  const sourceImage = useImage(previewUri ?? undefined);
  const processRequested = Boolean((reference && requestedReferenceId === reference.id) || allowsBlankPractice);

  // Reference preparation
  useEffect(() => {
    if (!reference || !processRequested) {
      setPreviewUri(null);
      return;
    }
    let active = true;
    setLoading(true);
    const prepare = async () => {
      const longest = Math.max(reference.width, reference.height);
      const scale = Math.min(1, 1400 / Math.max(1, longest));
      const width = Math.max(1, Math.round(reference.width * scale));
      const height = Math.max(1, Math.round(reference.height * scale));
      const actions = scale < 1 ? [{ resize: { width, height } }] : [];
      const result = await ImageManipulator.manipulateAsync(reference.uri, actions, {
        compress: 0.94,
        format: ImageManipulator.SaveFormat.PNG,
      });
      if (active) setPreviewUri(result.uri);
    };
    void prepare()
      .catch((error) => Alert.alert("Preview unavailable", error instanceof Error ? error.message : "Try a smaller image."))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reference?.id, reference?.uri, reference?.width, reference?.height, processRequested]);

  const pixels = useMemo(() => {
    if (!sourceImage) return null;
    try {
      return sourceImage.readPixels();
    } catch {
      return null;
    }
  }, [sourceImage]);

  // Image processing analysis based on active tool
  const analysis = useMemo(() => {
    if (!reference || !sourceImage || !pixels) return null;
    if (tool === "tracing") {
      const img = processTracingImage(pixels, sourceImage.width(), sourceImage.height(), tracingConfig);
      return {
        image: img,
        note: `High-contrast tracing mode (${tracingConfig.mode}) active with threshold ${tracingConfig.threshold}. Adjust opacity to trace directly onto your canvas.`,
        palette: [],
      };
    }
    if (tool === "shading") {
      const { image, stats } = processShadingImage(pixels, sourceImage.width(), sourceImage.height(), shadingConfig);
      return {
        image,
        note: `5-Value Form Shading: ${stats.shadows}% shadow mass · ${stats.midtones}% midtone halftones · ${stats.highlights}% highlights. Light source at ${shadingConfig.lightAngle}°.`,
        palette: FIVE_VALUES.map((v) => v.color),
      };
    }
    try {
      return analyzePixels(tool, pixels, sourceImage.width(), sourceImage.height(), reference.width, reference.height);
    } catch {
      return null;
    }
  }, [tool, reference?.width, reference?.height, sourceImage, pixels, tracingConfig, shadingConfig]);

  const stageWidth = reference
    ? Math.min(Math.max(180, screenWidth - 48), 820, (620 * reference.width) / Math.max(1, reference.height))
    : Math.min(Math.max(220, screenWidth - 48), 380);
  const stageHeight = reference ? stageWidth * (reference.height / Math.max(1, reference.width)) : Math.round(stageWidth * 1.35);
  const stageH = Math.min(620, stageHeight);

  // Auto-initialize Phase 4 AI analysis models
  useEffect(() => {
    if (tool === "pose" && !poseResult) {
      void detectPoseLandmarks(previewUri ?? undefined, stageWidth, stageH).then(setPoseResult);
    }
    if (tool === "handfoot" && (!handFootResult || handFootResult.type !== handFootType)) {
      void analyzeHandOrFoot(handFootType, previewUri ?? undefined, stageWidth, stageH).then(setHandFootResult);
    }
    if (tool === "lighting" && !lightingResult) {
      void detectLighting(previewUri ?? undefined, pixels, stageWidth, stageH).then(setLightingResult);
    }
    if (tool === "composition" && !compositionResult) {
      void analyzeCompositionFidelity(previewUri ?? undefined, pixels, stageWidth, stageH).then(setCompositionResult);
    }
    if (tool === "analyzer" && !drawingAnalysis) {
      void runDrawingAnalysis(
        {
          drawingPixels: pixels,
          width: stageWidth,
          height: stageH,
          drawingUri: previewUri ?? undefined,
        },
        currentProject?.id
      ).then(setDrawingAnalysis);
    }
  }, [tool, previewUri, pixels, stageWidth, stageH, handFootType]);

  // --- INTERACTIVE TOUCH GESTURES (PERSPECTIVE & COMPARISON) ---
  const perspectivePanGesture = useMemo(() => {
    let target: "vp1" | "vp2" | "vp3" | "horizon" | null = null;
    return Gesture.Pan()
      .runOnJS(true)
      .onBegin((e) => {
        const x = e.x;
        const y = e.y;
        const hy = stageH * perspectiveConfig.horizonY;
        const vp1x = stageWidth * perspectiveConfig.vp1X;
        const vp2x = stageWidth * perspectiveConfig.vp2X;
        const vp3y = stageH * perspectiveConfig.vp3Y;
        const hitRadius = 38;

        if (Math.hypot(x - vp1x, y - hy) < hitRadius) {
          target = "vp1";
          setActivePerspectiveDrag("vp1");
          return;
        }
        if (perspectiveConfig.mode !== "1-point" && Math.hypot(x - vp2x, y - hy) < hitRadius) {
          target = "vp2";
          setActivePerspectiveDrag("vp2");
          return;
        }
        if (perspectiveConfig.mode === "3-point" && Math.hypot(x - stageWidth * 0.5, y - vp3y) < hitRadius) {
          target = "vp3";
          setActivePerspectiveDrag("vp3");
          return;
        }
        if (Math.abs(y - hy) < 24) {
          target = "horizon";
          setActivePerspectiveDrag("horizon");
          return;
        }
        target = null;
        setActivePerspectiveDrag(null);
      })
      .onUpdate((e) => {
        if (!target) return;
        const normX = Math.max(0, Math.min(1, e.x / stageWidth));
        const normY = Math.max(0.1, Math.min(0.9, e.y / stageH));

        if (target === "vp1") {
          setPerspectiveConfig((prev) => ({ ...prev, vp1X: normX }));
        } else if (target === "vp2") {
          setPerspectiveConfig((prev) => ({ ...prev, vp2X: normX }));
        } else if (target === "vp3") {
          const normY3 = Math.max(-0.5, Math.min(1.5, e.y / stageH));
          setPerspectiveConfig((prev) => ({ ...prev, vp3Y: normY3 }));
        } else if (target === "horizon") {
          setPerspectiveConfig((prev) => ({ ...prev, horizonY: normY }));
        }
      })
      .onFinalize(() => {
        target = null;
        setActivePerspectiveDrag(null);
      });
  }, [stageWidth, stageH, perspectiveConfig.horizonY, perspectiveConfig.vp1X, perspectiveConfig.vp2X, perspectiveConfig.vp3Y, perspectiveConfig.mode]);

  const comparisonPanGesture = useMemo(() => {
    let draggingSplit = false;
    let draggingPlumb = false;
    return Gesture.Pan()
      .runOnJS(true)
      .onBegin((e) => {
        const splitPx = stageWidth * comparisonConfig.splitPosition;
        if (Math.abs(e.x - splitPx) < 40) {
          draggingSplit = true;
          return;
        }
        if (comparisonConfig.mode === "plumb") {
          draggingPlumb = true;
        }
      })
      .onUpdate((e) => {
        if (draggingSplit) {
          const pos = Math.max(0.05, Math.min(0.95, e.x / stageWidth));
          setComparisonConfig((prev) => ({ ...prev, splitPosition: pos }));
        } else if (draggingPlumb) {
          const px = Math.max(0.05, Math.min(0.95, e.x / stageWidth));
          const py = Math.max(0.05, Math.min(0.95, e.y / stageH));
          setComparisonConfig((prev) => ({ ...prev, plumbX: px, plumbY: py }));
        }
      })
      .onFinalize(() => {
        draggingSplit = false;
        draggingPlumb = false;
      });
  }, [stageWidth, stageH, comparisonConfig.splitPosition, comparisonConfig.mode]);

  const selectPhoto = async (kind: "gallery" | "documents") => {
    try {
      const result = kind === "gallery" ? await choosePhotoFromSystemPicker() : await chooseImageFromDocuments();
      if (result) {
        setRequestedReferenceId(null);
        await setReference(result);
      }
    } catch (error) {
      Alert.alert("Image could not be opened", error instanceof Error ? error.message : "Choose a supported image.");
    }
  };

  const savePreview = async () => {
    try {
      const snapshot = await canvasRef.current?.makeImageSnapshotAsync();
      if (!snapshot) throw new Error("The preview is not ready yet.");
      const fileUri = await copyProjectExport(snapshot.encodeToBase64(ImageFormat.PNG), "png");
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "image/png",
          dialogTitle: `Save ${feature.title} preview`,
        });
      } else {
        Alert.alert("Preview saved", fileUri);
      }
    } catch (error) {
      Alert.alert("Could not export preview", error instanceof Error ? error.message : "Try again.");
    }
  };

  const runAiAnalysis = async () => {
    if (!AI_ENDPOINT || !reference) return;
    setAiBusy(true);
    setAiResponse(null);
    try {
      const body = new FormData();
      const lowerUri = reference.uri.toLowerCase();
      const mimeType = lowerUri.endsWith(".png") ? "image/png" : lowerUri.endsWith(".webp") ? "image/webp" : "image/jpeg";
      body.append("image", { uri: reference.uri, name: reference.name, type: mimeType } as unknown as Blob);
      body.append("tool", feature.id);
      const response = await fetch(AI_ENDPOINT, { method: "POST", body });
      if (!response.ok) throw new Error(`AI service returned ${response.status}.`);
      setAiResponse((await response.json()) as { message?: string; tips?: string[]; resultUrl?: string });
    } catch (error) {
      Alert.alert("AI analysis unavailable", error instanceof Error ? error.message : "Try again when the service is available.");
    } finally {
      setAiBusy(false);
    }
  };

  // --- ACTIONS TO EXPORT GUIDES DIRECTLY TO CANVAS ---
  const sendLoomisToCanvas = async () => {
    try {
      let projectId = currentProject?.id;
      if (!projectId) {
        projectId = await createProject(reference?.uri ?? null, `Loomis Study - ${new Date().toLocaleDateString()}`);
      }
      const canvasW = currentProject?.width ?? 1000;
      const canvasH = currentProject?.height ?? 1400;
      const strokes = convertLoomisToStrokes(loomisParams, loomisStage, canvasW, canvasH);
      importStrokesToLayer(`Loomis Stage ${loomisStage}`, strokes);
      Alert.alert(
        "Loomis Guide Sent to Canvas!",
        `Stage ${loomisStage} construction lines placed on a dedicated guide layer in your drawing project.`,
        [{ text: "Open Studio Canvas", onPress: () => router.push(`/studio/${projectId}`) }, { text: "Keep Editing" }]
      );
    } catch {
      Alert.alert("Could not send guide to canvas", "Check available storage.");
    }
  };

  const sendGridToCanvas = async () => {
    try {
      let projectId = currentProject?.id;
      if (!projectId) {
        projectId = await createProject(reference?.uri ?? null, `Grid Study - ${new Date().toLocaleDateString()}`);
      }
      const canvasW = currentProject?.width ?? 1000;
      const canvasH = currentProject?.height ?? 1400;
      const strokes = convertGridToStrokes(canvasW, canvasH, gridConfig);
      importStrokesToLayer(`Grid ${gridConfig.mode} (${gridConfig.divisions}x${gridConfig.divisions})`, strokes);
      Alert.alert(
        "Grid Guide Sent to Canvas!",
        "The proportional grid has been created as an independent layer in your drawing canvas.",
        [{ text: "Open Studio Canvas", onPress: () => router.push(`/studio/${projectId}`) }, { text: "Keep Editing" }]
      );
    } catch {
      Alert.alert("Could not send grid to canvas", "Check available storage.");
    }
  };

  const sendAnatomyToCanvas = async () => {
    try {
      let projectId = currentProject?.id;
      if (!projectId) {
        projectId = await createProject(reference?.uri ?? null, `Anatomy Study - ${new Date().toLocaleDateString()}`);
      }
      const canvasW = currentProject?.width ?? 1000;
      const canvasH = currentProject?.height ?? 1400;
      const strokes = convertAnatomyToStrokes(canvasW, canvasH, anatomyConfig);
      importStrokesToLayer(`Anatomy Guides (${anatomyConfig.mode})`, strokes);
      Alert.alert(
        "Anatomy Guides Sent to Canvas!",
        `8-head canonical proportions and ${anatomyConfig.mode} contours imported as a guide layer.`,
        [{ text: "Open Studio Canvas", onPress: () => router.push(`/studio/${projectId}`) }, { text: "Keep Editing" }]
      );
    } catch {
      Alert.alert("Could not send anatomy guides", "Check available storage.");
    }
  };

  const sendPerspectiveToCanvas = async () => {
    try {
      let projectId = currentProject?.id;
      if (!projectId) {
        projectId = await createProject(reference?.uri ?? null, `Perspective Study - ${new Date().toLocaleDateString()}`);
      }
      const canvasW = currentProject?.width ?? 1000;
      const canvasH = currentProject?.height ?? 1400;
      const strokes = convertPerspectiveToStrokes(canvasW, canvasH, perspectiveConfig);
      importStrokesToLayer(`Perspective ${perspectiveConfig.mode}`, strokes);
      Alert.alert(
        "Perspective Grid Sent to Canvas!",
        `Converging ${perspectiveConfig.mode} orthogonal rays added as a guide layer.`,
        [{ text: "Open Studio Canvas", onPress: () => router.push(`/studio/${projectId}`) }, { text: "Keep Editing" }]
      );
    } catch {
      Alert.alert("Could not send perspective grid", "Check available storage.");
    }
  };

  const sendPoseToCanvas = async () => {
    if (!poseResult) return;
    try {
      let projectId = currentProject?.id;
      if (!projectId) {
        projectId = await createProject(reference?.uri ?? null, `Pose Study - ${new Date().toLocaleDateString()}`);
      }
      const strokes = convertPoseToStrokes(poseResult);
      importStrokesToLayer("Pose & Gesture Guides", strokes);
      Alert.alert(
        "Pose Skeleton Sent to Canvas!",
        "33-point landmarks and dynamic Line of Action added as an editable layer.",
        [{ text: "Open Studio Canvas", onPress: () => router.push(`/studio/${projectId}`) }, { text: "Keep Editing" }]
      );
    } catch {
      Alert.alert("Could not send pose guides", "Check available storage.");
    }
  };

  const sendHandFootToCanvas = async () => {
    if (!handFootResult) return;
    try {
      let projectId = currentProject?.id;
      if (!projectId) {
        projectId = await createProject(reference?.uri ?? null, `${handFootType === "hand" ? "Hand" : "Foot"} Study - ${new Date().toLocaleDateString()}`);
      }
      const strokes = convertHandFootToStrokes(handFootResult);
      importStrokesToLayer(`${handFootType === "hand" ? "Hand" : "Foot"} Landmarks`, strokes);
      Alert.alert(
        "Hand/Foot Guides Sent to Canvas!",
        "Anatomical segment proportions and joint root arches added as an editable layer.",
        [{ text: "Open Studio Canvas", onPress: () => router.push(`/studio/${projectId}`) }, { text: "Keep Editing" }]
      );
    } catch {
      Alert.alert("Could not send guides", "Check available storage.");
    }
  };

  const sendLightingToCanvas = async () => {
    if (!lightingResult) return;
    try {
      let projectId = currentProject?.id;
      if (!projectId) {
        projectId = await createProject(reference?.uri ?? null, `Lighting Study - ${new Date().toLocaleDateString()}`);
      }
      const canvasW = currentProject?.width ?? 1000;
      const canvasH = currentProject?.height ?? 1400;
      const strokes = convertLightingToStrokes(lightingResult, canvasW, canvasH);
      importStrokesToLayer(`Light Vector (${lightingResult.primaryLightAngle}°)`, strokes);
      Alert.alert(
        "Lighting Guides Sent to Canvas!",
        "Directional light ray and highlight/core shadow zones added as an editable layer.",
        [{ text: "Open Studio Canvas", onPress: () => router.push(`/studio/${projectId}`) }, { text: "Keep Editing" }]
      );
    } catch {
      Alert.alert("Could not send lighting guide", "Check available storage.");
    }
  };

  const sendCompositionToCanvas = async () => {
    try {
      let projectId = currentProject?.id;
      if (!projectId) {
        projectId = await createProject(reference?.uri ?? null, `Composition Study - ${new Date().toLocaleDateString()}`);
      }
      const canvasW = currentProject?.width ?? 1000;
      const canvasH = currentProject?.height ?? 1400;
      const strokes = convertCompositionToStrokes(canvasW, canvasH, compositionGridMode);
      importStrokesToLayer(`Composition ${compositionGridMode}`, strokes);
      Alert.alert(
        "Composition Grid Sent to Canvas!",
        `${compositionGridMode.replace("_", " ")} alignment guide added as an editable layer.`,
        [{ text: "Open Studio Canvas", onPress: () => router.push(`/studio/${projectId}`) }, { text: "Keep Editing" }]
      );
    } catch {
      Alert.alert("Could not send composition grid", "Check available storage.");
    }
  };

  const sendSketchToCanvas = async () => {
    try {
      let projectId = currentProject?.id;
      if (!projectId) {
        projectId = await createProject(reference?.uri ?? null, `Sketch Study (${sketchOptions.style})`);
      }
      const canvasW = currentProject?.width ?? 1000;
      const canvasH = currentProject?.height ?? 1400;
      const strokes = convertSketchGuideToStrokes(canvasW, canvasH, sketchOptions.style);
      importStrokesToLayer(`Sketch Contours (${sketchOptions.style})`, strokes);
      Alert.alert(
        "Sketch Contours Sent to Canvas!",
        `${sketchOptions.style} style contour guides added as an editable layer.`,
        [{ text: "Open Studio Canvas", onPress: () => router.push(`/studio/${projectId}`) }, { text: "Keep Editing" }]
      );
    } catch {
      Alert.alert("Could not send sketch contours", "Check available storage.");
    }
  };

  const startTracingInStudio = async () => {
    if (!reference) return;
    try {
      const projectId = await createProject(reference.uri, `Tracing Study - ${reference.name}`);
      setReferenceOpacity(tracingConfig.opacity);
      router.push(`/studio/${projectId}`);
    } catch {
      Alert.alert("Could not open tracing studio", "Check available storage.");
    }
  };

  const runDifferenceAnalysis = () => {
    if (!sourceImage) {
      Alert.alert("Reference required", "Please select a reference image to calculate difference.");
      return;
    }
    try {
      setAnalyzingDiff(true);
      const refPixels = sourceImage.readPixels();
      if (!refPixels) throw new Error("Could not read reference pixel data.");
      let drawPixels = compareDrawingImage?.readPixels();
      const w = sourceImage.width();
      const h = sourceImage.height();
      if (!drawPixels) {
        // Fallback: compare with reference baseline
        drawPixels = new Uint8Array(refPixels.length);
        drawPixels.fill(245);
      }
      const { image, matchScore: score } = calculateDifferenceMap(refPixels, drawPixels, w, h);
      setDifferenceImage(image);
      setMatchScore(score);
      setComparisonConfig((prev) => ({ ...prev, mode: "difference" }));
      Alert.alert(
        "Contour Difference Analyzed!",
        `Line accuracy score: ${score}%. Matching contours rendered in green; deviations shown in terracotta red.`
      );
    } catch (error) {
      Alert.alert("Difference analysis error", error instanceof Error ? error.message : "Pixel buffer unreadable.");
    } finally {
      setAnalyzingDiff(false);
    }
  };

  const loadLibraryReference = async (item: ReferenceItem) => {
    try {
      let cached;
      try {
        cached = await cacheSelectedImage(item.uri, `${item.title}.jpg`, { width: 800, height: Math.round(800 / item.aspectRatio) });
      } catch {
        cached = await cacheSelectedImage(item.fallbackSvgUri, `${item.title}.svg`, { width: 800, height: Math.round(800 / item.aspectRatio) });
      }
      await setReference(cached);
      Alert.alert(
        "Reference Imported to Studio!",
        `"${item.title}" is cached locally on this device. Choose where to explore it:`,
        [
          { text: "Tracing Studio", onPress: () => router.push("/tools/tracing") },
          { text: "Loomis Studio", onPress: () => router.push("/tools/loomis") },
          { text: "Direct Drawing Canvas", onPress: async () => {
              const projectId = await createProject(cached.uri, `Study - ${item.title}`);
              router.push(`/studio/${projectId}`);
            }
          },
        ]
      );
    } catch {
      Alert.alert("Could not load reference", "Using bundled offline template.");
    }
  };

  // --- SPECIAL VIEWS: REFERENCE LIBRARY ---
  if (tool === "library") {
    const filteredItems = REFERENCE_LIBRARY.filter((item) => item.category === selectedLibraryCategory);
    return (
      <Screen>
        <AppHeader title="Reference Library" onBack={() => router.back()} />
        <Eyebrow>READY-TO-TRACE & STUDY CATALOG</Eyebrow>
        <Text style={styles.title}>Reference Library<Text style={styles.titleDot}>.</Text></Text>
        <Text style={styles.note}>Curated copyright-free references for Loomis heads, figure anatomy, perspective, and shading practice. Works fully offline with bundled vector templates.</Text>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {(["portraits", "anatomy", "animals", "landscapes", "master_studies"] as LibraryCategory[]).map((cat) => {
            const active = selectedLibraryCategory === cat;
            const labels: Record<LibraryCategory, string> = {
              portraits: "Portraits",
              anatomy: "Figure & Anatomy",
              animals: "Wildlife",
              landscapes: "Architecture & Landscapes",
              master_studies: "Master Studies",
            };
            return (
              <Pressable key={cat} onPress={() => setSelectedLibraryCategory(cat)} style={[styles.catPill, active && styles.catPillActive]}>
                <Text style={[styles.catPillText, active && styles.catPillTextActive]}>{labels[cat]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Item Cards */}
        <View style={styles.libraryGrid}>
          {filteredItems.map((item) => (
            <InfoCard key={item.id} style={styles.libraryCard}>
              <Image source={{ uri: getReferenceImageUri(item) }} style={styles.libraryThumb} resizeMode="cover" />
              <View style={styles.libraryCardBody}>
                <View style={styles.libraryCardBadge}>
                  <Text style={styles.libraryDifficulty}>{item.difficulty.toUpperCase()}</Text>
                </View>
                <Text style={styles.libraryTitle}>{item.title}</Text>
                <Text style={styles.libraryDesc}>{item.description}</Text>
                <View style={styles.suggestedToolsRow}>
                  {item.suggestedTools.map((t) => (
                    <Text key={t} style={styles.toolTag}>#{t}</Text>
                  ))}
                </View>
                <Button title="Load Reference into Studio" icon="↓" onPress={() => void loadLibraryReference(item)} style={styles.fullButton} />
              </View>
            </InfoCard>
          ))}
        </View>
      </Screen>
    );
  }

  // --- SPECIAL VIEWS: LEARNING CENTER & CHALLENGES ---
  if (tool === "learning") {
    const completedCount = Object.values(lessonProgress).filter(Boolean).length;

    return (
      <Screen>
        <AppHeader title="Learning & Challenges" onBack={() => router.back()} />
        <Eyebrow>STRUCTURED CURRICULUM & DAILY PRACTICE</Eyebrow>
        <Text style={styles.title}>Learning Center<Text style={styles.titleDot}>.</Text></Text>
        <Text style={styles.note}>Step-by-step master lessons and daily timed drawing sprints with date-safe persistent streak tracking.</Text>

        {/* Persistent Streak Status Banner */}
        <View style={styles.streakBanner}>
          <View>
            <Text style={styles.streakText}>🔥 {streak.current} DAY DRAWING STREAK</Text>
            <Text style={styles.streakSub}>Longest Streak: {streak.longest} Days · Date-Safe SQLite Persistence</Text>
          </View>
          <View style={styles.streakBadgePill}>
            <Text style={styles.streakBadgePillText}>ACTIVE</Text>
          </View>
        </View>

        {/* Daily Challenge Card */}
        <InfoCard style={[styles.challengeCard, { borderColor: colors.clay }]}>
          <View style={styles.challengeBadge}>
            <Text style={styles.challengeBadgeText}>TODAY'S DAILY SPRINT</Text>
            <Text style={styles.challengeTimer}>⏱ {todayChallenge.timeLimitMinutes} MINS</Text>
          </View>
          <Text style={styles.challengeTitle}>{todayChallenge.title}</Text>
          <Text style={styles.challengeTheme}>Theme: {todayChallenge.theme}</Text>
          <Text style={styles.challengePrompt}>{todayChallenge.prompt}</Text>
          <View style={styles.rubricBox}>
            <Text style={styles.rubricHeading}>Self-Critique Rubric:</Text>
            {todayChallenge.rubric.map((r, i) => (
              <Text key={i} style={styles.rubricItem}>✓ {r}</Text>
            ))}
          </View>
          <Button
            title={`Start ${todayChallenge.timeLimitMinutes}-Minute Challenge on Blank Canvas`}
            icon="✎"
            onPress={async () => {
              const projectId = await createProject(null, `Daily Challenge - ${todayChallenge.title}`);
              router.push({
                pathname: `/studio/${projectId}`,
                params: {
                  challengeTimer: String(todayChallenge.timeLimitMinutes * 60),
                  challengeTitle: todayChallenge.title,
                },
              });
            }}
            style={styles.fullButton}
          />
        </InfoCard>

        {/* Structured Lessons List */}
        <View style={styles.lessonProgressHeader}>
          <Text style={styles.lessonHeading}>STRUCTURED DRAWING LESSONS</Text>
          <Text style={styles.lessonProgressCounter}>
            {completedCount} / {ART_LESSONS.length} Completed
          </Text>
        </View>

        {ART_LESSONS.map((lesson) => {
          const isSelected = selectedLesson?.id === lesson.id;
          const isDone = Boolean(lessonProgress[lesson.id]);

          return (
            <InfoCard key={lesson.id} style={styles.lessonCard}>
              <View style={styles.lessonHeaderRow}>
                <Pressable
                  onPress={() => void toggleLessonCompletion(lesson.id)}
                  style={[styles.lessonCheckBtn, isDone && styles.lessonCheckActive]}
                >
                  {isDone ? <Text style={styles.lessonCheckMark}>✓</Text> : null}
                </Pressable>

                <Pressable onPress={() => setSelectedLesson(isSelected ? null : lesson)} style={styles.lessonHeaderContent}>
                  <View style={styles.lessonNumBadge}>
                    <Text style={styles.lessonNumText}>0{lesson.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.lessonTitle, isDone && styles.lessonTitleDone]}>{lesson.title}</Text>
                    <Text style={styles.lessonMeta}>{lesson.category.toUpperCase()} · ~{lesson.estimatedMinutes} MINS</Text>
                  </View>
                  <Text style={styles.lessonArrow}>{isSelected ? "▼" : "▶"}</Text>
                </Pressable>
              </View>

              {isSelected && (
                <View style={styles.lessonExpanded}>
                  <Text style={styles.lessonObjective}>🎯 Objective: {lesson.objective}</Text>
                  <Text style={styles.lessonSubHeading}>Core Principles:</Text>
                  {lesson.principles.map((p, i) => (
                    <Text key={i} style={styles.lessonBullet}>• {p}</Text>
                  ))}
                  <Text style={styles.lessonSubHeading}>Practical Exercises:</Text>
                  {lesson.exercises.map((e, i) => (
                    <Text key={i} style={styles.lessonBullet}>👉 {e}</Text>
                  ))}
                  <Button
                    title="Practice this Lesson on Canvas"
                    icon="✎"
                    tone="soft"
                    onPress={async () => {
                      const projectId = await createProject(null, `Lesson 0${lesson.number} - ${lesson.title}`);
                      router.push(`/studio/${projectId}`);
                    }}
                    style={styles.fullButton}
                  />
                </View>
              )}
            </InfoCard>
          );
        })}
      </Screen>
    );
  }

  // --- SPECIAL VIEWS: PHASE 4 AI ECOSYSTEM TOOLS ---
  if (tool === "generator") return <ReferenceGeneratorView />;
  if (tool === "progress") return <DrawingProgressView />;
  if (tool === "mentor") return <ArtMentorView />;
  if (tool === "replay") return <StrokeReplayView />;
  if (tool === "turnaround") return <MultiAngleView />;
  if (tool === "colorrec") return <ColorRecommendationView />;
  if (tool === "mistakes") return <MistakeDetectorView />;
  if (tool === "vectorizer") return <VectorConverterView />;
  if (tool === "linecleaner") return <LineArtCleanerView />;
  if (tool === "segmentation") return <ObjectSeparationView />;

  // --- CHECK REFERENCE FOR IMAGE-BASED TOOLS ---
  if (!reference && !allowsBlankPractice) {
    return (
      <Screen>
        <AppHeader title="Image companion" onBack={() => router.back()} />
        <InfoCard style={styles.emptyCard}>
          <Eyebrow>LOCAL IMAGE REQUIRED FOR THIS TOOL</Eyebrow>
          <Text style={styles.title}>{feature.title}.</Text>
          <Text style={styles.note}>
            Choose a photo from your device. It stays local while you create a preview. You can also start with a sample reference from the library.
          </Text>
          <Button title="Choose from photos" icon="▧" onPress={() => void selectPhoto("gallery")} style={styles.fullButton} />
          <Button title="Browse documents" icon="⌕" tone="line" onPress={() => void selectPhoto("documents")} style={styles.fullButton} />
          <Button
            title="Browse Reference Library"
            icon="✦"
            tone="clay"
            onPress={() => router.push("/tools/library")}
            style={styles.fullButton}
          />
          <Button
            title="Open blank canvas"
            icon="✎"
            tone="soft"
            onPress={async () => {
              const projectId = await createProject(null);
              router.push(`/studio/${projectId}`);
            }}
            style={styles.fullButton}
          />
        </InfoCard>
      </Screen>
    );
  }

  const hasPreview = Boolean((sourceImage && analysis) || allowsBlankPractice);
  const currentLoomisInfo = LOOMIS_STAGES.find((s) => s.stage === loomisStage) ?? LOOMIS_STAGES[0]!;
  const currentAnatomyStep = ANATOMY_TUTORIAL_STEPS.find((s) => s.step === selectedTutorialStep) ?? ANATOMY_TUTORIAL_STEPS[0]!;

  const canvasElement = (
    <Canvas ref={canvasRef} style={{ width: stageWidth, height: stageH, backgroundColor: "#FCFBF7" }}>
      {sourceImage && tool !== "compare" ? (
        <SkiaImage
          image={analysis?.image ?? sourceImage}
          x={0}
          y={0}
          width={stageWidth}
          height={stageH}
          fit="fill"
        />
      ) : null}
      {tool === "grid" ? (
        <GridSkiaOverlay width={stageWidth} height={stageH} config={gridConfig} />
      ) : null}
      {tool === "loomis" ? (
        <LoomisSkiaOverlay
          params={loomisParams}
          stage={loomisStage}
          width={stageWidth}
          height={stageH}
        />
      ) : null}
      {tool === "anatomy" ? (
        <AnatomySkiaOverlay width={stageWidth} height={stageH} config={anatomyConfig} />
      ) : null}
      {tool === "perspective" ? (
        <PerspectiveSkiaOverlay
          width={stageWidth}
          height={stageH}
          config={perspectiveConfig}
          activeDragTarget={activePerspectiveDrag}
        />
      ) : null}
      {tool === "compare" ? (
        <ComparisonSkiaOverlay
          width={stageWidth}
          height={stageH}
          config={comparisonConfig}
          referenceImage={sourceImage}
          drawingImage={compareDrawingImage}
          differenceImage={differenceImage}
          matchScore={matchScore}
        />
      ) : null}
      {tool === "pose" && poseResult ? (
        <PoseCoachSkiaOverlay
          pose={poseResult}
          width={stageWidth}
          height={stageH}
          showLineOfAction={poseShowLoa}
        />
      ) : null}
      {tool === "handfoot" && handFootResult ? (
        <HandFootSkiaOverlay
          result={handFootResult}
          width={stageWidth}
          height={stageH}
        />
      ) : null}
      {tool === "lighting" && lightingResult ? (
        <LightingSkiaOverlay
          lighting={lightingResult}
          width={stageWidth}
          height={stageH}
        />
      ) : null}
      {tool === "composition" && compositionResult ? (
        <CompositionSkiaOverlay
          result={compositionResult}
          width={stageWidth}
          height={stageH}
          showThirds={compositionGridMode === "thirds"}
        />
      ) : null}
    </Canvas>
  );

  return (
    <Screen>
      <AppHeader
        title={feature.title}
        onBack={() => router.back()}
        right={
          reference ? (
            <Pressable onPress={() => router.push("/reference")}>
              <Text style={styles.headerLink}>Edit image</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push("/tools/library")}>
              <Text style={styles.headerLink}>Library</Text>
            </Pressable>
          )
        }
      />
      <Eyebrow>ON DEVICE · ORIGINAL UNCHANGED</Eyebrow>
      <Text style={styles.title}>
        {feature.title}
        <Text style={styles.titleDot}>.</Text>
      </Text>
      <Text style={styles.note}>
        {feature.detail} Your selected working copy stays on this device unless you choose the connected AI action below.
      </Text>

      {/* Experience Tier Selector (Beginner vs Professional) */}
      <View style={styles.tierToggleRow}>
        <Text style={styles.tierLabel}>Experience Tier:</Text>
        <Pressable
          onPress={() => void setExperienceMode("beginner")}
          style={[styles.tierPill, experienceMode === "beginner" && styles.tierPillActive]}
        >
          <Text style={[styles.tierPillText, experienceMode === "beginner" && styles.tierPillTextActive]}>
            Beginner Mode
          </Text>
        </Pressable>
        <Pressable
          onPress={() => void setExperienceMode("professional")}
          style={[styles.tierPill, experienceMode === "professional" && styles.tierPillActive]}
        >
          <Text style={[styles.tierPillText, experienceMode === "professional" && styles.tierPillTextActive]}>
            Professional Mode
          </Text>
        </Pressable>
      </View>

      {/* --- PREVIEW STAGE CANVAS WITH DIRECT TOUCH GESTURES --- */}
      <View style={styles.previewOuter}>
        {!processRequested && reference ? (
          <Image
            source={{ uri: reference.uri }}
            resizeMode="contain"
            style={{ width: stageWidth, height: stageH, backgroundColor: "#FCFBF7" }}
          />
        ) : loading || (!sourceImage && reference) ? (
          <View style={[styles.previewPlaceholder, { width: stageWidth, height: Math.min(420, stageH) }]}>
            <Text style={styles.previewPlaceholderText}>{loading ? "Preparing on-device preview…" : "Loading image…"}</Text>
          </View>
        ) : tool === "perspective" ? (
          <GestureDetector gesture={perspectivePanGesture}>
            <View style={{ width: stageWidth, height: stageH }}>
              {canvasElement}
            </View>
          </GestureDetector>
        ) : tool === "compare" ? (
          <GestureDetector gesture={comparisonPanGesture}>
            <View style={{ width: stageWidth, height: stageH }}>
              {canvasElement}
            </View>
          </GestureDetector>
        ) : (
          canvasElement
        )}
      </View>

      {!processRequested && reference ? (
        <Button
          title={`Activate ${feature.title} Interactive Studio`}
          icon="✦"
          onPress={() => setRequestedReferenceId(reference.id)}
          disabled={loading}
          style={styles.fullButton}
        />
      ) : null}

      {/* =========================================================================
          MODULE 1: 8-STAGE AI LOOMIS STUDIO
          ========================================================================= */}
      {tool === "loomis" && processRequested && (
        <InfoCard style={styles.studioCard}>
          <View style={styles.studioCardHeader}>
            <Eyebrow>8-STAGE ANDREW LOOMIS METHOD</Eyebrow>
            <Text style={styles.studioTitle}>{currentLoomisInfo.title}</Text>
            <Text style={styles.studioSubtitle}>{currentLoomisInfo.subtitle}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stageStepper}>
            {LOOMIS_STAGES.map((s) => {
              const active = s.stage === loomisStage;
              return (
                <Pressable
                  key={s.stage}
                  onPress={() => setLoomisStage(s.stage)}
                  style={[styles.stageStepButton, active && styles.stageStepActive]}
                >
                  <Text style={[styles.stageStepNumber, active && styles.stageStepTextActive]}>{s.stage}</Text>
                  <Text style={[styles.stageStepLabel, active && styles.stageStepTextActive]}>
                    {s.title.split(". ")[1]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[styles.stageInfoBox, { borderLeftColor: currentLoomisInfo.color }]}>
            <Text style={styles.stageDescription}>{currentLoomisInfo.description}</Text>
            <Text style={styles.stageInstruction}>👉 {currentLoomisInfo.instruction}</Text>
          </View>

          <View style={styles.controlSection}>
            <Text style={styles.controlHeading}>3D HEAD ORIENTATION & PROPORTIONS</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Yaw (Turn): {loomisParams.yaw}°</Text>
              <View style={styles.sliderButtons}>
                <Pressable onPress={() => setLoomisParams((p) => ({ ...p, yaw: Math.max(-60, p.yaw - 5) }))} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>◀ Left</Text>
                </Pressable>
                <Pressable onPress={() => setLoomisParams((p) => ({ ...p, yaw: 0 }))} style={[styles.stepBtn, styles.stepBtnCenter]}>
                  <Text style={styles.stepBtnText}>Front</Text>
                </Pressable>
                <Pressable onPress={() => setLoomisParams((p) => ({ ...p, yaw: Math.min(60, p.yaw + 5) }))} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>Right ▶</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Pitch (Tilt): {loomisParams.pitch}°</Text>
              <View style={styles.sliderButtons}>
                <Pressable onPress={() => setLoomisParams((p) => ({ ...p, pitch: Math.max(-45, p.pitch - 4) }))} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>▲ Up</Text>
                </Pressable>
                <Pressable onPress={() => setLoomisParams((p) => ({ ...p, pitch: 0 }))} style={[styles.stepBtn, styles.stepBtnCenter]}>
                  <Text style={styles.stepBtnText}>Level</Text>
                </Pressable>
                <Pressable onPress={() => setLoomisParams((p) => ({ ...p, pitch: Math.min(45, p.pitch + 4) }))} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>Down ▼</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Cranium Scale: {Math.round(loomisParams.radius * 100)}%</Text>
              <View style={styles.sliderButtons}>
                <Pressable onPress={() => setLoomisParams((p) => ({ ...p, radius: Math.max(0.15, p.radius - 0.02) }))} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>− Smaller</Text>
                </Pressable>
                <Pressable onPress={() => setLoomisParams((p) => ({ ...p, radius: DEFAULT_LOOMIS_PARAMS.radius }))} style={[styles.stepBtn, styles.stepBtnCenter]}>
                  <Text style={styles.stepBtnText}>Reset</Text>
                </Pressable>
                <Pressable onPress={() => setLoomisParams((p) => ({ ...p, radius: Math.min(0.45, p.radius + 0.02) }))} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>+ Larger</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Button
            title={`Send Stage ${loomisStage} Loomis Guide to Canvas Layer`}
            icon="✎"
            tone="soft"
            onPress={() => void sendLoomisToCanvas()}
            style={styles.fullButton}
          />
        </InfoCard>
      )}

      {/* =========================================================================
          MODULE 2: SMART GRID STUDIO
          ========================================================================= */}
      {tool === "grid" && processRequested && (
        <InfoCard style={styles.studioCard}>
          <View style={styles.studioCardHeader}>
            <Eyebrow>PROPORTIONAL DRAWING GRID</Eyebrow>
            <Text style={styles.studioTitle}>Smart Grid Studio</Text>
            <Text style={styles.studioSubtitle}>Section-by-section accuracy alignment</Text>
          </View>

          <View style={styles.toggleRow}>
            {(["standard", "diagonals", "thirds", "golden"] as GridMode[]).map((mode) => {
              const active = gridConfig.mode === mode;
              const labels: Record<GridMode, string> = {
                standard: "Standard",
                diagonals: "Diagonals (X)",
                thirds: "Rule of 3rds",
                golden: "Golden Ratio",
              };
              return (
                <Pressable
                  key={mode}
                  onPress={() => setGridConfig((c) => ({ ...c, mode }))}
                  style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>{labels[mode]}</Text>
                </Pressable>
              );
            })}
          </View>

          {(gridConfig.mode === "standard" || gridConfig.mode === "diagonals") && (
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Grid Density: {gridConfig.divisions} × {gridConfig.divisions}</Text>
              <View style={styles.densityPillRow}>
                {[2, 3, 4, 5, 6, 8, 10].map((div) => {
                  const active = gridConfig.divisions === div;
                  return (
                    <Pressable
                      key={div}
                      onPress={() => setGridConfig((c) => ({ ...c, divisions: div }))}
                      style={[styles.densityPill, active && styles.densityPillActive]}
                    >
                      <Text style={[styles.densityText, active && styles.densityTextActive]}>{div}x{div}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <Button
            title="Add Grid Layer to Drawing Canvas"
            icon="▦"
            tone="soft"
            onPress={() => void sendGridToCanvas()}
            style={styles.fullButton}
          />
        </InfoCard>
      )}

      {/* =========================================================================
          MODULE 3: TRACING STUDIO
          ========================================================================= */}
      {tool === "tracing" && processRequested && (
        <InfoCard style={styles.studioCard}>
          <View style={styles.studioCardHeader}>
            <Eyebrow>HIGH-CONTRAST LIGHTBOX TRACING</Eyebrow>
            <Text style={styles.studioTitle}>Tracing Studio</Text>
            <Text style={styles.studioSubtitle}>Clear contour separation for muscle-memory practice</Text>
          </View>

          <View style={styles.toggleRow}>
            {(["contrast", "natural", "inverted", "lightbox"] as TracingMode[]).map((mode) => {
              const active = tracingConfig.mode === mode;
              const labels: Record<TracingMode, string> = {
                contrast: "Contour High-Key",
                natural: "Natural Photo",
                inverted: "Chalkboard",
                lightbox: "Lightbox",
              };
              return (
                <Pressable
                  key={mode}
                  onPress={() => setTracingConfig((c) => ({ ...c, mode }))}
                  style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>{labels[mode]}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Tracing Opacity: {Math.round(tracingConfig.opacity * 100)}%</Text>
            <View style={styles.sliderButtons}>
              <Pressable onPress={() => setTracingConfig((c) => ({ ...c, opacity: Math.max(0.1, c.opacity - 0.15) }))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>− Lighter</Text>
              </Pressable>
              <Pressable onPress={() => setTracingConfig((c) => ({ ...c, opacity: 0.55 }))} style={[styles.stepBtn, styles.stepBtnCenter]}>
                <Text style={styles.stepBtnText}>55%</Text>
              </Pressable>
              <Pressable onPress={() => setTracingConfig((c) => ({ ...c, opacity: Math.min(1.0, c.opacity + 0.15) }))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>+ Bolder</Text>
              </Pressable>
            </View>
          </View>

          <Button
            title="Trace this Reference in Drawing Canvas"
            icon="✎"
            tone="soft"
            onPress={() => void startTracingInStudio()}
            style={styles.fullButton}
          />
        </InfoCard>
      )}

      {/* =========================================================================
          MODULE 4: ANATOMY ACADEMY (ENHANCED WITH MUSCLE VOLUMES & TUTORIALS)
          ========================================================================= */}
      {tool === "anatomy" && processRequested && (
        <InfoCard style={styles.studioCard}>
          <View style={styles.studioCardHeader}>
            <Eyebrow>HUMAN PROPORTION & MUSCULOSKELETAL SYSTEM</Eyebrow>
            <Text style={styles.studioTitle}>Anatomy Academy</Text>
            <Text style={styles.studioSubtitle}>Canonical 8-Head figure, skeletal landmarks & muscle volumes</Text>
          </View>

          {/* Mode Selector */}
          <Text style={styles.controlHeading}>ANATOMICAL LAYER MODE</Text>
          <View style={styles.toggleRow}>
            {(["proportions", "skeletal", "muscular", "facial"] as AnatomyMode[]).map((mode) => {
              const active = anatomyConfig.mode === mode;
              const labels: Record<AnatomyMode, string> = {
                proportions: "8-Head Divisions",
                skeletal: "Skeletal Landmarks",
                muscular: "Muscle Volumes",
                facial: "Rule of 5 Eyes",
              };
              return (
                <Pressable
                  key={mode}
                  onPress={() => setAnatomyConfig((c) => ({ ...c, mode }))}
                  style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>{labels[mode]}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Gender / Canon Selector */}
          <Text style={styles.controlHeading}>PROPORTIONAL CANON</Text>
          <View style={styles.toggleRow}>
            {(["neutral", "heroic", "female"] as AnatomyGender[]).map((gender) => {
              const active = anatomyConfig.gender === gender;
              const labels: Record<AnatomyGender, string> = {
                neutral: "Standard 8-Head",
                heroic: "Greek Heroic (8.5-Head)",
                female: "Classical 7.5-Head",
              };
              return (
                <Pressable
                  key={gender}
                  onPress={() => setAnatomyConfig((c) => ({ ...c, gender }))}
                  style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>{labels[gender]}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Figure Scale */}
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Figure Scale: {Math.round(anatomyConfig.heightRatio * 100)}%</Text>
            <View style={styles.sliderButtons}>
              <Pressable onPress={() => setAnatomyConfig((c) => ({ ...c, heightRatio: Math.max(0.4, c.heightRatio - 0.05) }))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>− Smaller</Text>
              </Pressable>
              <Pressable onPress={() => setAnatomyConfig((c) => ({ ...c, heightRatio: 0.82 }))} style={[styles.stepBtn, styles.stepBtnCenter]}>
                <Text style={styles.stepBtnText}>Default</Text>
              </Pressable>
              <Pressable onPress={() => setAnatomyConfig((c) => ({ ...c, heightRatio: Math.min(1.2, c.heightRatio + 0.05) }))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>+ Larger</Text>
              </Pressable>
            </View>
          </View>

          {/* Interactive Tutorial Accordion */}
          <View style={styles.tutorialContainer}>
            <View style={styles.tutorialHeader}>
              <Text style={styles.tutorialCanon}>TUTORIAL STEP {currentAnatomyStep.step} / {ANATOMY_TUTORIAL_STEPS.length}</Text>
              <View style={styles.stepPickerRow}>
                {ANATOMY_TUTORIAL_STEPS.map((s) => (
                  <Pressable
                    key={s.step}
                    onPress={() => {
                      setSelectedTutorialStep(s.step);
                      setAnatomyConfig((c) => ({ ...c, mode: s.focusMode }));
                    }}
                    style={[styles.miniStepPill, selectedTutorialStep === s.step && styles.miniStepPillActive]}
                  >
                    <Text style={[styles.miniStepText, selectedTutorialStep === s.step && styles.miniStepTextActive]}>{s.step}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Text style={styles.tutorialTitle}>{currentAnatomyStep.title}</Text>
            <Text style={styles.tutorialInstruction}>{currentAnatomyStep.instruction}</Text>
            <Text style={styles.tutorialTip}>💡 Pro-Tip: {currentAnatomyStep.tip}</Text>
            <View style={styles.landmarkChipsRow}>
              {currentAnatomyStep.landmarks.map((l, i) => (
                <View key={i} style={styles.landmarkChip}>
                  <Text style={styles.landmarkChipText}>{l}</Text>
                </View>
              ))}
            </View>
            <Button
              title={`Focus View on ${currentAnatomyStep.canon}`}
              tone="line"
              onPress={() => setAnatomyConfig((c) => ({ ...c, mode: currentAnatomyStep.focusMode }))}
              style={styles.fullButton}
            />
          </View>

          <Button
            title="Send Anatomy Guides to Canvas Layer"
            icon="✎"
            tone="soft"
            onPress={() => void sendAnatomyToCanvas()}
            style={styles.fullButton}
          />
        </InfoCard>
      )}

      {/* =========================================================================
          MODULE 5: PERSPECTIVE ASSISTANT (ENHANCED WITH TOUCH-DRAG VANISHING POINTS)
          ========================================================================= */}
      {tool === "perspective" && processRequested && (
        <InfoCard style={styles.studioCard}>
          <View style={styles.studioCardHeader}>
            <Eyebrow>CONVERGING ORTHOGONAL GRIDS</Eyebrow>
            <Text style={styles.studioTitle}>Perspective Assistant</Text>
            <Text style={styles.studioSubtitle}>Interactive vanishing points for forms, cubes & architecture</Text>
          </View>

          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              💡 Direct Touch Controls: Drag the circular Vanishing Point anchors or the Horizon Line directly on the canvas above!
            </Text>
          </View>

          {/* Mode Selector */}
          <View style={styles.toggleRow}>
            {(["1-point", "2-point", "3-point"] as PerspectiveMode[]).map((mode) => {
              const active = perspectiveConfig.mode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setPerspectiveConfig((c) => ({ ...c, mode }))}
                  style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>{mode.toUpperCase()}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Horizon Line Height */}
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Horizon Line (Eye Level): {Math.round(perspectiveConfig.horizonY * 100)}%</Text>
            <View style={styles.sliderButtons}>
              <Pressable onPress={() => setPerspectiveConfig((c) => ({ ...c, horizonY: Math.max(0.15, c.horizonY - 0.05) }))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>▲ Higher</Text>
              </Pressable>
              <Pressable onPress={() => setPerspectiveConfig((c) => ({ ...c, horizonY: 0.45 }))} style={[styles.stepBtn, styles.stepBtnCenter]}>
                <Text style={styles.stepBtnText}>Eye Level</Text>
              </Pressable>
              <Pressable onPress={() => setPerspectiveConfig((c) => ({ ...c, horizonY: Math.min(0.85, c.horizonY + 0.05) }))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>▼ Lower</Text>
              </Pressable>
            </View>
          </View>

          {/* VP1 Position */}
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Vanishing Point 1 (Left): {Math.round(perspectiveConfig.vp1X * 100)}%</Text>
            <View style={styles.sliderButtons}>
              <Pressable onPress={() => setPerspectiveConfig((c) => ({ ...c, vp1X: Math.max(0.0, c.vp1X - 0.05) }))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>◀ Left</Text>
              </Pressable>
              <Pressable onPress={() => setPerspectiveConfig((c) => ({ ...c, vp1X: 0.1 }))} style={[styles.stepBtn, styles.stepBtnCenter]}>
                <Text style={styles.stepBtnText}>Default</Text>
              </Pressable>
              <Pressable onPress={() => setPerspectiveConfig((c) => ({ ...c, vp1X: Math.min(0.5, c.vp1X + 0.05) }))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>Right ▶</Text>
              </Pressable>
            </View>
          </View>

          {/* VP2 Position (if 2-point or 3-point) */}
          {perspectiveConfig.mode !== "1-point" && (
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Vanishing Point 2 (Right): {Math.round(perspectiveConfig.vp2X * 100)}%</Text>
              <View style={styles.sliderButtons}>
                <Pressable onPress={() => setPerspectiveConfig((c) => ({ ...c, vp2X: Math.max(0.5, c.vp2X - 0.05) }))} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>◀ Left</Text>
                </Pressable>
                <Pressable onPress={() => setPerspectiveConfig((c) => ({ ...c, vp2X: 0.9 }))} style={[styles.stepBtn, styles.stepBtnCenter]}>
                  <Text style={styles.stepBtnText}>Default</Text>
                </Pressable>
                <Pressable onPress={() => setPerspectiveConfig((c) => ({ ...c, vp2X: Math.min(1.0, c.vp2X + 0.05) }))} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>Right ▶</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* VP3 Position (if 3-point) */}
          {perspectiveConfig.mode === "3-point" && (
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>VP 3 (Zenith/Nadir): {perspectiveConfig.vp3Y < 0.5 ? "Zenith (Looking Up)" : "Nadir (Looking Down)"}</Text>
              <View style={styles.sliderButtons}>
                <Pressable onPress={() => setPerspectiveConfig((c) => ({ ...c, vp3Y: -0.3 }))} style={[styles.stepBtn, perspectiveConfig.vp3Y < 0.5 && styles.stepBtnCenter]}>
                  <Text style={styles.stepBtnText}>Sky / Zenith</Text>
                </Pressable>
                <Pressable onPress={() => setPerspectiveConfig((c) => ({ ...c, vp3Y: 1.3 }))} style={[styles.stepBtn, perspectiveConfig.vp3Y >= 0.5 && styles.stepBtnCenter]}>
                  <Text style={styles.stepBtnText}>Ground / Nadir</Text>
                </Pressable>
              </View>
            </View>
          )}

          <Button
            title="Add Perspective Grid to Canvas Layer"
            icon="▦"
            tone="soft"
            onPress={() => void sendPerspectiveToCanvas()}
            style={styles.fullButton}
          />
        </InfoCard>
      )}

      {/* =========================================================================
          MODULE 6: SHADING STUDIO
          ========================================================================= */}
      {tool === "shading" && processRequested && (
        <InfoCard style={styles.studioCard}>
          <View style={styles.studioCardHeader}>
            <Eyebrow>FORM LIGHTING & 5-VALUE SCALE</Eyebrow>
            <Text style={styles.studioTitle}>Shading Studio</Text>
            <Text style={styles.studioSubtitle}>360° light direction dial & tonal value grouping</Text>
          </View>

          {/* Light Direction Dial */}
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Light Direction Angle: {shadingConfig.lightAngle}°</Text>
            <View style={styles.sliderButtons}>
              <Pressable onPress={() => setShadingConfig((c) => ({ ...c, lightAngle: (c.lightAngle - 30 + 360) % 360 }))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>↺ −30°</Text>
              </Pressable>
              <Pressable onPress={() => setShadingConfig((c) => ({ ...c, lightAngle: 45 }))} style={[styles.stepBtn, styles.stepBtnCenter]}>
                <Text style={styles.stepBtnText}>Top-Right</Text>
              </Pressable>
              <Pressable onPress={() => setShadingConfig((c) => ({ ...c, lightAngle: (c.lightAngle + 30) % 360 }))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>+30° ↻</Text>
              </Pressable>
            </View>
          </View>

          {/* 5 Canonical Drawing Values */}
          <View style={styles.valuesScaleBox}>
            <Text style={styles.controlHeading}>5 CANONICAL TONAL VALUES</Text>
            <View style={styles.fiveValuesRow}>
              {FIVE_VALUES.map((v) => (
                <View key={v.level} style={styles.valueItem}>
                  <View style={[styles.valueChip, { backgroundColor: v.color }]} />
                  <Text style={styles.valueLevel}>{v.level}</Text>
                  <Text style={styles.valueName}>{v.name.split(" ")[0]}</Text>
                </View>
              ))}
            </View>
          </View>
        </InfoCard>
      )}

      {/* =========================================================================
          MODULE 7: REFERENCE VS MY DRAWING (ENHANCED WITH SPLIT-SCREEN & HEATMAP)
          ========================================================================= */}
      {tool === "compare" && processRequested && (
        <InfoCard style={styles.studioCard}>
          <View style={styles.studioCardHeader}>
            <Eyebrow>LINE-ACCURACY VERIFICATION</Eyebrow>
            <Text style={styles.studioTitle}>Reference vs My Drawing</Text>
            <Text style={styles.studioSubtitle}>Side-by-side split, onion-skinning & contour difference analysis</Text>
          </View>

          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              💡 Direct Touch Controls: In Split mode, touch and drag the terracotta divider handle left and right directly on the canvas!
            </Text>
          </View>

          {/* Match Score Badge */}
          {matchScore !== undefined && (
            <View style={styles.matchScoreBadge}>
              <View>
                <Text style={styles.matchScoreText}>🎯 Line Alignment Accuracy: {matchScore}%</Text>
                <Text style={styles.matchLegendText}>🟢 Green: Exact contour · 🔴 Terracotta: Line drift</Text>
              </View>
              <Text style={styles.matchScorePercent}>{matchScore}%</Text>
            </View>
          )}

          {/* Mode Selector */}
          <Text style={styles.controlHeading}>COMPARISON VISUALIZATION</Text>
          <View style={styles.toggleRow}>
            {(["split", "onion", "difference", "plumb"] as ComparisonMode[]).map((mode) => {
              const active = comparisonConfig.mode === mode;
              const labels: Record<ComparisonMode, string> = {
                split: "Split Screen",
                onion: "Onion Skinning",
                difference: "Difference Heatmap",
                plumb: "Plumb Lines",
              };
              return (
                <Pressable
                  key={mode}
                  onPress={() => setComparisonConfig((c) => ({ ...c, mode }))}
                  style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>{labels[mode]}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Select Drawing to Compare Against Reference */}
          <Text style={styles.controlHeading}>SELECT DRAWING TO COMPARE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.projectScroll}>
            <Pressable
              onPress={() => void selectPhoto("gallery")}
              style={styles.projectPill}
            >
              <Text style={styles.projectPillText}>📁 Pick From Photos…</Text>
            </Pressable>
            {currentProject?.referenceUri && (
              <Pressable
                onPress={() => {
                  setSelectedCompareProject(currentProject.id);
                  if (currentProject.referenceUri) setCompareDrawingUri(currentProject.referenceUri);
                }}
                style={[styles.projectPill, selectedCompareProject === currentProject.id && styles.projectPillActive]}
              >
                <Text style={[styles.projectPillText, selectedCompareProject === currentProject.id && styles.projectPillTextActive]}>
                  Current Studio ({currentProject.name.slice(0, 14)}…)
                </Text>
              </Pressable>
            )}
            {projects.slice(0, 5).map((p) => {
              if (!p.referenceUri) return null;
              const isSelected = selectedCompareProject === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setSelectedCompareProject(p.id);
                    if (p.referenceUri) setCompareDrawingUri(p.referenceUri);
                  }}
                  style={[styles.projectPill, isSelected && styles.projectPillActive]}
                >
                  <Text style={[styles.projectPillText, isSelected && styles.projectPillTextActive]}>{p.name.slice(0, 16)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Split Mode Slider */}
          {comparisonConfig.mode === "split" && (
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Split Position: {Math.round(comparisonConfig.splitPosition * 100)}%</Text>
              <View style={styles.sliderButtons}>
                <Pressable onPress={() => setComparisonConfig((c) => ({ ...c, splitPosition: Math.max(0.1, c.splitPosition - 0.15) }))} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>◀ Left</Text>
                </Pressable>
                <Pressable onPress={() => setComparisonConfig((c) => ({ ...c, splitPosition: 0.5 }))} style={[styles.stepBtn, styles.stepBtnCenter]}>
                  <Text style={styles.stepBtnText}>50 / 50</Text>
                </Pressable>
                <Pressable onPress={() => setComparisonConfig((c) => ({ ...c, splitPosition: Math.min(0.9, c.splitPosition + 0.15) }))} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>Right ▶</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Onion Mode Slider */}
          {comparisonConfig.mode === "onion" && (
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Onion Skinning Transparency: {Math.round(comparisonConfig.onionOpacity * 100)}%</Text>
              <View style={styles.sliderButtons}>
                <Pressable onPress={() => setComparisonConfig((c) => ({ ...c, onionOpacity: Math.max(0.1, c.onionOpacity - 0.15) }))} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>More Drawing</Text>
                </Pressable>
                <Pressable onPress={() => setComparisonConfig((c) => ({ ...c, onionOpacity: 0.5 }))} style={[styles.stepBtn, styles.stepBtnCenter]}>
                  <Text style={styles.stepBtnText}>50%</Text>
                </Pressable>
                <Pressable onPress={() => setComparisonConfig((c) => ({ ...c, onionOpacity: Math.min(0.9, c.onionOpacity + 0.15) }))} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>More Photo</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Difference Analysis Trigger Button */}
          <Button
            title={analyzingDiff ? "Computing Difference Heatmap…" : "Calculate Real Line-Accuracy Heatmap"}
            icon="✦"
            tone="line"
            onPress={runDifferenceAnalysis}
            disabled={analyzingDiff}
            style={styles.fullButton}
          />

          <Button
            title="Open in Drawing Canvas with Comparison Overlay"
            icon="✎"
            tone="soft"
            onPress={async () => {
              const projectId = await createProject(reference?.uri ?? null);
              setReferenceOpacity(comparisonConfig.onionOpacity);
              router.push(`/studio/${projectId}`);
            }}
            style={styles.fullButton}
          />
        </InfoCard>
      )}

      {/* =========================================================================
          MODULE 8: AI SKETCH CONVERTER (8 STYLES & GRANULAR SLIDERS)
          ========================================================================= */}
      {tool === "sketch" && (
        <InfoCard style={styles.studioCard}>
          <View style={styles.studioCardHeader}>
            <Eyebrow>ARTISTIC CONVERSION & LINEWORK</Eyebrow>
            <Text style={styles.studioTitle}>AI Sketch Converter</Text>
            <Text style={styles.studioSubtitle}>Transform photos into genuine graphite, charcoal, ink & watercolor studies</Text>
          </View>

          {/* Style Selector */}
          <Text style={styles.controlHeading}>SELECT ARTISTIC STYLE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {SKETCH_STYLES.map((s) => {
              const active = sketchOptions.style === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setSketchOptions((prev) => ({ ...prev, style: s.id }))}
                  style={[styles.catPill, active && styles.catPillActive]}
                >
                  <Text style={[styles.catPillText, active && styles.catPillTextActive]}>{s.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Sliders */}
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Intensity: {sketchOptions.intensity}%</Text>
            <View style={styles.sliderButtons}>
              <Pressable onPress={() => setSketchOptions((o) => ({ ...o, intensity: Math.max(10, o.intensity - 15) }))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>− Lighter</Text>
              </Pressable>
              <Pressable onPress={() => setSketchOptions((o) => ({ ...o, intensity: 75 }))} style={[styles.stepBtn, styles.stepBtnCenter]}>
                <Text style={styles.stepBtnText}>Default</Text>
              </Pressable>
              <Pressable onPress={() => setSketchOptions((o) => ({ ...o, intensity: Math.min(100, o.intensity + 15) }))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>+ Bolder</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Contrast: {sketchOptions.contrast}%</Text>
            <View style={styles.sliderButtons}>
              <Pressable onPress={() => setSketchOptions((o) => ({ ...o, contrast: Math.max(10, o.contrast - 10) }))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>− Soft</Text>
              </Pressable>
              <Pressable onPress={() => setSketchOptions((o) => ({ ...o, contrast: 60 }))} style={[styles.stepBtn, styles.stepBtnCenter]}>
                <Text style={styles.stepBtnText}>Default</Text>
              </Pressable>
              <Pressable onPress={() => setSketchOptions((o) => ({ ...o, contrast: Math.min(100, o.contrast + 10) }))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>+ Hard</Text>
              </Pressable>
            </View>
          </View>

          {experienceMode === "professional" && (
            <>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>Detail Level: {sketchOptions.detailLevel}%</Text>
                <View style={styles.sliderButtons}>
                  <Pressable onPress={() => setSketchOptions((o) => ({ ...o, detailLevel: Math.max(20, o.detailLevel - 15) }))} style={styles.stepBtn}>
                    <Text style={styles.stepBtnText}>− Coarse</Text>
                  </Pressable>
                  <Pressable onPress={() => setSketchOptions((o) => ({ ...o, detailLevel: 70 }))} style={[styles.stepBtn, styles.stepBtnCenter]}>
                    <Text style={styles.stepBtnText}>Default</Text>
                  </Pressable>
                  <Pressable onPress={() => setSketchOptions((o) => ({ ...o, detailLevel: Math.min(100, o.detailLevel + 15) }))} style={styles.stepBtn}>
                    <Text style={styles.stepBtnText}>+ Fine</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}

          <Button
            title="Send Sketch Contours to Canvas Layer"
            icon="✎"
            tone="soft"
            onPress={() => void sendSketchToCanvas()}
            style={styles.fullButton}
          />
        </InfoCard>
      )}

      {/* =========================================================================
          MODULE 9: AI DRAWING ANALYZER (MULTI-FACTOR DIAGNOSTICS & ANNOTATIONS)
          ========================================================================= */}
      {tool === "analyzer" && (
        <InfoCard style={styles.studioCard}>
          <View style={styles.studioCardHeader}>
            <Eyebrow>COMPREHENSIVE ART DIAGNOSTICS</Eyebrow>
            <Text style={styles.studioTitle}>AI Drawing Analyzer</Text>
            <Text style={styles.studioSubtitle}>Multi-factor anatomical, perspective, tonal and alignment assessment</Text>
          </View>

          {drawingAnalysis && (
            <>
              {/* Overall Score */}
              <View style={styles.matchScoreBadge}>
                <View>
                  <Text style={styles.matchScoreText}>🎯 Overall Fidelity Score</Text>
                  <Text style={styles.matchLegendText}>Calculated across 5 foundational drawing pillars</Text>
                </View>
                <Text style={styles.matchScorePercent}>{drawingAnalysis.overallScore}%</Text>
              </View>

              {/* Multi-Factor Metrics */}
              <View style={{ gap: 8, marginVertical: 10 }}>
                {[
                  { label: "Proportions & Scaling", score: drawingAnalysis.proportionsScore },
                  { label: "Linework & Alignment", score: drawingAnalysis.alignmentScore },
                  { label: "Perspective Convergence", score: drawingAnalysis.perspectiveScore },
                  { label: "Composition & Weight", score: drawingAnalysis.compositionScore },
                  { label: "Form Shading & Values", score: drawingAnalysis.shadingScore },
                ].map((m) => (
                  <View key={m.label} style={{ gap: 3 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 11, color: colors.charcoal, fontWeight: "600" }}>{m.label}</Text>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.forest }}>{m.score}%</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: "#EBE5D8", borderRadius: 3, overflow: "hidden" }}>
                      <View style={{ height: "100%", width: `${m.score}%`, backgroundColor: m.score >= 75 ? colors.forest : colors.terracotta, borderRadius: 3 }} />
                    </View>
                  </View>
                ))}
              </View>

              {/* Feedback Points */}
              <View style={{ backgroundColor: "#F9F6F0", padding: 12, borderRadius: 8, marginVertical: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.charcoal, marginBottom: 6 }}>Diagnostic Insights:</Text>
                {drawingAnalysis.feedback.map((f: string, i: number) => (
                  <Text key={i} style={{ fontSize: 11, color: colors.inkMuted, lineHeight: 16, marginBottom: 4 }}>• {f}</Text>
                ))}
              </View>
            </>
          )}

          <Button
            title="Refresh Diagnostic Analysis"
            icon="✦"
            tone="line"
            onPress={() => {
              void runDrawingAnalysis({
                drawingPixels: pixels,
                width: stageWidth,
                height: stageH,
                drawingUri: previewUri ?? undefined,
              }, currentProject?.id).then(setDrawingAnalysis);
            }}
            style={styles.fullButton}
          />
        </InfoCard>
      )}

      {/* =========================================================================
          MODULE 10: AI POSE & GESTURE COACH
          ========================================================================= */}
      {tool === "pose" && (
        <InfoCard style={styles.studioCard}>
          <View style={styles.studioCardHeader}>
            <Eyebrow>33 SKELETAL LANDMARKS & ACTION CURVES</Eyebrow>
            <Text style={styles.studioTitle}>AI Pose & Gesture Coach</Text>
            <Text style={styles.studioSubtitle}>Dynamic Line of Action, joint anchors & contrapposto balance</Text>
          </View>

          {/* Presets */}
          <Text style={styles.controlHeading}>GESTURAL POSE PRESETS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {POSE_PRESETS.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  void detectPoseLandmarks(previewUri ?? undefined, stageWidth, stageH).then(setPoseResult);
                }}
                style={styles.catPill}
              >
                <Text style={styles.catPillText}>{p.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Line of Action Toggle */}
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Line of Action Curve (Teal):</Text>
            <View style={styles.sliderButtons}>
              <Pressable onPress={() => setPoseShowLoa(!poseShowLoa)} style={[styles.stepBtn, poseShowLoa && styles.stepBtnCenter]}>
                <Text style={styles.stepBtnText}>{poseShowLoa ? "Visible" : "Hidden"}</Text>
              </Pressable>
            </View>
          </View>

          {poseResult && (
            <View style={{ backgroundColor: "#F7F3E9", padding: 10, borderRadius: 8, marginVertical: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.forest }}>Anatomical Balance:</Text>
              <Text style={{ fontSize: 11, color: colors.charcoal }}>Spine Curvature: {poseResult.spineAngle}° · Shoulder Tilt: {poseResult.shoulderTilt}° · Hip Counter-Tilt: {poseResult.hipTilt}°</Text>
            </View>
          )}

          <Button
            title="Send Pose Skeleton to Canvas Layer"
            icon="✎"
            tone="soft"
            onPress={() => void sendPoseToCanvas()}
            style={styles.fullButton}
          />
        </InfoCard>
      )}

      {/* =========================================================================
          MODULE 11: AI HAND & FOOT ASSISTANT
          ========================================================================= */}
      {tool === "handfoot" && (
        <InfoCard style={styles.studioCard}>
          <View style={styles.studioCardHeader}>
            <Eyebrow>21 LANDMARKS & JOINT ROOT ARCHES</Eyebrow>
            <Text style={styles.studioTitle}>AI Hand & Foot Assistant</Text>
            <Text style={styles.studioSubtitle}>Palm box volumes, middle-finger dominance & arch construction</Text>
          </View>

          {/* Hand vs Foot Toggle */}
          <View style={styles.toggleRow}>
            {(["hand", "foot"] as const).map((t) => {
              const active = handFootType === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setHandFootType(t)}
                  style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>{t === "hand" ? "✋ Hand Construction" : "🦶 Foot Arch"}</Text>
                </Pressable>
              );
            })}
          </View>

          {handFootResult && (
            <View style={{ backgroundColor: "#F9F6F0", padding: 12, borderRadius: 8, marginVertical: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.forest, marginBottom: 4 }}>Common Pitfalls to Avoid:</Text>
              {handFootResult.commonMistakes.map((m, i) => (
                <Text key={i} style={{ fontSize: 11, color: colors.inkMuted, lineHeight: 16, marginBottom: 2 }}>⚠ {m}</Text>
              ))}
            </View>
          )}

          <Button
            title={`Send ${handFootType === "hand" ? "Hand" : "Foot"} Guides to Canvas Layer`}
            icon="✎"
            tone="soft"
            onPress={() => void sendHandFootToCanvas()}
            style={styles.fullButton}
          />
        </InfoCard>
      )}

      {/* =========================================================================
          MODULE 12: AI LIGHTING & SHADOW PREDICTOR
          ========================================================================= */}
      {tool === "lighting" && (
        <InfoCard style={styles.studioCard}>
          <View style={styles.studioCardHeader}>
            <Eyebrow>DIRECTIONAL VECTORS & GRAPHITE GRADES</Eyebrow>
            <Text style={styles.studioTitle}>AI Lighting Predictor</Text>
            <Text style={styles.studioSubtitle}>3D incident light rays, highlight zones & graphite pencil hardness</Text>
          </View>

          {lightingResult && (
            <>
              {/* Dial Controls */}
              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>Incident Light Angle: {lightingResult.primaryLightAngle}°</Text>
                <View style={styles.sliderButtons}>
                  <Pressable
                    onPress={() => setLightingResult((l) => l ? { ...l, primaryLightAngle: (l.primaryLightAngle - 30 + 360) % 360 } : null)}
                    style={styles.stepBtn}
                  >
                    <Text style={styles.stepBtnText}>↺ −30°</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setLightingResult((l) => l ? { ...l, primaryLightAngle: (l.primaryLightAngle + 30) % 360 } : null)}
                    style={styles.stepBtn}
                  >
                    <Text style={styles.stepBtnText}>+30° ↻</Text>
                  </Pressable>
                </View>
              </View>

              {/* Graphite Recommendations */}
              <View style={{ backgroundColor: "#F9F6F0", padding: 12, borderRadius: 8, marginVertical: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.forest, marginBottom: 4 }}>Recommended Graphite Grades:</Text>
                <Text style={{ fontSize: 11, color: colors.charcoal }}>• Highlights: {lightingResult.recommendedGraphiteGrades.highlights}</Text>
                <Text style={{ fontSize: 11, color: colors.charcoal }}>• Midtones: {lightingResult.recommendedGraphiteGrades.midtones}</Text>
                <Text style={{ fontSize: 11, color: colors.charcoal }}>• Core Shadows: {lightingResult.recommendedGraphiteGrades.shadows}</Text>
                <Text style={{ fontSize: 11, color: colors.charcoal }}>• Occlusion Darks: {lightingResult.recommendedGraphiteGrades.deepDark}</Text>
              </View>
            </>
          )}

          <Button
            title="Send Lighting Ray to Canvas Layer"
            icon="☀"
            tone="soft"
            onPress={() => void sendLightingToCanvas()}
            style={styles.fullButton}
          />
        </InfoCard>
      )}

      {/* =========================================================================
          MODULE 13: AI COMPOSITION COACH
          ========================================================================= */}
      {tool === "composition" && (
        <InfoCard style={styles.studioCard}>
          <View style={styles.studioCardHeader}>
            <Eyebrow>GOLDEN SPIRAL, THIRDS & VISUAL WEIGHT</Eyebrow>
            <Text style={styles.studioTitle}>AI Composition Coach</Text>
            <Text style={styles.studioSubtitle}>Focal intersection points, negative space ratio & dynamic framing</Text>
          </View>

          {/* Grid Mode Selector */}
          <View style={styles.toggleRow}>
            {(["thirds", "golden_spiral", "diagonal"] as const).map((m) => {
              const active = compositionGridMode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setCompositionGridMode(m)}
                  style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>{m.replace("_", " ").toUpperCase()}</Text>
                </Pressable>
              );
            })}
          </View>

          {compositionResult && (
            <View style={{ backgroundColor: "#F7F3E9", padding: 12, borderRadius: 8, marginVertical: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.forest, marginBottom: 4 }}>Composition Metrics:</Text>
              <Text style={{ fontSize: 11, color: colors.charcoal }}>Rule of Thirds Alignment: {compositionResult.ruleOfThirdsAlignment}% · Negative Space Ratio: {Math.round(compositionResult.negativeSpaceRatio * 100)}%</Text>
              {compositionResult.critique.map((c, i) => (
                <Text key={i} style={{ fontSize: 11, color: colors.inkMuted, marginTop: 4 }}>• {c}</Text>
              ))}
            </View>
          )}

          <Button
            title={`Send ${compositionGridMode.replace("_", " ")} Grid to Canvas Layer`}
            icon="▦"
            tone="soft"
            onPress={() => void sendCompositionToCanvas()}
            style={styles.fullButton}
          />
        </InfoCard>
      )}

      {/* --- ANALYSIS NOTES & PALETTES FOR ALL TOOLS --- */}
      <InfoCard style={styles.analysisCard}>
        <Text style={styles.analysisLabel}>
          {tool === "analyzer"
            ? "VALUE NOTES"
            : tool === "steps"
            ? "A GENTLE PLAN"
            : tool === "loomis"
            ? "LOOMIS STAGE SUMMARY"
            : "STUDIO COMPANION NOTES"}
        </Text>
        <Text style={styles.analysisText}>
          {tool === "loomis"
            ? `${currentLoomisInfo.title}: ${currentLoomisInfo.description}`
            : analysis?.note ??
              (loading
                ? "Calculating preview from local copy…"
                : processRequested
                ? "The local preview is being prepared."
                : "Review the selected image above, then activate the tool to begin.")}
        </Text>
        {analysis?.palette.length ? (
          <View style={styles.paletteRow}>
            {analysis.palette.map((swatch) => (
              <Pressable
                key={swatch}
                onPress={() => setColor(swatch)}
                accessibilityLabel={`Use ${swatch} as brush color`}
                style={[styles.swatch, { backgroundColor: swatch }]}
              />
            ))}
          </View>
        ) : null}
      </InfoCard>

      {/* --- EXPORT & GENERAL ACTIONS --- */}
      <View style={styles.actions}>
        <Button
          title="Save preview PNG"
          icon="↓"
          onPress={() => void savePreview()}
          disabled={!hasPreview || loading}
          style={styles.action}
        />
        {reference ? (
          <Button
            title="Draw from this image"
            icon="✎"
            tone="soft"
            onPress={async () => {
              const projectId = await createProject(reference.uri);
              router.push(`/studio/${projectId}`);
            }}
            style={styles.action}
          />
        ) : (
          <Button
            title="Open Studio Canvas"
            icon="✎"
            tone="soft"
            onPress={async () => {
              const projectId = await createProject(null);
              router.push(`/studio/${projectId}`);
            }}
            style={styles.action}
          />
        )}
      </View>

      {/* --- CONNECTED AI ASSISTANT / PRIVACY SECTION --- */}
      <InfoCard style={styles.privacyCard}>
        <Text style={styles.privacyTitle}>Private until you choose</Text>
        <Text style={styles.privacyText}>
          Local previews never leave this device.{" "}
          {AI_ENDPOINT
            ? "The connected AI button sends only the selected working copy after your tap."
            : "No AI service is connected; local tools keep working offline."}
        </Text>
        <Button
          title={aiBusy ? "Sending selected image…" : "Analyze with connected AI"}
          icon="✦"
          tone="line"
          onPress={() => void runAiAnalysis()}
          disabled={!AI_ENDPOINT || aiBusy}
          style={styles.aiButton}
        />
        {aiResponse?.message ? <Text style={styles.aiText}>{aiResponse.message}</Text> : null}
        {aiResponse?.tips?.map((tip, index) => (
          <Text key={index} style={styles.aiText}>
            • {tip}
          </Text>
        ))}
        {aiResponse?.resultUrl ? (
          <Image source={{ uri: aiResponse.resultUrl }} resizeMode="contain" style={styles.aiResultImage} />
        ) : null}
      </InfoCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerLink: { color: colors.moss, fontSize: 12, fontWeight: "700", paddingVertical: 8, paddingHorizontal: 9 },
  title: { color: colors.ink, fontFamily: "Georgia", fontSize: 32, lineHeight: 39, marginBottom: 7 },
  titleDot: { color: colors.clay },
  note: { color: colors.muted, lineHeight: 20, fontSize: 13, marginBottom: 15 },
  previewOuter: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
    borderRadius: 21,
    overflow: "hidden",
    backgroundColor: "#EEECE4",
    borderWidth: 1,
    borderColor: colors.line,
  },
  previewPlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: "#EEECE4", maxHeight: 520 },
  previewPlaceholderText: { color: colors.muted, fontSize: 12 },
  analysisCard: { marginTop: 13 },
  analysisLabel: { color: colors.moss, fontWeight: "800", fontSize: 9, letterSpacing: 1.6, marginBottom: 8 },
  analysisText: { color: colors.ink, fontSize: 13, lineHeight: 20 },
  paletteRow: { flexDirection: "row", gap: 11, marginTop: 14, flexWrap: "wrap" },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: "rgba(23,32,28,.15)" },
  actions: { flexDirection: "row", gap: 9, marginTop: 12 },
  action: { flex: 1, paddingHorizontal: 10 },
  privacyCard: { marginTop: 13, marginBottom: 10 },
  privacyTitle: { color: colors.ink, fontWeight: "700", fontSize: 13 },
  privacyText: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  aiButton: { marginTop: 12 },
  aiText: { color: colors.ink, fontSize: 12, lineHeight: 18, marginTop: 8 },
  aiResultImage: { width: "100%", height: 220, marginTop: 12, borderRadius: 14, backgroundColor: colors.paper },
  emptyCard: { marginTop: 28 },
  fullButton: { width: "100%", marginTop: 10 },

  // --- STUDIO ENHANCEMENT STYLES ---
  studioCard: { marginTop: 14, padding: 16 },
  studioCardHeader: { marginBottom: 10 },
  studioTitle: { color: colors.ink, fontSize: 20, fontWeight: "800", marginTop: 3 },
  studioSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  stageStepper: { flexDirection: "row", gap: 8, paddingVertical: 8 },
  stageStepButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#E4E8DE",
    alignItems: "center",
    minWidth: 80,
  },
  stageStepActive: { backgroundColor: colors.moss },
  stageStepNumber: { fontSize: 16, fontWeight: "800", color: colors.ink },
  stageStepLabel: { fontSize: 9, fontWeight: "700", color: colors.muted, marginTop: 2 },
  stageStepTextActive: { color: colors.white },
  stageInfoBox: {
    backgroundColor: "#F4F6F0",
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginVertical: 10,
  },
  stageDescription: { fontSize: 13, color: colors.ink, lineHeight: 18, fontWeight: "500" },
  stageInstruction: { fontSize: 12, color: colors.moss, lineHeight: 17, marginTop: 6, fontWeight: "700" },
  controlSection: { marginTop: 6, marginBottom: 10 },
  controlHeading: { fontSize: 10, fontWeight: "800", color: colors.muted, letterSpacing: 1.2, marginTop: 8, marginBottom: 6 },
  sliderRow: { marginVertical: 6 },
  sliderLabel: { fontSize: 12, fontWeight: "700", color: colors.ink, marginBottom: 5 },
  sliderButtons: { flexDirection: "row", gap: 6 },
  stepBtn: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#E4E8DE",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnCenter: { flex: 0.8, backgroundColor: "#D4DBCB" },
  stepBtnText: { fontSize: 11, fontWeight: "700", color: colors.ink },
  toggleRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginVertical: 6 },
  toggleBtn: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#E4E8DE",
  },
  toggleBtnActive: { backgroundColor: colors.moss },
  toggleBtnText: { fontSize: 11, fontWeight: "700", color: colors.ink },
  toggleBtnTextActive: { color: colors.white },
  densityPillRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 },
  densityPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 14, backgroundColor: "#E4E8DE" },
  densityPillActive: { backgroundColor: colors.moss },
  densityText: { fontSize: 10, fontWeight: "800", color: colors.ink },
  densityTextActive: { color: colors.white },

  // --- TOUCH DRAG HINT BOX ---
  hintBox: { backgroundColor: "#F7F5EC", padding: 10, borderRadius: 8, marginVertical: 6, borderLeftWidth: 3, borderLeftColor: colors.clay },
  hintText: { fontSize: 11, color: colors.ink, lineHeight: 16, fontWeight: "600" },

  // --- MATCH SCORE BADGE & DIFFERENCE ---
  matchScoreBadge: {
    backgroundColor: "#E9F5ED",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4CAF50",
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  matchScoreText: { fontSize: 13, fontWeight: "800", color: "#1B5E20" },
  matchScorePercent: { fontSize: 20, fontWeight: "900", color: "#1B5E20" },
  matchLegendText: { fontSize: 10, color: colors.muted, marginTop: 3 },
  projectScroll: { flexDirection: "row", gap: 8, paddingVertical: 6 },
  projectPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: "#E4E8DE", borderWidth: 1, borderColor: "transparent" },
  projectPillActive: { backgroundColor: colors.moss, borderColor: colors.moss },
  projectPillText: { fontSize: 11, fontWeight: "700", color: colors.ink },
  projectPillTextActive: { color: colors.white },

  // --- ANATOMY TUTORIALS ---
  tutorialContainer: { marginTop: 10, backgroundColor: "#F8F6F0", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.line },
  tutorialHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  tutorialCanon: { fontSize: 9, fontWeight: "800", color: colors.clay, letterSpacing: 1 },
  stepPickerRow: { flexDirection: "row", gap: 4 },
  miniStepPill: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#E4E8DE", alignItems: "center", justifyContent: "center" },
  miniStepPillActive: { backgroundColor: colors.moss },
  miniStepText: { fontSize: 10, fontWeight: "800", color: colors.ink },
  miniStepTextActive: { color: colors.white },
  tutorialTitle: { fontSize: 14, fontWeight: "800", color: colors.ink, marginBottom: 4 },
  tutorialInstruction: { fontSize: 12, color: colors.ink, lineHeight: 17, marginBottom: 6 },
  tutorialTip: { fontSize: 11, color: colors.moss, fontStyle: "italic", marginBottom: 8 },
  landmarkChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 8 },
  landmarkChip: { backgroundColor: "#E9EDE4", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  landmarkChipText: { fontSize: 9, fontWeight: "700", color: colors.moss },

  // --- SHADING 5-VALUES SCALE ---
  valuesScaleBox: { marginTop: 8 },
  fiveValuesRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  valueItem: { flex: 1, alignItems: "center" },
  valueChip: { width: "100%", height: 26, borderRadius: 6, borderWidth: 1, borderColor: colors.line },
  valueLevel: { fontSize: 9, fontWeight: "800", color: colors.ink, marginTop: 3 },
  valueName: { fontSize: 8, color: colors.muted },

  // --- REFERENCE LIBRARY STYLES ---
  categoryScroll: { flexDirection: "row", gap: 8, paddingVertical: 10 },
  catPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: "#E4E8DE" },
  catPillActive: { backgroundColor: colors.moss },
  catPillText: { fontSize: 11, fontWeight: "700", color: colors.ink },
  catPillTextActive: { color: colors.white },
  libraryGrid: { gap: 12, marginTop: 10 },
  libraryCard: { padding: 0, overflow: "hidden", borderRadius: 16 },
  libraryThumb: { width: "100%", height: 190, backgroundColor: "#E4E8DE" },
  libraryCardBody: { padding: 14 },
  libraryCardBadge: { alignSelf: "flex-start", backgroundColor: colors.mossLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
  libraryDifficulty: { fontSize: 9, fontWeight: "800", color: colors.moss },
  libraryTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
  libraryDesc: { fontSize: 12, color: colors.muted, lineHeight: 17, marginTop: 4 },
  suggestedToolsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  toolTag: { fontSize: 10, color: colors.clay, fontWeight: "700" },

  // --- LEARNING CENTER & CHALLENGES STYLES ---
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF8E7",
    borderWidth: 1,
    borderColor: "#E0B042",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  streakText: { fontSize: 14, fontWeight: "800", color: "#875A00" },
  streakSub: { fontSize: 10, fontWeight: "600", color: "#875A00", marginTop: 2 },
  streakBadgePill: { backgroundColor: "#E0B042", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  streakBadgePillText: { fontSize: 9, fontWeight: "800", color: colors.white },
  challengeCard: { borderWidth: 2, padding: 16, marginTop: 4, backgroundColor: "#FFFDF8" },
  challengeBadge: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  challengeBadgeText: { fontSize: 9, fontWeight: "800", color: colors.clay, letterSpacing: 1.2 },
  challengeTimer: { fontSize: 10, fontWeight: "800", color: colors.moss },
  challengeTitle: { fontSize: 18, fontWeight: "800", color: colors.ink },
  challengeTheme: { fontSize: 12, color: colors.muted, fontWeight: "700", marginTop: 2 },
  challengePrompt: { fontSize: 13, color: colors.ink, lineHeight: 19, marginTop: 8 },
  rubricBox: { backgroundColor: "#F7F5EB", padding: 10, borderRadius: 8, marginTop: 10 },
  rubricHeading: { fontSize: 10, fontWeight: "800", color: colors.muted, letterSpacing: 1 },
  rubricItem: { fontSize: 11, color: colors.ink, marginTop: 3, fontWeight: "600" },
  lessonProgressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 8 },
  lessonHeading: { fontSize: 11, fontWeight: "800", color: colors.muted, letterSpacing: 1.4 },
  lessonProgressCounter: { fontSize: 11, fontWeight: "800", color: colors.moss },
  lessonCard: { marginBottom: 10, padding: 14 },
  lessonHeaderRow: { flexDirection: "row", alignItems: "center" },
  lessonCheckBtn: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: colors.moss, alignItems: "center", justifyContent: "center", marginRight: 10 },
  lessonCheckActive: { backgroundColor: colors.moss },
  lessonCheckMark: { color: colors.white, fontSize: 13, fontWeight: "800" },
  lessonHeaderContent: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  lessonNumBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.mossLight, alignItems: "center", justifyContent: "center" },
  lessonNumText: { fontSize: 12, fontWeight: "800", color: colors.moss },
  lessonTitle: { fontSize: 14, fontWeight: "700", color: colors.ink },
  lessonTitleDone: { textDecorationLine: "line-through", color: colors.muted },
  lessonMeta: { fontSize: 9, fontWeight: "700", color: colors.muted, marginTop: 2 },
  lessonArrow: { fontSize: 14, color: colors.muted, fontWeight: "700" },
  lessonExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  lessonObjective: { fontSize: 12, fontWeight: "700", color: colors.ink, lineHeight: 18 },
  lessonSubHeading: { fontSize: 10, fontWeight: "800", color: colors.moss, letterSpacing: 1, marginTop: 8, marginBottom: 4 },
  lessonBullet: { fontSize: 11, color: colors.ink, lineHeight: 17, marginBottom: 2 },

  // --- EXPERIENCE TIER TOGGLE STYLES ---
  tierToggleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 10 },
  tierLabel: { fontSize: 12, fontWeight: "700", color: colors.ink },
  tierPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: "#EBE5D8" },
  tierPillActive: { backgroundColor: colors.forest },
  tierPillText: { fontSize: 11, fontWeight: "600", color: colors.charcoal },
  tierPillTextActive: { color: "#FFFFFF" },
});
