import React from "react";
import { Coordinates } from '@/src/hooks/useGeolocationTracking';

/** 
 * Mock implementation of travel time estimation.
 * Replace with real API (e.g., Google Directions API or Mapbox).
 */
export async function getTravelTime(
  from: Coordinates,
  to: Coordinates
): Promise<number> {
  const latDiff = Math.abs(from.latitude - to.latitude);
  const lonDiff = Math.abs(from.longitude - to.longitude);
  const distanceKm = Math.sqrt(latDiff ** 2 + lonDiff ** 2) * 111; // Rough conversion to km

  // Simulate 40km/h average speed
  const timeMinutes = (distanceKm / 40) * 60;

  // Simulate network delay
  await new Promise((r) => setTimeout(r, 300));

  return Math.round(timeMinutes);
  // // Mock travel time based on distance formula
  // const R = 6371; // Earth radius in km
  // const dLat = (to.latitude - from.latitude) * (Math.PI / 180);
  // const dLng = (to.longitude - from.longitude) * (Math.PI / 180);
  // const a =
  //   Math.sin(dLat / 2) ** 2 +
  //   Math.cos(from.latitude * (Math.PI / 180)) *
  //     Math.cos(to.latitude * (Math.PI / 180)) *
  //     Math.sin(dLng / 2) ** 2;
  // const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // const distance = R * c; // in km
  // const avgSpeed = 40; // km/h
  // const travelTime = (distance / avgSpeed) * 60; // in minutes
  // return Math.round(travelTime);  
}
