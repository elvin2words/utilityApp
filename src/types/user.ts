import React from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "artisan" | "supervisor" | "manager" | "dispatcher" | "admin";
  isActive?: boolean;
  lastActive?: string; // ISO timestamp
  avatarUrl?: string;
  region?: string;
  skills?: string[]; // optional, useful for dispatch logic
}


export type Team = {
  id: string;
  name: string;
  skills?: string[]; // e.g., ["HV", "LV", "Communication"]
  capacity?: number; // open jobs capacity
  region: string;
  members?: User[];
};