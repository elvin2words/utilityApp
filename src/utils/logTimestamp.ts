// utils/logTimestamp.ts

import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  ACTIVE_JOB: "active_job",
  LAST_STATE: "last_geofence_state",
  TIMESTAMPS: "geofence_timestamps",
};

// Save active job (circle or polygon geofence)
export async function saveActiveJob(job: any) {
  await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_JOB, JSON.stringify(job));
}

export async function getActiveJob() {
  const json = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_JOB);
  return json ? JSON.parse(json) : null;
}

// Save last inside/outside state
export async function saveLastState(state: boolean) {
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_STATE, JSON.stringify({ inside: state }));
}

export async function getLastState() {
  const json = await AsyncStorage.getItem(STORAGE_KEYS.LAST_STATE);
  return json ? JSON.parse(json).inside : false;
}

// Save timestamp log
export async function logTimestamp(event: "enter" | "exit", jobId: string, time: Date) {
  const existing = await AsyncStorage.getItem(STORAGE_KEYS.TIMESTAMPS);
  const logs = existing ? JSON.parse(existing) : [];
  const newEntry = { event, jobId, time: time.toISOString() };
  const updated = [...logs, newEntry];
  await AsyncStorage.setItem(STORAGE_KEYS.TIMESTAMPS, JSON.stringify(updated));

  console.log(`[${event.toUpperCase()}] Job ${jobId} @ ${time.toISOString()}`);

  // Optional: If online, sync to API now
  try {
    // await api.post("/geofence-events", newEntry);
  } catch (err) {
    console.log("Will retry upload later");
  }
}

export function formatTimestamp(date: Date | null): string {
  if (!date) return "N/A";
  return date.toISOString();
}
export function durationBetween(entry: Date, exit: Date): number {
  return (exit.getTime() - entry.getTime()) / 1000; // seconds
}
