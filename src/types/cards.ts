// ----------------------------- Helpers / Types -----------------------------
import React from "react";

export type StatCardData = {
  id: string;
  title: string;
  superscript:string;
  subscript:string;
  subText:string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | null;
  // children:React;
  onPress?: () => void;
};

export type Escalation = {
  id: string;
  jobId: string;
  level: number;
  reason: string;
  createdAt: string;
  status: "open" | "acknowledged" | "resolved";
};

export type Shift = { 
  id: string;
  name: string;
  time: string;
  supervisor: string;
};

export type Schedule {
  id: string;
  shiftId: string;
  date: string;
  assignedUsers: string[];
}


export type SLARule {
  id: string;
  name: string;
  description: string;
  thresholdHours: number;
}
