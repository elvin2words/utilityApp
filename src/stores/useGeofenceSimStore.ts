import React from "react";
import { create } from 'zustand';

export const useGeofenceSimStore = create((set) => ({
  isSimulatingEntry: false,
  isSimulatingExit: false,
  toggleEntrySim: () => set((s) => ({ isSimulatingEntry: !s.isSimulatingEntry })),
  toggleExitSim: () => set((s) => ({ isSimulatingExit: !s.isSimulatingExit })),
}));
 