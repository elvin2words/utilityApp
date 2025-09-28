// lib/api/artisanApi.ts

import React from "react";
import { API_BASE_URL } from "@/src/lib/constants";
import { Fault, Notification } from "@/src/shared/schema";

export async function fetchActiveJob(userId: string): Promise<Fault | null> {
  const res = await fetch(`${API_BASE_URL}/artisan/${userId}/active-job`);
  if (!res.ok) throw new Error("Failed to fetch active job");
  return res.json();
}

export async function fetchUpcomingFaultJobs(userId: string): Promise<Fault[]> {
  const res = await fetch(`${API_BASE_URL}/artisan/${userId}/upcoming-tasks`);
  if (!res.ok) throw new Error("Failed to fetch upcoming tasks");
  return res.json();
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const res = await fetch(`${API_BASE_URL}/artisan/${userId}/notifications`);
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}
