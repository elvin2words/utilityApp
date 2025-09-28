// utils/misc.ts

import { Dimensions } from "react-native";
import { LatLng } from "react-native-maps";
import { Fault } from "@/src/types/faults";

export const getSeverityColor = (sev: Fault["severity"]) => {
  switch (sev) {
    case "critical":
      return "#ef4444";
    case "major":
      return "#f97316";      
    case "moderate":
      return "#647022ff";
    default:
      return "#10b981"; // safe fallback
  }
};

export const formatLabel = (s: unknown): string => {
  if (typeof s !== "string") return String(s ?? "");
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export function normalizeCoords(lat: number, lon: number) {
  if (lat > 0 && lon < 0) {
    return { lat: lon, lon: lat }; // swap
  }
  return { lat, lon };
}

// --- UI sizing helpers ---
export const { width, height } = Dimensions.get("window");
export const CONTROL_SIZE = Math.max(40, Math.min(52, Math.round(width * 0.11)));
export const GAP = Math.max(8, Math.min(12, Math.round(width * 0.03)));
export const BOTTOM_NAV_SAFE = 94;
export const EDGE_PADDING = { top: 100, right: 80, bottom: 160, left: 80 };
export const DETAILED_ZOOM_THRESHOLD = 12;
export const BOTTOM_SHEET_HEIGHT = height * 0.35;

export const CLUSTER_VISIBLE_ZOOM = 0.05;
export const GEOFENCE_VISIBLE_ZOOM = 0.05;

export const isValidLatLng = (lat?: number, lon?: number) =>
  typeof lat === "number" && !isNaN(lat) && typeof lon === "number" && !isNaN(lon);

export function normalizedCoords(lat?: number, lon?: number): LatLng | null {
  if (!isValidLatLng(lat, lon)) return null;
  return { latitude: lat!, longitude: lon! };
}
