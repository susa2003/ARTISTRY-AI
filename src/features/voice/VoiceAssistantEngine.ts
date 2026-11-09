import { useAppStore } from "../../state/appStore";

export type VoiceActionType =
  | "SELECT_PENCIL"
  | "SELECT_ERASER"
  | "SELECT_INK_PEN"
  | "SELECT_BRUSH"
  | "INCREASE_BRUSH"
  | "DECREASE_BRUSH"
  | "UNDO"
  | "REDO"
  | "CLEAR_CANVAS"
  | "ZOOM_IN"
  | "ZOOM_OUT"
  | "OPEN_CANVAS"
  | "OPEN_STUDIO"
  | "EXPLAIN_CONCEPT"
  | "SUGGEST_PRACTICE"
  | "UNKNOWN_COMMAND";

export interface VoiceActionResult {
  action: VoiceActionType;
  target?: string;
  parameters?: Record<string, any>;
  requiresConfirmation: boolean;
  spokenResponseEn: string;
  spokenResponseTa: string;
  confidence: number;
}

export class VoiceAssistantEngine {
  private apiUrl?: string;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || process.env.EXPO_PUBLIC_AI_API_URL;
  }

  async processVoiceCommand(
    transcript: string,
    language: "en" | "ta" = "en",
    currentScreen = "home"
  ): Promise<VoiceActionResult> {
    // 1. Try remote backend if configured
    if (this.apiUrl) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${this.apiUrl}/api/v1/voice/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, language, currentScreen }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.intent) {
            return json.data.intent;
          }
        }
      } catch {
        // Fall back to local processing
      }
    }

    // 2. 100% Offline Local Intent Parser (Bilingual)
    return this.parseLocalIntent(transcript, language);
  }

  parseLocalIntent(transcript: string, language: "en" | "ta"): VoiceActionResult {
    const raw = transcript.trim().toLowerCase();

    // Pencil
    if (raw.includes("pencil") || raw.includes("பென்சில்") || raw.includes("lead")) {
      return {
        action: "SELECT_PENCIL",
        requiresConfirmation: false,
        spokenResponseEn: "Pencil selected.",
        spokenResponseTa: "பென்சில் தேர்ந்தெடுக்கப்பட்டது.",
        confidence: 0.95,
      };
    }

    // Eraser
    if (raw.includes("eraser") || raw.includes("அழிப்பான்") || raw.includes("அழி") || raw.includes("erase")) {
      return {
        action: "SELECT_ERASER",
        requiresConfirmation: false,
        spokenResponseEn: "Eraser selected.",
        spokenResponseTa: "அழிப்பான் தேர்ந்தெடுக்கப்பட்டது.",
        confidence: 0.95,
      };
    }

    // Ink Pen
    if (raw.includes("ink") || raw.includes("மை பேனா") || /\bpen\b/.test(raw)) {
      return {
        action: "SELECT_INK_PEN",
        requiresConfirmation: false,
        spokenResponseEn: "Ink pen selected.",
        spokenResponseTa: "மை பேனா தேர்ந்தெடுக்கப்பட்டது.",
        confidence: 0.95,
      };
    }

    // Brush
    if (raw.includes("brush") || raw.includes("தூரிகை") || raw.includes("paint")) {
      return {
        action: "SELECT_BRUSH",
        requiresConfirmation: false,
        spokenResponseEn: "Soft brush selected.",
        spokenResponseTa: "வண்ணத் தூரிகை தேர்ந்தெடுக்கப்பட்டது.",
        confidence: 0.92,
      };
    }

    // Brush Size
    if (raw.includes("increase brush") || raw.includes("bigger brush") || raw.includes("பெரிதாக்கு")) {
      return {
        action: "INCREASE_BRUSH",
        parameters: { step: 5 },
        requiresConfirmation: false,
        spokenResponseEn: "Increasing brush size.",
        spokenResponseTa: "தூரிகையின் அளவு கூட்டப்பட்டது.",
        confidence: 0.9,
      };
    }

    if (raw.includes("decrease brush") || raw.includes("smaller brush") || raw.includes("சிறிதாக்கு")) {
      return {
        action: "DECREASE_BRUSH",
        parameters: { step: 5 },
        requiresConfirmation: false,
        spokenResponseEn: "Decreasing brush size.",
        spokenResponseTa: "தூரிகையின் அளவு குறைக்கப்பட்டது.",
        confidence: 0.9,
      };
    }

    // Undo / Redo
    if (raw.includes("undo") || raw.includes("முந்தைய நிலை") || raw.includes("மீட்டமை") || raw.includes("பின் செல்")) {
      return {
        action: "UNDO",
        requiresConfirmation: false,
        spokenResponseEn: "Undoing last action.",
        spokenResponseTa: "முந்தைய நிலை மீட்டமைக்கப்பட்டது.",
        confidence: 0.98,
      };
    }

    if (raw.includes("redo") || raw.includes("அடுத்த நிலை") || raw.includes("முன் செல்")) {
      return {
        action: "REDO",
        requiresConfirmation: false,
        spokenResponseEn: "Redoing stroke.",
        spokenResponseTa: "அடுத்த வரைதல் நிலை செயல்படுத்தப்பட்டது.",
        confidence: 0.98,
      };
    }

    // Clear Canvas (Guarded with Confirmation)
    if (raw.includes("clear canvas") || raw.includes("delete all") || raw.includes("அனைத்தையும் அழி")) {
      return {
        action: "CLEAR_CANVAS",
        requiresConfirmation: true,
        spokenResponseEn: "Are you sure you want to clear the entire canvas?",
        spokenResponseTa: "வரைபடப் பலகையை முழுமையாக அழிக்க உறுதி செய்கிறீர்களா?",
        confidence: 0.95,
      };
    }

    // Studio Navigation
    const studios: Record<string, string[]> = {
      anatomy: ["anatomy", "அனாடமி", "உடற்கூறு", "bones"],
      perspective: ["perspective", "தொலைநோக்கு", "கோண பார்வை"],
      shading: ["shading", "நிழல்", "shadow", "values"],
      loomis: ["loomis", "லூமிஸ்", "head construction"],
      grid: ["grid", "கட்டம்", "வலைப்பின்னல்"],
      compare: ["compare", "ஒப்பீடு", "onion skin"],
      library: ["library", "நூலகம்", "reference library"],
      learning: ["learning", "பாடம்", "challenges", "பயிற்சி"],
      sketch: ["sketch converter", "ஸ்கெட்ச்"],
      analyzer: ["analyzer", "ஆய்வு"],
      generator: ["generator", "உருவாக்கு"],
      pose: ["pose coach", "தோரணை"],
      handfoot: ["hand and foot", "கை", "கால்"],
      lighting: ["lighting predictor", "ஒளி"],
      composition: ["composition", "கலவை"],
      linecleaner: ["line cleaner", "வரி சுத்தம்"],
      segmentation: ["segmentation", "பிரிப்பு"],
      colorrec: ["color recommender", "வண்ணங்கள்"],
      turnaround: ["multi angle", "பல கோணம்"],
      replay: ["stroke replay", "மறுபதிவு"],
      mistakes: ["mistake detector", "பிழைகள்"],
      mentor: ["art mentor", "வழிகாட்டி"],
      vectorizer: ["vector converter", "வெக்டார்"],
    };

    for (const [studioId, keywords] of Object.entries(studios)) {
      if (keywords.some((kw) => raw.includes(kw))) {
        return {
          action: "OPEN_STUDIO",
          target: studioId,
          requiresConfirmation: false,
          spokenResponseEn: `Opening ${studioId} studio.`,
          spokenResponseTa: `${studioId} பகுதி திறக்கப்படுகிறது.`,
          confidence: 0.92,
        };
      }
    }

    // Default Fallback
    return {
      action: "UNKNOWN_COMMAND",
      requiresConfirmation: false,
      spokenResponseEn: `Command received: "${transcript}". Ask to select tools, undo, or open a studio.`,
      spokenResponseTa: `கட்டளை பெறப்பட்டது: "${transcript}". கருவிகளைத் தேர்ந்தெடுக்க அல்லது பாடங்களைத் திறக்க கேட்கலாம்.`,
      confidence: 0.5,
    };
  }

  executeAction(
    result: VoiceActionResult,
    onNavigate?: (route: string) => void
  ): boolean {
    const store = useAppStore.getState();

    switch (result.action) {
      case "SELECT_PENCIL":
        store.setActiveBrush("pencil");
        return true;
      case "SELECT_ERASER":
        store.setActiveBrush("eraser");
        return true;
      case "SELECT_INK_PEN":
        store.setActiveBrush("pen");
        return true;
      case "SELECT_BRUSH":
        store.setActiveBrush("brush");
        return true;
      case "INCREASE_BRUSH":
        store.setBrushSize(Math.min(60, store.brushSize + 5));
        return true;
      case "DECREASE_BRUSH":
        store.setBrushSize(Math.max(2, store.brushSize - 5));
        return true;
      case "UNDO":
        store.undo();
        return true;
      case "REDO":
        store.redo();
        return true;
      case "CLEAR_CANVAS":
        store.clearActiveLayer();
        return true;
      case "OPEN_STUDIO":
        if (result.target && onNavigate) {
          onNavigate(`/tools/${result.target}`);
          return true;
        }
        return false;
      default:
        return false;
    }
  }
}

export const voiceAssistantEngine = new VoiceAssistantEngine();
