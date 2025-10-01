// utils/normalizeFault.ts

import {
  Fault,
  FaultAssignee,
  FaultStatus,
  FaultHandler,
  FaultPhase,
  FaultZone,
  FaultSource,
  FaultSeverity,
  FaultTimeline,
  FaultUtilityType,
  FaultAttachment,
  FaultImpact,
  FaultCost,
  FaultWeather,
  SLA_THRESHOLDS,
} from "@/src/types/faults";

/**
 * Normalize raw API response or mock JSON into a strongly typed Fault object.
 */
export function normalizeFault(raw: any): Fault {
  const status: FaultStatus =
    raw.status && typeof raw.status === "string" ? raw.status : "pending";

  const severity: FaultSeverity =
    raw.severity && ["critical", "major", "moderate", "minor"].includes(raw.severity)
      ? raw.severity
      : "moderate";

  const faultHandler: FaultHandler =
    raw.faultHandler && ["single", "individual_team", "multiple_teams"].includes(raw.faultHandler)
      ? raw.faultHandler
      : "single";

  const coords = raw.coords
    ? { latitude: Number(raw.coords.latitude), longitude: Number(raw.coords.longitude) }
    : { latitude: 0, longitude: 0 };

  const assignedTo: FaultAssignee | null =
    raw.assignedTo && raw.assignedTo.id
      ? {
          id: String(raw.assignedTo.id),
          name: raw.assignedTo.name ?? "Unknown",
          role: raw.assignedTo.role ?? "artisan",
          contact: raw.assignedTo.contact,
        }
      : null;

  const team: FaultAssignee[] = Array.isArray(raw.team)
    ? raw.team.map((m: any) => ({
        id: String(m.id),
        name: m.name ?? "Unknown",
        role: m.role ?? "artisan",
        contact: m.contact,
      }))
    : [];

  const attachments: FaultAttachment[] = Array.isArray(raw.attachments)
    ? raw.attachments.map((a: any) => ({
        id: String(a.id),
        url: a.url,
        type: a.type ?? "image",
        name: a.name,
        size: a.size,
        uploadedAt: a.uploadedAt ?? new Date().toISOString(),
        uploadedBy: a.uploadedBy,
      }))
    : [];

  const timeline: FaultTimeline = raw.timeline ?? { reported: new Date().toISOString() };

  return {
    id: String(raw.id ?? crypto.randomUUID()),
    referenceNumber: raw.referenceNumber ?? `REF-${Date.now()}`,
    title: raw.title ?? "Untitled Fault",
    description: raw.description ?? "",

    utilityType: (raw.utilityType as FaultUtilityType) ?? "electricity",
    faultType: raw.faultType ?? "unknown",

    severity,
    status,
    priority: raw.priority,
    priorityColor: raw.priorityColor,

    coords,
    geofence: raw.geofence,
    locationName: raw.locationName ?? "Unknown Location",

    faultHandler,
    assigned: raw.assigned ?? false,
    isTeamJob: raw.isTeamJob ?? team.length > 1,
    assignedTo,
    team,

    phase: (raw.phase as FaultPhase) ?? "N/A",
    zone: (raw.zone as FaultZone) ?? "urban",
    source: (raw.source as FaultSource) ?? "user_report",

    cause: raw.cause,
    rootCauseCategory: raw.rootCauseCategory,
    assetId: raw.assetId,
    assetType: raw.assetType,

    timeline,
    impact: raw.impact as FaultImpact,
    cost: raw.cost as FaultCost,
    weather: raw.weather as FaultWeather,

    attachments,

    estimatedResolutionTime: raw.estimatedResolutionTime,
    sla: {
      targetMinutes: SLA_THRESHOLDS[severity],
    },

    customFields: raw.customFields ?? {},
  };
}
