// screens/Artisan/MapScreen.tsx

import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Alert, Animated, Dimensions, Linking, Modal, PanResponder, 
  Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, UrlTile, Circle, LatLng, Polygon, Region } from "react-native-maps";
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { Snackbar } from "react-native-paper";
import NetInfo from "@react-native-community/netinfo";

import Supercluster  from "supercluster";

import BottomSheet from "@gorhom/bottom-sheet";

import { Ionicons, Feather, Entypo } from "@expo/vector-icons";
import { Plus, Minus, ChevronDown, Compass, Locate, MapPin, Crosshair, Navigation2 } from "lucide-react-native";

import { Fault } from "@/src/types/faults";

import { useFaultsQuery } from "@/src/hooks/useFaultsQuery";
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { useGeolocationOnce, useGeolocationTracking } from '@/src/hooks/useGeolocationTracking';

import { useAuth } from "@/src/lib/auth/AuthContext";

import { useThemeStore } from "@/src/lib/themeStore";
import { getThemeByMode, AppTheme } from "@/src/lib/colors";
import { FAULT_STATUS_FILTERS, StatusKey, LATITUDE_DELTA, LONGITUDE_DELTA } from "@/src/lib/constants";

import { useAppStore } from "@/src/stores/appStore";

import { CONTROL_SIZE, GAP, EDGE_PADDING, GEOFENCE_VISIBLE_ZOOM, } from "@/src/utils/misc";
import { formatLabel, getSeverityColor } from "@/src/utils/misc";
import { openMapsToFault } from "@/src/utils/navigation";

import LoadingScreen from "@/src/components/LoadingScreen";
import { ClusterMarker } from "@/src/components/ui/maps/clusterMarker";





const MAPTILER_KEY = (process.env.MAPTILER_KEY ?? "__MUST_SET__"); 

// ---- Utility: safe async wrapper ----
async function safeAsync<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.error(`❌ ${label} error:`, err);
    return null;
  }
}

// Helper: convert latDelta to approximate zoom
function regionToZoom(region: Region): number {
  const angle = region.longitudeDelta;
  return Math.round(Math.log(360 / angle) / Math.LN2);
}


export default function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const { user } = useAuth();
  const {isOnline} = useNetworkStatus();
  const {userLocation, errorMsg} = useGeolocationOnce();
  // const {userLocation, errorMsg} = useGeolocationTracking(false, false);

  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  const [selectedFilter, setSelectedFilter] = useState<StatusKey>("pending");
  const [selectedFaultJob, setSelectedFaultJob] = useState<any | null>(null);
  
  const mode = useThemeStore((s) => s.mode);
  const themeColors: AppTheme = getThemeByMode(mode);
    
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isZooming, setIsZooming] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [bottomSheetHeight] = useState(new Animated.Value(90));

  const { showMockData } = useAppStore();


  
  // call fetch Faults hook
  const { 
    filteredFaults, 
    activeFaultJob, 
    primaryFault, 
    refreshFaults, 
    loading, 
    error 
  } = useFaultsQuery({
    isOnline,
    // user: user ?? { id: "anon", role: "artisan" as const },
    user: user!,
    location:userLocation,
    useMockData:showMockData,
    selectedFilter:"all"
  } as any);

  const handleRefresh = async () => {
    await refreshFaults();
  };

  // Filter jobs
  const faultJobs = showMockData 
  ? ( Array.isArray(filteredFaults) ? filteredFaults : []) 
  : [];

  // Filtered jobs by status
  const filteredFaultJobs = useMemo(() => {
    return faultJobs.filter((f:any) => selectedFilter === "all" ? true : f.status === selectedFilter );
  }, [faultJobs, selectedFilter]);

  // Convert to GeoJSON for Supercluster
  const points = useMemo(() =>
    filteredFaultJobs
      .filter((f) => f.coords)
      .map((f) => ({
      type: "Feature" as const,
      properties: { ...f, cluster: false },
      geometry: { type: "Point" as const, coordinates: [f.coords.longitude, f.coords.latitude] },
    })),
  [filteredFaultJobs]);

  // Supercluster index
  const clusterIndex = useMemo(() => {
    const index = new Supercluster({
      radius: 60, // px cluster radius
      maxZoom: 20,
    });
    try {
      // ensure points is an array of valid GeoJSON features
      const safePoints = Array.isArray(points)
        ? points.filter(p => p && p.geometry && Array.isArray(p.geometry.coordinates) && p.geometry.coordinates.length === 2)
        : [];
      index.load(safePoints);
    } catch (err) {
      console.error("clusterIndex.load error:", err);
      // fallback: leave index empty (no clusters) to avoid crashing the app
    }
    return index;
  }, [points]); 

  // Compute clusters for visible region
  const clusters = useMemo(() => {
    if (!mapRegion) return [];
    const bounds = [
      mapRegion.longitude - mapRegion.longitudeDelta / 2, // west
      mapRegion.latitude - mapRegion.latitudeDelta / 2,  // south
      mapRegion.longitude + mapRegion.longitudeDelta / 2, // east
      mapRegion.latitude + mapRegion.latitudeDelta / 2,  // north
    ] as [number, number, number, number];
    const zoom = regionToZoom(mapRegion);
    return clusterIndex.getClusters(bounds, zoom);
  }, [clusterIndex, mapRegion]);

  // Clustering (simple distance-based)
  // const clusteredJobs = useMemo(() => {
  //   if (!mapRegion || mapRegion.latitudeDelta < CLUSTER_VISIBLE_ZOOM) return filteredFaultJobs;
  //   const clusters: { latitude: number; longitude: number; count: number }[] = [];
  //   // Simple grid-based clustering
  //   const gridSize = mapRegion.latitudeDelta / 20;
  //   const added = new Set<number>();

  //   filteredFaultJobs.forEach((job, i) => {
  //     if (added.has(i)) return;
  //     let clusterLat = job.coords.latitude;
  //     let clusterLng = job.coords.longitude;
  //     let count = 1;

  //     filteredFaultJobs.forEach((otherJob, j) => {
  //       if (i !== j && !added.has(j)) {
  //         const latDiff = Math.abs(clusterLat - otherJob.coords.latitude);
  //         const lngDiff = Math.abs(clusterLng - otherJob.coords.longitude);
  //         if (latDiff < gridSize && lngDiff < gridSize) {
  //           clusterLat = (clusterLat * count + otherJob.coords.latitude) / (count + 1);
  //           clusterLng = (clusterLng * count + otherJob.coords.longitude) / (count + 1);
  //           count += 1;
  //           added.add(j);
  //         }
  //       }
  //     });
  //     clusters.push({ latitude: clusterLat, longitude: clusterLng, count });
  //   });
  //   return clusters;
  // }, [filteredFaultJobs, mapRegion]);

  const renderMarkers = (
    clusters: any[],
    clusterIndex: any,
    setSelectedFaultJob: (job: any) => void,
    mapRef: React.RefObject<MapView>
  ) => {
    return clusters.map((c) => {
      const [longitude, latitude] = c.geometry.coordinates;
      const { c: isCluster, point_count } = c.properties;

      if (c.properties.cluster) {
        const clusterId = c.id;

        const leaves = clusterIndex.getLeaves(clusterId, 1); // first leaf for type
        const firstFault = leaves[0]?.properties;

        return (
          <Marker
            key={`cluster-${clusterId}`}
            coordinate={{ latitude, longitude }}
            // onPress={() => handleClusterPress(clusterId, cluster)}
            onPress={() => {
              const expansionZoom = clusterIndex.getClusterExpansionZoom(clusterId);
              mapRef.current?.animateCamera({
                center: { latitude, longitude },
                zoom: expansionZoom * 1.1,
              });
            }}
          >
            <ClusterMarker
              count={c.properties.point_count}
              representativeType={firstFault?.type ?? "F"}
              hasCritical={leaves.some((l: any) => l.properties.severity === "critical")}
              hasMajor={leaves.some((l: any) => l.properties.severity === "major")}
              hasMinor={leaves.some((l: any) => l.properties.severity === "minor")}
            />
          </Marker>
        );
      } else {
        const fault = c.properties as Fault;
        return (
          <Marker
            key={`point-${fault.id}`}
            coordinate={{ latitude, longitude }}
            pinColor={fault.severity === "critical" ? "red" : "yellow"}
            title={`${fault.title ?? "Fault"} @ ${fault.locationName ?? "this location"}`}
            description={`Possible ${fault.cause ?? "unknown"} | ${fault.source ?? "unknown"} | ${fault.zone ?? "Unknown"} Zone`}
            onPress={() => {
              setSelectedFaultJob(fault.id);
              mapRef.current?.animateToRegion(
                {
                  latitude: fault.coords.latitude,
                  longitude: fault.coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                },
                500
              );
            }}
          />
        );
      }
    });
  };

  const memoizedMarkers = useMemo(
    () => renderMarkers(clusters, clusterIndex, setSelectedFaultJob, mapRef),
    [clusters, clusterIndex, setSelectedFaultJob, mapRef]
  );

  const handleLocateMe = useCallback(() => {
    if (!userLocation) {
      Alert.alert("Location issue", errorMsg ?? "Could not retrieve location.");
      return;
    }
    scale.value = withSpring(0.95);
    mapRef.current?.animateToRegion({
      ...userLocation,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setTimeout(() => (scale.value = withSpring(1)), 300);
  }, [userLocation, errorMsg, scale]);


  const initialRegion = useMemo(
    () => ({
      latitude: userLocation?.latitude ?? -17.8292,
      longitude: userLocation?.longitude ?? 31.0522,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }),
    [userLocation]
  );

  // Fit map to artisan + faults
  const autoFitMap = useCallback(() => {
    if (!mapRef.current || !userLocation ) return;
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
    mapRef.current.animateToRegion(region, 300);
  }, [filteredFaultJobs, userLocation]);

  // useEffect(() => {
  //   const t = setTimeout(autoFitMap, 150); // small delay for map to render before fitting
  //   return () => clearTimeout(t);
  // }, [autoFitMap]);

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

  // Top-level map controls
  // const zoomPrime = useCallback((delta: number) => {
  //   mapRef.current?.getCamera().then((cam) => {
  //     if (!cam?.zoom && cam?.zoom !== 0) return;
  //     mapRef.current?.animateCamera({ zoom: cam.zoom + delta });
  //   });
  // }, []);  
  // const handleZoom = (delta: 1 | -1) => {
  //   if (!mapRef.current || !mapRegion) return;
  //   const factor = delta > 0 ? 0.5 : 2;
  //   mapRef.current.animateToRegion({
  //     ...mapRegion,
  //     latitudeDelta: mapRegion.latitudeDelta * factor,
  //     longitudeDelta: mapRegion.longitudeDelta * factor,
  //   });
  // };
  const zoom = (direction: "in" | "out") => {
    if (isZooming || !mapRef.current) return; // block spamming
    setIsZooming(true);
    mapRef.current.getCamera().then((cam) => {
      const newZoom = direction === "in" ? cam.zoom + 1 : cam.zoom - 1;
      mapRef.current?.animateCamera({ ...cam, zoom: newZoom }, { duration: 300 });
    });
    setTimeout(() => setIsZooming(false), 350); // throttle ~350ms
  };

  const resetCompass = useCallback(() => {
    mapRef.current?.animateCamera({ heading: 0, pitch: 0 });
  }, []);
    
  const controlButtons = useMemo(
    () => [
      { key: "reset", icon: <Compass size={22} />, onPress: resetCompass },
      { key: "zoom-in", icon: <Plus size={22} />, onPress: () => zoom("in") },
      { key: "zoom-out", icon: <Minus size={22} />, onPress: () => zoom("out") },
      { key: "fit", icon: <Crosshair size={22} />, onPress: handleFitTap },
    ],
    [zoom, resetCompass, handleFitTap]
  );

  const handleNavigateToFault = useCallback(() => {
    if (!selectedFaultJob?.coords) {
      Alert.alert("No coordinates available");
      return;
    }    
    const { latitude, longitude } = selectedFaultJob.coords;
    Linking.openURL( `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving` );

  }, [selectedFaultJob]); 


  return (
    <>
      {loading ? (
          <LoadingScreen />
        ) : (
          <View style={[styles.container, { backgroundColor: themeColors.colors.background}]} >
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              initialRegion={initialRegion}
              showsUserLocation
              onRegionChangeComplete={(region) => setMapRegion(region)}
              onMapReady={() => {
                setTimeout(() => {
                  try {
                    autoFitMap();
                  } catch (err) {
                    console.error("autoFitMap error:", err);
                  }
                }, 300);
              }}
              // onMapError={() => setTileError(true)}
              showsMyLocationButton={false}
              showsCompass = {false}
              // customMapStyle={mode === "dark" ? mapThemes.dark : mapThemes.light}
              // mapPadding={EDGE_PADDING}
              // provider={PROVIDER_GOOGLE}
              // {...(Platform.OS === "ios" ? { compassOffset: { x: 16, y: 96 } } : {})}
            >

              {/* OpenStreetMap / MapTiler tiles (guarded) */}
              {/* {(!tileError && isOnline && MAPTILER_KEY && MAPTILER_KEY !== "__MUST_SET__") ? ( */}
              {(!tileError && MAPTILER_KEY && MAPTILER_KEY !== "__MUST_SET__") ? (
                <UrlTile
                  // urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  urlTemplate={`https://api.maptiler.com/tiles/streets/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`}
                  maximumZ={19}
                  flipY={false}
                  // There is no onError prop for UrlTile in react-native-maps stable, so as a fallback
                  // we guard by setting tileError from network or map errors elsewhere.
                />
              ) : null}
              
              {/* Clustered markers (safe rendering) */}
              {/* {clusteredJobs.map((entry, idx) => {
                // cluster entries from your clusteredJobs use {latitude, longitude, count} for clusters
                if (entry && typeof (entry as any).count === "number" && (entry as any).count > 1) {
                  const cluster = entry as { latitude: number; longitude: number; count: number };
                  return (
                    <Marker
                      key={`cluster-${idx}-${cluster.latitude}-${cluster.longitude}`}
                      coordinate={{ latitude: Number(cluster.latitude), longitude: Number(cluster.longitude) }}
                      onPress={() => {
                        mapRef.current?.animateToRegion({
                          latitude: Number(cluster.latitude),
                          longitude: Number(cluster.longitude),
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }, 500);
                      }}
                    >
                      <View style={styles.clusterMarker}>
                        <Text style={styles.clusterText}>{cluster.count}</Text>
                      </View>
                    </Marker>
                  );
                }

                // otherwise treat as single job — ensure coords exist
                const job = entry as any;
                if (!job || !job.latitude || !job.longitude) {
                  // fallback: skip rendering invalid entry
                  return null;
                }
                // attempt to find corresponding job object in filteredFaultJobs (search by coords)
                const matched = filteredFaultJobs.find(f => f?.coords?.latitude === job.latitude && f?.coords?.longitude === job.longitude);
                const id = matched?.id ?? `marker-${idx}-${job.latitude}-${job.longitude}`;

                return (
                  <Marker
                    key={id}
                    coordinate={{ latitude: job.latitude, longitude: job.longitude }}
                    pinColor={matched?.severity === "critical" ? "red" : (matched?.severity === "major" ? "orange" : "yellow")}
                    onPress={() => {
                      if (matched) setSelectedFaultJob(matched);
                      mapRef.current?.animateToRegion({
                        latitude: job.latitude,
                        longitude: job.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }, 500);
                    }}
                    title={matched?.title ?? "Fault"}
                    description={
                      matched 
                        ? `Possible ${matched.cause ?? "unknown"} | ${matched.source ?? "Unknown Source"}`
                        : undefined
                    }
                  />
                );
              })} */}

              {/* {clusters.map((c: any) => {
                const [longitude, latitude] = c.geometry.coordinates;
                const size = Math.min(50, 20 + Math.log(c.properties.point_count) * 8);
                // const severityColor = clusterHasCritical
                //   ? "red"
                //   : clusterHasMajor
                //     ? "orange"
                //     : "#2563eb";

                if (c.properties.cluster) {
                  return (
                    <Marker
                      key={`cluster-${c.id}`}
                      coordinate={{ latitude, longitude }}
                      onPress={() => {
                        const expansionZoom = clusterIndex.getClusterExpansionZoom(c.id);
                        mapRef.current?.animateCamera({
                          center: { latitude, longitude },
                          zoom: expansionZoom*1.1,
                        });
                      }}
                    >
                      
                      <View style={[
                        styles.clusterMarker,
                        { width: size, height: size, borderRadius: size / 2 }
                      ]}>
                        <Text style={styles.clusterText}>{c.properties.point_count}</Text>
                      </View>
                    </Marker>
                  );
                } else {
                  const clusterFault = c.properties as Fault;
                  return (
                    <Marker
                      key={`point-${clusterFault.id}`}
                      coordinate={{ latitude, longitude }}
                      pinColor={clusterFault.severity === "critical" ? "red" : "yellow"}
                      title={String(`${clusterFault.title ?? "Fault"} @ ${clusterFault.locationName ?? "this location."}`)}
                      description={`Possible ${clusterFault.cause ?? "cause unknown"} | ${clusterFault.source ?? "Unknown Source"} | ${clusterFault.zone ?? "Unknown"} Zone`}
                      onPress={() => {
                        setSelectedFaultJob(clusterFault.id);
                        mapRef.current?.animateToRegion({
                          latitude: clusterFault.coords.latitude,
                          longitude: clusterFault.coords.longitude,
                          latitudeDelta: 0.01, // zoom tighter
                          longitudeDelta: 0.01,
                        }, 500);}
                      }
                    />
                  );
                }
              })} */}

              {/* Render clusters & markers */}
              {memoizedMarkers}
            
              {/* Geofences (render only when zoomed in) */}
              {mapRegion &&
                mapRegion.latitudeDelta < GEOFENCE_VISIBLE_ZOOM &&
                filteredFaultJobs.map((job: any) => {
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
                  if (job.geofence?.type === "polygon"  && job.geofence.coordinates) {
                    return (
                      <Polygon
                        key={`gf-${job.id}`}
                        coordinates={job.geofence.coordinates ?? []}
                        strokeColor={getSeverityColor(job.severity)}
                        fillColor={`${getSeverityColor(job.severity)}55`}
                        strokeWidth={1}
                      />
                    );
                  }
                  return null;
                })
              }
            </MapView>

            {/* Filter Pills */}
            <View style={styles.filterTabs}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {FAULT_STATUS_FILTERS.map((status) => (
                  <TouchableOpacity
                    key={status.key}
                    style={[styles.filterButton, selectedFilter === status.key && styles.filterButtonActive]}
                    onPress={() => {
                      setSelectedFilter(status.key as StatusKey); // ensure we set the key (string) not the full object
                      setTimeout(() => fitToFilteredData(), 30); // slight debounce to allow state to settle before fit
                    }}
                  >
                    <Text style={{ color: selectedFilter === status.key ? "#fff" : "#1f1e1eff" }}>{formatLabel(status.label)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Snackbar for tile error */}
            <Snackbar 
              visible={tileError} 
              onDismiss={() => setTileError(false)} 
              duration={3000}
            >
              Map tiles failed to load. Showing fallback basemap.
            </Snackbar>            

            {/* Top Map Controls */}
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
                <TouchableOpacity onPress={handleNavigateToFault} >
                  <Navigation2 size={22} />
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
  loadingText: { marginTop: GAP, fontSize: 16, opacity: 0.6 },

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
    borderColor: "#78a0c5ff", 

    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,

    minWidth: 32,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
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
