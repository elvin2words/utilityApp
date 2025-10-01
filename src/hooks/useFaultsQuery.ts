// hooks/useFaultsQuery.ts

/**
 * useFaultsQuery
 *
 * Responsibilities:
 * - fetch faults (online -> cache -> mock)
 * - normalize + enrich (weather eagerly, travelTime lazily)
 * - expose derived lists (active, upcoming, etc.)
 * - unified assignment mutation (single/multi/team) with optimistic update + offline queue
 * - status mutation with optimistic update + offline queue
 * - auto-selection (geo + priority + ETA) while respecting "resolved/closed" preservation
 * - offline sync (replay pending assignments and status updates)
 */

import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import Toast from "react-native-toast-message";
import { useQueryClient, useMutation } from "@tanstack/react-query";

import { fetchWeatherImpact } from "@/src/hooks/useWeather";
import { Coordinates, useGeolocationOnce } from "@/src/hooks/useGeolocationTracking";

import { API_BASE_URL } from "@/src/lib/constants";
import { getTravelTime } from "@/src/lib/navigation";
import { assignPriorityColor } from "@/src/lib/utils";
import { getCachedJobs, cacheJobs } from "@/src/lib/jobCache";

import { Fault, FaultStatus, FaultSeverity } from "@/src/types/faults";

import mockFaults from "@/assets/mocks/mockFaults.json";

import {
  addPendingAssignment,
  clearPendings,
  getPendingAssignments,
  getPendingUpdates,
  addPendingStatusUpdate
} from "@/src/utils/queues";

import { useArtisanStore } from "@/src/stores/artisanStore";
import { calculateDistance } from "@/src/utils/adjustTrackingSettings";
import { normalizeFault } from "@/src/utils/normalizeFault";



const mapSeverity = (severity: Fault["severity"]): "critical" | "moderate" | "low" => {
  if (severity === "critical" || severity === "major") return "critical";
  if (severity === "moderate") return "moderate";
  return "low";
};

const isUserAssigned = (fault: Fault, userId: string): boolean =>
  !!(
    fault?.assignedTo?.id === userId ||
    fault?.team?.some((m) => m.id === userId)
  );

// safer fetch with simple retries and clearer logs
const safeFetchJSON = async (url: string, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const text = await res.text();
      if (!text) throw new Error("Empty response body");
      return JSON.parse(text);
    } catch (err) {
      console.warn(`[Fetch attempt ${i+1}] Failed for ${url}`, err);
      if (i === retries) throw err; // rethrow after last retry
      // small delay before retry
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
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
  // optional tuning parameters:
  autoSelectConfig?: {
    maxGeoLockDistance?: number; // meters
    distanceWeight?: number;
    priorityWeight?: number;
    etaWeight?: number;
  };
}

export const useFaultsQuery = ({
  isOnline,
  user,
  location,
  useMockData=false,
  selectedFilter="all",
  autoSelectConfig,
}: UseFaultsQueryProps) => {
  const queryClient = useQueryClient();
  const enrichmentCache = useRef<Map<string, any>>(new Map());
  const mountedRef = useRef(true);

  const { activeJob: storeActiveJob, setActiveJob } = useArtisanStore.getState();
  const { userLocation } = useGeolocationOnce();

  const [faults, setFaults] = useState<Fault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());

  const safeUser = user ?? { id: "anon", role: "guest" };

  // Toast suppression (single toast on first successful load)
  const toastShownRef = useRef(false);

  // Auto-select configuration defaults
  const cfg = {
    maxGeoLockDistance: 100,
    distanceWeight: 1,
    priorityWeight: 100,
    etaWeight: 1 / 3600000, // convert ms to hours in weight usage
    ...(autoSelectConfig ?? {}),
  };

  // ---------- Helpers ----------
  const getLocalFaults = useCallback(async (): Promise<Fault[]> => {
    if (faults?.length) return faults;
    const cached = await getCachedJobs();
    if (!cached) return [];
    try {
      const parsed = JSON.parse(cached);
      return (parsed || []).map(normalizeFault);
    } catch {
      return [];
    }
  }, [faults]);

  const scoreJob = useCallback(
    (job: Fault, userLoc: Coordinates | null) => {
      // lower score => better
      const dist = userLoc ? calculateDistance(userLoc, job.coords) : 1e6;
      const priority = Number(job.priority ?? 3);
      const etaMs = job.estimatedResolutionTime
        ? new Date(job.estimatedResolutionTime).getTime()
        : 0;
      const etaFactor = etaMs ? cfg.etaWeight * etaMs : 0;
      return cfg.distanceWeight * dist + cfg.priorityWeight * priority + etaFactor;
    },
    [cfg.distanceWeight, cfg.priorityWeight, cfg.etaWeight]
  );

  // -------- Fetch & enrich pipeline --------
  const fetchAndEnrichFaults = useCallback(async (): Promise<Fault[]> => {
    if (!safeUser || safeUser.id === "anon") return [];

    setLoading(true);
    let jobs: any[] = [];

    try {
      // -------- 1. Try online fetch --------
      if (isOnline) {
        const url =
          safeUser.role === "supervisor"
            ? `${API_BASE_URL}/faults`
            : `${API_BASE_URL}/artisans/${safeUser.id}/faults`;
        try {
          const response = await safeFetchJSON(url);
          if (response?.length) {
            jobs = response;
            await cacheJobs(jobs); // cache fresh online data
          }
        } catch (err) {
          // fetch failed after retries, we'll fallback to cache/mock
          console.warn("Online fetch failed, falling back to cache/mock", err);
        }
      }

      // -------- 2. Fallback to cache --------
      if (!jobs.length) {
        const cached = await getCachedJobs();
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed?.length) jobs = parsed;
          } catch (err) {
            console.warn("Invalid cached data, ignoring", err);
            jobs = [];
          }
        }
      }

      // -------- 3. Fallback to mock data --------
      if (!jobs.length && useMockData) {
        console.info("Using mock data fallback");
        jobs = mockFaults;
        if (jobs.length > 0){
          console.log("Mock Data Loaded")
        }
      }

      // -------- Normalize --------
      let visibleJobs: Fault[] = jobs.map(normalizeFault);

      // If not using mock data, filter for artisan assignments unless supervisor
      if (!useMockData) {
        visibleJobs =
          safeUser.role === "supervisor"
            ? visibleJobs
            : visibleJobs.filter((f) => isUserAssigned(f, safeUser.id));
      }

      // Enrich: weather and priorityColor immediately; travelTime lazy
      const enrichedBase = await Promise.all(
        visibleJobs.map(async (f) => {
          const base = await enrichFault(f, null, enrichmentCache.current); // weather/priority only
          return { ...base, travelTime: undefined as unknown as number | undefined };
        })
      );

      // Set faults quickly to allow UI to render; travelTimes will be filled in background
      if (mountedRef.current) setFaults(enrichedBase);

      // background: compute travel times in batches (avoid hammering APIs)
      (async () => {
        if (!location && !userLocation) return;
        const loc = location ?? userLocation ?? null;
        // batch in groups of N to be safe — adjust N as needed
        const BATCH = 8;
        for (let i = 0; i < enrichedBase.length; i += BATCH) {
          const batch = enrichedBase.slice(i, i + BATCH);
          await Promise.all(
            batch.map(async (f) => {
              try {
                if (loc) {
                  const travelTime = await getTravelTime(loc, f.coords);
                  f.travelTime = travelTime;
                }
              } catch (err) {
                // non-fatal, leave travelTime undefined
                console.warn("travelTime fetch failed for", f.id, err);
              }
            })
          );
          // commit partial results to state to keep UI updated progressively
          if (mountedRef.current) {
            setFaults((prev) => {
              const mapById = new Map(prev.map((p) => [p.id, p]));
              for (const f of batch) {
                mapById.set(f.id, f);
              }
              return Array.from(mapById.values());
            });
          }
        }
      })();

      // single toast on first successful load
      if (!toastShownRef.current && (enrichedBase?.length ?? 0) > 0) {
        Toast.show({
          type: "success",
          text1: `${enrichedBase.length} assigned fault job(s) loaded`,
          visibilityTime: 2500,
        });
        toastShownRef.current = true;
      } else if (enrichedBase?.length ?? 0 > 0) {
        Toast.show({ type: "success", text1: `Your assigned fault jobs have been loaded` , visibilityTime: 3000 });
        console.info("Page has been refreshed");
      } else {
        Toast.show({ type: "info", text1: `No fault jobs assigned for ${safeUser.role} ${safeUser.id}` , visibilityTime: 3000 });
        console.log("No fault jobs assigned or retrieved");
      } 
      return enrichedBase;
    } catch (err: any) {
      console.error("fetchAndEnrichFaults failed:", err);
      setError(err);
      return [];
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [isOnline, safeUser, location, useMockData, userLocation]);

  // refresh helper
  const refreshFaults = useCallback(async () => {
    setLastRefreshTime(Date.now());
    await fetchAndEnrichFaults();
    // also invalidate react-query cache key so other queries relying on it update
    queryClient.invalidateQueries({ queryKey: ["faults"] }).catch(() => {});
  }, [fetchAndEnrichFaults, queryClient]);

  // initial fetch + periodic auto-refresh (every 5 min check, run fetch if 15min stale)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (!isOnline) return;
      const age = Date.now() - lastRefreshTime;
      if (age > 10 * 60 * 1000) {
        // refreshFaults().catch((err) => console.warn("Auto-refresh failed", err));
        fetchAndEnrichFaults()
          .then(() => setLastRefreshTime(Date.now()))
          .catch((err) => console.warn("Auto-refresh failed", err));
      }
      console.debug(`Refresh check: ${Math.round(age/60000)} min since last successful refresh`);
    }, 1 * 60 * 1000); // check every 1 minute
    return () => {
      clearInterval(checkInterval);
    };
  }, [fetchAndEnrichFaults, isOnline, ,refreshFaults]);

  
  // keep store activeJob in sync with server-derived active job when faults change
  useEffect(() => {
    if (!faults) return;
    const serverActive = faults.find((f) => f.status === "active") ?? null;
    // prefer existing storeActiveJob if equal; otherwise reconcile
    if (
      (storeActiveJob && serverActive && storeActiveJob.id === serverActive.id) ||
      (!serverActive && !storeActiveJob)
    ) {
      // nothing to do
    } else {
      useArtisanStore.setState({ activeJob: serverActive ?? null });
    }

    if (!toastShownRef.current && (faults?.length ?? 0) > 0) {
      Toast.show({
        type: "success",
        text1: `${faults.length} assigned fault job(s) loaded`,
        visibilityTime: 2500,
      });
      toastShownRef.current = true;
    }
  }, [faults, storeActiveJob]);

  // -------------------- Mutations --------------------
  // unified assign mutation (single user, multiple users, or team)
  const assignMut = useMutation({
    mutationFn: async ({
      faultId,
      assigneeId,
      teamId,
    }: {
      faultId: string;
      assigneeId?: string | string[]; // string or array of strings
      teamId?: string;
    }) => {
      // prefer assigneeId if provided (single or multiple)
      if (assigneeId && (Array.isArray(assigneeId) ? assigneeId.length > 0 : true)) {
        // ensure server accepts array; adapt payload shape if API expects single value
        const payload = Array.isArray(assigneeId) ? { assignedTo: assigneeId } : { assignedTo: [assigneeId] };
        const res = await fetch(`${API_BASE_URL}/faults/${faultId}/assign`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Assignment failed");
        return res.json();
      } else if (teamId) {
        const res = await fetch(`${API_BASE_URL}/faults/${faultId}/assign-team`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ team_id: teamId }),
        });
        if (!res.ok) throw new Error("Team assignment failed");
        return res.json();
      }
      throw new Error("No assignees or teamId provided");
    },
    onMutate: async ({ faultId, assigneeId, teamId }) => {
      const local = await getLocalFaults();
      // normalize to array
      const ids = Array.isArray(assigneeId) ? assigneeId : assigneeId ? [assigneeId] : [];
      setFaults(
        local.map((f) => {
          if (f.id !== faultId) return f;
          if (ids.length) return { ...f, assignedTo: ids.length === 1 ? { id: ids[0] } : (ids.map(id => ({ id })) as any) };
          if (teamId) return { ...f, team: [{ id: teamId }] };
          return f;
        })
      );

      // queue if offline
      if (!isOnline) {
        await addPendingAssignment({ faultId, assigneeId: ids.length ? ids : undefined, teamId, timestamp: Date.now() });
        Toast.show({ type: "info", text1: "Assignment queued (offline)", visibilityTime: 2000 });
      } else {
        // optimistic feedback
        Toast.show({ type: "success", text1: "Assignment updated locally", visibilityTime: 1500 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faults"] });
      Toast.show({ type: "success", text1: "Assignment synced", visibilityTime: 1500 });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Assignment failed", visibilityTime: 2000 });
    },
  });

  // status update mutation (strict FaultStatus)
  const updateFaultStatus = useMutation({
    mutationFn: async ({ faultId, status }: { faultId: string; status: FaultStatus }) => {
      const res = await fetch(`${API_BASE_URL}/jobs/${faultId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Status change failed");
      return res.json();
    },
    onMutate: async ({ faultId, status }) => {
      const local = await getLocalFaults();
      setFaults(
        local.map((f) => {
          if (f.id === faultId) return { ...f, status };
          // If setting one job active, reset only pending/active others (do not touch resolved/closed)
          if (status === "active" && f.id !== faultId && ["pending", "active"].includes(f.status)) {
            return { ...f, status: "pending" };
          }
          return f;
        })
      );
      if (status === "active") {
        const job = local.find((f) => f.id === faultId);
        setActiveJob(job ? { ...job, status: "active" } : null);
      }
      if (!isOnline) {
        await addPendingStatusUpdate({ faultId, status, timestamp: Date.now() });
        Toast.show({ type: "info", text1: "Status update queued (offline)", visibilityTime: 2000 });
      } else {
        Toast.show({ type: "success", text1: "Status updated locally", visibilityTime: 1200 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faults"] });
      Toast.show({ type: "success", text1: "Status synced", visibilityTime: 1500 });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Status update failed", visibilityTime: 2000 });
    },
  });

  // Auto-selection logic
  useEffect(() => {
    const maybeAutoSelect = async () => {
      const upcomingJobs = (faults || []).filter((f) => f.status === "pending");
      if (!upcomingJobs.length) return;
      // if store already has an active job prefer it (manual lock)
      if (storeActiveJob) return;

      try {
        const loc = location ?? userLocation ?? null;
        // choose best job via scoring; if any job within geo lock distance, prefer that
        let best: { job: Fault; score: number } | null = null;
        for (const job of upcomingJobs) {
          const score = scoreJob(job, loc);
          if (!best || score < best.score) best = { job, score };
        }
        if (!best) return;
        // check distance specifically
        const dist = loc ? calculateDistance(loc, best.job.coords) : Infinity;
        if (dist <= cfg.maxGeoLockDistance) {
          updateFaultStatus.mutate({ faultId: best.job.id, status: "active" });
          return;
        }
        // otherwise only auto-select if best score significantly better (or simply pick top priority)
        // Here we pick the best by priority fallback if not too far.
        const byPriority = [...upcomingJobs].sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3));
        if (byPriority[0]) {
          updateFaultStatus.mutate({ faultId: byPriority[0].id, status: "active" });
        }
      } catch (err) {
        console.warn("Auto-select job failed:", err);
      }
    };
    // run on changes to faults
    maybeAutoSelect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faults, location, userLocation]);


  // -------------------- Offline sync / queue replay --------------------
  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;
    (async () => {
      try {
        const pendingAss = await getPendingAssignments(); // queued assignments
        const pendingUpds = await getPendingUpdates(); // queued status updates
        // for (const item of [...pendingAss, ...pendingUpds]) {
        for (const item of pendingAss) {
          if (cancelled) break;
          try {
            await assignMut.mutateAsync({
              faultId: item.faultId,
              assigneeId: item.assigneeId,
              teamId: item.teamId,
            });
          } catch (err) {
            console.warn("Failed to sync pending assignment", item, err);
          }
        }
        // sync statuses
        for (const item of pendingUpds) {
          if (cancelled) break;
          try {
            if (item.status) {
              await updateFaultStatus.mutateAsync({ faultId: item.faultId, status: item.status });
            }
          } catch (err) {
            console.warn("Failed to sync pending status update", item, err);
          }
        }
        await clearPendings();
        if (!cancelled) await refreshFaults();
      } catch (err) {
        console.warn("Queue sync failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  // }, [isOnline, assignMut, updateFaultStatus, refreshFaults]);
  }, [isOnline,]);

  // -------- Derived filters --------
  const filters = useMemo(() => {
    const data = faults ?? [];
    const validFaults = data.filter((f) => !!f.coords);

    const enrichedFaults = validFaults.map((f) => ({
      ...f,
      assignedToUser: isUserAssigned(f, safeUser.id),
      isTeamJob: !!f.team && f.team.length > 0,
    }));

    const filteredFaults =
      selectedFilter === "all"
        ? enrichedFaults
        : enrichedFaults.filter((f) => f.status === selectedFilter);

    // inProgressFaults
    const openFaults = enrichedFaults.filter((f) =>
      ["open", "pending", "active"].includes(f.status)
    );

    const primaryFault =
      openFaults.find((f) => f.faultType === "single") ??
      openFaults.find((f) => f.faultType === "team_single") ??
      openFaults[0] ??
      null;

    const displayedFaults = enrichedFaults.filter((f) => f.status !== "in_progress" || f.isTeamJob);

    const activeFaultJob = enrichedFaults.find((f) => f.status === "active" && !f.isTeamJob) ?? null;
    const activeJob = enrichedFaults.find((f) => f.status === "active") ?? null;

    const upcomingFaultJobs = enrichedFaults
      .filter((f) => f.status === "pending")
      .sort((a, b) => (a.priority ?? 3) - (b.priority ?? 3));


    return {
      validFaults,
      enrichedFaults,
      filteredFaults,
      activeFaultJob,
      upcomingFaultJobs,
      openFaults,
      primaryFault,
      displayedFaults,
      getFaultsByAssignee: (assigneeId: string) => enrichedFaults.filter((f) => f.assignedTo?.id === assigneeId),
      filterByStatus: (statuses: Fault["status"][]) => data.filter((f) => statuses.includes(f.status)),
      filterBySeverity: (severities: Fault["severity"][]) => data.filter((f) => severities.includes(f.severity)),
      filterByZone: (zones: Fault["zone"][]) => data.filter((f) => zones.includes(f.zone)),
      getFaultById: (id: string) => data.find((f) => f.id === id),
      getActiveFaults: () => data.filter((f) => ["active", "in_progress"].includes(f.status)),
      getTeamAssignments: (userId: string) => data.filter((f) => f.assignedTo?.id === userId || f.team?.some((m) => m.id === userId)),
      // conveniences
      serverActiveJob: activeJob,
    };
  }, [faults, safeUser.id, selectedFilter]);


  // -------------------- Return --------------------
  return {
    // state
    faults,
    loading,
    error,
    refreshFaults,

    // mutations
    assignMut,
    updateFaultStatus,

    // derived
    ...filters,
  };
};

export default useFaultsQuery;