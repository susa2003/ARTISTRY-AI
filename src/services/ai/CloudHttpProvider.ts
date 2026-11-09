import type { IAIProvider } from "./AIProvider";
import { LocalFallbackProvider } from "./LocalFallbackProvider";
import type {
  AIProviderStatus,
  ArtMentorMessage,
  ColorPaletteRecommendation,
  CompositionResult,
  DrawingAnalysisRequest,
  DrawingAnalysisResult,
  HandFootResult,
  HandFootType,
  LightingResult,
  LineArtCleanOptions,
  MistakeDetectionResult,
  MultiAngleResult,
  PoseResult,
  ReferenceGenerateOptions,
  ReferenceGenerateResult,
  SegmentationResult,
  SketchConvertOptions,
  VectorizeOptions,
  VectorizeResult,
} from "./types";

export class CloudHttpProvider implements IAIProvider {
  private endpoint?: string;
  private fallback: LocalFallbackProvider;

  constructor(endpoint?: string) {
    this.endpoint = endpoint?.trim() || process.env.EXPO_PUBLIC_AI_API_URL?.trim();
    this.fallback = new LocalFallbackProvider();
  }

  async getStatus(): Promise<AIProviderStatus> {
    if (!this.endpoint) {
      return { mode: "local", isCloudAvailable: false };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const start = Date.now();
      const res = await fetch(`${this.endpoint}/health`, { signal: controller.signal });
      clearTimeout(timer);
      const latencyMs = Date.now() - start;

      if (res.ok) {
        return {
          mode: "cloud",
          isCloudAvailable: true,
          endpoint: this.endpoint,
          lastPingMs: latencyMs,
        };
      }
    } catch {
      // Endpoint unreachable
    }

    return {
      mode: "local",
      isCloudAvailable: false,
      endpoint: this.endpoint,
    };
  }

  async convertSketch(imageUri: string, options: SketchConvertOptions): Promise<string> {
    if (!this.endpoint) return this.fallback.convertSketch(imageUri, options);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${this.endpoint}/sketch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUri, options }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.uri) return data.uri;
      }
    } catch {
      // Cloud failure fallback
    }
    return this.fallback.convertSketch(imageUri, options);
  }

  async analyzeDrawing(request: DrawingAnalysisRequest): Promise<DrawingAnalysisResult> {
    if (!this.endpoint) return this.fallback.analyzeDrawing(request);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${this.endpoint}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          width: request.width,
          height: request.height,
          drawingUri: request.drawingUri,
          referenceUri: request.referenceUri,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.overallScore !== undefined) return data;
      }
    } catch {
      // Cloud failure fallback
    }
    return this.fallback.analyzeDrawing(request);
  }

  async generateReference(options: ReferenceGenerateOptions): Promise<ReferenceGenerateResult> {
    if (!this.endpoint) return this.fallback.generateReference(options);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${this.endpoint}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.uri) return { ...data, isLocalFallback: false };
      }
    } catch {
      // Cloud failure fallback
    }
    return this.fallback.generateReference(options);
  }

  async detectPose(imageUri?: string, width?: number, height?: number): Promise<PoseResult> {
    if (!this.endpoint) return this.fallback.detectPose(imageUri, width, height);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.endpoint}/pose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUri, width, height }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.landmarks) return data;
      }
    } catch {
      // Cloud failure fallback
    }
    return this.fallback.detectPose(imageUri, width, height);
  }

  async analyzeHandFoot(type: HandFootType, imageUri?: string, width?: number, height?: number): Promise<HandFootResult> {
    if (!this.endpoint) return this.fallback.analyzeHandFoot(type, imageUri, width, height);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.endpoint}/handfoot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, imageUri, width, height }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.landmarks) return data;
      }
    } catch {
      // Cloud failure fallback
    }
    return this.fallback.analyzeHandFoot(type, imageUri, width, height);
  }

  async predictLighting(imageUri?: string, pixels?: Uint8Array | Float32Array | null, width?: number, height?: number): Promise<LightingResult> {
    if (!this.endpoint) return this.fallback.predictLighting(imageUri, pixels, width, height);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.endpoint}/lighting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUri, width, height }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.primaryLightAngle !== undefined) return data;
      }
    } catch {
      // Cloud failure fallback
    }
    return this.fallback.predictLighting(imageUri, pixels, width, height);
  }

  async analyzeComposition(imageUri?: string, pixels?: Uint8Array | Float32Array | null, width?: number, height?: number): Promise<CompositionResult> {
    if (!this.endpoint) return this.fallback.analyzeComposition(imageUri, pixels, width, height);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.endpoint}/composition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUri, width, height }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.ruleOfThirdsAlignment !== undefined) return data;
      }
    } catch {
      // Cloud failure fallback
    }
    return this.fallback.analyzeComposition(imageUri, pixels, width, height);
  }

  async cleanLineArt(imageUri: string, options: LineArtCleanOptions): Promise<string> {
    if (!this.endpoint) return this.fallback.cleanLineArt(imageUri, options);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${this.endpoint}/linecleaner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUri, options }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.uri) return data.uri;
      }
    } catch {
      // Cloud failure fallback
    }
    return this.fallback.cleanLineArt(imageUri, options);
  }

  async segmentSubject(imageUri: string, pixels?: Uint8Array | Float32Array | null, width?: number, height?: number): Promise<SegmentationResult> {
    if (!this.endpoint) return this.fallback.segmentSubject(imageUri, pixels, width, height);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${this.endpoint}/segment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUri, width, height }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.maskUri) return data;
      }
    } catch {
      // Cloud failure fallback
    }
    return this.fallback.segmentSubject(imageUri, pixels, width, height);
  }

  async recommendColors(dominantHexes: string[]): Promise<ColorPaletteRecommendation> {
    if (!this.endpoint) return this.fallback.recommendColors(dominantHexes);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${this.endpoint}/colors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dominantHexes }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.palettes) return data;
      }
    } catch {
      // Cloud failure fallback
    }
    return this.fallback.recommendColors(dominantHexes);
  }

  async generateTurnaround(category: string, subjectType: string): Promise<MultiAngleResult> {
    if (!this.endpoint) return this.fallback.generateTurnaround(category, subjectType);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${this.endpoint}/turnaround`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subjectType }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.angles) return data;
      }
    } catch {
      // Cloud failure fallback
    }
    return this.fallback.generateTurnaround(category, subjectType);
  }

  async detectMistakes(drawingUri?: string, referenceUri?: string, pixels?: Uint8Array | Float32Array | null, width?: number, height?: number): Promise<MistakeDetectionResult> {
    if (!this.endpoint) return this.fallback.detectMistakes(drawingUri, referenceUri, pixels, width, height);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${this.endpoint}/mistakes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawingUri, referenceUri, width, height }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.mistakes) return data;
      }
    } catch {
      // Cloud failure fallback
    }
    return this.fallback.detectMistakes(drawingUri, referenceUri, pixels, width, height);
  }

  async consultMentor(history: ArtMentorMessage[], query: string, context?: { skillLevel: string; currentTool?: string }): Promise<ArtMentorMessage> {
    if (!this.endpoint) return this.fallback.consultMentor(history, query, context);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${this.endpoint}/mentor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, query, context }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.text) return data;
      }
    } catch {
      // Cloud failure fallback
    }
    return this.fallback.consultMentor(history, query, context);
  }

  async vectorizeSketch(imageUri: string, options: VectorizeOptions): Promise<VectorizeResult> {
    if (!this.endpoint) return this.fallback.vectorizeSketch(imageUri, options);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${this.endpoint}/vectorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUri, options }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.svgContent) return data;
      }
    } catch {
      // Cloud failure fallback
    }
    return this.fallback.vectorizeSketch(imageUri, options);
  }
}
