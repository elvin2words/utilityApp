// /lib/api/faults.ts

import React from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/lib/constants';
import { Fault } from '@/types/faults';
import { fetchWeatherImpact } from '@/lib/weather';
import { assignPriorityColor } from '@/lib/priority';
import { getTravelTime } from '@/lib/navigation';
import { getCachedEnrichment, cacheEnrichment } from '@/utils/enrichmentCache';

const FAULTS_CACHE_KEY = 'faults_cache_v1';

export async function fetchFaultsFromServer(token?: string): Promise<Fault[]> {
  const res = await fetch(`${API_BASE_URL}/artisans/faults`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch faults');
  return res.json();
}

export async function getCachedFaults(): Promise<Fault[]> {
  const raw = await AsyncStorage.getItem(FAULTS_CACHE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveFaultsToCache(faults: Fault[]) {
  await AsyncStorage.setItem(FAULTS_CACHE_KEY, JSON.stringify(faults));
}

export async function getFaults(isOnline: boolean, token?: string): Promise<Fault[]> {
  if (isOnline) {
    try {
      const faults = await fetchFaultsFromServer(token);
      await saveFaultsToCache(faults);
      return faults;
    } catch (err) {
      // fallback to cache
      return getCachedFaults();
    }
  }
  return getCachedFaults();
}

export async function enrichFault(fault: Fault, location?: { latitude: number; longitude: number }) {
  const cached = await getCachedEnrichment(fault.id);
  if (cached) return { ...fault, ...cached };

  const travelTime = location ? await getTravelTime(location, fault.coordinates) : undefined;
  const weatherImpact = await fetchWeatherImpact(fault.coordinates);
  const priorityColor = assignPriorityColor(
    fault.severity,
    fault.estimated_completion_time,
    weatherImpact?.impact ?? false,
    travelTime
  );

  const enrichedData = { travelTime, weather: weatherImpact, priorityColor };
  await cacheEnrichment(fault.id, enrichedData);
  return { ...fault, ...enrichedData };
}
