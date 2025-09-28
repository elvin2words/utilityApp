// lib/auth/authService.ts

import React from "react";

import { loginApi, refreshApi, socialLoginApi, magicLinkLoginApi, logoutApi, getProfileApi, setTokens } from "@/src/api/apiClient";
import { AuthSession, User } from "./authTypes";
import { AuthStorage } from "@/src/lib/auth/authStorage";
  
/**
 * authService: thin wrapper around backend endpoints.
 * - In __DEV__ it returns predictable mock responses.
 * - In production it uses api client to call real endpoints.
 */

type ApiErrorHandler = (error: unknown) => void;

const TEST_USERS = {
  supervisor: {
    email: "test.supervisor@app.com",
    role: "supervisor",
    name: "Test Supervisor",
    hasOnboarded: true,
  },
  artisan: {
    email: "test.artisan@app.com",
    role: "artisan",
    name: "Test Artisan",
    hasOnboarded: false,
  },
};

const DEV_USERS = {
  supervisor: { id: "sup-dev", name: "Dev Supervisor", email: "supervisor@dev.local", role: "supervisor" as const, hasOnboarded: true },
  artisan: { id: "art-dev", name: "Dev Artisan", email: "artisan@dev.local", role: "artisan" as const, hasOnboarded: false },
};

const DEV_MOCKS = {
  login: (email: string): AuthSession => {
    const role = email.includes("supervisor") ? "supervisor" : "artisan";
    const user = DEV_USERS[role];
    return { accessToken: "dev-access", refreshToken: "dev-refresh", user, remember: true };
  },
  me: (): User => DEV_USERS.artisan,
  refresh: (): { accessToken: string; refreshToken: string } => ({ accessToken: "dev-access-refreshed", refreshToken: "dev-refresh" }),
};

export const authService = {
  
  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    if (__DEV__ || email.startsWith("devtest.")) return DEV_MOCKS.login(email);
    return loginApi(email, password);
  },

  async refreshToken(refreshToken?: string) {
    if (__DEV__) return DEV_MOCKS.refresh();
    if (!refreshToken) throw new Error("Missing refresh token");
    return refreshApi(refreshToken);
  },

  async getProfile(): Promise<User> {
    if (__DEV__) return DEV_MOCKS.me();
    return getProfileApi();
  },

  async socialLogin(provider: "google" | "apple" | "facebook", providerToken: string) {
    if (__DEV__) {
      const role = providerToken.includes("supervisor") ? "supervisor" : "artisan";
      const user = { ...DEV_USERS[role], name: "Social User", email: "social@example.com" };
      return { accessToken: "dev-social-access", refreshToken: "dev-social-refresh", user };
    }
    return socialLoginApi(provider, providerToken);
  },

  async sendMagicLink(email: string) {
    if (__DEV__) { console.log("[DEV] Magic link ->", email); return; }
    await magicLinkLoginApi(email);
  },

  async serverLogout() {
    await logoutApi();
  },

  /** Dev quick login explicit role */
  async devQuickLogin(role: "supervisor" | "artisan") {
    const email = role === "supervisor" ? "supervisor@dev.local" : "artisan@dev.local";
    return DEV_MOCKS.login(email);
  },
};


// // ufms/lib/auth/authService.ts
// import {
//   loginApi,
//   logoutApi,
//   refreshApi,
//   socialLoginApi,
//   magicLinkLoginApi,
//   SessionExpiredError,
// } from "@/lib/api/apiClient";
// import { AuthStorage } from "@/lib/auth/authStorage";
// import { User } from "@/types/user";

// export type AuthSession = {
//   accessToken: string;
//   refreshToken?: string;
//   user: User;
// };

// type ApiErrorHandler = (error: unknown) => void;

// class AuthService {
//   private errorHandlers: ApiErrorHandler[] = [];

//   /**
//    * Subscribe to global API errors (e.g., SessionExpiredError)
//    */
//   onGlobalApiError(handler: ApiErrorHandler) {
//     this.errorHandlers.push(handler);
//     return () => {
//       this.errorHandlers = this.errorHandlers.filter((h) => h !== handler);
//     };
//   }

//   /**
//    * Internal method to propagate errors
//    */
//   private handleError(error: unknown) {
//     this.errorHandlers.forEach((handler) => handler(error));
//   }

//   /**
//    * Standard login
//    */
//   async login(email: string, password: string): Promise<AuthSession> {
//     try {
//       const { accessToken, refreshToken, user } = await loginApi(email, password);
//       return { accessToken, refreshToken, user };
//     } catch (error) {
//       this.handleError(error);
//       throw error;
//     }
//   }

//   /**
//    * Social login
//    */
//   async socialLogin(provider: "google" | "apple" | "facebook"): Promise<AuthSession> {
//     try {
//       // Token will be obtained via Expo AuthSession or native SDK (handled in AuthContext)
//       const token = await this.getSocialAccessToken(provider);
//       const { accessToken, refreshToken, user } = await socialLoginApi(provider, token);
//       return { accessToken, refreshToken, user };
//     } catch (error) {
//       this.handleError(error);
//       throw error;
//     }
//   }

//   /**
//    * Magic link login (sends email link)
//    */
//   async sendMagicLink(email: string): Promise<void> {
//     try {
//       await magicLinkLoginApi(email);
//     } catch (error) {
//       this.handleError(error);
//       throw error;
//     }
//   }

//   /**
//    * Refresh access token
//    */
//   async refresh(): Promise<AuthSession> {
//     try {
//       const session = await AuthStorage.getSession();
//       if (!session?.refreshToken) throw new SessionExpiredError();
//       const { accessToken, refreshToken } = await refreshApi(session.refreshToken);
//       const updatedSession: AuthSession = {
//         accessToken,
//         refreshToken: refreshToken || session.refreshToken,
//         user: session.user,
//       };
//       await AuthStorage.saveSession(updatedSession);
//       return updatedSession;
//     } catch (error) {
//       this.handleError(error);
//       throw error;
//     }
//   }

//   /**
//    * Logout
//    */
//   async logout(): Promise<void> {
//     try {
//       await logoutApi();
//     } catch (error) {
//       this.handleError(error);
//       throw error;
//     }
//   }

//   /**
//    * Dev login (only in dev mode)
//    */
//   async devLogin(email: string): Promise<AuthSession> {
//     if (!__DEV__) throw new Error("Dev login is disabled in production");
//     try {
//       // Simulate API response for dev
//       const mockUser: User = {
//         id: "dev-" + Date.now(),
//         email,
//         name: "Developer",
//       };
//       return {
//         accessToken: "dev-access-token",
//         refreshToken: "dev-refresh-token",
//         user: mockUser,
//       };
//     } catch (error) {
//       this.handleError(error);
//       throw error;
//     }
//   }

//   /**
//    * Placeholder for actual social token retrieval
//    * (Handled by Expo AuthSession or SDK in AuthContext)
//    */
//   private async getSocialAccessToken(provider: string): Promise<string> {
//     // In production, this should be implemented in AuthContext
//     throw new Error(`Social login for ${provider} not implemented here`);
//   }
// }

// export const authService = new AuthService();
