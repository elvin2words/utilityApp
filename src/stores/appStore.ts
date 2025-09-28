// stores/appStore.ts 

import React from "react";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";



type AppState = { 
  username: string;
  isOnline: boolean;
  isInGeofence: boolean;
  badges: Record<string, number>; // e.g. { Tasks: 3, Notifications: 5 }
  showMockData: boolean;
  fabVisible: boolean;
  
  // setters
  setUsername: (name: string) => void;
  resetUsername: () => void;
  
  setIsOnline: (online: boolean) => void;
  setIsInGeofence: (geofence: boolean) => void;
  
  setBadgeCount: (tab: string, count: number) => void;
  resetBadges: () => void;

  setFABVisible: (val: boolean) => void;
  toggleFAB: () => void;
  
  toggleMockData: () => void;

  // helpers  
  totalBadges: () => number;
  resetAll: () => void;
};


export const useAppStore = create<AppState & { fabVisible: boolean; toggleFAB: () => void; setFABVisible: (val: boolean) => void }>()(
  persist(
    (set, get) => {
      // Initialize network subscription once
      NetInfo.addEventListener((state) => {
        const online = Boolean(state.isConnected && state.isInternetReachable);
        set({ isOnline: online });
      });



      return {
        username: "Guest",
        isOnline: false,
        isInGeofence: false,
        badges: {},

        fabVisible: true, // new FAB state
        showMockData: true, // default ON
        
        setFABVisible: (val: boolean) => set({ fabVisible: val }),
        toggleFAB: () => set((state) => ({ fabVisible: !state.fabVisible })),

        toggleMockData: () =>
          set((state) => ({ showMockData: !state.showMockData })),

        setUsername: (name) => set({ username: name }),
        resetUsername: () => set({ username: "Guest" }),

        setIsOnline: (online) => set({ isOnline: online }),
        setIsInGeofence: (inGeo) => set({ isInGeofence: inGeo }),

        setBadgeCount: (tab, count) =>
          set((state) => ({ badges: { ...state.badges, [tab]: count } })),

        resetBadges: () => set({ badges: {} }),

        totalBadges: () => {
          const badges = get().badges;
          return Object.values(badges).reduce((sum, n) => sum + (n || 0), 0);
        },

        resetAll: () =>
          set({
            username: "Guest",
            isOnline: false,
            isInGeofence: false,
            badges: {},
            fabVisible: true,
            showMockData: true,
          }),
      };

    },
    {
      name: "utility-app-store",
      // Use createJSONStorage to ensure we use AsyncStorage correctly
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);