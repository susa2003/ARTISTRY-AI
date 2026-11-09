import request from "supertest";
import { app } from "../src/app";

describe("System & Diagnostics Endpoints", () => {
  it("GET /api/v1/health should return system status 200", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("healthy");
    expect(res.body.data.service).toBe("artistry-ai-backend");
    expect(res.body.data.system).toBeDefined();
  });

  it("GET /api/v1/providers/status should return configured providers", async () => {
    const res = await request(app).get("/api/v1/providers/status");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.preferredMode).toBeDefined();
    expect(res.body.data.gemini).toBeDefined();
  });

  it("GET /health (flat alias) should return 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
