//ufms/lib/utils.ts 

import React from "react";
import { format, formatDistanceToNow } from "date-fns";

export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  return format(new Date(date), 'h:mm a');
}

export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  return format(new Date(date), 'EEE, d MMM yyyy');
}

export function formatTimeAgo(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
 
export const statusConfig = {
  online: { color: "#22c55e", label: "Online" },      // green-500
  offline: { color: "#6b7280", label: "Offline" },    // gray-500
  inGeofence: { color: "#3b82f6", label: "In Geofence" }, // blue-500
  outGeofence: { color: "#6b7280", label: "Out of Geofence" }, // gray-500
  available: { color: "#22c55e", label: "Available" },
  onDuty: { color: "#3b82f6", label: "On Duty" },
  offDuty: { color: "#6b7280", label: "Off Duty" },
  onBreak: { color: "#eab308", label: "On Break" },   // yellow-500
  standby: { color: "#8b5cf6", label: "Standby" },    // purple-500
} as const;

export type StatusType = keyof typeof statusConfig;

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#f3f4f6'; // gray-100 background equivalent
    case 'in_progress':
      return '#bfdbfe'; // light blue (onsite-light) example
    case 'resolved':
      return '#bbf7d0'; // light green (resolved-light) example
    case 'delayed':
      return '#fde68a'; // light yellow (moderate-light) example
    default:
      return '#f3f4f6'; // default gray-100
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return '#fecaca'; // light red (critical-light)
    case 'medium':
      return '#fde68a'; // light yellow (moderate-light)
    case 'low':
      return '#f3f4f6'; // gray-100
    default:
      return '#f3f4f6';
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return '#fecaca'; // light red (critical-light)
    case 'moderate':
      return '#fde68a'; // light yellow (moderate-light)
    case 'low':
      return '#f3f4f6'; // gray-100
    default:
      return '#f3f4f6';
  }
}

export function getBorderColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return '#dc2626'; // red-600 border
    case 'moderate':
      return '#fbbf24'; // yellow-400 border
    case 'low':
      return '#d1d5db'; // gray-300 border
    default:
      return '#d1d5db'; // gray-300
  }
}

export function calculateGeoFenceStatus(
  userLocation: { lat: number; lng: number } | null,
  geofence: { lat: number; lng: number; radius: number } | null | undefined
): boolean {
  if (!userLocation || !geofence) return false;
  
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  
  const dLat = toRad(geofence.lat - userLocation.lat);
  const dLon = toRad(geofence.lng - userLocation.lng);
  
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(userLocation.lat)) *
    Math.cos(toRad(geofence.lat)) *
    Math.sin(dLon / 2) ** 2;
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance <= geofence.radius;
}


export function isWithinGeofence(
  userLat: number,
  userLon: number,
  centerLat: number,
  centerLon: number,
  radiusInMeters: number
): boolean {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters

  const dLat = toRad(centerLat - userLat);
  const dLon = toRad(centerLon - userLon);

  const lat1 = toRad(userLat);
  const lat2 = toRad(centerLat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= radiusInMeters;
}

// utils/geo.ts
// import { getDistance } from "geolib";

// export function isPointInCircle(
//   point: { lat: number; lon: number },
//   center: { lat: number; lon: number },
//   radius: number // in meters
// ): boolean {
//   const distance = getDistance(
//     { latitude: point.lat, longitude: point.lon },
//     { latitude: center.lat, longitude: center.lon }
//   );
//   return distance <= radius;
// }


export function isPointInCircle(
  point: { lat: number; lon: number },
  center: { lat: number; lon: number },
  radius: number // in meters
): boolean {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters

  const dLat = toRad(center.lat - point.lat);
  const dLon = toRad(center.lon - point.lon);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(point.lat)) *
      Math.cos(toRad(center.lat)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= radius;
}


// utils/timestamp.ts
export function formatTimestamp(date: Date | null): string {
  if (!date) return "N/A";
  return date.toISOString();
}

export function durationBetween(entry: Date, exit: Date): number {
  return (exit.getTime() - entry.getTime()) / 1000; // seconds
}


export function isPointInPolygon(
  point: { lat: number; lon: number },
  polygon: { lat: number; lon: number }[]
): boolean {
  let inside = false;
  const x = point.lon, y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lon, 
      yi = polygon[i].lat;
    const xj = polygon[j].lon, 
      yj = polygon[j].lat;

    const intersect = 
      ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}


/**
 * Assign a color based on severity, deadline, weather, and travel time.
 */
export function assignPriorityColor(
  severity: 'critical' | 'moderate' | 'low',
  status: 'open' | 'in_progress' | 'resolved',
  eta?: string,
  weatherImpact?: boolean,
  travelTime?: number
): string {
  let base = severity === 'critical' ? 3 : severity === 'moderate' ? 2 : 1;
  let weatherScore = weatherImpact ? 1 : 0;
  let urgencyScore = 0;

  if (eta) {
    const deadline = new Date(eta).getTime();
    const now = Date.now();
    const timeLeft = deadline - now;

    if (timeLeft < 60 * 60 * 1000) urgencyScore = 2; // <1hr
    else if (timeLeft < 3 * 60 * 60 * 1000) urgencyScore = 1; // <3hr
  }

  if (travelTime && travelTime > 30) urgencyScore += 1;

  const priorityLevel = base + weatherScore + urgencyScore;

  // Map score to color
  if (priorityLevel >= 5) return '#dc2626'; // Red
  if (priorityLevel >= 3) return '#f59e0b'; // Amber
  return '#22c55e'; // Green
}

// ): string {
//   let base = severity === 'critical'
//     ? 3
//     : severity === 'moderate'
//     ? 2
//     : 1;

//   if (dueMinutes < 60) base += 1;
//   if (weatherImpact) base += 1;
//   if (travelTime > 30) base += 1;

//   // Return color code
//   if (base >= 5) return '#dc2626'; // Red
//   if (base >= 3) return '#f59e0b'; // Orange
//   return '#10b981'; // Green
// }

// ): string {
//   if (status === 'resolved') return 'gray';
//   if (status === 'in_progress') return 'orange';

//   switch (severity) {
//     case 'critical':
//       return 'red';
//     case 'moderate':
//       return 'gold';
//     case 'low':
//       return 'green';
//     default:
//       return 'blue';
//   }
// }


