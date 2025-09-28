// types/fault.ts

import React from "react";

// import { Coordinates } from '@/src/hooks/useGeolocationTracking';


export type LatLng = { latitude: number; longitude: number };

export type ISODateString = string;

export const SLA_THRESHOLDS: Record<FaultSeverity, number> = {
  critical: 180,
  major: 360,
  moderate: 720,
  minor: 1440,
};

export type FaultSeverity = "critical" | "major" | "moderate" | "minor";

export const SEVERITY_ORDER: Record<FaultSeverity, number> = {
  critical: 1,
  major: 2,
  moderate: 3,
  minor: 4,
};

export type FaultStatus =
  | "active" // field for eachcurrently opened and locked in fault job
  | "pending" // field for artisan jobs yet to be completed
  | "in_progress" //field or use by supercisors to see all active jobs across multiple artisans
  | "resolved" // field for artisan jobs completed
  | "closed" // field for completed jobs ackwoledged by supervisors
  | "cancelled" // field for artisan cancelled, maybe discontinued section etc
  | "on_hold" // field for jobd raised but assignment window extended for whatever reaso
  | "escalated"; // field for jobs raised and on hold but also escalated for whatever reaso

export type FaultHandler = "single" | "individual_team" | "multiple_teams";

export type SLAState = "ok" | "at_risk" | "breached";

export type SLAInfo = { state: SLAState; minutesLeft: number };

// export type FaultCoords = {
//   latitude: number;
//   lng: number;
// };

export type FaultAssigneeRole =
  | "artisan"
  | "supervisor"
  | "contractor"
  | "dispatcher"
  | "inspector";

export type FaultAssignee = {
  id: string;
  name: string;
  role: FaultAssigneeRole;
  contact?: string; // phone or email
};

export type FaultAttachmentType = "image" | "video" | "document" | "audio";

export type FaultAttachment = {
  id: string;
  url: string;
  type: FaultAttachmentType;
  name?: string;
  size?: number;
  uploadedAt: ISODateString;
  uploadedBy?: string; // user ID
};

export type FaultUtilityType = "electricity" | "water" | "gas" | "telecom" | "other";

export type FaultImpact = {
  customersAffected?: number;
  assetsAffected?: string[]; // e.g., transformer IDs, pipelines
  outageScope?: "local" | "regional" | "national";
};

export type FaultTimelineEvent =
  | "reported"
  | "acknowledged"
  | "dispatched"
  | "arrival"
  | "resolved"
  | "closed"
  | "escalated"
  | "on_hold";

export type FaultTimeline = {
  [K in FaultTimelineEvent]?: string; // ISO date string
} & {
  logs?: {
    event: string;
    timestamp: string;
    actorId?: string;
    note?: string;
  }[];
};

export type FaultCost = {
  estimatedCost?: number;
  actualCost?: number;
  currency?: string;
};

export type FaultWeather = {
  impact: boolean;
  condition: string;
  temperature?: number;
  windSpeed?: number;
};

export type FaultRootCauseCategory =
  | "equipment_failure"
  | "human_error"
  | "natural_disaster"
  | "third_party_damage"
  | "unknown";

export type FaultPhase = "single" | "2-phase" | "3-phase" | "N/A";

export type FaultZone =
  | "residential"
  | "industrial"
  | "commercial"
  | "rural"
  | "urban";

export type FaultSource = 
  | "user_report" 
  | "smart_meter" 
  | "control_room" 
  | "automated_detection";

//  Enhanced Geofence Support (circle or polygon)
export type Geofence =
  | {
      type: "circle"; 
      center: LatLng;
      radius: number; // in meters
    }
  | {
      type: "polygon";
      coordinates: LatLng[]; // list of points defining the polygon
    };

  // geofence?: {
  //   type: "circle" | "polygon";
  //   center?: LatLng;
  //   radius?: number;
  //   coordinates?: LatLng[];
  // };

// export type Fault = { // Fault Job
export interface Fault { // Fault Job
  id: string;
  referenceNumber: string;
  
  title: string;
  description?: string;

  utilityType: FaultUtilityType; // e.g., electricity, water
  faultType: string; // e.g., transformer_fault, burst_pipe

  severity: FaultSeverity;
  status: FaultStatus;
  priority?: string; // for sorting
  priorityColor?: string;

  coords: LatLng;
  geofence?: Geofence;
  locationName: string;

  faultHandler: FaultHandler;
  assigned: boolean;
  isTeamJob?: boolean;
  assignedTo?: FaultAssignee | null;
  team?: FaultAssignee[];

  // customerName?: string;
  // customerContact?: string;

  phase: FaultPhase;
  zone: FaultZone;
  source: FaultSource;
  // region?: string; // e.g., Harare North
  // district?: string;

  cause?: string;
  rootCauseCategory?: FaultRootCauseCategory;
  assetId?: string;
  assetType?: string; // e.g., Transformer, RMU

  timeline: FaultTimeline;
  impact?: FaultImpact;
  cost?: FaultCost;
  weather?: FaultWeather;

  attachments?: FaultAttachment[];

  estimatedResolutionTime?: ISODateString;
  sla: {
    targetMinutes: number; // SLA window from createdAt
  };

  customFields?: Record<string, any>; // extensibility for future
}

export type Escalation = {
  id: string;
  faultId: string;
  level: number;
  reason: string;
  createdAt: ISODateString;
  status: "open" | "acknowledged" | "resolved";
};

// SLA helpers
export const minutesBetween = (a: string, b: string) =>
  Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 60000);


// Simple SLA calculator; adapt to your real SLA logic
export function computeSLAState(job: Fault, nowIso?: string): SLAInfo {
  const now = nowIso ? new Date(nowIso) : new Date();
  // const reported = new Date(job.timeline?.reported ?? job.timeline.reported ?? job.timeline.dispatched ?? now.toISOString());
  const reportedIso = job.timeline?.reported ?? job.timeline?.dispatched ?? now.toISOString();
  const reported = new Date(reportedIso);
  const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - reported.getTime()) / 60000));
  const maxMinutes = SLA_THRESHOLDS[job.severity];

  const minutesLeft = maxMinutes - elapsedMinutes;
  const percent = (minutesLeft / maxMinutes) * 100;

  let state: SLAState = "ok";
  if (percent <= 0) state = "breached";
  else if (percent < 20) state = "at_risk";

  return { state, minutesLeft };
}


