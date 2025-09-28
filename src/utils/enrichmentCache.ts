// FILE: /utils/enrichmentCache.ts


import React from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
const PREFIX = 'enrich_';
const TTL = 1000 * 60 * 60; // 1 hour

export async function getCachedEnrichment(id: string) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + id);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj._ts > TTL) {
      await AsyncStorage.removeItem(PREFIX + id);
      return null;
    }
    delete obj._ts;
    return obj;
  } catch (e) {
    return null;
  }
}

export async function cacheEnrichment(id: string, data: any) {
  try {
    await AsyncStorage.setItem(PREFIX + id, JSON.stringify({ ...data, _ts: Date.now() }));
  } catch (e) {
    // ignore
  }
}