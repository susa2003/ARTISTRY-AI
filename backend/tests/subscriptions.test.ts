import request from "supertest";
import { app } from "../src/app";
import { entitlementService } from "../src/services/EntitlementService";
import { subscriptionService } from "../src/services/SubscriptionService";

describe("Subscription Plans & Entitlement System", () => {
  let userToken: string;
  const testUserId = "sub_test_user_da_vinci";

  beforeAll(async () => {
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: "subscriber@artistry.ai",
      password: "MasterSecurePassword2026!",
      confirmPassword: "MasterSecurePassword2026!",
      displayName: "Art Subscriber",
      consentTerms: true,
    });
    userToken = regRes.body.data.tokens.accessToken;
  });

  it("GET /api/v1/subscriptions/plans should return configurable plans catalog", async () => {
    const res = await request(app).get("/api/v1/subscriptions/plans");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.plans.length).toBe(3);

    const [free, pro, premium] = res.body.data.plans;
    expect(free.tier).toBe("free");
    expect(free.monthlyCredits).toBe(50);
    expect(free.pricing.monthlyUsd).toBe(0);

    expect(pro.tier).toBe("pro");
    expect(pro.monthlyCredits).toBe(500);
    expect(pro.pricing.monthlyUsd).toBe(9.99);

    expect(premium.tier).toBe("premium");
    expect(premium.monthlyCredits).toBe(2000);
    expect(premium.pricing.monthlyUsd).toBe(19.99);
  });

  it("GET /api/v1/subscriptions/me should return Free tier by default", async () => {
    const res = await request(app)
      .get("/api/v1/subscriptions/me")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tier).toBe("free");
    expect(res.body.data.cancelAtPeriodEnd).toBe(false);
  });

  it("should enforce feature entitlements correctly across tiers", async () => {
    // 1. Free tier check
    const freeCheck = await entitlementService.checkFeatureAccess("random_user", "drawing_analysis");
    expect(freeCheck.allowed).toBe(false);
    expect(freeCheck.userTier).toBe("free");
    expect(freeCheck.requiredTier).toBe("pro");

    // 2. Activate Pro subscription for test user
    await subscriptionService.activateSubscription(testUserId, "pro", "monthly", {
      productId: "artistry_pro_monthly",
      orderId: "ORDER_GPA_12345",
      purchaseToken: "token_abc_123",
    });

    const proAnalysisCheck = await entitlementService.checkFeatureAccess(testUserId, "drawing_analysis");
    expect(proAnalysisCheck.allowed).toBe(true);
    expect(proAnalysisCheck.userTier).toBe("pro");

    // Pro user attempting Premium feature
    const proMentorCheck = await entitlementService.checkFeatureAccess(testUserId, "art_mentor");
    expect(proMentorCheck.allowed).toBe(false);
    expect(proMentorCheck.requiredTier).toBe("premium");

    // 3. Activate Premium subscription
    await subscriptionService.activateSubscription(testUserId, "premium", "yearly", {
      productId: "artistry_premium_yearly",
      orderId: "ORDER_GPA_99999",
      purchaseToken: "token_prem_999",
    });

    const premMentorCheck = await entitlementService.checkFeatureAccess(testUserId, "art_mentor");
    expect(premMentorCheck.allowed).toBe(true);
    expect(premMentorCheck.userTier).toBe("premium");
  });

  it("should preserve access during grace period and demote upon expiration", async () => {
    const expiringUser = "grace_period_user";
    const now = Date.now();

    // Past currentPeriodEnd but within grace period (+3 days)
    entitlementService.setInMemorySubscription(expiringUser, {
      userId: expiringUser,
      tier: "pro",
      status: "active",
      currentPeriodEnd: new Date(now - 24 * 60 * 60 * 1000), // expired yesterday
      gracePeriodExpiresAt: new Date(now + 48 * 60 * 60 * 1000), // grace period valid for 2 more days
    });

    const graceCheck = await entitlementService.getUserActiveTier(expiringUser);
    expect(graceCheck.tier).toBe("pro");
    expect(graceCheck.status).toBe("grace_period");

    // Past both currentPeriodEnd and gracePeriodExpiresAt
    entitlementService.setInMemorySubscription(expiringUser, {
      userId: expiringUser,
      tier: "pro",
      status: "expired",
      currentPeriodEnd: new Date(now - 7 * 24 * 60 * 60 * 1000),
      gracePeriodExpiresAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
    });

    const expiredCheck = await entitlementService.getUserActiveTier(expiringUser);
    expect(expiredCheck.tier).toBe("free");
    expect(expiredCheck.status).toBe("expired");
  });

  it("POST /api/v1/subscriptions/cancel should schedule cancellation at period end", async () => {
    // Activate pro subscription for authenticated user
    const profileRes = await request(app)
      .get("/api/v1/user/profile")
      .set("Authorization", `Bearer ${userToken}`);
    const actualUserId = profileRes.body.data.userId;

    await subscriptionService.activateSubscription(actualUserId, "pro", "monthly", {
      productId: "artistry_pro_monthly",
    });

    const cancelRes = await request(app)
      .post("/api/v1/subscriptions/cancel")
      .set("Authorization", `Bearer ${userToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.scheduledCancellation).toBe(true);

    const subStatus = await request(app)
      .get("/api/v1/subscriptions/me")
      .set("Authorization", `Bearer ${userToken}`);
    expect(subStatus.body.data.cancelAtPeriodEnd).toBe(true);
  });

  it("POST /api/v1/subscriptions/restore should restore user entitlements", async () => {
    const res = await request(app)
      .post("/api/v1/subscriptions/restore")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tier).toBe("pro");
  });
});
