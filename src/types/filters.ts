import React from "react";
import { FaultStatus, FaultAssignee, FaultSeverity } from "./faults";


export type FaultJobsScreenFilters = {
  search: string;
  statuses: FaultStatus[]; // multi
  severities: FaultSeverity[]; // multi
  assignedTo: FaultAssignee[] | "all";
  sla: ("ok" | "at_risk" | "breached" | "all");
  dateRange: "24h" | "7d" | "30d" | "all";
  sort: "priority" | "sla" | "createdAt";  // or use Tiemlien Object
  teamId?: string; // Added property for team filtering
};

