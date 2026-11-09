import { create } from "zustand";
import { clientAuthService, UserProfile, AuthTokens } from "../services/auth/AuthService";
import * as database from "../storage/database";

interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  restoreSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    confirmPassword: string;
    displayName: string;
    consentTerms: boolean;
    language?: "en" | "ta";
    experienceMode?: "beginner" | "professional";
  }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  exportData: () => Promise<any>;
  deleteAccount: (confirmation: { password?: string; confirmEmail?: string }) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  restoreSession: async () => {
    try {
      set({ isLoading: true });
      const stored = await database.getStoredAuth();
      if (!stored || !stored.tokens?.refreshToken) {
        set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Refresh tokens to get a fresh access token
      try {
        const { tokens } = await clientAuthService.refreshTokens(stored.tokens.refreshToken);
        const user = await clientAuthService.getProfile(tokens.accessToken);
        await database.setStoredAuth({ user, tokens });
        set({ user, tokens, isAuthenticated: true, isLoading: false });
      } catch {
        // Fallback to stored user in offline mode
        set({
          user: stored.user,
          tokens: stored.tokens,
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user, tokens } = await clientAuthService.login(email, password);
      await database.setStoredAuth({ user, tokens });
      set({ user, tokens, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Login failed", isLoading: false });
      throw err;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { user, tokens } = await clientAuthService.register(payload);
      await database.setStoredAuth({ user, tokens });
      set({ user, tokens, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Registration failed", isLoading: false });
      throw err;
    }
  },

  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user, tokens } = await clientAuthService.googleLogin(idToken);
      await database.setStoredAuth({ user, tokens });
      set({ user, tokens, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Google sign-in failed", isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    const { tokens } = get();
    if (tokens?.refreshToken) {
      await clientAuthService.logout(tokens.refreshToken);
    }
    await database.clearStoredAuth();
    set({ user: null, tokens: null, isAuthenticated: false });
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { tokens, user } = get();
    if (!tokens?.accessToken || !user) return;

    set({ isLoading: true });
    try {
      const updated = await clientAuthService.updateProfile(updates, tokens.accessToken);
      await database.setStoredAuth({ user: updated, tokens });
      set({ user: updated, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  exportData: async () => {
    const { tokens } = get();
    if (!tokens?.accessToken) throw new Error("Authentication required");
    return await clientAuthService.exportData(tokens.accessToken);
  },

  deleteAccount: async (confirmation: { password?: string; confirmEmail?: string }) => {
    const { tokens } = get();
    if (!tokens?.accessToken) throw new Error("Authentication required");
    await clientAuthService.deleteAccount(confirmation, tokens.accessToken);
    await database.clearStoredAuth();
    set({ user: null, tokens: null, isAuthenticated: false });
  },
}));
