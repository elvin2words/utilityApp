import React from "react";
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist } from "zustand/middleware";

interface Fault {
  id: number;
  refNo: string;
  status: string;
  coordinates: { lat: number; lng: number };
  severity: "low" | "medium" | "high";
  eta?: string;
}

interface FaultStore {
  faults: Fault[];
  setFaults: (faults: Fault[]) => void;
  updateFault: (id: number, updates: Partial<Fault>) => void;
}

export const useFaultStore = create<FaultStore>()(
  persist(
    (set) => ({
      faults: [],
      setFaults: (faults) => set({ faults }),
      updateFault: (id, updates) =>
        set((state) => ({
          faults: state.faults.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        })),
    }),
    { name: "faults-cache", storage: AsyncStorage }
  )
);
