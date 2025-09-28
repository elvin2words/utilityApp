// screens/Artisan/MapScreen.tsx

import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Alert, Animated, Dimensions, Linking, Modal, PanResponder, 
  Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Circle, LatLng, PROVIDER_GOOGLE, Polygon, Region } from "react-native-maps";
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import Toast from "react-native-toast-message";

import NetInfo from "@react-native-community/netinfo";

import BottomSheet from "@gorhom/bottom-sheet";

import { Ionicons, Feather, Entypo } from "@expo/vector-icons";
import { Plus, Minus, ChevronDown, Compass, Locate, MapPin, Crosshair, Navigation2 } from "lucide-react-native";

import { Fault } from "@/src/types/faults";

import mockFaults from "@/assets/mocks/mockFaults.json";

// import SuperCluster from 'react-native-maps-super-cluster';
// import MapboxGL from "@rnmapbox/maps";

import { useGeolocationOnce, useGeolocationTracking, Coordinates } from '@/src/hooks/useGeolocationTracking';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { getWeather, fetchWeatherImpact } from '@/src/hooks/useWeather';
import { useFaultsQuery } from "@/src/hooks/useFaultsQuery";

import { useAuth } from "@/src/lib/auth/AuthContext";

import { FAULT_STATUS_FILTERS, API_BASE_URL } from "@/src/lib/constants";
import { calculateGeoFenceStatus } from '@/src/lib/utils';
import { getTravelTime } from '@/src/lib/navigation';
import { queueMutation, replayQueuedMutations } from "@/src/lib/offlineQueue";

import { getCachedJobs, cacheJobs } from "@/src/lib/jobCache";

import { useThemeStore } from "@/src/lib/themeStore";
import { getThemeByMode, AppTheme } from "@/src/lib/colors";

import { formatLabel, getSeverityColor } from "@/src/utils/misc";
import { openMapsToFault } from "@/src/utils/navigation";
import { getCachedEnrichment, cacheEnrichment } from '@/src/utils/enrichmentCache';

import { 
  normalizeCoords,
  width, height, 
  CONTROL_SIZE, 
  GAP, 
  BOTTOM_NAV_SAFE, 
  EDGE_PADDING,
  DETAILED_ZOOM_THRESHOLD,  
  BOTTOM_SHEET_HEIGHT,
  GEOFENCE_VISIBLE_ZOOM,
  CLUSTER_VISIBLE_ZOOM
} from "@/src/utils/misc";

import LoadingScreen from "@/src/components/LoadingScreen";



export default function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const { user } = useAuth();
  const {isOnline} = useNetworkStatus();
  const {userLocation, errorMsg} = useGeolocationOnce();
  // const {userLocation, errorMsg} = useGeolocationTracking(false, false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  const [selectedFilter, setSelectedFilter] = useState<typeof FAULT_STATUS_FILTERS[number]>("pending");
  const [selectedFaultJob, setSelectedFaultJob] = useState<Fault | null>(null);
  
  const [bottomSheetHeight] = useState(new Animated.Value(90));
  
  const [refreshing, setRefreshing] = useState(false);

  const mode = useThemeStore((s) => s.mode);
  const themeColors: AppTheme = getThemeByMode(mode);
    
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  


  // call fetch Faults hook, others???
  const { 
    filteredFaults = mockFaults, 
    activeFault, 
    primaryFault, 
    refreshFaults = async () => {}, 
    loading, 
    error 
  } = useFaultsQuery({
    isOnline,
    user: user ?? { id: "anon", role: "artisan" as const },
    location:userLocation,
    useMockData:true,
    selectedFilter:"all"
  } as any);

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    await refreshFaults();
  };

  // Filter jobs
  // const filteredFaultJobs = filteredFaults;
  const filteredFaultJobs = Array.isArray(filteredFaults) && filteredFaults.length ? filteredFaults : mockFaults;

  // Clustering (simple distance-based)
  const clusteredJobs = useMemo(() => {
    if (!mapRegion || mapRegion.latitudeDelta < CLUSTER_VISIBLE_ZOOM) return filteredFaultJobs;
    const clusters: { latitude: number; longitude: number; count: number }[] = [];
    // Simple grid-based clustering
    const gridSize = mapRegion.latitudeDelta / 20;
    const added = new Set<number>();

    filteredFaultJobs.forEach((job, i) => {
      if (added.has(i)) return;
      let clusterLat = job.coords.latitude;
      let clusterLng = job.coords.longitude;
      let count = 1;

      filteredFaultJobs.forEach((otherJob, j) => {
        if (i !== j && !added.has(j)) {
          const latDiff = Math.abs(clusterLat - otherJob.coords.latitude);
          const lngDiff = Math.abs(clusterLng - otherJob.coords.longitude);
          if (latDiff < gridSize && lngDiff < gridSize) {
            clusterLat = (clusterLat * count + otherJob.coords.latitude) / (count + 1);
            clusterLng = (clusterLng * count + otherJob.coords.longitude) / (count + 1);
            count += 1;
            added.add(j);
          }
        }
      });
      clusters.push({ latitude: clusterLat, longitude: clusterLng, count });
    });

    return clusters;
  }, [filteredFaultJobs, mapRegion]);

    
  const handleLocateMe = useCallback(async () => {
    scale.value = withSpring(0.95);
    try {
      if (errorMsg) throw new Error(errorMsg);
      const waitForLocation = new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Location request timed out")), 10000);
        const checkLocation = () => {
          if (userLocation) {
            clearTimeout(timeout);
            resolve(userLocation);
          } else setTimeout(checkLocation, 500);
        };
        checkLocation();
      });
      const coords = await waitForLocation;
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    } catch (err: any) {
      Alert.alert("Location issue", err?.message ?? "Could not retrieve location.");
    } finally {
      scale.value = withSpring(1);
    }
  }, [userLocation, errorMsg, scale]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    // await onActionQueued();
    setRefreshing(false);
  };


  const initialRegion = useMemo(
    () => ({
      latitude: userLocation?.latitude ?? -17.8292,
      longitude: userLocation?.longitude ?? 31.0522,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }),
    [userLocation]
  );

  // Fit map to artisan + faults
  const autoFitMap = useCallback(() => {
    if (!mapRef.current || !userLocation) return;
    const coords = [...filteredFaultJobs.map((f: any) => f.coords), userLocation].filter(Boolean);
    if (coords.length === 0) return;

    const lats = coords.map((c: any) => c.latitude);
    const lngs = coords.map((c: any) => c.longitude);

    const region: Region = {
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitudeDelta: Math.max(Math.max(...lats) - Math.min(...lats), 0.01) * 1.5,
      longitudeDelta: Math.max(Math.max(...lngs) - Math.min(...lngs), 0.01) * 1.5,
    };

    mapRef.current.animateToRegion(region, 600);
  }, [filteredFaultJobs, userLocation]);

  useEffect(() => {
    // small delay for map to render before fitting
    const t = setTimeout(autoFitMap, 300);
    return () => clearTimeout(t);
  }, [autoFitMap]);


  const fitToFilteredData = useCallback(
    (includeUser = false) => {
      const points: LatLng[] = [];
      if (includeUser && (userLocation?.latitude && userLocation?.longitude)) {
        points.push({ latitude: userLocation.latitude, longitude: userLocation.longitude, });
      }
      filteredFaultJobs.forEach(f => points.push({ latitude: f.coords.latitude, longitude: f.coords.longitude }));
      if (points.length > 0) {
        mapRef.current?.fitToCoordinates(points, {
          edgePadding: EDGE_PADDING,
          animated: true,
        });
      } else if (includeUser && (userLocation)) {
        mapRef.current?.animateToRegion({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
      });
    }},
    [ filteredFaultJobs, userLocation, ]
  );
  
  const handleFitTap = () => {
    if (tapTimeout.current) {
      // Double tap detected
      clearTimeout(tapTimeout.current);
      tapTimeout.current = null;
      fitToFilteredData(true); // include user location
    } else {
      // First tap → wait to see if double
      tapTimeout.current = setTimeout(() => {
        fitToFilteredData(); // just filtered data
        tapTimeout.current = null;
      }, 250); // 250ms window
    }
  };


  const handleFilterChange = (key: string) => {
    setSelectedFilter(key);
    setTimeout(fitToFilteredData, 20);
  };

  
  // Top-level map controls
  const zoom = useCallback((delta: number) => {
    mapRef.current?.getCamera().then((cam) => {
      if (!cam?.zoom && cam?.zoom !== 0) return;
      mapRef.current?.animateCamera({ zoom: cam.zoom + delta });
    });
  }, []);  
  // const handleZoom = (delta: 1 | -1) => {
  //   if (!mapRef.current || !mapRegion) return;
  //   const factor = delta > 0 ? 0.5 : 2;
  //   mapRef.current.animateToRegion({
  //     ...mapRegion,
  //     latitudeDelta: mapRegion.latitudeDelta * factor,
  //     longitudeDelta: mapRegion.longitudeDelta * factor,
  //   });
  // };

  const resetCompass = useCallback(() => {
    mapRef.current?.animateCamera({ heading: 0, pitch: 0 });
  }, []);
    
  const controlButtons = useMemo(
    () => [
      { key: "reset", icon: <Compass size={22} />, onPress: resetCompass },
      { key: "zoom-in", icon: <Plus size={22} />, onPress: () => zoom(1) },
      { key: "zoom-out", icon: <Minus size={22} />, onPress: () => zoom(-1) },
      { key: "fit", icon: <Crosshair size={22} />, onPress: handleFitTap },
    ],
    [zoom, resetCompass, handleFitTap]
  );

  const handleNavigateToFault = useCallback(() => {
    if (!selectedFaultJob?.coords) return;
    const { latitude, longitude } = selectedFaultJob.coords;
    Linking.openURL( `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving` );

  }, [selectedFaultJob]); 

  

  return (
    <>
      {loading ? (
          <LoadingScreen />
        ) : (
          <View
            // showsVerticalScrollIndicator={false}
            // refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchJobs} tintColor={themeColors.colors.primary} />}
            style={[styles.container, { backgroundColor: themeColors.colors.background}]}
          >
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              initialRegion={initialRegion}
              // provider={PROVIDER_GOOGLE}
              showsMyLocationButton={false}
              showsUserLocation
              onMapReady={() => {
                // setMapReady(true);
                // setTimeout(fitToFilteredData(true), 1);
                autoFitMap(); // pan once map is ready
              }}
              // customMapStyle={mode === "dark" ? mapThemes.dark : mapThemes.light}
              onRegionChangeComplete={(region) => setMapRegion(region)}
              // showsCompass
              // mapPadding={{ top: 80, right: 12, bottom: 140, left: 12 }}
              {...(Platform.OS === "ios" ? { compassOffset: { x: 16, y: 96 } } : {})}
            >
              {/* Artisan marker */}
              {userLocation && (
                <>
                  <Marker coordinate={userLocation} title="Me" pinColor="blue" description="My current location" />
                  <Circle center={userLocation} radius={30} strokeColor="rgba(0,122,255,0.5)" fillColor="rgba(0,122,255,0.2)" />
                </>
              )}

              {/* Clustered markers */}
              {clusteredJobs.map((c, idx) =>
                "count" in c && c.count > 1 ? (
                  <Marker 
                    key={`cluster-${idx}`} 
                    coordinate={{ latitude: Number(c.latitude), longitude: Number(c.longitude) }}
                    onPress={() => {
                      mapRef.current?.animateToRegion({
                        latitude: Number(c.latitude),
                        longitude: Number(c.longitude),
                        latitudeDelta: 0.01, // zoom tighter
                        longitudeDelta: 0.01,
                      }, 500);}
                    }
                  >
                    <View style={styles.clusterMarker}>
                      <Text style={styles.clusterText}>{c.count}</Text>
                    </View>
                  </Marker>
                ) : (
                  <Marker
                    key={filteredFaultJobs[idx].id ??  `${filteredFaultJobs[idx].coords.latitude}-${filteredFaultJobs[idx].coords.longitude}`}
                    coordinate={filteredFaultJobs[idx].coords}
                    pinColor={filteredFaultJobs[idx].severity === "critical" ? "red" : "yellow"}
                    // pinColor={getSeverityColor(filteredFaultJobs[idx].severity)}
                    onPress={() => {
                      setSelectedFaultJob(filteredFaultJobs[idx]);
                      mapRef.current?.animateToRegion({
                        latitude: filteredFaultJobs[idx].coords.latitude,
                        longitude: filteredFaultJobs[idx].coords.longitude,
                        latitudeDelta: 0.01, // zoom tighter
                        longitudeDelta: 0.01,
                      }, 500);}
                    }
                    title={String(`${filteredFaultJobs[idx].title ?? "Fault"} @ ${filteredFaultJobs[idx].locationName ?? "this location."}`)}
                    description={`Possible ${filteredFaultJobs[idx].cause ?? "cause unknown"} | ${filteredFaultJobs[idx].source ?? "Unknown Source"} | ${filteredFaultJobs[idx].zone ?? "Unknown"} Zone`}
                  />
                )
              )}

            {/* Geofences (render only when zoomed in) */}
            {mapRegion &&
              mapRegion.latitudeDelta < GEOFENCE_VISIBLE_ZOOM &&
              filteredFaultJobs.map((job) => {
                if (job.geofence?.type === "circle" && job.geofence.center) {
                  return (
                    <Circle
                      key={`gf-${job.id}`}
                      center={job.geofence.center}
                      radius={job.geofence.radius || 20}
                      strokeColor="rgba(48, 48, 224, 0.4)"
                      fillColor="rgba(86, 86, 168, 0.1)"
                    />
                  );
                }
                // if (job.geofence?.coordinates.length > 1) {
                if (job.geofence?.type === "polygon") {
                  return (
                    <Polygon
                      key={`gf-${job.id}`}
                      coordinates={job.geofence.coordinates ?? []}
                      // coordinates={job.geofence.coordinates.map(([longitude, latitude]) => ({ latitude: latitude, longitude: longitude }))}
                      // strokeColor={getSeverityColor(job.severity)}
                      strokeColor={job.severity}
                      // fillColor={`${getSeverityColor(job.severity)}55`}
                      fillColor={`${job.severity}55`}
                      strokeWidth={1}
                    />
                  );
                }
                return null;
              })}
            </MapView>

            {/* Filter Pills */}
            <View style={styles.filterTabs}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {FAULT_STATUS_FILTERS.map((status) => (
                  <TouchableOpacity
                    key={status.key}
                    style={[styles.filterButton, selectedFilter === status && styles.filterButtonActive]}
                    onPress={() => setSelectedFilter(status)}
                  >
                    <Text style={{ color: selectedFilter === status ? "#fff" : "#1f1e1eff" }}>{formatLabel(status.label)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>            

            {/* Top Controls */}
            <View style={styles.controls}>
              {controlButtons.map((btn) => (
                <TouchableOpacity key={btn.key}  onPress={btn.onPress} style={styles.controlBtn}>
                  {btn.icon}
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={handleLocateMe} style={styles.controlBtn}>
                <Locate size={22}/>
              </TouchableOpacity>
            </View>    

            <View style={styles.bottomBar}>
              {/* Navigate to button */}

              <Animated.View style={[
                animatedStyle,  
                { width: CONTROL_SIZE, height: CONTROL_SIZE, borderRadius: CONTROL_SIZE / 2 }, 
                styles.navigateButtonFloating  
              ]}>
                <TouchableOpacity onPress={handleLocateMe} >
                  <Navigation2 size={22} />
                  {/* {userLocation ? <ActivityIndicator /> : <Locate size={22} />} */}
                </TouchableOpacity>
              </Animated.View>

              {/* Locate Me button */}
              <Animated.View style={[
                animatedStyle,  
                { width: CONTROL_SIZE, height: CONTROL_SIZE, borderRadius: CONTROL_SIZE / 4 }, 
                styles.locateButton  
              ]}>
                <TouchableOpacity onPress={handleLocateMe} >
                  <Locate size={22} />
                  {/* {userLocation ? <ActivityIndicator /> : <Locate size={22} />} */}
                </TouchableOpacity>
              </Animated.View>

            </View>
          </View>
        )
      }
    </>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1,  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, opacity: 0.6 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, opacity: 0.6 },

  filterTabs: { 
    position: "absolute", 
    top: GAP, 
    left: 0,
    right: 0,
    width: "100%", 
    flexDirection: "row",
    alignItems: "center",
    // paddingHorizontal: GAP, 
    marginHorizontal: GAP, 
  },  
  filterButton: { 
    backgroundColor: "rgba(95, 87, 134, 0.54)", 
    paddingHorizontal: GAP, 
    paddingVertical: GAP/2, 
    borderRadius: GAP*2, 
    marginRight: GAP/1.5,
    alignItems: "center",
  },  
  filterButtonActive: { backgroundColor: "#2563eb" },
  
  controls: { 
    position: "absolute", 
    top: GAP*4.5, 
    right: GAP, 
    borderRadius: 12,
    backgroundColor: "rgba(95, 87, 134, 0.54)",
    flexDirection: "column", 
    padding: GAP/3,
    gap:GAP/2
  },
  controlBtn: {
    backgroundColor: "#fff", 
    padding: 8, 
    width: GAP*3, 
    height: GAP*3,
    justifyContent: "center", 
    alignItems: "center", 
    borderRadius: 10, 
  },
  clusterMarker: { 
    backgroundColor: "#2563eb", 
    borderRadius: 25, 
    padding: 5, 
    borderWidth: 2, 
    borderColor: "#78a0c5ff" 
  },
  clusterText: { 
    color: "#fff", 
    fontWeight: "bold" 
  },

  bottomBar: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  locateButton: {
    position: "absolute",
    bottom: GAP,
    right: GAP,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    // marginRight: GAP,
    // marginLeft:GAP/2,
  },
  navigateButtonFloating: {
    position: "absolute",
    bottom: GAP*6,
    right: GAP,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },  
});
