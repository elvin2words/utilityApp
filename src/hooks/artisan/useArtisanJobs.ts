import { useQuery } from "@tanstack/react-query";
import { fetchActiveJob, fetchUpcomingFaultJobs } from "@/src/api/artisanApi";
import { Fault } from "@/src/shared/schema"; 
import { useArtisanStore } from "@/src/stores/artisanStore";

export function useActiveJob(userId?: string) {
  const setActiveJob = useArtisanStore((s) => s.setActiveJob);

  return useQuery<Fault | null>({
    queryKey: ["activeJob", userId],
    queryFn: () => fetchActiveJob(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
    onSuccess: (data) => setActiveJob(data),
  });
}

export function useUpcomingJobs(userId?: string) {
  const setUpcomingJobs = useArtisanStore((s) => s.setUpcomingJobs);

  return useQuery<Fault[]>({
    queryKey: ["upcomingFaultJobs", userId],
    queryFn: () => fetchUpcomingFaultJobs(userId!),
    enabled: !!userId,
    onSuccess: (data) => setUpcomingJobs(data),
  });
}
