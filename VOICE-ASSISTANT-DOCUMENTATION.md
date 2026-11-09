# ARTISTRY AI — Bilingual Voice Drawing Assistant (Tamil & English)

---

## 1. Overview
ARTISTRY AI includes a native, bilingual Voice Drawing Assistant capable of understanding and executing drawing commands in both **English** and **Tamil** (தமிழ்). It maps verbal or typed speech to a safe, predefined action registry.

---

## 2. Safe Predefined Action Registry

To safeguard the user's artwork and maintain process security, voice commands never execute arbitrary shell commands or unvetted scripts. Every command maps strictly to one of the following validated actions:

| Action | Example Utterance (English) | Example Utterance (Tamil) | Confirmation Guard |
| :--- | :--- | :--- | :---: |
| `SELECT_PENCIL` | "Select pencil", "Pencil tool" | "பென்சில் தேர்ந்தெடு" | No |
| `SELECT_ERASER` | "Select eraser", "Eraser" | "அழிப்பான் தேர்ந்தெடு", "அழி" | No |
| `SELECT_INK_PEN` | "Select ink pen", "Pen" | "மை பேனா தேர்ந்தெடு" | No |
| `SELECT_BRUSH` | "Soft brush", "Paint brush" | "வண்ணத் தூரிகை தேர்ந்தெடு" | No |
| `INCREASE_BRUSH` | "Increase brush size", "Bigger" | "தூரிகையை பெரிதாக்கு" | No |
| `DECREASE_BRUSH` | "Decrease brush size", "Smaller" | "தூரிகையை சிறிதாக்கு" | No |
| `UNDO` | "Undo last stroke", "Undo" | "முந்தைய நிலை", "மீட்டமை" | No |
| `REDO` | "Redo stroke", "Redo" | "அடுத்த நிலை", "முன் செல்" | No |
| `CLEAR_CANVAS` | "Clear entire canvas", "Delete all" | "அனைத்தையும் அழி", "முழுதும் நீக்கு" | **YES (Guarded)** |
| `OPEN_STUDIO` | "Open Anatomy Academy" | "அனாடமி பகுதி திற" | No |
| `EXPLAIN_CONCEPT` | "How do I shade a sphere?" | "நிழல் வரைவது எப்படி?" | No |
| `SUGGEST_PRACTICE` | "Suggest daily practice" | "பயிற்சி பரிந்துரை" | No |

---

## 3. Destructive Action Confirmation Guard
Commands categorized as destructive (such as `CLEAR_CANVAS`) trigger a high-visibility confirmation dialog in the assistant UI with spoken and written warnings:
- **English:** *"Are you sure you want to clear the entire canvas?"*
- **Tamil:** *"வரைபடப் பலகையை முழுமையாக அழிக்க உறுதி செய்கிறீர்களா?"*
The action is executed only if the user explicitly taps **"Yes, Clear" / "ஆம், அழி"**.

---

## 4. Architecture & Fallback
1. **Online Mode:** Client sends speech transcript or audio snippet to `POST /api/v1/voice/process`. The Node.js backend processes intents with language confidence scoring and returns localized spoken strings.
2. **Offline Fallback:** If the network or backend is unreachable, the client invokes `voiceAssistantEngine.parseLocalIntent()`, parsing Tamil and English grammar rules entirely on-device. Normal touch controls and canvas editing remain uninterrupted at all times.
