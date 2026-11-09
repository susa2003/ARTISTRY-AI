import request from "supertest";
import { app } from "../src/app";
import { authService, inMemoryUsers } from "../src/services/AuthService";
import { creditService } from "../src/services/CreditService";
import { adminService } from "../src/services/AdminService";

describe("Admin Dashboard & Management Ecosystem", () => {
  let adminToken: string;
  let adminUserId: string;

  let regularUserToken: string;
  let regularUserId: string;

  let targetUserId: string;

  beforeAll(async () => {
    // 1. Create Admin User
    const admin = await authService.register({
      email: "superadmin@artistry.ai",
      password: "AdminPassword123!",
      displayName: "Super Admin",
    });
    adminUserId = admin.user.userId;
    // Elevate role to admin in memory
    const storedAdmin = inMemoryUsers.get(adminUserId);
    storedAdmin.role = "admin";
    inMemoryUsers.set(adminUserId, storedAdmin);
    inMemoryUsers.set("superadmin@artistry.ai", storedAdmin);

    adminToken = authService.signAccessToken({
      userId: adminUserId,
      email: "superadmin@artistry.ai",
      role: "admin",
      subscriptionTier: "premium",
    });

    // 2. Create Regular User
    const regular = await authService.register({
      email: "learner@artistry.ai",
      password: "UserPassword123!",
      displayName: "Art Learner",
    });
    regularUserId = regular.user.userId;
    regularUserToken = regular.tokens.accessToken;

    // 3. Create Target User for testing adjustments
    const target = await authService.register({
      email: "targetartist@artistry.ai",
      password: "TargetPassword123!",
      displayName: "Target Artist",
    });
    targetUserId = target.user.userId;
    creditService.setInMemoryBalance(targetUserId, 50);
  });

  describe("Admin Authorization Guard", () => {
    it("should reject unauthenticated request to /admin/overview with 401", async () => {
      const res = await request(app).get("/api/v1/admin/overview");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject regular user with 403 FORBIDDEN", async () => {
      const res = await request(app)
        .get("/api/v1/admin/overview")
        .set("Authorization", `Bearer ${regularUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("GET /api/v1/admin/overview", () => {
    it("should return comprehensive system metrics for admin", async () => {
      const res = await request(app)
        .get("/api/v1/admin/overview")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overview).toBeDefined();

      const { overview } = res.body.data;
      expect(overview.totalUsers).toBeGreaterThanOrEqual(3);
      expect(overview.subscriptionDistribution).toBeDefined();
      expect(overview.financials).toBeDefined();
      expect(overview.credits).toBeDefined();
      expect(overview.systemHealth.nodeVersion).toBeDefined();
    });
  });

  describe("GET /api/v1/admin/users", () => {
    it("should search and list registered users with pagination", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users?query=Target&page=1&limit=10")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.users[0].email).toBe("targetartist@artistry.ai");
    });
  });

  describe("GET /api/v1/admin/users/:userId", () => {
    it("should fetch complete details for a target user", async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users/${targetUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.userId).toBe(targetUserId);
      expect(res.body.data.creditHistory).toBeDefined();
    });

    it("should return 404 for non-existent user", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users/non-existent-user-id")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("USER_NOT_FOUND");
    });
  });

  describe("POST /api/v1/admin/users/:userId/suspend", () => {
    it("should prevent admin from suspending themselves", async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${adminUserId}/suspend`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isSuspended: true, reason: "Self test" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("CANNOT_SUSPEND_SELF");
    });

    it("should suspend a target user and record audit log", async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${targetUserId}/suspend`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isSuspended: true, reason: "Violation of terms" });

      expect(res.status).toBe(200);
      expect(res.body.data.user.isSuspended).toBe(true);
      expect(res.body.data.user.suspensionReason).toBe("Violation of terms");

      // Verify audit logs
      const auditRes = await request(app)
        .get("/api/v1/admin/audit-logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(auditRes.status).toBe(200);
      const suspendLog = auditRes.body.data.auditLogs.find(
        (l: any) => l.action === "USER_SUSPEND" && l.targetUserId === targetUserId
      );
      expect(suspendLog).toBeDefined();
      expect(suspendLog.details.reason).toBe("Violation of terms");
    });

    it("should unsuspend a target user", async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${targetUserId}/suspend`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isSuspended: false });

      expect(res.status).toBe(200);
      expect(res.body.data.user.isSuspended).toBe(false);
    });
  });

  describe("POST /api/v1/admin/users/:userId/credits", () => {
    it("should reject 0 credit adjustment with validation error", async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${targetUserId}/credits`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ amount: 0, reason: "No change" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should adjust target user credits and record audit log", async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${targetUserId}/credits`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ amount: 150, reason: "Promotional credit grant" });

      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(150);
      expect(res.body.data.newBalance).toBe(200); // 50 + 150

      // Verify transaction in target user history
      const history = await creditService.getTransactionHistory(targetUserId);
      const adjustmentTx = history.find((t) => t.type === "admin_adjustment");
      expect(adjustmentTx).toBeDefined();
      expect(adjustmentTx.amount).toBe(150);
    });
  });

  describe("POST /api/v1/admin/users/:userId/role", () => {
    it("should update user role to artist", async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${targetUserId}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "artist" });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe("artist");
    });
  });

  describe("Analytics & Audit Endpoints", () => {
    it("should return AI usage analytics", async () => {
      const res = await request(app)
        .get("/api/v1/admin/analytics/ai")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.featureBreakdown).toBeDefined();
    });

    it("should return audit logs list", async () => {
      const res = await request(app)
        .get("/api/v1/admin/audit-logs?limit=50")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.auditLogs)).toBe(true);
      expect(res.body.data.auditLogs.length).toBeGreaterThan(0);
    });
  });
});
