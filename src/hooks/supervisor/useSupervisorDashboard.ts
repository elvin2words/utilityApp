// hooks/useSupervisorDashboard.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDashboardData, getFaults, getActivityLogs } from '@/src/api/supervisorApi';
import mockFaults from '@/assets/mocks/mockFaults.json';
import mockActivities from '@/assets/mocks/mockActivities.json';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';

const FAULTS_CACHE_KEY = 'ufms_faults_cache_v1';
const DASH_CACHE_KEY = 'ufms_dashboard_cache_v1';
const ACT_CACHE_KEY = 'ufms_activities_cache_v1';

export function useSupervisorDashboard() {
  const { isOnline } = useNetworkStatus();
  const qc = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: ['supervisor', 'dashboard'],
    queryFn: async () => {
      if (!isOnline) {
        const cached = await AsyncStorage.getItem(DASH_CACHE_KEY);
        if (cached) return JSON.parse(cached);
        if (__DEV__) return { fallback: true };
        throw new Error('Offline');
      }
      const data = await getDashboardData();
      await AsyncStorage.setItem(DASH_CACHE_KEY, JSON.stringify(data));
      return data;
    },
    staleTime: 1000 * 60 * 3,
    retry: 1,
    initialData: __DEV__ ? {} : undefined,
  });

  const faultsQuery = useQuery({
    queryKey: ['supervisor', 'faults'],
    queryFn: async () => {
      if (!isOnline) {
        const cached = await AsyncStorage.getItem(FAULTS_CACHE_KEY);
        if (cached) return JSON.parse(cached);
        if (__DEV__) return (mockFaults as any) || [];
        return [];
      }
      const data = await getFaults();
      await AsyncStorage.setItem(FAULTS_CACHE_KEY, JSON.stringify(data));
      return data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
    initialData: __DEV__ ? (mockFaults as any) : undefined,
  });

  const activitiesQuery = useQuery({
    queryKey: ['supervisor', 'activities'],
    queryFn: async () => {
      if (!isOnline) return (__DEV__ ? (mockActivities as any) : []);
      const data = await getActivityLogs();
      await AsyncStorage.setItem(ACT_CACHE_KEY, JSON.stringify(data));
      return data;
    },
    staleTime: 1000 * 60 * 2,
    retry: 1,
    initialData: __DEV__ ? (mockActivities as any) : undefined,
  });

  const refetchAll = async () => {
    await Promise.all([dashboardQuery.refetch(), faultsQuery.refetch(), activitiesQuery.refetch()]);
  };

  return {
    dashboard: dashboardQuery.data,
    faults: faultsQuery.data || [],
    activities: activitiesQuery.data || [],
    isLoading: dashboardQuery.isLoading || faultsQuery.isLoading || activitiesQuery.isLoading,
    isOnline,
    refetchAll,
    dashboardQuery,
    faultsQuery,
    activitiesQuery,
    queryClient: qc,
  };
}