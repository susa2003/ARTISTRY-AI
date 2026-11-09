import request from "supertest";
import { app } from "../src/app";
import { googlePlayVerificationService } from "../src/services/GooglePlayVerificationService";

describe("Google Play Billing & Purchase Verification API", () => {
  let user1Token: string;
  let user2Token: string;

  beforeAll(async () => {
    googlePlayVerificationService.clearInMemoryPurchases();

    const u1 = await request(app).post("/api/v1/auth/register").send({
      email: "buyer1@artistry.ai",
      password: "MasterSecurePassword2026!",
      confirmPassword: "MasterSecurePassword2026!",
      displayName: "Buyer One",
      consentTerms: true,
    });
    user1Token = u1.body.data.tokens.accessToken;

    const u2 = await request(app).post("/api/v1/auth/register").send({
      email: "buyer2@artistry.ai",
      password: "MasterSecurePassword2026!",
      confirmPassword: "MasterSecurePassword2026!",
      displayName: "Buyer Two",
      consentTerms: true,
    });
    user2Token = u2.body.data.tokens.accessToken;
  });

  it("GET /api/v1/billing/status should return billing service status", async () => {
    const res = await request(app).get("/api/v1/billing/status");

    expect(res.status).toBe(200);
    expect(res.body.data.packageName).toBe("ai.artistry.studio");
    expect(res.body.data.configured).toBeDefined();
  });

  it("should reject verification with mismatched package name", async () => {
    const res = await request(app)
      .post("/api/v1/billing/verify-purchase")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        packageName: "com.imposter.app",
        productId: "artistry_pro_monthly",
        purchaseToken: "token_123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("PACKAGE_MISMATCH");
  });

  it("should reject verification with unknown product ID", async () => {
    const res = await request(app)
      .post("/api/v1/billing/verify-purchase")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        packageName: "ai.artistry.studio",
        productId: "unregistered_in_app_product",
        purchaseToken: "token_123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("UNKNOWN_PRODUCT");
  });

  it("should report NOT_CONFIGURED when live token passed without server credentials", async () => {
    const res = await request(app)
      .post("/api/v1/billing/verify-purchase")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        packageName: "ai.artistry.studio",
        productId: "artistry_pro_monthly",
        purchaseToken: "real_production_token_from_google_play_999",
      });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("BILLING_NOT_CONFIGURED");
  });

  it("should verify test token and activate Pro subscription", async () => {
    const sharedToken = "test_purchase_token_first_redemption";
    const res = await request(app)
      .post("/api/v1/billing/verify-purchase")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        packageName: "ai.artistry.studio",
        productId: "artistry_pro_monthly",
        purchaseToken: sharedToken,
        orderId: "GPA.3333-4444-5555",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verified).toBe(true);
    expect(res.body.data.tier).toBe("pro");

    // Duplicate purchase token attempt by another user must be rejected
    const duplicateRes = await request(app)
      .post("/api/v1/billing/verify-purchase")
      .set("Authorization", `Bearer ${user2Token}`)
      .send({
        packageName: "ai.artistry.studio",
        productId: "artistry_pro_monthly",
        purchaseToken: sharedToken,
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.error.code).toBe("DUPLICATE_PURCHASE_TOKEN");
  });
});
