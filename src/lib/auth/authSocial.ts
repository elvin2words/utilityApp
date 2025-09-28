// lib/auth/authSocial.ts

import React from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";


WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri();

export async function signInWithGoogle() {
  const clientId =
    Constants.expoConfig?.extra?.GOOGLE_EXPO_CLIENT_ID ??
    process.env.GOOGLE_EXPO_CLIENT_ID;

  const discovery = {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
  };

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    responseType: "token",
    scopes: ["profile", "email"],
  });

  const result = await request.promptAsync(discovery);

  if (result.type === "success") {
    return result.authentication?.accessToken;
  }
  return null;
}

export async function signInWithApple() {
  const clientId =
    Constants.expoConfig?.extra?.APPLE_CLIENT_ID ?? process.env.APPLE_CLIENT_ID;

  const discovery = {
    authorizationEndpoint: "https://appleid.apple.com/auth/authorize",
    tokenEndpoint: "https://appleid.apple.com/auth/token",
  };

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    responseType: "code",
    scopes: ["name", "email"],
  });

  const result = await request.promptAsync(discovery);

  if (result.type === "success") {
    return result.params.code; // exchange with backend for identity token
  }
  return null;
}

export async function signInWithFacebook() {
  const clientId =
    Constants.expoConfig?.extra?.FACEBOOK_APP_ID ?? process.env.FACEBOOK_APP_ID;

  const discovery = {
    authorizationEndpoint: "https://www.facebook.com/v11.0/dialog/oauth",
    tokenEndpoint: "https://graph.facebook.com/v11.0/oauth/access_token",
  };

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    responseType: "token",
    scopes: ["public_profile", "email"],
  });

  // const result = await request.promptAsync(discovery, { useProxy: true });
  const result = await request.promptAsync(discovery);

  if (result.type === "success") {
    return result.authentication?.accessToken;
  }
  return null;
}
