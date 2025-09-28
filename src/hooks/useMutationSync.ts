// hooks/useMutationSync.ts

import React, { useEffect } from "react";
import { API_BASE_URL } from "@/src/lib/constants";
import { useAppStore } from "@/src/stores/appStore";
import { useMutationQueue } from "@/src/stores/mutationQueue";


async function sendActionToApi(action: any) {
  const res = await fetch(`${API_BASE_URL}/faults/${action.faultId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: action.type, payload: action.payload }),
  });

  if (!res.ok) throw new Error("API failed");
  return res.json();
}

/**
 * useMutationSync
 * - Automatically retries queued actions when online
 * - Reactive to network changes via Zustand
 */
export function useMutationSync() {
  const { queue, dequeue } = useMutationQueue();
  const isOnline = useAppStore((state:any) => state.isOnline);

  useEffect(() => {
    if (!isOnline || queue.length === 0) return;

    const syncQueue = async () => {
      for (const action of queue) {
        try {
          await sendActionToApi(action);
          dequeue(action.id); // remove successfully synced actions
        } catch (err) {
          console.log("Retry later for action:", action.id);
        }
      }
    };

    syncQueue();
  }, [isOnline, queue, dequeue]);
}
