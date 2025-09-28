// utils/adjustTrackingSettings.ts

import React from "react";
import * as Location from 'expo-location';


export async function adjustTrackingSettings(distanceToFence: number, LOCATION_TASK_NAME:string) {
  let accuracy = Location.Accuracy.Low;
  let interval = 60000; // 60s default

  if (distanceToFence < 500) { // within 500m
    accuracy = Location.Accuracy.Balanced;
    interval = 15000;
  }
  if (distanceToFence < 100) { // very close
    accuracy = Location.Accuracy.High;
    interval = 3000;
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy,
    timeInterval: interval,
    distanceInterval: 10,
    foregroundService: {
      notificationTitle: "Tracking Active",
      notificationBody: "Optimizing for geofence proximity",
    },
  });
}

export function calculateDistance(p1, p2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(p2.latitude - p1.latitude);
  const dLon = toRad(p2.longitude - p1.longitude);
  const lat1 = toRad(p1.latitude);
  const lat2 = toRad(p2.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
