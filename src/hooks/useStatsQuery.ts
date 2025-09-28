// hooks/useStatsQuery.ts

import React from "react";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/src/lib/constants";

const STATS_CACHE_KEY = "dashboard_stats_cache";

export type DashboardStats = {
  totalFaults: number;
  openFaults: number;
  inProgressFaults: number;
  completedFaults: number;
  teamCompletionRates: { [teamId: string]: number }; // % completed
  artisanPerformance: { [artisanId: string]: number }; // % completed
  faultsByType: { [type: string]: number };
  faultsByPriority: { [priority: string]: number };
  // add more metrics as needed
};

async function fetchStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${API_BASE_URL}/dashboard/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    const data = await res.json();
    await AsyncStorage.setItem(STATS_CACHE_KEY, JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn("Stats fetch failed, falling back to cache", err);
    const cached = await AsyncStorage.getItem(STATS_CACHE_KEY);
    return cached ? JSON.parse(cached) : {
      totalFaults: 0,
      openFaults: 0,
      inProgressFaults: 0,
      completedFaults: 0,
      teamCompletionRates: {},
      artisanPerformance: {},
      faultsByType: {},
      faultsByPriority: {},
    };
  }
}

export function useStatsQuery({ isOnline }: { isOnline: boolean }) {
  const query = useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: fetchStats,
    staleTime: 1000 * 60 * 5, // 5 min
    enabled: isOnline, // optional: skip fetch when offline
  });

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
