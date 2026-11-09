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

export class VoiceService {
  parseIntent(text: string, language: "en" | "ta" = "en"): VoiceActionResult {
    const raw = text.trim().toLowerCase();

    // 1. Tool Selection
    if (
      raw.includes("pencil") ||
      raw.includes("பென்சில்") ||
      raw.includes("lead")
    ) {
      return {
        action: "SELECT_PENCIL",
        requiresConfirmation: false,
        spokenResponseEn: "Pencil selected. Ready to sketch.",
        spokenResponseTa: "பென்சில் தேர்ந்தெடுக்கப்பட்டது. வரையத் தொடங்கலாம்.",
        confidence: 0.95,
      };
    }

    if (
      raw.includes("eraser") ||
      raw.includes("அழிப்பான்") ||
      raw.includes("அழி") ||
      raw.includes("erase")
    ) {
      return {
        action: "SELECT_ERASER",
        requiresConfirmation: false,
        spokenResponseEn: "Eraser selected.",
        spokenResponseTa: "அழிப்பான் தேர்ந்தெடுக்கப்பட்டது.",
        confidence: 0.95,
      };
    }

    if (
      raw.includes("ink") ||
      raw.includes("மை பேனா") ||
      /\bpen\b/.test(raw)
    ) {
      return {
        action: "SELECT_INK_PEN",
        requiresConfirmation: false,
        spokenResponseEn: "Ink pen selected for crisp linework.",
        spokenResponseTa: "மை பேனா தேர்ந்தெடுக்கப்பட்டது.",
        confidence: 0.95,
      };
    }

    if (
      raw.includes("brush") ||
      raw.includes("தூரிகை") ||
      raw.includes("paint")
    ) {
      return {
        action: "SELECT_BRUSH",
        requiresConfirmation: false,
        spokenResponseEn: "Soft brush selected.",
        spokenResponseTa: "வண்ணத் தூரிகை தேர்ந்தெடுக்கப்பட்டது.",
        confidence: 0.92,
      };
    }

    // 2. Brush Size Adjustments
    if (
      raw.includes("increase brush") ||
      raw.includes("bigger brush") ||
      raw.includes("பெரிதாக்கு") ||
      raw.includes("அளவு கூட்டு")
    ) {
      return {
        action: "INCREASE_BRUSH",
        parameters: { step: 5 },
        requiresConfirmation: false,
        spokenResponseEn: "Increasing brush size.",
        spokenResponseTa: "தூரிகையின் அளவு கூட்டப்பட்டது.",
        confidence: 0.9,
      };
    }

    if (
      raw.includes("decrease brush") ||
      raw.includes("smaller brush") ||
      raw.includes("சிறிதாக்கு") ||
      raw.includes("அளவு குறை")
    ) {
      return {
        action: "DECREASE_BRUSH",
        parameters: { step: 5 },
        requiresConfirmation: false,
        spokenResponseEn: "Decreasing brush size.",
        spokenResponseTa: "தூரிகையின் அளவு குறைக்கப்பட்டது.",
        confidence: 0.9,
      };
    }

    // 3. Undo / Redo
    if (
      raw.includes("undo") ||
      raw.includes("முந்தைய நிலை") ||
      raw.includes("மீட்டமை") ||
      raw.includes("பின் செல்")
    ) {
      return {
        action: "UNDO",
        requiresConfirmation: false,
        spokenResponseEn: "Undoing last action.",
        spokenResponseTa: "முந்தைய நிலை மீட்டமைக்கப்பட்டது.",
        confidence: 0.98,
      };
    }

    if (
      raw.includes("redo") ||
      raw.includes("அடுத்த நிலை") ||
      raw.includes("முன் செல்")
    ) {
      return {
        action: "REDO",
        requiresConfirmation: false,
        spokenResponseEn: "Redoing stroke.",
        spokenResponseTa: "அடுத்த வரைதல் நிலை செயல்படுத்தப்பட்டது.",
        confidence: 0.98,
      };
    }

    // 4. Destructive Action - Clear Canvas
    if (
      raw.includes("clear canvas") ||
      raw.includes("delete all") ||
      raw.includes("அனைத்தையும் அழி") ||
      raw.includes("முழுவதும் நீக்கு")
    ) {
      return {
        action: "CLEAR_CANVAS",
        requiresConfirmation: true,
        spokenResponseEn: "Are you sure you want to clear the entire canvas?",
        spokenResponseTa: "வரைபடப் பலகையை முழுமையாக அழிக்க உறுதி செய்கிறீர்களா?",
        confidence: 0.95,
      };
    }

    // 5. Studio Navigation
    const studios: Record<string, string[]> = {
      anatomy: ["anatomy", "அனாடமி", "உடற்கூறு", "bones", "muscles"],
      perspective: ["perspective", "தொலைநோக்கு", "கோண பார்வை", "vanishing point"],
      shading: ["shading", "நிழல்", "shadow", "values", "ஒளி நிழல்"],
      loomis: ["loomis", "லூமிஸ்", "head construction", "முகம்"],
      grid: ["grid", "கட்டம்", "வலைப்பின்னல்", "thirds"],
      compare: ["compare", "ஒப்பீடு", "reference vs", "onion skin"],
      library: ["library", "நூலகம்", "reference library", "மாதிரி படங்கள்"],
      learning: ["learning", "பாடம்", "challenges", "பாடங்கள்", "பயிற்சி"],
      sketch: ["sketch converter", "ஸ்கெட்ச்"],
      analyzer: ["analyzer", "ஆய்வு", "analyze drawing"],
      generator: ["reference generator", "உருவாக்கு"],
      pose: ["pose coach", "gesture", "தோரணை"],
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

    // 6. Educational Explanations
    if (raw.includes("how to shade") || raw.includes("shading tip") || raw.includes("நிழல் எப்படி")) {
      return {
        action: "EXPLAIN_CONCEPT",
        target: "shading",
        requiresConfirmation: false,
        spokenResponseEn:
          "For realistic shading, establish a 5-value tonal scale: highlight, halftone, core shadow, reflected light, and cast shadow.",
        spokenResponseTa:
          "இயற்கையான நிழலுக்கு ஐந்து மதிப்புகளைப் பயன்படுத்துங்கள்: ஒளி புள்ளி, இடைநிலை ஒளி, முக்கிய நிழல், எதிரொளித்த ஒளி மற்றும் விழும் நிழல்.",
        confidence: 0.9,
      };
    }

    if (raw.includes("perspective tip") || raw.includes("how perspective works") || raw.includes("தொலைநோக்கு")) {
      return {
        action: "EXPLAIN_CONCEPT",
        target: "perspective",
        requiresConfirmation: false,
        spokenResponseEn:
          "All parallel lines converge toward vanishing points on the horizon line at eye level.",
        spokenResponseTa:
          "அனைத்து இணையான கோடுகளும் கண் மட்டத்திலுள்ள அடிவான புள்ளிகளில் ஒன்றிணைகின்றன.",
        confidence: 0.9,
      };
    }

    // Default Fallback
    return {
      action: "UNKNOWN_COMMAND",
      requiresConfirmation: false,
      spokenResponseEn: `I heard: "${text}". You can ask to select tools, undo, open studios, or ask for drawing tips.`,
      spokenResponseTa: `நான் கேட்டது: "${text}". பென்சில் தேர்ந்தெடுக்க, முந்தைய நிலைக்கு செல்ல, அல்லது வரைதல் குறிப்புகள் கேட்கலாம்.`,
      confidence: 0.5,
    };
  }
}

export const voiceService = new VoiceService();
