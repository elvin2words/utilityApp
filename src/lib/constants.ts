// lib/constants
 
import React from "react";

import Constants from "expo-constants";
import { height, width } from "../utils/misc";


const extra = Constants.expoConfig?.extra || {};

export const API_BASE_URL = extra.apiUrl || "https://api.utility.com";

export const OPENWEATHER_API_KEY =
  extra.openWeatherKey || "fallback-weather-key";

export const GOOGLE_AUTH = extra.google || {};

export const APPLE_CLIENT_ID = extra.appleClientId || "";
export const FACEBOOK_APP_ID = extra.facebookAppId || "";

export const APP_ENV = extra.env || "development";

export const EAS_PROJECT_ID = extra.eas?.projectId || "";


export const AVAILABILITY_STATUS_OPTIONS = [
  { label: 'Available', value: 'available' },
  { label: 'On Duty', value: 'on_duty' },
  { label: 'Off Duty', value: 'off_duty' },
  { label: 'On Break', value: 'on_break' },
  { label: 'Standby', value: 'standby' }
];

export const CHART_PERIOD_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' }
];

export const THEME_OPTIONS = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' }
];

// MAPS and Faults

export const MAP_LAYER_OPTIONS = [
  { label: 'Fault Jobs', value: 'faultjobs' },
  { label: 'Heatmap', value: 'heatmap' },
  { label: 'Facilities', value: 'facilities' },
  { label: 'AdminMap', value: 'adminmap' }
];

// --- Status Filters ---
export const FAULT_STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in-progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
  { key: "active", label: "Active" },
  { key: "new", label: "New" },
  { key: "closed", label: "Closed" },
] as const;

// --- Admin Map Filters ---
export const ADMIN_MODES = [
  // { key: "all", label: "All" },
  { key: "iot", label: "IoT" },
  { key: "drone", label: "Drone Inspects" },
  { key: "load", label: "Load" },
  { key: "storm", label: "Storm Mode" },
  { key: "predictive", label: "Predictive AI" },
  { key: "infra", label: "Infrastructure" },
] as const;

// --- Heatmap Filters ---
export const HEATMAP_FILTERS = [
  // { key: "all", label: "All" },
  { key: "duration", label: "Duration" }, // Changes over time - eg open longer as storm was over
  { key: "thematic", label: "Thematic" }, // By cause or category
  { key: "intensity", label: "Intensity" }, //can use severity, cost, frqeuncy mix
  { key: "severity", label: "Severity" }, // color intensity low, med, high
  { key: "density", label: "Density" }, // Concentration of events egfaults per sqkm
  { key: "assetType", label: "Asset Type" }, // transformers/meters/overheads
] as const;

export const FACILITIES_FILTERS = [
  { key: "all", label: "All" },
  { key: "transformers", label: "Transformers" },
  { key: "overheads", label: "Overheads" },
  { key: "meters", label: "Meters" },
] as const;

export type StatusKey = typeof FAULT_STATUS_FILTERS[number]["key"];
export type ModeKey = typeof ADMIN_MODES[number]["key"];
export type HeatMapKey = typeof HEATMAP_FILTERS[number]["key"];
export type FacilitiesKey = typeof FACILITIES_FILTERS[number]["key"];
export type LayerKey = "faultjobs" | "adminmap" | "heatmap" | "facilities";

export const DEFAULT_MAP_CENTER = {
  lat: -17.824858,
  lng: 31.053028
};

export const METRICS_ABBREVIATIONS = {
  SAIDI: 'System Average Interruption Duration Index',
  SAIFI: 'System Average Interruption Frequency Index',
  CAIDI: 'Customer Average Interruption Duration Index'
};

// 2. React Native style objects version (use in RN components)
export const STATUS_COLORS = {
  pending: { backgroundColor: '#f3f4f6', color: '#1f2937' }, // bg-gray-100, text-gray-800
  in_progress: { backgroundColor: '#d1fae5', color: '#065f46' }, // bg-onsite-light, text-onsite-dark
  resolved: { backgroundColor: '#dcfce7', color: '#166534' }, // bg-resolved-light, text-resolved-dark
  delayed: { backgroundColor: '#dbeafe', color: '#2563eb' }, // bg-moderate-light, text-moderate-dark (example)
  default: { backgroundColor: '#f3f4f6', color: '#1f2937' }
};

export const PRIORITY_COLORS = {
  high: { backgroundColor: '#fecaca', color: '#991b1b' }, // bg-critical-light, text-critical-dark
  medium: { backgroundColor: '#bfdbfe', color: '#1e40af' }, // bg-moderate-light, text-moderate-dark
  low: { backgroundColor: '#f3f4f6', color: '#1f2937' }, // bg-gray-100, text-gray-800
  default: { backgroundColor: '#f3f4f6', color: '#1f2937' }
};

export const SEVERITY_COLORS = {
  critical: { backgroundColor: '#fecaca', color: '#991b1b' },
  moderate: { backgroundColor: '#bfdbfe', color: '#1e40af' },
  low: { backgroundColor: '#f3f4f6', color: '#1f2937' },
  default: { backgroundColor: '#f3f4f6', color: '#1f2937' }
};

export const BORDER_COLORS = {
  critical: { borderColor: '#991b1b' }, // border-critical
  moderate: { borderColor: '#2563eb' }, // border-moderate
  low: { borderColor: '#d1d5db' }, // border-gray-300
  default: { borderColor: '#d1d5db' }
};

// // 3. Tailwind RN class names version (use with tailwind-rn or similar)
// export const STATUS_COLORS_TWRN = {
//   pending: 'bg-gray-100 text-gray-800',
//   in_progress: 'bg-onsite-light text-onsite-dark',
//   resolved: 'bg-resolved-light text-resolved-dark',
//   delayed: 'bg-moderate-light text-moderate-dark',
//   default: 'bg-gray-100 text-gray-800'
// };

// export const PRIORITY_COLORS_TWRN = {
//   high: 'bg-critical-light text-critical-dark',
//   medium: 'bg-moderate-light text-moderate-dark',
//   low: 'bg-gray-100 text-gray-800',
//   default: 'bg-gray-100 text-gray-800'
// };

// export const SEVERITY_COLORS_TWRN = {
//   critical: 'bg-critical-light text-critical-dark',
//   moderate: 'bg-moderate-light text-moderate-dark',
//   low: 'bg-gray-100 text-gray-800',
//   default: 'bg-gray-100 text-gray-800'
// };

// export const BORDER_COLORS_TWRN = {
//   critical: 'border-critical',
//   moderate: 'border-moderate',
//   low: 'border-gray-300',
//   default: 'border-gray-300'
// };


export const HEATMAP_LEGENDS = {
  severity: [
    { color: "#00ff00", label: "Minor" },
    { color: "#ffff00", label: "Major" },
    { color: "#ff0000", label: "Critical" },
  ],
  density: [
    { color: "#00ffff", label: "Low density" },
    { color: "#0000ff", label: "Medium density" },
    { color: "#800080", label: "High density" },
  ],
  intensity: [
    { color: "#c6ff00", label: "Low intensity" },
    { color: "#ff9100", label: "Medium intensity" },
    { color: "#d50000", label: "High intensity" },
  ],
  duration: [
    { color: "#8bc34a", label: "< 1 hour" },
    { color: "#ffeb3b", label: "1–6 hours" },
    { color: "#f44336", label: "> 6 hours" },
  ],
  thematic: [
    { color: "#2196f3", label: "Weather-related" },
    { color: "#9c27b0", label: "Equipment failure" },
    { color: "#ff5722", label: "Human/other" },
  ],
  assetType: [
    { color: "#2636f3", label: "Trx" },
    { color: "#9d17b0", label: "Meters" },
    { color: "#fb4522", label: "Ovs" },
  ],
} as const;

export type HeatmapLegendProps = { activeFilter: keyof typeof HEATMAP_LEGENDS; };


export const ASPECT_RATIO = width / height;
export const LATITUDE_DELTA = 0.0922;
export const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;