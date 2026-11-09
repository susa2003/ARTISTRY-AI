import request from "supertest";
import { app } from "../src/app";

describe("Authentication & User Profile API", () => {
  const testUser = {
    email: "davinci@artistry.ai",
    password: "SecureArtistry2026!",
    confirmPassword: "SecureArtistry2026!",
    displayName: "Leonardo da Vinci",
    consentTerms: true,
    language: "en" as const,
    experienceMode: "professional" as const,
  };

  let accessToken: string;
  let refreshToken: string;
  let resetToken: string;
  let verificationToken: string;

  it("should reject registration with weak password", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      ...testUser,
      email: "weak@artistry.ai",
      password: "weak",
      confirmPassword: "weak",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject registration without terms consent", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      ...testUser,
      email: "noconsent@artistry.ai",
      consentTerms: false,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should register a new user successfully", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.displayName).toBe(testUser.displayName);
    expect(res.body.data.user.role).toBe("user");
    expect(res.body.data.user.creditBalance).toBe(50);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();

    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
    verificationToken = res.body.data.verificationToken;
  });

  it("should reject duplicate registration with same email", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE_ACCOUNT");
  });

  it("should login successfully with correct credentials", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();

    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: testUser.email,
      password: "WrongPassword999!",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("should authenticate with Google ID token", async () => {
    const res = await request(app).post("/api/v1/auth/google").send({
      idToken: "test_google_token_michelangelo",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("michelangelo@gmail.com");
    expect(res.body.data.user.isEmailVerified).toBe(true);
  });

  it("should rotate refresh token and provide new token pair", async () => {
    const res = await request(app).post("/api/v1/auth/refresh").send({
      refreshToken,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).not.toBe(refreshToken);

    const oldToken = refreshToken;
    refreshToken = res.body.data.tokens.refreshToken;
    accessToken = res.body.data.tokens.accessToken;

    // Token reuse detection test: using oldToken must be rejected
    const reuseRes = await request(app).post("/api/v1/auth/refresh").send({
      refreshToken: oldToken,
    });
    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error.code).toBe("REVOKED_REFRESH_TOKEN");
  });

  it("should verify email with valid verification token", async () => {
    const res = await request(app).post("/api/v1/auth/verify-email").send({
      token: verificationToken,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.verified).toBe(true);
  });

  it("should request password reset token", async () => {
    const res = await request(app).post("/api/v1/auth/forgot-password").send({
      email: testUser.email,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.resetToken).toBeDefined();
    resetToken = res.body.data.resetToken;
  });

  it("should reset password with reset token", async () => {
    const newPassword = "BrandNewArtistryPassword2026!";
    const res = await request(app).post("/api/v1/auth/reset-password").send({
      token: resetToken,
      newPassword,
      confirmPassword: newPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.reset).toBe(true);

    // Old password must fail
    const oldLogin = await request(app).post("/api/v1/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(oldLogin.status).toBe(401);

    // New password must succeed
    const newLogin = await request(app).post("/api/v1/auth/login").send({
      email: testUser.email,
      password: newPassword,
    });
    expect(newLogin.status).toBe(200);
    accessToken = newLogin.body.data.tokens.accessToken;
  });

  it("should fetch user profile with Bearer token", async () => {
    const res = await request(app)
      .get("/api/v1/user/profile")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.role).toBe("user");
  });

  it("should update user profile without allowing privilege escalation", async () => {
    const res = await request(app)
      .put("/api/v1/user/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        displayName: "Leonardo Master",
        language: "ta",
        role: "admin", // Malicious attempt to escalate role
        creditBalance: 999999, // Malicious attempt to inject credits
      });

    expect(res.status).toBe(200);
    expect(res.body.data.displayName).toBe("Leonardo Master");
    expect(res.body.data.language).toBe("ta");
    expect(res.body.data.role).toBe("user"); // Escaped role ignored!
    expect(res.body.data.creditBalance).not.toBe(999999); // Injected credits ignored!
  });

  it("should log out all sessions for user", async () => {
    const res = await request(app)
      .post("/api/v1/auth/logout-all")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.revokedCount).toBeGreaterThanOrEqual(1);
  });
});
