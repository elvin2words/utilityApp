// lib/auth/authStorage.ts - Secure token storage + optional "remember me".
 
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { AuthSession, User } from "./authTypes";

const ACCESS = "auth.access"; 
const REFRESH = "auth.refresh";
const USER = "auth.user";
const REMEMBER = "auth.remember";


export const AuthStorage = {
  async saveSession(session: AuthSession) {
    const { accessToken, refreshToken, user, remember } = session;
    await SecureStore.setItemAsync(ACCESS, accessToken);
    await SecureStore.setItemAsync(REFRESH, refreshToken);
    await AsyncStorage.setItem(USER, JSON.stringify(user));
    await AsyncStorage.setItem(REMEMBER, remember ? "true" : "false");
  },

  async getSession(): Promise<AuthSession | null> {
    const [accessToken, refreshToken, userJson, remember] = await Promise.all([
      SecureStore.getItemAsync(ACCESS),
      SecureStore.getItemAsync(REFRESH),
      AsyncStorage.getItem(USER),
      AsyncStorage.getItem(REMEMBER),
    ]);
    if (accessToken && refreshToken && userJson) {
      return {
        accessToken,
        refreshToken,
        user: JSON.parse(userJson) as User,
        remember: remember === "true",
      };
    }
    return null;
  },

  async updateUser(partialUser: Partial<AuthSession["user"]>): Promise<void> {
    const current = await this.getSession();
    if (!current) return;

    const updatedUser = { ...current.user, ...partialUser };
    await AsyncStorage.setItem(USER, JSON.stringify(updatedUser));
  },
  

  async clearSession() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS),
      SecureStore.deleteItemAsync(REFRESH),
      AsyncStorage.removeItem(USER),
      AsyncStorage.removeItem(REMEMBER),
    ]);
  },

  async getAccessToken() {
    return SecureStore.getItemAsync(ACCESS);
  },

  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH);
  },

  async setAccessToken(token: string) {
    return SecureStore.setItemAsync(ACCESS, token);
  },

  async setTokens(accessToken: string, refreshToken?: string) {
    await SecureStore.setItemAsync(ACCESS, accessToken);
    if (refreshToken) await SecureStore.setItemAsync(REFRESH, refreshToken);
  },

  async getUser(): Promise<User | null> {
    const j = await AsyncStorage.getItem(USER);
    return j ? (JSON.parse(j) as User) : null;
  },

  async setUser(user: User) {
    return AsyncStorage.setItem(USER, JSON.stringify(user));
  },
};
