
// hooks/useGeolocationTracking.ts

import React, { useState, useEffect } from 'react';
import { Alert } from "react-native";
import * as Location from 'expo-location';
import * as TaskManager from "expo-task-manager";

import { logTimestamp, getActiveJob, getLastState, saveLastState,  } from '@/src/utils/logTimestamp'; // AsyncStorage helpers
import { isWithinGeofence } from "@/src/utils/geofenceUtils";
import { calculateDistance, adjustTrackingSettings } from '@/src/utils/adjustTrackingSettings';


export type Coordinates = { latitude: number; longitude: number };

const LOCATION_TASK_NAME = "background-location-task";

// Define background task - what happens when location updates in background
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Background location error:", error);
    return;
  }

  if (data) {
    const { locations } = data as any;
    const [location] = locations;
    const { latitude, longitude } = location.coords;

    // Get the active job’s geofence (from Redux, async storage, or backend)
    const activeJob = await getActiveJob(); 
    if (!activeJob) return;

    // const inside = isWithinGeofence(
    //   latitude, longitude,
    //   activeJob.geofenceCenter.latitude,
    //   activeJob.geofenceCenter.longitude,
    //   activeJob.radius
    // );
    const inside = isWithinGeofence({ latitude, longitude }, activeJob.geofence, activeJob.radius);
    const lastInside = await getLastState();


    // Handle enter/exit events
    if (inside && !lastInside) {
      await logTimestamp("enter", activeJob.id, new Date());
      await saveLastState(true);
    } else if (!inside && lastInside) {
      await logTimestamp("exit", activeJob.id, new Date());
      await saveLastState(false);
    }

    // Adjust accuracy dynamically
    if (activeJob.geofence.type === "circle") {
      const distance = calculateDistance(
        { latitude, longitude },
        activeJob.geofence.center
      );
      await adjustTrackingSettings(distance, LOCATION_TASK_NAME);
    }    
  }
});

// Get location 
export function useGeolocationOnce() {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status: fglocationStatus } = await Location.requestForegroundPermissionsAsync();
      if ((fglocationStatus) !== "granted") {
        setErrorMsg('Location permission denied');
        Alert.alert('Permission denied', 'Location Access is required.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      // (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })).coords;
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);
  return { userLocation, errorMsg };
}


// Track location in real time
// export function useGeolocationTracking(enabled: boolean, background: boolean = false) {
export function useGeolocationTracking(enabled: boolean, job: any | null) {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      // if (background) stopBackgroundTracking();
      if (!job) stopBackgroundTracking();
      return;
    } // don't track unless explicitly enabled

    let subscription: Location.LocationSubscription | null = null;
    
    (async () => {
      // const { status: fglocationStatus } = await Location.requestForegroundPermissionsAsync();
      // const { status: bglocationStatus } = await Location.requestBackgroundPermissionsAsync();

      // const { status } = background
      const { status } = job
        ? await Location.requestBackgroundPermissionsAsync()
        : await Location.requestForegroundPermissionsAsync();

      // if (fglocationStatus !== "granted" && bglocationStatus !== "granted") {
      if (status !== "granted") {
        setErrorMsg('Location permissions denied');
        Alert.alert('Permissions denied', 'Location Access is required.');
        return;
      }
      
      // if (background) {
      if (job) {
        // Background tracking
        await startBackgroundTracking(job);
      } else {
        // Foreground-only tracking
        //  Start watching position - Stops when component unmounts unless managed globally - Works only when the app is active
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (loc) => {
            setUserLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        );
      }
    })();
    
    return () => {
      subscription?.remove(); //clean up the active listener, when ltracking stops
      // if (background) stopBackgroundTracking();
      if (!job) stopBackgroundTracking();
    };
  // }, [enabled, background]);
  }, [enabled, job]);
    
  return { userLocation, errorMsg };
}


// Helpers
async function startBackgroundTracking(job: any) {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (!isRunning) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Tracking Active",
        notificationBody: "Location tracking is running for the active fault job" + job.id,
      },
    });
  }
}

async function stopBackgroundTracking() {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}      

//add a navigation traccker thingy maybe or leave it in navigation