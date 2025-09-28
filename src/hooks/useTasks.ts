import React, { useEffect } from "react"; 
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/src/lib/constants";
import { useArtisanStore } from "@/src/stores/artisanStore";

export function useTasks() {
  const { setTasks, tasks } = useArtisanStore(); 

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const [faultsRes, assignmentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/artisan/faults`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/assignments`).then((r) => r.json()),
      ]);
      return { faults: faultsRes, assignments: assignmentsRes };
    },
    refetchInterval: 1000 * 60, // auto-refresh every 60s
    staleTime: 1000 * 30,
    // removed onSuccess, will handle data curation in useEffect below
  });

  useEffect(() => {
    if (data) {
      // curate & cache
      const curated = data.faults.map((fault: any) => {
        const assignment = data.assignments.find((a: any) => a.fault_id === fault.id) || null;
        return { fault, assignment };
      });
      setTasks(curated);
    }
  }, [data, setTasks]);

  return { tasks, isLoading, refetch, isFetching };
}
