
// lib/themeStore.ts 

import React from "react";
import { Appearance } from "react-native";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import AsyncStorage from "@react-native-async-storage/async-storage";



type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const systemPref = Appearance.getColorScheme() === "dark" ? "dark" : "light";

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: systemPref as ThemeMode,
      setMode: (mode: ThemeMode) => set({ mode }),
      toggleMode: () => {
        const next = get().mode === "light" ? "dark" : "light";
        set({ mode: next });
      },
    }),
    {
      name: "utility-theme",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
