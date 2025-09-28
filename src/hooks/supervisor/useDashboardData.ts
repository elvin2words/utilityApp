// hooks/useDashboardData.ts
import { useQuery } from "@tanstack/react-query";
import { supervisorService } from "@/src/api/supervisorApi";

export const useDashboardData = () => {
  const summaryQuery = useQuery(["dashboard-summary"], supervisorService.getSummary);
  const faultsQuery = useQuery(["dashboard-faults"], supervisorService.getFaults);
  const activitiesQuery = useQuery(["dashboard-activities"], supervisorService.getActivities);
  const performanceQuery = useQuery(["dashboard-performance"], supervisorService.getPerformanceMetrics);

  return { summaryQuery, faultsQuery, activitiesQuery, performanceQuery };
};
