// stores/mutationQueue.ts

import React from "react";
import { create } from "zustand"; 
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type FaultActionType = "COMPLETE" | "DELAY" | "RESOLVE";

export interface FaultAction {
  id: string; // unique for tracking
  faultId: number;
  type: FaultActionType;
  payload?: any;
  createdAt: number;
}

interface MutationQueueStore {
  queue: FaultAction[];
  enqueue: (action: FaultAction) => void;
  dequeue: (id: string) => void;
  clear: () => void;
}

const zustandAsyncStorage: import("zustand/middleware").PersistStorage<MutationQueueStore> = {
  getItem: async (name) => {
    const value = await AsyncStorage.getItem(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

export const useMutationQueue = create<MutationQueueStore>()(
  persist(
    (set) => ({
      queue: [],
      enqueue: (action) =>
        set((state) => ({ queue: [...state.queue, action] })),
      dequeue: (id) =>
        set((state) => ({
          queue: state.queue.filter((a) => a.id !== id),
        })),
      clear: () => set({ queue: [] }),
    }),
    {
      name: "mutation-queue",
      storage: zustandAsyncStorage,
    }
  )
);
