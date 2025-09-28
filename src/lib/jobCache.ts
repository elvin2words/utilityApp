// lib/offline/jobCache.ts

import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const JOB_CACHE_KEY = "OFFLINE_JOBS";

// Save jobs to cache
export async function cacheJobs(jobs: any[]) {
  try {
    await AsyncStorage.setItem(JOB_CACHE_KEY, JSON.stringify(jobs));
  } catch (err) {
    console.error("Error caching jobs:", err);
  }
}

// Get cached jobs
export async function getCachedJobs() {
  try {
    const data = await AsyncStorage.getItem(JOB_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Error reading cached jobs:", err);
    return [];
  }
}

// Clear jobs cache
export async function clearCachedJobs() {
  try {
    await AsyncStorage.removeItem(JOB_CACHE_KEY);
  } catch (err) {
    console.error("Error clearing cached jobs:", err);
  }
}
