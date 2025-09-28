// lib/dev/apiLogger.ts

import React from "react";
import { create } from "zustand";

type ApiLogEntry = {
  method: string;
  endpoint: string;
  status: number;
  payload?: any;
  timestamp: string;
};

interface ApiLoggerState {
  logs: ApiLogEntry[];
  log: (entry: ApiLogEntry) => void;
  clear: () => void;
}

export const useApiLogger = create<ApiLoggerState>((set) => ({
  logs: [],
  log: (entry) =>
    set((state) => ({
      logs: [{ ...entry, timestamp: new Date().toISOString() }, ...state.logs],
    })),
  clear: () => set({ logs: [] }),
}));
