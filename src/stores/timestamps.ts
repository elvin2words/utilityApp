// //stores/timestamps.ts
//useLocalTimestampsStore: manages current geofence status and timestamp data, syncs when online.
// import { create } from "zustand";
// import { persist } from "zustand/middleware";
// // import { getDateTimeString } from "@/lib/utils"; // Optional helper

// export type GeofenceEvent = {
//   taskId: string;
//   type: "enter" | "exit";
//   timestamp: string; // ISO format
// };

// type TimestampStore = {
//   events: GeofenceEvent[];
//   addEvent: (event: Omit<GeofenceEvent, "timestamp">) => void;
//   clearEvents: () => void;
//   getEventsByTask: (taskId: string) => GeofenceEvent[];
// };

// export const useTimestampStore = create<TimestampStore>()(
//   persist(
//     (set, get) => ({
//       events: [],
//       addEvent: ({ taskId, type }) =>
//         set((state) => ({
//           events: [
//             ...state.events,
//             {
//               taskId,
//               type,
//               timestamp: new Date().toISOString(),
//             },
//           ],
//         })),
//       clearEvents: () => set({ events: [] }),
//       getEventsByTask: (taskId) =>
//         get().events.filter((e) => e.taskId === taskId),
//     }),
//     {
//       name: "geofence-timestamps",
//     }
//   )
// );


// stores/timestamps.ts
// import { create } from "zustand";

// type TimestampState = {
//   isInGeofence: boolean;
//   entryTimestamp: Date | null;
//   exitTimestamp: Date | null;
//   setInGeofence: (valOrUpdater: boolean | ((prev: boolean) => boolean)) => void;
//   setEntryTimestamp: (ts: Date | null) => void;
//   setExitTimestamp: (ts: Date | null) => void;
//   clearTimestamps: () => void;
//   syncTimestamps: () => void; // for future use
// };

// export const useTimestampStore = create<TimestampState>((set, get) => ({
//   isInGeofence: false,
//   entryTimestamp: null,
//   exitTimestamp: null,
//   setInGeofence: (valOrUpdater) =>
//     set((state) => {
//       const value =
//         typeof valOrUpdater === "function"
//           ? valOrUpdater(state.isInGeofence)
//           : valOrUpdater;
//       return { isInGeofence: value };
//     }),
//   setEntryTimestamp: (ts) => set({ entryTimestamp: ts }),
//   setExitTimestamp: (ts) => set({ exitTimestamp: ts }),
//   clearTimestamps: () =>
//     set({
//       isInGeofence: false,
//       entryTimestamp: null,
//       exitTimestamp: null,
//     }),
//   syncTimestamps: () => {
//     const { entryTimestamp, exitTimestamp } = get();
//     console.log("Syncing timestamps", { entryTimestamp, exitTimestamp });
//     // Implement backend sync if needed
//   },
// }));




// // store/timestamps.ts
// import { create } from "zustand";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// interface TimestampsState {
//   isInGeofence: boolean;
//   entryTimestamp: Date | null;
//   exitTimestamp: Date | null;
//   setInGeofence: (fn: (prev: boolean) => boolean) => void;
//   setEntryTimestamp: (time: Date) => void;
//   setExitTimestamp: (time: Date) => void;
//   clearTimestamps: () => void;
//   syncTimestamps: () => Promise<void>;
// }

// export const useLocalTimestampsStore = create<TimestampsState>((set, get) => ({
//   isInGeofence: false,
//   entryTimestamp: null,
//   exitTimestamp: null,

// //   setInGeofence: (fn) => set((state) => ({ isInGeofence: fn(state.isInGeofence) })),
//   setInGeofence: () => set((state) => ({ isInGeofence: (state.isInGeofence) })),
//   setEntryTimestamp: (time) => set({ entryTimestamp: time }),
//   setExitTimestamp: (time) => set({ exitTimestamp: time }),

//   clearTimestamps: () =>
//     set({
//       entryTimestamp: null,
//       exitTimestamp: null,
//       isInGeofence: false,
//     }),

//   syncTimestamps: async () => {
//     const { entryTimestamp, exitTimestamp } = get();

//     if (entryTimestamp || exitTimestamp) {
//       try {
//         // Replace this with real API sync logic
//         console.log("🔄 Syncing timestamps", {
//           entry: entryTimestamp?.toISOString(),
//           exit: exitTimestamp?.toISOString(),
//         });

//         // Example: store locally first
//         await AsyncStorage.setItem(
//           "lastSyncedGeofenceLog",
//           JSON.stringify({ entryTimestamp, exitTimestamp })
//         );

//         get().clearTimestamps(); // Reset after syncing
//       } catch (e) {
//         console.error("❌ Failed to sync timestamps", e);
//       }
//     }
//   },
// }));


// stores/geofenceTimestamps.ts
import React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

export type GeofenceEvent = {
  taskId: string;
  type: "enter" | "exit";
  timestamp: string; // ISO format
  synced?: boolean; // mark if successfully synced
};

type GeofenceTimestampsStore = {
  // Session state
  activeTaskId: string | null;  
  isInGeofence: boolean;
  entryTimestamp: Date | null;
  exitTimestamp: Date | null;

  // Event log
  events: GeofenceEvent[];

  // Setters
  setActiveTask: (taskId: string | null) => void;
  setInGeofence: (fn: (prev: boolean) => boolean) => void;
  setEntryTimestamp: (time: Date) => void;
  setExitTimestamp: (time: Date) => void;
  addEvent: (event: Omit<GeofenceEvent, "timestamp" | "synced">) => void;

  // Utilities
  clearSessionTimestamps: () => void;
  clearAllEvents: () => void;
  getEventsByTask: (taskId: string) => GeofenceEvent[];
  syncTimestamps: () => Promise<void>;
  addTimestamp: (taskId: string, type: "enter" | "exit", coords: { latitude: number; longitude: number }) => void;
  // other properties/method
};

export const useGeofenceTimestampsStore = create<GeofenceTimestampsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      activeTaskId: null,
      // Session
      isInGeofence: false,
      entryTimestamp: null,
      exitTimestamp: null,

      // Event log
      events: [],

      // Setters
      setActiveTask: (taskId) => set({ activeTaskId: taskId }),
      setInGeofence: (fn) =>
        set((state) => ({ isInGeofence: fn(state.isInGeofence) })),
      setEntryTimestamp: (time) => set({ entryTimestamp: time }),
      setExitTimestamp: (time) => set({ exitTimestamp: time }),

      // Add a new event to log
      addEvent: ({ taskId, type }) =>
        set((state) => ({
          events: [
            ...state.events,
            {
              taskId,
              type,
              timestamp: new Date().toISOString(),
              synced: false,
            },
          ],
        })),
      
      // Filter events by task
      getEventsByTask: (taskId) =>
        get().events.filter((e) => e.taskId === taskId),

      removeEventsByTask: (taskId: string) =>
        set((state) => ({
          events: state.events.filter((e) => e.taskId !== taskId),
        })),

      // Clear only the session state
      clearSessionTimestamps: () =>
        set({
          isInGeofence: false,
          entryTimestamp: null,
          exitTimestamp: null,
        }),

      // Clear everything (manual)
      clearAllEvents: () => set({ events: [] }),

      // Sync to server
      syncTimestamps: async () => {
        const { events } = get();
        const unsynced = events.filter((e) => !e.synced);

        if (unsynced.length === 0) return;

      //   const { entryTimestamp, exitTimestamp, clearSessionTimestamps } = get();

      //   if (entryTimestamp || exitTimestamp) {
      //     try {
      //       console.log("🔄 Syncing timestamps", {
      //         entry: entryTimestamp?.toISOString(),
      //         exit: exitTimestamp?.toISOString(),
      //       });

      //       await AsyncStorage.setItem(
      //         "lastSyncedGeofenceLog",
      //         JSON.stringify({
      //           entryTimestamp,
      //           exitTimestamp,
      //         })
      //       );

      //       clearSessionTimestamps();
      //     } catch (e) {
      //       console.error("❌ Failed to sync timestamps", e);
      //     }
      //   }
      // },
       try {
          // Replace with actual API call
          console.log("🔄 Syncing to server:", unsynced);

          // Simulate success
          await new Promise((res) => setTimeout(res, 1000));

          // Update synced flag
          const updatedEvents = events.map((e) =>
            unsynced.includes(e) ? { ...e, synced: true } : e
          );

          set({ events: updatedEvents });

          // Optionally store sync info
          await AsyncStorage.setItem(
            "lastSyncTime",
            new Date().toISOString()
          );
        } catch (e) {
          console.error("❌ Sync failed, will retry later", e);
        }
      },
      addTimestamp: (taskId, type, coords) => {
        // Implement logic to add a timestamp (e.g., push to an array or send to backend)
        // Example:
        console.log(`Timestamp added for task ${taskId}: ${type} at`, coords);
      },
      // other methods
    }),
    {
      name: "geofence-timestamps-store", 
      storage: AsyncStorage,
    }
  )
);

// useGeofenceTimestampsStore.getState().addEvent({ taskId: "123", type: "enter" });
// await useGeofenceTimestampsStore.getState().syncTimestamps();
//const logs = useGeofenceTimestampsStore.getState().getEventsByTask("123");



