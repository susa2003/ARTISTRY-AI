import request from "supertest";
import { app } from "../src/app";

describe("AI Features API Endpoints", () => {
  it("POST /api/v1/sketch/convert should process sketch conversion", async () => {
    const res = await request(app)
      .post("/api/v1/sketch/convert")
      .send({
        imageUri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        options: {
          style: "graphite",
          intensity: 60,
          contrast: 50,
          brightness: 50,
          detailLevel: 50,
          edgeStrength: 50,
          grayscale: true,
          paperTexture: false,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.uri).toBeDefined();
  });

  it("POST /api/v1/drawing/analyze should return assessment scores", async () => {
    const res = await request(app)
      .post("/api/v1/drawing/analyze")
      .send({
        width: 800,
        height: 800,
        drawingUri: "test_drawing.png",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overallScore).toBeGreaterThanOrEqual(0);
    expect(res.body.data.feedback.length).toBeGreaterThan(0);
    expect(res.body.data.annotations).toBeDefined();
  });

  it("POST /api/v1/reference/generate should return reference image", async () => {
    const res = await request(app)
      .post("/api/v1/reference/generate")
      .send({
        category: "portraits",
        complexity: "intermediate",
        style: "realistic",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.uri).toBeDefined();
    expect(res.body.data.category).toBe("portraits");
  });

  it("POST /api/v1/pose/detect should return pose landmarks", async () => {
    const res = await request(app)
      .post("/api/v1/pose/detect")
      .send({ width: 800, height: 800 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.landmarks.length).toBeGreaterThan(0);
    expect(res.body.data.lineOfAction).toBeDefined();
  });

  it("POST /api/v1/lighting/analyze should calculate shadow zones", async () => {
    const res = await request(app)
      .post("/api/v1/lighting/analyze")
      .send({ lightAngleDeg: 45, width: 800, height: 800 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lightVector).toBeDefined();
    expect(res.body.data.recommendedGrades.length).toBe(4);
  });

  it("POST /api/v1/mentor/chat should provide artistic feedback", async () => {
    const res = await request(app)
      .post("/api/v1/mentor/chat")
      .send({
        messages: [{ role: "user", content: "How do I shade a sphere?" }],
        experienceMode: "beginner",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toContain("shading");
    expect(res.body.data.role).toBe("assistant");
  });
});
