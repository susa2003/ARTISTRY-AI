import request from "supertest";
import { app } from "../src/app";
import { authService, inMemoryUsers } from "../src/services/AuthService";
import { notificationService } from "../src/services/NotificationService";

describe("Privacy, Data Export, Account Deletion & Notifications", () => {
  let userToken: string;
  let userId: string;
  const userEmail = "gdpr.artist@artistry.ai";
  const userPassword = "SecurePassword123!";

  let googleUserToken: string;
  let googleUserId: string;
  let googleEmail: string;

  beforeAll(async () => {
    // 1. Password-based user
    const reg = await authService.register({
      email: userEmail,
      password: userPassword,
      displayName: "GDPR Artist",
    });
    userId = reg.user.userId;
    userToken = reg.tokens.accessToken;

    // 2. Google OAuth user (no password)
    const googleLoginRes = await authService.googleLogin("test_google_token_googleartist");
    googleUserId = googleLoginRes.user.userId;
    googleEmail = googleLoginRes.user.email;
    googleUserToken = googleLoginRes.tokens.accessToken;
  });

  describe("GET /api/v1/user/export-data (GDPR Art. 20)", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/v1/user/export-data");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should export complete user profile, ledger, and subscription bundle", async () => {
      const res = await request(app)
        .get("/api/v1/user/export-data")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.metadata).toBeDefined();
      expect(data.metadata.complianceStandards).toBeDefined();
      expect(data.userProfile.email).toBe(userEmail);
      expect(data.creditLedger).toBeDefined();
      expect(Array.isArray(data.subscriptions)).toBe(true);
      expect(Array.isArray(data.notifications)).toBe(true);
    });
  });

  describe("Notifications System", () => {
    let testNotificationId: string;

    beforeAll(async () => {
      const notif = await notificationService.createNotification(
        userId,
        "Low Credits Warning",
        "You have only 5 credits remaining. Upgrade to Pro for 500 monthly credits.",
        "credit_alert",
        { balance: 5 }
      );
      testNotificationId = notif.notificationId;

      await notificationService.createNotification(
        userId,
        "Welcome to Artistry AI",
        "Explore classical drawing tools anytime offline.",
        "system_announcement"
      );
    });

    it("should fetch user notifications and unread count", async () => {
      const res = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(2);
    });

    it("should mark a single notification as read", async () => {
      const res = await request(app)
        .post(`/api/v1/notifications/${testNotificationId}/read`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });

    it("should mark all unread notifications as read", async () => {
      const res = await request(app)
        .post("/api/v1/notifications/read-all")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBeGreaterThanOrEqual(1);

      // Verify unread count is now 0
      const checkRes = await request(app)
        .get("/api/v1/notifications?unreadOnly=true")
        .set("Authorization", `Bearer ${userToken}`);

      expect(checkRes.body.data.unreadCount).toBe(0);
    });
  });

  describe("POST /api/v1/user/delete-account (GDPR Right to Erasure)", () => {
    it("should require password for password-authenticated account", async () => {
      const res = await request(app)
        .post("/api/v1/user/delete-account")
        .set("Authorization", `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("PASSWORD_REQUIRED");
    });

    it("should reject deletion if password does not match", async () => {
      const res = await request(app)
        .post("/api/v1/user/delete-account")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ password: "WrongPassword999!" });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_PASSWORD");
    });

    it("should permanently delete password-based account with valid credentials", async () => {
      const res = await request(app)
        .post("/api/v1/user/delete-account")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ password: userPassword });

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);

      // Verify user can no longer log in
      const loginAttempt = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: userEmail, password: userPassword });

      expect(loginAttempt.status).toBe(401);
    });

    it("should reject Google user deletion if email confirmation does not match", async () => {
      const res = await request(app)
        .post("/api/v1/user/delete-account")
        .set("Authorization", `Bearer ${googleUserToken}`)
        .send({ confirmEmail: "wrong.email@artistry.ai" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("EMAIL_MISMATCH");
    });

    it("should delete Google OAuth account when correct confirmation email is provided", async () => {
      const res = await request(app)
        .post("/api/v1/user/delete-account")
        .set("Authorization", `Bearer ${googleUserToken}`)
        .send({ confirmEmail: googleEmail });

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });
});
