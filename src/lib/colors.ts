// lib/colors.ts

import React from "react";

import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";

 
export interface AppTheme extends Theme {
  colors: Theme["colors"] & {
    maintext: string;
    subtext: string;
    placeholder: string;
    onPrimary: string;
    secondary: string;
    danger: string;
    success: string;
    warning: string;
    onboardingBg: string;
    geofenceActive: string;
    geofenceInactive: string;
    taskCard: string;
    headerBackground: string;
    primaryGradient:string[];
  };
}

/**
 * Central token set - keep semantic tokens here.
 * Add / tweak tokens to match your design system.
 */
const tokens = {
  primary: "#2563EB",
  primaryVariant: "#1D4ED8",
  secondary: "#3B82F6",
  danger: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
  muted: "#6B7280",
};

/** Surface / background colors */
const surfaces = {
  lightBg: "#FFFFFF",
  lightCard: "#F9FAFB",
  lightTaskCard: "#F3F4F6",

  darkBg: "#0B1220",
  darkCard: "#111827",
  darkTaskCard: "#0F1724",
};

/** Text tokens — centralized for easy maintenance. */
const textTokens = {
  light: {
    default: "#111827", // base navigation text
    main: "#000000",    // strong headlines
    sub: "#4B5563",     // softer subtitles / helper text
    placeholder: tokens.muted,
  },
  dark: {
    default: "#E6EEF8", // base navigation text
    main: "#F9FAFB",    // near-white for contrast
    sub: "#9CA3AF",     // muted gray for secondary
    placeholder: "#94A3B8",
  },
};

export const MyLightTheme: AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: surfaces.lightBg,
    card: surfaces.lightCard,

    primaryGradient: ["#3B82F6", "#2563EB", "#1E40AF"],

    // text
    text: textTokens.light.default,
    maintext: textTokens.light.main,
    subtext: textTokens.light.sub,
    placeholder: textTokens.light.placeholder,

    border: "#E5E7EB",
    notification: tokens.primary,

    // semantic
    primary: tokens.primary,
    onPrimary: "#FFFFFF",
    secondary: tokens.secondary,
    danger: tokens.danger,
    success: tokens.success,
    warning: tokens.warning,

    onboardingBg: "#F0F4F8",
    geofenceActive: tokens.primary,
    geofenceInactive: "#9CA3AF",
    taskCard: surfaces.lightTaskCard,
    headerBackground: surfaces.lightBg,
  },
};

export const MyDarkTheme: AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: surfaces.darkBg,
    card: surfaces.darkCard,

    primaryGradient: ["#3B82F6", "#2563EB", "#1E40AF"],

    // text
    text: textTokens.dark.default,
    maintext: textTokens.dark.main,
    subtext: textTokens.dark.sub,
    placeholder: textTokens.dark.placeholder,

    // border: "#1F2937",

    notification: tokens.primary,

    // semantic
    primary: tokens.primary,
    onPrimary: surfaces.darkBg,
    secondary: tokens.secondary,
    danger: tokens.danger,
    success: tokens.success,
    warning: tokens.warning,

    onboardingBg: "#0F1724",
    geofenceActive: tokens.secondary,
    geofenceInactive: "#4B5563",
    taskCard: surfaces.darkTaskCard,
    headerBackground: "#071129",
  },
};

/**
 * Helper selecting theme by mode
 */
export const getThemeByMode = (mode: "light" | "dark") =>
  mode === "dark" ? MyDarkTheme : MyLightTheme;

