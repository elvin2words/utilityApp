// hooks/useAssignmentOptionsQuery.ts

import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/src/lib/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";


const ARTISANS_CACHE_KEY = "assignment_artisans_cache";
const TEAMS_CACHE_KEY = "assignment_teams_cache";


type Artisan = {
  id: string;
  name: string;
  status: "available" | "busy" | "offline";
  skills: string[];
};

type Team = {
  id: string;
  name: string;
  members: Artisan[];
  status: "available" | "busy";
};

async function fetchAvailableArtisans(): Promise<Artisan[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/artisans?available=true`);
    if (!response.ok) throw new Error("Failed to fetch artisans");
    const data = await response.json();
    await AsyncStorage.setItem(ARTISANS_CACHE_KEY, JSON.stringify(data));
    return data;
  } catch (err) {
    // fallback to cache
    const cached = await AsyncStorage.getItem(ARTISANS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

async function fetchAvailableTeams(): Promise<Team[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/teams?available=true`);
    if (!response.ok) throw new Error("Failed to fetch teams");
    const data = await response.json();
    await AsyncStorage.setItem(TEAMS_CACHE_KEY, JSON.stringify(data));
    return data;
  } catch (err) {
    // fallback to cache
    const cached = await AsyncStorage.getItem(TEAMS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

export function useAssignmentOptionsQuery({ isOnline }: { isOnline: boolean }) {
  const artisansQuery = useQuery<Artisan[]>({
    queryKey: ["availableArtisans"],
    queryFn: fetchAvailableArtisans,
    staleTime: 1000 * 60 * 5,
    enabled: isOnline, // optional: skip fetch when offline
  });

  const teamsQuery = useQuery<Team[]>({
    queryKey: ["availableTeams"],
    queryFn: fetchAvailableTeams,
    staleTime: 1000 * 60 * 5,
    enabled: isOnline,
  });

  return {
    artisans: artisansQuery.data ?? [],
    teams: teamsQuery.data ?? [],
    isLoading: artisansQuery.isLoading || teamsQuery.isLoading,
    error: artisansQuery.error || teamsQuery.error,
    refetch: () => {
      artisansQuery.refetch();
      teamsQuery.refetch();
    },
  };
}
