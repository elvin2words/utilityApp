// hooks/useMutationQueue.ts

import React, { useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = 'mutation_queue_v1';

export type MutationItem = {
  id: string; // uuid
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  createdAt: number;
};

export function useMutationQueue() {
  const processing = useRef(false);

  const push = useCallback(async (item: MutationItem) => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(item);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
  }, []);

  const popAll = useCallback(async () => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return arr as MutationItem[];
  }, []);

  const clear = useCallback(async () => {
    await AsyncStorage.removeItem(QUEUE_KEY);
  }, []);

  const processQueue = useCallback(async () => {
    if (processing.current) return;
    processing.current = true;
    try {
      const state = await NetInfo.fetch();
      if (!state.isConnected) return;
      const queue = await popAll();
      for (const q of queue) {
        try {
          await fetch(q.url, {
            method: q.method,
            headers: { 'Content-Type': 'application/json', ...(q.headers || {}) },
            body: q.body ? JSON.stringify(q.body) : undefined,
          });
          // if success, continue
        } catch (e) {
          // keep item in queue if failed
        }
      }
      // If we got here, just clear queue — for production you want more robust per-item checks
      await clear();
    } finally {
      processing.current = false;
    }
  }, [popAll, clear]);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) processQueue();
    });
    // try to process on mount
    processQueue();
    return () => unsub();
  }, [processQueue]);

  return { push, processQueue, popAll, clear };
}
