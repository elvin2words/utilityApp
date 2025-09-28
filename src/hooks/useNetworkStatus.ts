// hooks/useNetworkStatus.ts

import React, { useEffect, useState, useRef } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useAppStore } from "@/src/stores/appStore"; 
// import { debounce } from "lodash";

/**
 * Lightweight debounce to avoid rapid UI churn on flaky connections.
 */
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 300) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}


export function useNetworkStatus() {
  const setIsOnline = useAppStore((state:any) => state.setIsOnline);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);

  const debouncedSetIsOnlineRef = useRef(debounce((v: boolean) => setIsOnline(v), 350));

  useEffect(() => {
    let mounted = true;

    const handleNetworkChange = (state: NetInfoState) => {
      if (!mounted) return;
      setIsConnected(Boolean(state.isConnected));
      setIsInternetReachable(state.isInternetReachable ?? false);

      const online = Boolean(state.isConnected && state.isInternetReachable);
      debouncedSetIsOnlineRef.current(online);
    };
    
    // initial
    NetInfo.fetch().then(handleNetworkChange).catch((e) => console.warn("NetInfo.fetch failed", e));

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [setIsOnline]);

  const isOnline = Boolean(isConnected && isInternetReachable);
    
  return {
    isConnected,
    isInternetReachable,
    isOnline,
  };
}

