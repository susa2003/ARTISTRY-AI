import request from "supertest";
import { app } from "../src/app";
import { creditService } from "../src/services/CreditService";

describe("AI Credit & Usage Management System", () => {
  let userToken: string;
  let testUserId: string;

  beforeAll(async () => {
    creditService.clearInMemoryCredits();

    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: "credit_test@artistry.ai",
      password: "MasterSecurePassword2026!",
      confirmPassword: "MasterSecurePassword2026!",
      displayName: "Credit Tester",
      consentTerms: true,
    });
    userToken = regRes.body.data.tokens.accessToken;
    testUserId = regRes.body.data.user.userId;
  });

  it("GET /api/v1/credits/balance should return current balance and costs", async () => {
    const res = await request(app)
      .get("/api/v1/credits/balance")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.creditBalance).toBe(50);
    expect(res.body.data.costs.drawing_analysis).toBe(5);
    expect(res.body.data.costs.canvas).toBe(0);
  });

  it("should never deduct credits for 0-cost classical tools", async () => {
    const deduction = await creditService.deductCredits(testUserId, "canvas");
    expect(deduction.deducted).toBe(0);
    expect(deduction.newBalance).toBe(50);
  });

  it("should atomically deduct credits and respect idempotency", async () => {
    const idempotencyKey = "idemp_test_req_001";
    const deduction1 = await creditService.deductCredits(testUserId, "drawing_analysis", {
      idempotencyKey,
      description: "Analyze drawing #1",
    });

    expect(deduction1.success).toBe(true);
    expect(deduction1.deducted).toBe(5);
    expect(deduction1.newBalance).toBe(45);

    // Duplicate call with same idempotency key must not double-charge
    const deduction2 = await creditService.deductCredits(testUserId, "drawing_analysis", {
      idempotencyKey,
    });

    expect(deduction2.deducted).toBe(5);
    expect(deduction2.newBalance).toBe(45); // Balance unchanged!
  });

  it("should reject operations when balance is insufficient", async () => {
    creditService.setInMemoryBalance(testUserId, 2);

    await expect(
      creditService.deductCredits(testUserId, "drawing_analysis")
    ).rejects.toThrow("INSUFFICIENT_CREDITS");
  });

  it("should safely refund credits for failed eligible jobs without double-refunding", async () => {
    creditService.setInMemoryBalance(testUserId, 50);
    const jobId = "failed_ai_job_777";

    const deduction = await creditService.deductCredits(testUserId, "sketch_conversion", {
      jobId,
      description: "Sketch conversion job",
    });
    expect(deduction.newBalance).toBe(47);

    // Refund
    const refund1 = await creditService.refundCredits(testUserId, jobId, "Service worker timeout");
    expect(refund1.refunded).toBe(3);
    expect(refund1.newBalance).toBe(50);

    // Repeated refund attempt must not grant extra credits
    const refund2 = await creditService.refundCredits(testUserId, jobId, "Repeated refund attempt");
    expect(refund2.newBalance).toBe(50);
  });

  it("GET /api/v1/credits/history should return transaction records", async () => {
    const res = await request(app)
      .get("/api/v1/credits/history")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.history)).toBe(true);
    expect(res.body.data.history.length).toBeGreaterThan(0);
  });
});
