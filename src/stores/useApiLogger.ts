import React from "react";
import { create } from 'zustand';

export const useApiLogger = create((set) => ({
  apiLogs: [],
  log: (entry: any) =>
    set((s: any) => ({ apiLogs: [entry, ...s.apiLogs.slice(0, 49)] })), // max 50 logs
  clearLogs: () => set({ apiLogs: [] }),
}));
