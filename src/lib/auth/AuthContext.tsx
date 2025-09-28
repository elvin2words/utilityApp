// lib/auth/AuthContext.tsx - Binds API unauthorized handler, hydrates once, periodic refresh, foreground refresh, exposes all needed methods.

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Alert, AppState } from "react-native";

import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
// import * as AuthSession from "expo-auth-session";

import { AuthStorage } from "./authStorage";
import { authService } from "./authService";
import { User, AuthSession } from "./authTypes";
import { signInWithGoogle, signInWithApple, signInWithFacebook } from "./authSocial";
import { hydrateTokens, setTokens, clearTokens, SessionExpiredError } from "@/src/api/apiClient";

// Social auth helpers (expo) - move to apiClient???
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Facebook from "expo-auth-session/providers/facebook";

import Constants from "expo-constants";



type Provider = "google" | "apple" | "facebook";

type AuthSessionData = {
  accessToken: string;
  refreshToken?: string;
  user: User;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  ready: boolean; // hydrated + loaded
  loading: boolean;

  // actions
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  logout: () => Promise<void>;
  devLogin: (role: "supervisor" | "artisan") => Promise<void>;
  biometricLogin: () => Promise<void>;

  // social / magic
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  socialLogin: (provider: Provider, providerToken: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;

  markOnboarded: () => Promise<void>;
  cachedUser: User | null;
}

const AuthContext = createContext<AuthContextType>(null as any);


/**
 * AuthProvider
 *
 * Responsibilities:
 * - hydrate session (SecureStore/AsyncStorage)
 * - bind API unauthorized handler
 * - refresh tokens periodically and on foreground
 * - provide login/logout/dev/social/magic/biometric helpers
 */
export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [user, setUser] = useState<User | null>(null);
  const [socialToken, setSocialToken] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const isAuthenticated = !!accessToken && !!user;
  const ready = hydrated && !loading;

  // Access keys from app.config.js via Constants.expoConfig.extra
  // const { GOOGLE_EXPO_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } =
  //   Constants.expoConfig?.extra ?? {};


  /** --- Hydration --- */
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const session = await AuthStorage.getSession();
        if (session && active) {
          setAccessToken(session.accessToken);
          setRefreshToken(session.refreshToken);
          setUser(session.user);

          // Soft profile refresh
          try {
            const profile = await authService.getProfile();
            if (active) setUser(profile);
          } catch {}
        }
      } finally {
        if (active) setLoading(false);
        if (active) setHydrated(true);
      }
    })();

    return () => { active = false; };
  }, []);

  /** --- Internal session save --- */
  const saveSession = async (session: AuthSession) => {
    const { accessToken, refreshToken, user, remember } = session;
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setUser(user);
    if (remember) await AuthStorage.saveSession(session);
  };

  // Load session from storage
  const loadSession = async () => {
    setLoading(true);
    try {
      await hydrateTokens(); // load tokens into memory
      const session = await AuthStorage.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  };


  /** --- Standard login --- */
  const login = async (email: string, password: string, remember = true) => {
    setLoading(true);
    try {
      const { accessToken, refreshToken, user } = await authService.login(email.trim(), password);
      await saveSession({ accessToken, refreshToken, user, remember });
      return user;
    } catch (e: any) {
      throw new Error(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  /** --- Logout --- */
  const logout = async () => {
    setLoading(true);
    try { await authService.serverLogout(); } catch {}
    await AuthStorage.clearSession();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setLoading(false);
  };

  /**
   * Global error handler for SessionExpiredError
   */
  // const handleApiErrors = useCallback(() => {
  //   const unsubscribe = authService.onGlobalApiError(async (error) => {
  //     if (error instanceof SessionExpiredError) {
  //       await logout();
  //     }
  //   });
  //   return unsubscribe;
  // }, []);


  /** --- Token refresh (periodic + foreground) --- */
  useEffect(() => {
    if (!refreshToken) return;

    let stopped = false;

    const refresh = async () => {
      try {
        const res = await authService.refreshToken(refreshToken!);
        if (res?.accessToken && !stopped) {
          await AuthStorage.setTokens(res.accessToken, res.refreshToken);
          setAccessToken(res.accessToken);
          if (res.refreshToken) setRefreshToken(res.refreshToken);
        } else {
          await logout();
        }
      } catch {
        await logout();
      }
    };

    // Periodic refresh
    const interval = setInterval(refresh, 9 * 60 * 1000);

    // Foreground refresh
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });

    return () => { stopped = true; clearInterval(interval); sub.remove(); };
  }, [refreshToken]);


  /** --- Dev quick login --- */
  const devLogin = async (role: "supervisor" | "artisan") => {
    if (!__DEV__) return;
    setLoading(true);
    try {
      const { accessToken, refreshToken, user } = await authService.devQuickLogin(role);
      await saveSession({ accessToken, refreshToken, user, remember: true });
    } finally { setLoading(false); }
  };


  /** --- Biometric login --- */
  const biometricLogin = async () => {
    const hasHw = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHw || !enrolled) throw new Error("Biometrics unavailable");

    const res = await LocalAuthentication.authenticateAsync({ promptMessage: "Authenticate" });
    if (!res.success) throw new Error("Biometric authentication failed");

    const session = await AuthStorage.getSession();
    if (!session) throw new Error("No cached session available");

    setAccessToken(session.accessToken);
    setRefreshToken(session.refreshToken);
    setUser(session.user);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  /** --- Social login (generic) --- */
  const socialLogin = async (provider: Provider, providerToken: string) => {
    setLoading(true);
    try {
      const { accessToken, refreshToken, user } = await authService.socialLogin(provider, providerToken);
      await saveSession({ accessToken, refreshToken, user, remember: true });
    } catch {
      Alert.alert("Social login failed", "Please try again");
    } finally { setLoading(false); }
  };

  /** --- Provider-specific social login helpers --- */
  const loginWithGoogle = async () => {
    const token = await signInWithGoogle();
    if (!token) throw new Error("Google login failed");
    await socialLogin("google", token);
  };

  const loginWithApple = async () => {
    const code = await signInWithApple();
    if (!code) throw new Error("Apple login failed");
    await socialLogin("apple", code);
  };

  const loginWithFacebook = async () => {
    const token = await signInWithFacebook();
    if (!token) throw new Error("Facebook login failed");
    await socialLogin("facebook", token);
  };


  // Social login (Google)
  // NOTE: supply client ids in app config / env
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_GOOGLE_CLIENT_ID ?? "GOOGLE_EXPO_CLIENT_ID",
    iosClientId: process.env.GOOGLE_IOS_CLIENT_ID ?? "GOOGLE_IOS_CLIENT_ID",
    androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID ?? "GOOGLE_ANDROID_CLIENT_ID",
  });
  const loginWithGoogleM2 = async () => {
    try {
      const result = await googlePromptAsync();
      if (result?.type === "success" && result.authentication?.accessToken) {
        const res = await authService.socialLogin("google", result.authentication.accessToken);
        await AuthStorage.saveSession({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user, remember: true });
        setSocialToken(res.accessToken);
        setUser(res.user);
      } else {
        throw new Error("Google login canceled");
      }
    } catch (err) {
      throw err;
    }
  };

  // Apple
  const loginWithAppleM2 = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const idToken = (credential as any).identityToken;
      if (!idToken) throw new Error("Apple authentication missing token");
      const res = await authService.socialLogin("apple", idToken);
      await AuthStorage.saveSession({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user, remember: true });
      setSocialToken(res.accessToken);
      setUser(res.user);
    } catch (err) {
      throw err;
    }
  };

  // Facebook
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: process.env.FB_APP_ID ?? "<FB_APP_ID>",
  });
  const loginWithFacebookM2 = async () => {
    try {
      const result = await fbPromptAsync();
      if (result?.type === "success" && result.authentication?.accessToken) {
        const res = await authService.socialLogin("facebook", result.authentication.accessToken);
        await AuthStorage.saveSession({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user, remember: true });
        setSocialToken(res.accessToken);
        setUser(res.user);
      } else {
        throw new Error("Facebook login canceled");
      }
    } catch (err) {
      throw err;
    }
  };


  /** --- Magic link --- */
  const sendMagicLink = async (email: string) => {
    try {
      await authService.sendMagicLink(email);
      Alert.alert("Check your email", "We sent you a login link.");
    } catch {
      Alert.alert("Error", "Could not send magic link");
    }
  };


  /** --- Mark onboarding complete --- */
  const markOnboarded = async () => {
    setUser((u) => (u ? { ...u, hasOnboarded: true } : u));
    const session = await AuthStorage.getSession();
    if (session) await AuthStorage.saveSession({ ...session, user: { ...session.user, hasOnboarded: true } });
  };


  /**
   * Foreground refresh
   */
  // useEffect(() => {
  //   const sub = AppState.addEventListener("change", (state) => {
  //     if (state === "active" && isAuthenticated) {
  //       authService.refresh().catch(() => logout());
  //     }
  //   });
  //   return () => sub.remove();
  // }, [isAuthenticated]);

  // /**
  //  * Periodic refresh with jitter
  //  */
  // useEffect(() => {
  //   if (!isAuthenticated) return;
  //   const jitter = Math.floor(Math.random() * 60 * 1000); // ±1 min
  //   const interval = setInterval(() => {
  //     authService.refresh().catch(() => logout());
  //   }, 10 * 60 * 1000 + jitter); // every ~10 mins
  //   return () => clearInterval(interval);
  // }, [isAuthenticated]);

  // /**
  //  * Load session on mount & bind error handler
  //  */
  // useEffect(() => {
  //   loadSession();
  //   const unsubscribe = handleApiErrors();
  //   return unsubscribe;
  // }, []);

  const value = useMemo(() => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated,
      ready,
      loading,
      login,
      logout,
      devLogin,
      biometricLogin,
      loginWithGoogle,
      loginWithApple,
      loginWithFacebook,
      loginWithGoogleM2,
      loginWithAppleM2,
      loginWithFacebookM2,      
      socialLogin,
      sendMagicLink,
      markOnboarded,
      cachedUser: user,
    }),
    [user, accessToken, refreshToken, isAuthenticated, loading, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
