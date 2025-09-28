
import React from "react";

export interface SystemNotification {
  id: string;
  type:
    | "fault"
    | "assignment"
    | "update"
    | "reminder"
    | "weather"
    | "info"
    | "alert"
    | "safety"
    | "system"
    | "event";
  message: string;
  timestamp: string; // ISO format
  seen: boolean;
  severity?: "low" | "medium" | "high" | "critical";
  category?: "operations" | "environment" | "maintenance" | "admin" | "safety";
  tags?: string[];
  context?: {
    fault_id?: string;
    assignment_id?: string;
    user_id?: string;
    location?: string;
    region?: string;
    weather?: {
      condition: string;
      severity: "mild" | "moderate" | "severe";
    };
  };
  actions?: {
    label: string;
    type: "navigate" | "acknowledge" | "dismiss" | "external_link";
    payload?: any;
    icon?: string;
  }[];
  created_by?: "system" | "admin" | "supervisor" | string;
  expires_at?: string;
  requires_ack?: boolean;
  pinned?: boolean;
  icon?: string; // For UI customization
}


