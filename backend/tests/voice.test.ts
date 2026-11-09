import request from "supertest";
import { app } from "../src/app";

describe("Bilingual Voice Assistant API", () => {
  it("should parse English tool selection intent", async () => {
    const res = await request(app)
      .post("/api/v1/voice/process")
      .send({ transcript: "Please select pencil", language: "en" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.intent.action).toBe("SELECT_PENCIL");
    expect(res.body.data.intent.spokenResponseEn).toContain("Pencil selected");
  });

  it("should parse Tamil tool selection intent", async () => {
    const res = await request(app)
      .post("/api/v1/voice/process")
      .send({ transcript: "பென்சில் தேர்ந்தெடு", language: "ta" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.intent.action).toBe("SELECT_PENCIL");
    expect(res.body.data.intent.spokenResponseTa).toContain("பென்சில் தேர்ந்தெடுக்கப்பட்டது");
  });

  it("should recognize Undo action in both English and Tamil", async () => {
    const resEn = await request(app)
      .post("/api/v1/voice/process")
      .send({ transcript: "undo last action", language: "en" });
    expect(resEn.body.data.intent.action).toBe("UNDO");

    const resTa = await request(app)
      .post("/api/v1/voice/process")
      .send({ transcript: "முந்தைய நிலை", language: "ta" });
    expect(resTa.body.data.intent.action).toBe("UNDO");
  });

  it("should guard clear canvas with requiresConfirmation=true", async () => {
    const res = await request(app)
      .post("/api/v1/voice/process")
      .send({ transcript: "clear canvas", language: "en" });

    expect(res.body.data.intent.action).toBe("CLEAR_CANVAS");
    expect(res.body.data.intent.requiresConfirmation).toBe(true);
  });
});
