export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: "user" | "artist" | "admin";
  experienceMode: "beginner" | "professional";
  language: "en" | "ta";
  isEmailVerified: boolean;
  creditBalance: number;
  subscriptionTier: "free" | "pro" | "premium";
  drawingPreferences: {
    defaultBrush: string;
    smoothing: string;
    autoSaveIntervalMs: number;
  };
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  isStrongEnough: boolean;
  issues: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const issues: string[] = [];

  if (!password || password.length < 8) {
    issues.push("At least 8 characters");
  }
  if (!/[a-z]/.test(password)) {
    issues.push("One lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    issues.push("One uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    issues.push("One number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push("One special symbol");
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  const boundedScore = Math.min(score, 4);
  const labels: PasswordStrength["label"][] = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];

  return {
    score: boundedScore,
    label: labels[boundedScore],
    isStrongEnough: issues.length === 0,
    issues,
  };
}

export class ClientAuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_AI_API_URL || "http://localhost:4000/api/v1";
  }

  async register(payload: {
    email: string;
    password: string;
    confirmPassword: string;
    displayName: string;
    consentTerms: boolean;
    language?: "en" | "ta";
    experienceMode?: "beginner" | "professional";
  }): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const res = await fetch(`${this.baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Registration failed");
    }
    return data.data;
  }

  async login(email: string, password: string): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Login failed");
    }
    return data.data;
  }

  async googleLogin(idToken: string): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const res = await fetch(`${this.baseUrl}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Google login failed");
    }
    return data.data;
  }

  async refreshTokens(refreshToken: string): Promise<{ tokens: AuthTokens }> {
    const res = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Token refresh failed");
    }
    return data.data;
  }

  async logout(refreshToken: string): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      return true;
    } catch {
      return false;
    }
  }

  async forgotPassword(email: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return Boolean(data.success);
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword, confirmPassword: newPassword }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Reset password failed");
    }
    return true;
  }

  async getProfile(accessToken: string): Promise<UserProfile> {
    const res = await fetch(`${this.baseUrl}/user/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to fetch profile");
    }
    return data.data;
  }

  async updateProfile(updates: Partial<UserProfile>, accessToken: string): Promise<UserProfile> {
    const res = await fetch(`${this.baseUrl}/user/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to update profile");
    }
    return data.data;
  }

  async exportData(accessToken: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/user/export-data`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to export data");
    }
    return data.data;
  }

  async deleteAccount(
    confirmation: { password?: string; confirmEmail?: string },
    accessToken: string
  ): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/user/delete-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(confirmation),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to delete account");
    }
    return true;
  }
}

export const clientAuthService = new ClientAuthService();
