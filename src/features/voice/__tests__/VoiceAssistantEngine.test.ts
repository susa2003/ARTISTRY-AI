import { VoiceAssistantEngine } from "../VoiceAssistantEngine";

describe("VoiceAssistantEngine (Bilingual Tamil & English)", () => {
  const engine = new VoiceAssistantEngine();

  it("should parse English tool selection correctly", () => {
    const res = engine.parseLocalIntent("select pencil tool", "en");
    expect(res.action).toBe("SELECT_PENCIL");
    expect(res.requiresConfirmation).toBe(false);
    expect(res.spokenResponseEn).toContain("Pencil selected");
  });

  it("should parse Tamil tool selection correctly", () => {
    const res = engine.parseLocalIntent("பென்சில் தேர்ந்தெடு", "ta");
    expect(res.action).toBe("SELECT_PENCIL");
    expect(res.requiresConfirmation).toBe(false);
    expect(res.spokenResponseTa).toContain("பென்சில் தேர்ந்தெடுக்கப்பட்டது");
  });

  it("should parse Undo command in both English and Tamil", () => {
    const resEn = engine.parseLocalIntent("undo last stroke", "en");
    expect(resEn.action).toBe("UNDO");

    const resTa = engine.parseLocalIntent("முந்தைய நிலை", "ta");
    expect(resTa.action).toBe("UNDO");
  });

  it("should require confirmation for Clear Canvas", () => {
    const res = engine.parseLocalIntent("clear canvas", "en");
    expect(res.action).toBe("CLEAR_CANVAS");
    expect(res.requiresConfirmation).toBe(true);
  });

  it("should identify studio navigation targets", () => {
    const resAnatomy = engine.parseLocalIntent("open anatomy academy", "en");
    expect(resAnatomy.action).toBe("OPEN_STUDIO");
    expect(resAnatomy.target).toBe("anatomy");

    const resShading = engine.parseLocalIntent("நிழல் பகுதி திற", "ta");
    expect(resShading.action).toBe("OPEN_STUDIO");
    expect(resShading.target).toBe("shading");
  });
});
