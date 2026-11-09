import { checkPasswordStrength } from "../../../services/auth/AuthService";

describe("Client Authentication & Security Utilities", () => {
  it("should evaluate very weak passwords correctly", () => {
    const res = checkPasswordStrength("weak");
    expect(res.isStrongEnough).toBe(false);
    expect(res.score).toBeLessThanOrEqual(1);
    expect(res.issues).toContain("At least 8 characters");
  });

  it("should flag missing numbers and uppercase letters", () => {
    const res = checkPasswordStrength("alllowercasewords!");
    expect(res.isStrongEnough).toBe(false);
    expect(res.issues).toContain("One uppercase letter");
    expect(res.issues).toContain("One number");
  });

  it("should accept strong passwords meeting all requirements", () => {
    const res = checkPasswordStrength("MasterArtistry2026!");
    expect(res.isStrongEnough).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(3);
    expect(res.issues.length).toBe(0);
  });
});
