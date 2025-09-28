// stores/artisanStore

import React from "react";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Fault } from "@/src/types/faults";
import { SystemNotification } from "@/src/types/notification";

interface ArtisanStore {
  activeJob: Fault | null;
  upcomingJobs: Fault[]; 
  notifications: Notification[];

  tasks: any[]; // Fault+Assignment combined

  setActiveJob: (job: Fault | null) => void;
  setUpcomingJobs: (jobs: Fault[]) => void;
  setNotifications: (notifs: Notification[]) => void;

  setTasks: (tasks: any[]) => void;

  clear: () => void;
}

export const useArtisanStore = create<ArtisanStore>()(
  persist(
    (set) => ({
      activeJob: null,
      upcomingJobs: [],
      notifications: [],

      tasks: [],

      setActiveJob: (job) => set({ activeJob: job }),
      setUpcomingJobs: (jobs) => set({ upcomingJobs: jobs }),
      setNotifications: (notifs) => set({ notifications: notifs }),

      setTasks: (tasks) => set({ tasks }),

      clear: () =>
        set({ activeJob: null, upcomingJobs: [], notifications: [] }),
    }),
    {
      name: "artisan-store", // storage key
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeJob: state.activeJob,
        upcomingJobs: state.upcomingJobs,
        notifications: state.notifications,

        tasks: state.tasks,
      }), // only persist what matters
    }
  ),
);
