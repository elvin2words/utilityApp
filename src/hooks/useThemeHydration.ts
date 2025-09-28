// hooks/useThemeHydration.ts
import React from "react";

import { useEffect, useState } from "react"; 
import { useThemeStore } from "@/src/lib/themeStore";

/**
 * Returns hydrate status and current theme mode.
 * Ensures consumers can wait for persisted theme to restore.
 */

export function useThemeHydration() {
  const [hydrated, setHydrated] = useState(false);
  const mode = useThemeStore((state:any) => state.mode);

  useEffect(() => {
    // Zustand persist exposes onFinishHydration in .persist
    // Types may vary; we guard-check to avoid runtime errors.
    try {
      const persistApi: any = (useThemeStore as any).persist;
      if (persistApi?.onFinishHydration) {
        const unsub = persistApi.onFinishHydration(() => setHydrated(true));
        // If already hydrated:
        if ((persistApi as any).hasHydrated && persistApi.hasHydrated()) {
          setHydrated(true);
        }
        return () => unsub && unsub();
      } else {
        // Fallback: consider hydrated immediately
        setHydrated(true);
      }
    } catch (err) {
      console.warn("useThemeHydration fallback", err);
      setHydrated(true);
    }
  }, []);

  return { hydrated, mode };
}
