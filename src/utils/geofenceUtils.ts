// utils/geofenceUtils.ts

import React from "react";
import { Coordinates } from "@/src/hooks/useGeolocationTracking";


type Geofence =
  | { type: "circle"; center: Coordinates; radius: number }
  | { type: "polygon"; coordinates: Coordinates[] };


// Haversine for circle
function isWithinCircle(point, center, radiusMeters) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(center.latitude - point.latitude);
  const dLon = toRad(center.longitude - point.longitude);
  const lat1 = toRad(point.latitude);
  const lat2 = toRad(center.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c <= radiusMeters;
}


// Ray-casting for polygon
function isWithinPolygon(point, polygon: { latitude: number; longitude: number }[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude,
      yi = polygon[i].longitude;
    const xj = polygon[j].latitude,
      yj = polygon[j].longitude;
    const intersect =
      yi > point.longitude !== yj > point.longitude &&
      point.latitude <
        ((xj - xi) * (point.longitude - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}


export function isWithinGeofenceCheck(point, geofence) {
  if (geofence.type === "circle") {
    return isWithinCircle(point, geofence.center, geofence.radius);
  }
  if (geofence.type === "polygon") {
    return isWithinPolygon(point, geofence.coordinates);
  }
  return false;
}


export function isWithinGeofence(
  point: { latitude: number; longitude: number },
  center: { latitude: number; longitude: number },
  radiusMeters: number
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters

  const dLat = toRad(center.latitude - point.latitude);
  const dLon = toRad(center.longitude - point.longitude);
  const lat1 = toRad(point.latitude);
  const lat2 = toRad(center.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c <= radiusMeters;
}


export function isInsideGeofence( 
  point: Coordinates,
  geofence: Geofence
): boolean {
  if (geofence.type === "circle") {
    const { lat: lat1, lon: lon1 } = point;
    const { lat: lat2, lon: lon2 } = geofence.center;
    const radius = geofence.radius;

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371e3; // Earth radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = 
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radius;
  }

  if (geofence.type === "polygon") {
    const x = point.lon;
    const y = point.lat;
    let inside = false;
    const coords = geofence.coordinates;

    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      const xi = coords[i].lon,
        yi = coords[i].lat;
      const xj = coords[j].lon,
        yj = coords[j].lat;

      const intersect =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  return false;
}