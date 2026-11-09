import request from "supertest";
import { app } from "../src/app";

describe("Async AI Job Lifecycle API", () => {
  it("should create async job when prefer-async header is set", async () => {
    const res = await request(app)
      .post("/api/v1/drawing/analyze")
      .set("prefer-async", "true")
      .send({ width: 800, height: 800 });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobId).toBeDefined();

    const jobId = res.body.data.jobId;

    // Check job status
    const statusRes = await request(app).get(`/api/v1/jobs/${jobId}`);
    expect(statusRes.status).toBe(200);
    expect(["pending", "processing", "completed"]).toContain(statusRes.body.data.status);
  });

  it("should handle job cancellation", async () => {
    // Create an uncompleted job
    const createRes = await request(app)
      .post("/api/v1/drawing/analyze")
      .set("prefer-async", "true")
      .send({ width: 800, height: 800 });

    const jobId = createRes.body.data.jobId;

    // Cancel job
    const cancelRes = await request(app).post(`/api/v1/jobs/${jobId}/cancel`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe("cancelled");
  });
});
