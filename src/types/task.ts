import React from "react";

// types/task.ts
export type Task = {
  id: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in meters
  status: "assigned" | "in_progress" | "completed";
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
};
