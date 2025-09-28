// services/supervisorService.ts
import React from "react";
import { API_BASE_URL } from "@/src/lib/constants";
import { Fault, ActivityLog } from "@/src/shared/schema";
import { AuthStorage } from "@/src/lib/auth/authStorage";

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export const supervisorService = {
  // Dashboard endpoints
  getDashboardSummary: () =>
    request<any>(`${API_BASE_URL}/dashboard/summary`),

  getDashboardFaults: () =>
    request<Fault[]>(`${API_BASE_URL}/dashboard/faults`),

  getDashboardActivities: () =>
    request<ActivityLog[]>(`${API_BASE_URL}/dashboard/activities`),

  getPerformanceMetrics: () =>
    request<any>(`${API_BASE_URL}/dashboard/performance`),

  // Supervisor-specific endpoints
  getDashboardData: () =>
    request<any>(`${API_BASE_URL}/supervisor/dashboard`),

  getFaults: () =>
    request<Fault[]>(`${API_BASE_URL}/supervisor/faults`),

  getActivityLogs: () =>
    request<ActivityLog[]>(`${API_BASE_URL}/activity-logs`),

  acknowledgeResolvedFaults: async (): Promise<void> => {
    const token = await AuthStorage.getAccessToken();
    await request(`${API_BASE_URL}/supervisor/acknowledge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ acknowledgedAt: new Date().toISOString() }),
    });
  },

  assignFault: async (faultId: string, artisanId: string) => {
    const token = await AuthStorage.getAccessToken();
    return request(`${API_BASE_URL}/supervisor/faults/${faultId}/assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ artisanId }),
    });
  },
};
