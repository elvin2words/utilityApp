// hooks/useFaultsQuery.ts
// Centralized faultjob fetching & enrichment logic
// - Enriched fetches from API when online
// - Cache for offline / API failure
// - Mock data fallback in dev
// - Query invalidation & refresh
// - Auto-refresh every 15 min (checked every 5 min)

// Should be able to set or pick out currently actie or ogged in fault job, 
// make an ordered queue of other assigned tasks pending for the artisan

import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import Toast from "react-native-toast-message";

import { useQueryClient, useMutation } from "@tanstack/react-query";

import { fetchWeatherImpact } from "@/src/hooks/useWeather";
import { Coordinates } from "@/src/hooks/useGeolocationTracking";

import { API_BASE_URL } from "@/src/lib/constants";
import { getTravelTime } from "@/src/lib/navigation";
import { assignPriorityColor } from "@/src/lib/utils";
import { getCachedJobs, cacheJobs } from "@/src/lib/jobCache";

import { Fault, FaultStatus, FaultSeverity } from "@/src/types/faults";

import mockFaults from "@/assets/mocks/mockFaults.json";

import {
  addPendingAssignment,
  clearPendingAssignments,
  getPendingAssignments,
} from "@/src/utils/assignmentQueue";


// -------------------- Utils --------------------
const normalizeFault = (f: any): Fault => ({
  id: f.id || `fault-${Math.random().toString(36).slice(2)}`, //substring(2)
  referenceNumber: f.referenceNumber,
  utilityType: f.utilityType || "electricity",
  faultType: f.faultType || "unknown",

  status: (f.status as FaultStatus) || "pending",
  severity: (f.severity as FaultSeverity) || "moderate",

  priority: f.priority ?? 3,
  priorityColor: f.priorityColor || "#FFA500",

  title: f.title || "Untitled Fault",
  description: f.description || "Generated mock fault for testing.",

  faultHandler: f.faultHandler || "single",
  isTeamJob: f.isTeamJob ?? false,
  assignedTo: f.assignedTo || null,
  team: f.team || [],

  coords: f.coords || { latitude: 0, longitude: 0 },
  geofence: f.geofence,
  locationName: f.locationName || "Unknown Location",

  customerName: f.customerName,
  customerContact: f.customerContact,

  phase: f.phase || "N/A",
  zone: f.zone || "urban",
  source: f.source || "user_report",

  cause: f.cause,
  rootCauseCategory: f.rootCauseCategory || "unknown",
  estimatedResolutionTime: f.estimatedResolutionTime,

  timeline: {
    reported: f.timeline?.reportedAt || new Date().toISOString(),
    acknowledged: f.timeline?.acknowledged,
    dispatched: f.timeline?.dispatched,
    arrival: f.timeline?.arrival,
    resolved: f.timeline?.resolved,
    closed: f.timeline?.closed,
  },

  impact: f.impact || { customersAffected: 0, assetsAffected: [] },
  cost: f.cost || { estimatedCost: 0, currency: "USD" },
  weather: f.weather || { impact: false, condition: "clear" },

  attachments: f.attachments || [],
  customFields: f.customFields || {},
});

const mapSeverity = (severity: Fault["severity"]): "critical" | "moderate" | "low" => {
  if (severity === "critical" || severity === "major") return "critical";
  if (severity === "moderate") return "moderate";
  return "low";
};

const isUserAssigned = (fault: Fault, userId: string): boolean =>
  fault?.assignedTo?.id === userId ||
  fault?.team?.some((m) => m.id === userId) ||
  false;

const safeFetchJSON = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const text = await res.text();
    if (!text) throw new Error("Empty response body");
    return JSON.parse(text);
  } catch (err) {
    console.warn("Fetch failed, falling back to cache/mock:", err);
    return null;
  }
};

// -------------------- Enrichment --------------------
const enrichFault = async (
  fault: Fault,
  location: Coordinates | null,
  enrichmentCache: Map<string, any>
) => {
  if (!fault) return fault;

  let cached = enrichmentCache.get(fault.id);
  if (!cached) {
    const weatherImpact = await fetchWeatherImpact(fault.coords);
    const priorityColor = assignPriorityColor(
      mapSeverity(fault.severity),
      (fault.status as "open" | "in_progress" | "resolved") || "open",
      fault.estimatedResolutionTime,
      weatherImpact?.impact ?? false,
      undefined // travelTime handled separately
    );

    cached = { weather: weatherImpact, priorityColor };
    enrichmentCache.set(fault.id, cached);
  }

  const travelTime = location ? await getTravelTime(location, fault.coords) : undefined;
  return { ...fault, ...cached, travelTime };
};

// -------------------- Hook --------------------
interface UseFaultsQueryProps {
  isOnline: boolean;
  user: { id: string; role: string };
  location?: Coordinates | null;
  useMockData?: boolean;
  selectedFilter?: string;
}


export const useFaultsQuery = ({
  isOnline,
  user,
  location,
  useMockData,
  selectedFilter,
}: UseFaultsQueryProps) => {
  const queryClient = useQueryClient();
  const enrichmentCache = useRef<Map<string, any>>(new Map());

  const [faults, setFaults] = useState<Fault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

  const safeUser = user ?? { id: "anon", role: "guest" };

  // -------- Fetch & enrich pipeline --------
  const fetchAndEnrichFaults = useCallback(async (): Promise<Fault[]> => {
    if (safeUser.id === "anon") return [];

    setLoading(true);
    let jobs: Fault[] = [];

    try {
      if (isOnline) {
        const url =
          safeUser.role === "supervisor"
            ? `${API_BASE_URL}/faults`
            : `${API_BASE_URL}/artisans/${safeUser.id}/faults`;

        const response = await safeFetchJSON(url);
        if (response) {
          jobs = response;
          cacheJobs(jobs);
        }
      }

      if (!jobs.length) {
        const cached = await getCachedJobs();
        if (cached) {
          try {
            jobs = JSON.parse(cached);
          } catch {
            console.warn("Invalid cached data, ignoring");
          }
        }
      }

      if (!jobs.length && useMockData) {
        console.info("Using mock data fallback");
        jobs = mockFaults.map(normalizeFault);
      }

      const visibleJobs =
        safeUser.role === "supervisor"
          ? jobs
          : jobs.filter((f) => isUserAssigned(f, safeUser.id));

      const enriched = await Promise.all(
        visibleJobs.map((f) => enrichFault(f, location ?? null, enrichmentCache.current))
      );

      if (!enriched.length && safeUser.role !== "supervisor") {
        Toast.show({ type: "info", text1: "No fault jobs assigned.", visibilityTime: 3000 });
      }

      setFaults(enriched);
      return enriched;
    } catch (err: any) {
      console.error("fetchAndEnrichFaults failed:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isOnline, safeUser, location, useMockData]);

  // -------- Refresh & auto-refresh --------
  const refreshFaults = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["faults"] });
    setLastRefreshTime(Date.now());
    return fetchAndEnrichFaults();
  }, [fetchAndEnrichFaults, queryClient]);

  // periodic auto-refresh (static enrichment)
  useEffect(() => {
    fetchAndEnrichFaults();
    const interval = setInterval(() => {
      console.log("Auto-refresh: checking faults…");
      if (isOnline && Date.now() - lastRefreshTime > 15 * 60 * 1000) {
        fetchAndEnrichFaults();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isOnline, lastRefreshTime, fetchAndEnrichFaults]);

  // -------- Mutations --------
  const updateFaultAssignment = useCallback(
    async (faultId: string, assigneeId: string) => {
      if (!isOnline) {
        await addPendingAssignment({ faultId, assigneeId, timestamp: Date.now() });
        Toast.show({ type: "error", text1: "Reassignment queued (offline)" });
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/faults/${faultId}/assign`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedTo: assigneeId }),
        });
        if (!res.ok) throw new Error("Failed to assign");
        await refreshFaults();
      } catch (err) {
        await addPendingAssignment({ faultId, assigneeId, timestamp: Date.now() });
        Toast.show({ type: "error", text1: "Reassignment failed, queued" });
      }
    },
    [isOnline, refreshFaults]
  );

  const updateFaultTeamAssignment = useCallback(
    async (faultId: string, teamId: string) => {
      if (!isOnline) {
        await addPendingAssignment({ faultId, teamId, timestamp: Date.now() });
        Toast.show({ type: "error", text1: "Team assignment queued (offline)" });
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/faults/${faultId}/assign-team`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ team_id: teamId }),
        });
        if (!res.ok) throw new Error("Failed to assign team");
        Toast.show({ type: "success", text1: "Job assigned to team" });
        await refreshFaults();
      } catch {
        await addPendingAssignment({ faultId, teamId, timestamp: Date.now() });
        Toast.show({ type: "error", text1: "Team assignment failed, queued" });
      }
    },
    [isOnline, refreshFaults]
  );

  const assignMut = useMutation({
    mutationFn: async ({ faultId, teamId }: { faultId: string; teamId: string }) => {
      const res = await fetch(`${API_BASE_URL}/faults/${faultId}/assign-team`, {
        method: "POST",
        body: JSON.stringify({ teamId }),
      });
      if (!res.ok) throw new Error("Assign failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["faults"]);
      Toast.show({ type: "success", text1: "Assigned" });
    },
    onError: () => Toast.show({ type: "error", text1: "Assign failed" }),
  });

  const statusMut = useMutation({
    mutationFn: async ({ faultId, status }: { faultId: string; status: FaultStatus }) => {
      const res = await fetch(`${API_BASE_URL}/jobs/${faultId}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Status change failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["faults"]);
      Toast.show({ type: "success", text1: "Status updated" });
    },
    onError: () => Toast.show({ type: "error", text1: "Status update failed" }),
  });

  // -------- Sync pending assignments --------
  useEffect(() => {
    if (!isOnline) return;
    (async () => {
      const pending = await getPendingAssignments();
      for (const item of pending) {
        try {
          if (item.assigneeId) {
            await updateFaultAssignment(item.faultId, item.assigneeId);
          } else if (item.teamId) {
            await updateFaultTeamAssignment(item.faultId, item.teamId);
          }
        } catch (err) {
          console.warn("Failed to sync pending assignment", item, err);
        }
      }
      await clearPendingAssignments();
      await refreshFaults();
    })();
  }, [isOnline]);

  // -------- Derived filters --------
  const filters = useMemo(() => {
    const data = faults ?? [];
    const validFaults = data.filter((f) => !!f.coords);

    const enrichedFaults = validFaults.map((f) => ({
      ...f,
      assignedToUser: isUserAssigned(f, safeUser.id),
      isTeamJob: !!f.team,
    }));

    const filteredFaults =
      selectedFilter === "all"
        ? enrichedFaults
        : enrichedFaults.filter((f) => f.status === selectedFilter);

    const openFaults = enrichedFaults.filter((f) =>
      ["open", "pending", "active"].includes(f.status)
    );

    const primaryFault =
      openFaults.find((f) => f.faultType === "single") ??
      openFaults.find((f) => f.faultType === "team_single") ??
      openFaults[0];

    const displayedFaults = enrichedFaults.filter(
      (f) => f.status !== "in_progress" || f.isTeamJob
    );

    const activeFault = enrichedFaults.find(
      (f) => f.status === "active" && !f.isTeamJob
    );

    return {
      validFaults,
      enrichedFaults,
      filteredFaults,
      openFaults,
      primaryFault,
      displayedFaults,
      activeFault,
      getFaultsByAssignee: (assigneeId: string) =>
        enrichedFaults.filter((f) => f.assignedTo?.id === assigneeId),
      filterByStatus: (statuses: Fault["status"][]) =>
        data.filter((f) => statuses.includes(f.status)),
      filterBySeverity: (severities: Fault["severity"][]) =>
        data.filter((f) => severities.includes(f.severity)),
      filterByZone: (zones: Fault["zone"][]) =>
        data.filter((f) => zones.includes(f.zone)),
      getFaultById: (id: string) => data.find((f) => f.id === id),
      getActiveFaults: () =>
        data.filter((f) => ["active", "in_progress"].includes(f.status)),
      getTeamAssignments: (userId: string) =>
        data.filter(
          (f) =>
            f.assignedTo?.id === userId ||
            f.team?.some((member) => member.id === userId)
        ),
    };
  }, [faults, safeUser.id, selectedFilter]);

  return {
    faults,
    loading,
    error,
    refreshFaults,
    updateFaultAssignment,
    updateFaultTeamAssignment,
    assignMut,
    statusMut,
    ...filters,
  };
};
