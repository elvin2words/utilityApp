// lib/dev/devConfigStore.ts

import React from "react";
import { create } from "zustand";

type Env = "development" | "staging" | "production";

interface DevConfigState {
  environment: Env;
  developerFlags: {
    mockLogin: boolean;
    forceSync: boolean;
    offlineMode: boolean;
  };
  setEnvironment: (env: Env) => void;
  toggleFlag: (key: keyof DevConfigState["developerFlags"]) => void;
}

export const useDevConfigStore = create<DevConfigState>((set) => ({
  environment: "development",
  developerFlags: {
    mockLogin: false,
    forceSync: false,
    offlineMode: false,
  },
  setEnvironment: (env) => set({ environment: env }),
  toggleFlag: (key) =>
    set((state) => ({
      developerFlags: {
        ...state.developerFlags,
        [key]: !state.developerFlags[key],
      },
    })),
}));
