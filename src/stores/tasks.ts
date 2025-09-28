// stores/tasks.ts
//useTasksStore: manages the active task, including the geofence.


import React from "react";
import { create } from "zustand";
// import { Task } from "@/types/task";
import { persist } from "zustand/middleware";


// --- Extended Geofence Types ---
type CircularGeofence = {
  type: "circle";
  center: {
    lat: number;
    lon: number;
  };
  radius: number;
};

type PolygonGeofence = {
  type: "polygon";
  coordinates: {
    lat: number;
    lon: number;
  }[];
};

export type Geofence = CircularGeofence | PolygonGeofence;


// upgrade task to accomodate polygon geofences not just circular
export type Task = {
  id: string;
  title: string;
  description: string;
  status: "assigned" | "in_progress" | "completed";
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in meters for legacy use
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  geofence?: Geofence; // NEW: optional geofence support
};

// --- Zustand Store Type ---
type TaskStore = {
  assignedTasks: Task[];
  activeTask: Task | null;
  //Setters
  setAssignedTasks: (tasks: Task[]) => void;
  setActiveTask: (task: Task | null) => void;
  //Task  Actions
  getUpcomingTasks: () => Task[];
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  endTask: () => void;
};

export const useTaskStore = create<TaskStore>() (
  persist(
    (set, get) => ({
      assignedTasks: [],
      activeTask: null,

      // Assign all tasks (on sync or login)
      setAssignedTasks: (tasks) => set({ assignedTasks: tasks }),

      // Set or clear the active task manually
      // Maybe automatic, may make use of other fault jobs geofences to detect closest + priority wiht recommended tag but also allow manual selection
      setActiveTask: (task) => set({ activeTask: task }),

      // Get all assigned tasks except the one in progress
      getUpcomingTasks: () => {
        const activeId = get().activeTask?.id;
        return get().assignedTasks.filter((task) => task.id !== activeId && task.status !== "completed");
      },

      // Transition task into "in_progress" and set timestamps
      // Workout whehter this happens auto or manual, maybe based on active task but think about those times 
      // Started at and completed at should come from the timestamps of geofence, instead add one more for departure, which should be set when user leaves geofense zones denoted as bases or depots
      startTask: (taskId) => {
        const task = get().assignedTasks.find((t) => t.id === taskId);
        if (!task) {
          console.warn("❌ Task not found:", taskId);
          return;
        }

        const updatedTask = {
          ...task,
          status: "in_progress",
          startedAt: new Date().toISOString(),
        };

        set({
          activeTask: updatedTask,
          assignedTasks: get().assignedTasks.map((t) =>
            t.id === taskId ? updatedTask : t
          ),
        });

        console.log("🚀 Task started:", updatedTask.id);
      },

      // Mark task completed and clear active
      completeTask: (taskId) => {
        const updatedTasks = get().assignedTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: "completed",
                completedAt: new Date().toISOString(),
              }
            : task
        );

        set({
          assignedTasks: updatedTasks,
          activeTask: null,
        });

        console.log("✅ Task completed:", taskId);
      },

      // Cancel task or force-stop tracking
      endTask: () => {
        const ended = get().activeTask;
        if (ended) {
          console.log("⛔ Task ended:", ended.id);
        }
        set({ activeTask: null });
      },
    }),
    {
      name: "task-store",
    }
  )
);

// export const useTaskStore = create<TaskStore>()(
//   persist(
//     (set, get) => ({
//       tasks: [],
//       activeTask: null,

//       setTasks: (tasks) => set({ tasks }),

//       setActiveTask: (task) => set({ activeTask: task }),

//       getUpcomingTasks: () => {
//         const activeId = get().activeTask?.id;
//         return get().tasks.filter((task) => task.id !== activeId);
//       },

//       clearTasks: () => set({ tasks: [], activeTask: null }),
//     }),
//     {
//       name: "assigned-tasks-store",
//     }
//   )
// );


// store/tasks.ts
// import { create } from "zustand";

// export interface Geofence {
//   center: { lat: number; lon: number };
//   radius: number;
// }

// export interface Task {
//   id: string;
//   title: string;
//   geofence?: Geofence;
//   // other fields...
// }

// interface TasksState {
//   activeTask: Task | null;
//   setActiveTask: (task: Task | null) => void;
// }

// export const useTasksStore = create<TasksState>((set) => ({
//   activeTask: null,
//   setActiveTask: (task) => set({ activeTask: task }),
// }));
