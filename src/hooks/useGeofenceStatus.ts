// hooks/useGeofenceStatus.ts

import React from "react";
import { Alert } from "react-native";
import { useEffect, useState } from "react"; 
import * as Location from "expo-location";
import { useAppStore } from "@/src/stores/appStore";
import { isWithinGeofence, isPointInPolygon } from "@/src/lib/utils";
import { useTaskStore } from "@/src/stores/tasks"; // assumes Zustand store
import { useNetworkStatus } from "@/src/hooks/useNetworkStatus";
import { useGeofenceTimestampsStore } from "@/src/stores/timestamps";


// type Geofence = {
//   latitude: number;
//   longitude: number;
//   radius: number; // in meters
// };

type Geofence =
  | { type: 'circle'; center: { lat: number; lon: number }; radius: number }
  | { type: 'polygon'; coordinates: { lat: number; lon: number }[] };


// export function useGeofenceStatus(geofence: Geofence | null) {
export function useGeofenceStatus() {
//   const setIsInGeofence = useAppStore((state) => state.setIsInGeofence);

// const { assignedTasks, activeTask, startTask, endTask } = useTaskStore();
// <Button onPress={() => startTask("task-123")}>Start</Button>
// <Button onPress={endTask}>Stop</Button>
  const activeTask = useTaskStore((state:any) => state.activeTask);
//   const [isInGeofence, setIsInGeofence] = useState(false);
//   const [entryTimestamp, setEntryTimestamp] = useState<Date | null>(null);
  // const [exitTimestamp, setExitTimestamp] = useState<Date | null>(null);
  const { isConnected } = useNetworkStatus();
  const [isTracking, setIsTracking] = useState(false);
  const {
    isInGeofence,
    setInGeofence,
    entryTimestamp,
    setEntryTimestamp,
    exitTimestamp,
    setExitTimestamp,
    clearSessionTimestamps,
    syncTimestamps,
  } = useGeofenceTimestampsStore();
//   useEffect(() => {
//     if (!geofence) return;

//     let watchId: Location.LocationSubscription | null = null;

//     const startWatching = async () => {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         setIsInGeofence(false);
//         return;
//       }

//       watchId = await Location.watchPositionAsync(
//         {
//           accuracy: Location.Accuracy.High,
//           timeInterval: 5000,
//           distanceInterval: 5,
//         },
//         (location) => {
//           const { latitude, longitude } = location.coords;
//           const distance = getDistance(
//             { latitude, longitude },
//             {
//               latitude: geofence.latitude,
//               longitude: geofence.longitude,
//             }
//           );

//           setIsInGeofence(distance <= geofence.radius);
//         }
//       );
//     };

//     startWatching();

//     return () => {
//       if (watchId) {
//         watchId.remove();
//       }
//     };
//   }, [geofence]);
// }

// Helper function to calculate distance in meters using Haversine formula


// function getDistance(
//   coord1: { latitude: number; longitude: number },
//   coord2: { latitude: number; longitude: number }
// ): number {
//   const toRad = (value: number) => (value * Math.PI) / 180;
//   const R = 6371e3; // Earth radius in meters

//   const φ1 = toRad(coord1.latitude);
//   const φ2 = toRad(coord2.latitude);
//   const Δφ = toRad(coord2.latitude - coord1.latitude);
//   const Δλ = toRad(coord2.longitude - coord1.longitude);

//   const a =
//     Math.sin(Δφ / 2) ** 2 +
//     Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   return R * c; // in meters
// }

useEffect(() => {
    let watcher: Location.LocationSubscription | null = null;

    // async function startWatching() {
    //   const { status } = await Location.requestForegroundPermissionsAsync();
    //   if (status !== "granted") {
    //     console.warn("Location permission not granted");
    //     setIsInGeofence(false);
    //     return;
    //   }

    //   watcher = await Location.watchPositionAsync(
    //     {
    //       accuracy: Location.Accuracy.High,
    //       timeInterval: 5000,
    //       distanceInterval: 5,
    //     },
    //     (location) => {
    //       if (!geofence) {
    //         setIsInGeofence(false);
    //         return;
    //       }

    //       const { latitude, longitude } = location.coords;
    //       const inFence = isWithinGeofence(
    //         latitude,
    //         longitude,
    //         geofence.latitude,
    //         geofence.longitude,
    //         geofence.radius
    //       );

    //       setIsInGeofence(inFence);
    //     }
    //   );
    // }

    // startWatching();

//     return () => {
//       if (watcher) watcher.remove();
//     };
//   }, [geofence, setIsInGeofence]);
// }

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission not granted");
        Alert.alert("Location permission denied", "Unable to track your position.");
        return;
      }

      const geofence = activeTask?.geofence;
      if (!geofence) {
        console.warn("⛔ No geofence defined for active task");
        return;
      }

      setIsTracking(true);

      watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, 
            timeInterval: 5000, //every 5 sec
            distanceInterval: 5 }, // every 5m moved
        (location) => {
          const { latitude, longitude } = location.coords;
          // const inside = isPointInCircle(
          //   { lat: latitude, lon: longitude },
          //   activeTask.geofence.center,
          //   activeTask.geofence.radius
          // );
          const point = { lat: latitude, lon: longitude };
          // const g = activeTask.geofence;
          let inside = false;

          
          if (geofence.type === "circle") {
            inside = isWithinGeofence(
              point.lat,
              point.lon,
              geofence.center.lat,
              geofence.center.lon,
              geofence.radius
            );
          } else if (geofence.type === "polygon") {
            inside = isPointInPolygon(point, geofence.coordinates);
          }

          setInGeofence((wasInside) => {
            const now = new Date();
            if (!wasInside && inside) {
              // const now = new Date();
              console.log("📍 Entered geofence at", now.toISOString());
              setEntryTimestamp(now);
            } else if (wasInside && !inside) {
              // const now = new Date();
              console.log("🚪 Exited geofence at", now.toISOString());
              setExitTimestamp(now);
            }
            return inside;
          });
        }
      );
    };

    if (activeTask?.geofence) {
      startTracking();
    } else {
      // Auto-pause tracking if no active task
      console.log("🛑 No active task — pausing geofence tracking");
      setIsTracking(false);
      setInGeofence(() => false);
      clearSessionTimestamps();
    }

    return () => {
      watcher?.remove();
      console.log("👋 Cleaned up geofence watcher");
    };
  }, [activeTask]);

  // Attempt sync on reconnection
  useEffect(() => {
    if (isConnected) {
      console.log("Online?", isConnected);
      syncTimestamps();
    }
  }, [isConnected]);

  return { isInGeofence, activeTask, entryTimestamp, exitTimestamp, isTracking };
}

//Would you like me to help implement a fallback for tasks without geofences or add visual debugging for the geofence area on a map?