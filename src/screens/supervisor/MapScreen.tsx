// screens/supervisor/MapScreen.tsx

import React, { useEffect, useMemo, useRef, useState, useCallback, JSX } from "react";
import { Alert, Animated as RNAnimated, FlatList, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";

import MapView, {
  Marker,
  Heatmap,
  UrlTile,
  Polyline,
  LatLng,
  Circle,
  Polygon,
  Region,
} from "react-native-maps";

import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Plus, Minus, ChevronDown, Compass, Crosshair, Locate, BarChart2 } from "lucide-react-native";

import { Fault, } from "@/src/shared/schema";

import {
  MAP_LAYER_OPTIONS,
  FAULT_STATUS_FILTERS,
  ADMIN_MODES,
  HEATMAP_FILTERS,
  FACILITIES_FILTERS,
  StatusKey,
  ModeKey,
  FacilitiesKey,
  HeatMapKey,
  LayerKey,
  HEATMAP_LEGENDS,
  HeatmapLegendProps,
} from "@/src/lib/constants";

import mockFaults from "@/assets/data/mockFaults.json";
import facilitiesData from "@/assets/data/facilities.json";

import { useGeolocationOnce } from "@/src/hooks/useGeolocationTracking";
import { useNetworkStatus } from "@/src/hooks/useNetworkStatus";
import { useFaultsQuery } from "@/src/hooks/useFaultsQuery";
import { useAuth } from "@/src/lib/auth/AuthContext";

import LoadingScreen from "@/src/components/LoadingScreen";

import { Facility, Transformer, OverheadLine, Meter } from "@/src/types/facilities";

import { useThemeStore } from "@/src/lib/themeStore";
import { getThemeByMode, AppTheme } from "@/src/lib/colors";
import { mapThemes } from "@/src/utils/mapThemes";

import { 
  normalizeCoords,
  width, 
  height, 
  CONTROL_SIZE, 
  GAP, 
  BOTTOM_NAV_SAFE, 
  EDGE_PADDING,
  DETAILED_ZOOM_THRESHOLD,
  GEOFENCE_VISIBLE_ZOOM,
  CLUSTER_VISIBLE_ZOOM,
  normalizedCoords,
  isValidLatLng
} from "@/src/utils/misc";

import Toast from "react-native-toast-message";



type LayerState = Record<LayerKey, { label: string; enabled: boolean }>;
type LayerFilters = Record<LayerKey, string>;

type GenericPoint = {
  id: string;
  latitude: number;
  longitude: number;
  payload?: any;
  kind?: "fault" | "transformer" | "meter" | "overhead";
};

// const { width } = Dimensions.get('window');


// // --- Inline Bottom Drawer Component ---
// const BottomFaultDrawer = ({ faults, selected, onSelect, }: 
// {
//   faults: Fault[];
//   selected: Fault | null;
//   onSelect: (f: Fault) => void;
// }) => {
//   const sheetRef = useRef<BottomSheet>(null);
//   const snapPoints = ['20%', '60%'];
//   return (
//     <BottomSheet ref={sheetRef} index={0} snapPoints={snapPoints}>
//       <View style={mapStyles.bottomContainer}>
//         <Text style={mapStyles.title}>Active Faults</Text>
//         {faults.map(f => {
//           const isSelected = selected?.id === f.id;
//           return (
//             <TouchableOpacity
//               key={f.id}
//               style={[
//                 mapStyles.faultItem,
//                 isSelected && mapStyles.faultItemSelected,
//               ]}
//               onPress={() => {
//                 onSelect(f);
//                 sheetRef.current?.snapToIndex(0);
//               }}
//             >
//               <View>
//                 <Text style={mapStyles.faultName}>{f.name}</Text>
//                 <Text style={mapStyles.faultLocation}>{f.location_name}</Text>
//               </View>
//               <Text style={mapStyles.arrow}>›</Text>
//             </TouchableOpacity>
//           );
//         })}
          // <View style={mapStyles.modalActions}>
                    // artisan_assigned assumed to be a field on Fault
                    // {selectedFault.status === 'pending' && !selectedFault.artisan_assigned && (
                      // Assign artisans link should be only if it didt have an artisna already assigned, otherwis eit shoudl small the aritsan assigned.
                      // <TouchableOpacity style={mapStyles.assignButton} onPress={openAssignModal}>
                        // <Text style={mapStyles.buttonText}>Assign Fault Job</Text>
                      // </TouchableOpacity>
                    // )}
// /                    <TouchableOpacity style={mapStyles.assignButton} onPress={handleNavigateToFault}>
                      // <Text style={mapStyles.buttonText}>Navigate to Fault</Text>
                    // </TouchableOpacity>
                    // {/* <TouchableOpacity style={mapStyles.closeButton} onPress={() => setInfoDialogVisible(false)}>
                      // <Text style={mapStyles.buttonText}>Close</Text>
                    // </TouchableOpacity> */}
                  // </View>
//       </View>
//     </BottomSheet>
//   );
// };

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { userLocation, errorMsg } = useGeolocationOnce();

  const [selectedFault, setSelectedFault] = useState<Fault | null>(null);
  
  const mode = useThemeStore((s) => s.mode);
  const themeColors: AppTheme = getThemeByMode(mode);
  
  const [isZooming, setIsZooming] = useState(false);
  
  const [layers, setLayers] = useState(() =>
    MAP_LAYER_OPTIONS.reduce((acc, option) => {
      acc[option.value as LayerKey] = { label: option.label, enabled: option.value === "faultjobs" };
      return acc;
    }, {} as LayerState)
  );
  const [layerFilters, setLayerFilters] = useState<LayerFilters>({
    faultjobs: FAULT_STATUS_FILTERS[0]?.key ?? "all",
    heatmap: HEATMAP_FILTERS[0]?.key ?? "severity",
    facilities: FACILITIES_FILTERS[0]?.key ?? "substations",
    adminmap: ADMIN_MODES[0]?.key ?? "load",
  });
  const activeLayers = useMemo(() => Object.entries(layers).filter(([_, l]) => l.enabled), [layers]);
  
  const longestLabels: Record<string, number> = {
    faultjobs: Math.max(...FAULT_STATUS_FILTERS.map(f => f.label.length)),
    adminmap: Math.max(...ADMIN_MODES.map(f => f.label.length)),
    heatmap: Math.max(...HEATMAP_FILTERS.map(f => f.label.length)),
    facilities: Math.max(...FACILITIES_FILTERS.map(f => f.label.length)),
  };
  // convert char length to px width (≈7px per char at fontSize 14)
  const layerFilterWidths: Record<string, number> = Object.fromEntries(
    Object.entries(longestLabels).map(([k, len]) => [k, len * 7 + 32])
  );

  const [popupLayer, setPopupLayer] = useState<LayerKey | null>(null);
  
  // Animation
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const blinkAnim = useRef(new RNAnimated.Value(1)).current;

  const tapTimeout = useRef<NodeJS.Timeout | null>(null);

  const [loadingLocation, setLoadingLocation] = useState(false);

  const [BottomDrawerVisible, setBottomDrawerVisible] = useState(false);
  const [infoDialogVisible, setInfoDialogVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);


  // Blink animation for new faults
  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(blinkAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        RNAnimated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [blinkAnim]);



  // --- Data Queries --- useFaultsQuery, useFacilitiesQuery, useHeatMapsQuery
  const { loading, filteredFaults } = useFaultsQuery({
    isOnline,
    user: user ?? { id: "anon", role: "supervisor" as const },
    // location, // for travelTime enrichment, not necessary
    useMockData: true,
    selectedFilter: "all",
  });



  // For now use assets — you'll want an API hook for real facilities
  const facilities: Facility = facilitiesData as unknown as Facility;
  const facilitiesss = facilitiesData;
  
  const normalizedFacilities = [
    ...(facilities?.transformers ?? []).map((f) => ({...f, assetCateg: "transformers",})),
    ...(facilities?.overheads ?? []).map((f) => ({...f, assetCateg: "overheads",})),
    ...(facilities?.meters ?? []).map((f) => ({...f, assetCateg: "meters", })),
  ];

  // Normalize facilities once
  const normalizedFacilitiesMemo = useMemo(() => {
    if (!facilities) return [];
    return [
      ...(facilities?.transformers ?? []).map((f, idx) => ({...f, id: f.id ?? `trx-${idx}`, assetCateg: "transformers" as FacilitiesKey, })),
      ...(facilities?.overheads ?? []).map((f, idx) => ({ ...f, id: f.id ?? `oh-${idx}`, assetCateg: "overheads" as FacilitiesKey, })),
      ...(facilities?.meters ?? []).map((f, idx) => ({ ...f, id: f.meterno ?? `meter-${idx}`, assetCateg: "meters" as FacilitiesKey, })),
    ];
  }, [facilities]);  

  const normalizedFacilitiesSup = Object.entries(facilities ?? {}).flatMap(
  ([key, items]) =>
    Array.isArray(items)
      ? items.map((f) => ({ ...f, assetCateg: key }))
      : []
  );

  const filteredFacilities = useMemo(() => {
    const assetsCategFilter = layerFilters.facilities as FacilitiesKey;
    switch (assetsCategFilter) {
      case "all":
        // flatten everything into one array for mapping
        return normalizedFacilities;
      case "transformers":
        return (facilities?.transformers ?? []).map((f) => ({...f, assetCateg: "transformers",}));
      case "overheads":
        return (facilities?.overheads ?? []).map((f) => ({...f, assetCateg: "overheads",}));
      case "meters":
        return (facilities?.meters ?? []).map((f) => ({...f, assetCateg: "meters", }));
      default:
        return [];
    }
  }, [facilities, layerFilters.facilities, normalizedFacilities]);

  // Memoized facilities components
  const { transformers, meters, overheads } = useMemo(() => {
    const transformers = facilitiesss.flatMap((f) =>
      f.transformers.filter((t) => t.latitude != null && t.longitude != null)
    );
    const meters = facilitiesss.flatMap((f) => f.meters.filter((m) => m.latitude != null && m.longitude != null));
    const overheads = facilitiesss.flatMap((f) => f.overheads || []);
    return { transformers, meters, overheads };
  }, [facilities]);

  const { transformers2, meters2, overheads2 } = useMemo(() => {
    return {
      transformers2: filteredFacilities.filter((f) => f.assetCateg === "transformers"),
      meters2: filteredFacilities.filter((f) => f.assetCateg === "meters"),
      overheads2: filteredFacilities.filter((f) => f.assetCateg === "overheads"),
    };
  }, [filteredFacilities]);

  // Flattened facility points
  const facilityPoints = useMemo<GenericPoint[]>(() => {
    const points: GenericPoint[] = [];
    facilities.forEach((f) => {
      const base = { id: `facility-${f.id}`, latitude: f.latitude, longitude: f.longitude, payload: f, kind: "transformer" } as GenericPoint;
      // facility center (if present) - optional
      if (isValidLatLng(f.latitude, f.longitude)) {
        points.push({ id: `facility-center-${f.id}`, latitude: f.latitude, longitude: f.longitude, payload: f, kind: "transformer" });
      }
      // transformers
      (f.transformers || []).forEach((t) => {
        if (isValidLatLng(t.latitude, t.longitude)) {
          points.push({ id: `trx-${f.id}-${t.id ?? Math.random()}`, latitude: Number(t.latitude), longitude: Number(t.longitude), payload: { ...t, parent: f }, kind: "transformer" });
        }
      });
      // meters (note: meters lat/lon fixed)
      (f.meters || []).forEach((m) => {
        if (isValidLatLng(m.latitude, m.longitude)) {
          points.push({ id: `meter-${f.id}-${m.meterno ?? Math.random()}`, latitude: Number(m.latitude), longitude: Number(m.longitude), payload: { ...m, parent: f }, kind: "meter" });
        }
      });
      // overhead points (if they have point coords) or will be drawn as polylines separately
      (f.overheads || []).forEach((oh, idx) => {
        if (Array.isArray(oh.points) && oh.points.length) {
          oh.points.forEach((p: any, pidx: number) => {
            if (isValidLatLng(p.latitude, p.longitude)) {
              points.push({ id: `oh-${f.id}-${idx}-${pidx}`, latitude: Number(p.latitude), longitude: Number(p.longitude), payload: { ...oh, parent: f }, kind: "overhead" });
            }
          });
        }
      });
    });
    return points;
  }, [facilities, isValidLatLng]);

  // Redo logic for overhead lines, assess, the data we have and if what we need works
  const overheadPolylines = useMemo(() => {
    const lines: { coords: LatLng[]; feedercode: string | null }[] = [];
    overheads.forEach((oh) => {
      const feeder = oh.feedercode || "UNSPECIFIED";
      const relatedTransformers = transformers.filter((t) => t.sourcefeeder === feeder);
      if (relatedTransformers.length >= 2) {
        const coords = relatedTransformers.map((t) => ({ latitude: t.latitude, longitude: t.longitude }));
        lines.push({ coords, feedercode: feeder });
      }
    });
    return lines;
  }, [overheads, transformers]);

  const overheadPolylines2 = useMemo(() => {
    return overheads
      .filter((oh) => Array.isArray(oh.points) && oh.points.length)
      .map((oh, idx) => ({
        key: `oh-${oh.id ?? idx}`,
        coords: oh.points
          .filter((p) => isValidLatLng(p.lat, p.lon))
          .map((p) => ({ latitude: Number(p.lat), longitude: Number(p.lon) })),
      }));
  }, [overheads]);


  const renderTransformers = useCallback(() => {
    if (layerFilters.facilities !== "all" && layerFilters.facilities !== "transformers") return null;
    return transformers
      // .map(t => normalizedCoords(t.latitude, t.longitude))
      // .filter(Boolean)
      .map((t, idx) => (
      <>
        <Marker
          key={`transformer-${idx}`}
          coordinate={{ latitude: Number(t.latitude), longitude: Number(t.longitude) }}
          title={String(`${t.voltageratio} Trx @ ${t.Name ?? ""}`)}
          description={`${t.capacity ?? "N/A"} kVA | ${t.status ?? "Unknown Status"} | ${t.application ?? "UnspecApp"}`}
          // pinColor={themeColors.accent}
          pinColor="orange"
          onPress={() => {
            // setSelectedAsset(f);
            mapRef.current?.animateToRegion({
              latitude: Number(t.latitude),
              longitude: Number(t.longitude),
              latitudeDelta: 0.01, // zoom tighter
              longitudeDelta: 0.01,
            }, 500);}}
        >
          <View style={{ alignItems: "center" }}>
            <View style={styles.trxMarker} />
          </View>
        </Marker>


        <Circle
          center={{ latitude: Number(t.latitude), longitude: Number(t.longitude) }}
          radius={t.geofenceRadiusM ?? 10} // default to 10m if not specified
          strokeColor="rgba(255,165,0,0.6)"
          fillColor="rgba(255,165,0,0.2)"
        />
      </>

    ));
  }, [transformers, layerFilters.facilities, themeColors]);

  const renderMeters = useCallback(() => {
    if (layerFilters.facilities !== "all" && layerFilters.facilities !== "meters") return null;
    return meters
      // .map(m => normalizedCoords(m.longitude, m.latitude))
      // .filter(Boolean)
      .map((m, idx) => (
      <>
        <Marker
          key={`meter-${idx}`}
          coordinate={{ latitude: Number(m.longitude), longitude: Number(m.latitude) }}
          title={String(m.customername ?? `Meter ${m.meterno}`)}
          description={String(`${m.phase ?? "Unknown"} phase | ${m.tariff ?? "Unkown"} Metering`)}
          // pinColor={themeColors.accent2}
          pinColor="blue"
          onPress={() => {
            // setSelectedAsset(f);
            mapRef.current?.animateToRegion({
              latitude: Number(m.longitude),
              longitude: Number(m.latitude),
              latitudeDelta: 0.01, // zoom tighter
              longitudeDelta: 0.01,
            }, 500);}}
        >
          <View style={{ alignItems: "center" }}>
            <View style={styles.meterMarker} />
          </View>
        </Marker>
      </>
    ));
  }, [meters, layerFilters.facilities, themeColors]);

  // to redo this
  const renderOverheads = useCallback(() => {
    if (layerFilters.facilities !== "all" && layerFilters.facilities !== "overheads") return null;
    return overheadPolylines.map((line, idx) => (
      <Polyline 
        key={`oh-${idx}`} 
        coordinates={line.coords} 
        strokeColor="red" 
        strokeWidth={1} />
    ));
  }, [overheadPolylines, layerFilters.facilities, themeColors]);



  // const faultsData = filteredFaults;
  const faultsData = mockFaults;

  const faults = useMemo(() => {
    const status = layerFilters.faultjobs as StatusKey;
    if (status === "all") return faultsData.filter(f => f.coords?.latitude != null && f.coords?.longitude != null);
    return faultsData.filter((f) => (f.status as StatusKey) === status && f.coords?.latitude != null && f.coords?.longitude != null);
  }, [faultsData, layerFilters.faultjobs]);

  // also fetch from api - the idea was to show all areas with active faults, hence interrupted power 
  const outageZones = useMemo(() => {
    const zones: Array<{ center: LatLng; radius: number }> = [];
    const used = new Set<string>();
    const metersToDeg = (m: number) => m / 111320;
    for (const f of faults) {
      if (used.has(f.id)) continue;
      const cluster = [f];
      for (const g of faults) {
        if (g.id === f.id) continue;
        const dx = f.coords.latitude - g.coords.latitude;
        const dy = f.coords.longitude - g.coords.longitude;
        const dist = Math.sqrt(dx * dx + dy * dy) * 111320;
        if (dist < 500) {
          cluster.push(g);
          used.add(g.id);
        }
      }
      used.add(f.id);
      const lat = cluster.reduce((s, x) => s + x.coords.latitude, 0) / cluster.length;
      const lng = cluster.reduce((s, x) => s + x.coords.longitude, 0) / cluster.length;
      const radius = Math.min(800, 200 + cluster.length * 120);
      zones.push({ center: { latitude: lat, longitude: lng }, radius: metersToDeg(radius) });
    }
    return zones;
  }, [faults]);
  


  const heatMapData = null; // supposed to be some array of heatmaps perhaps and their data, configure api

  // const heatmaps = useMemo(() => {
  //   const heatmap = layerFilters.heatmap as HeatMapKey;
  //   return heatmapsData.filter((hm) => (hm.heatmap as HeatMapKey) === heatmap);
  // }, [heatmapsData, layerFilters.heatmap]);
  
  // need to fetch heatmaps Data from api where server uses faults data to plot proper heat maps
  const heatmapPoints = useMemo(() => {
    return faultsData
      .filter((f) => normalizedCoords(f.coords.latitude, f.coords.longitude))
      .map((f) => {
        let weight = 1;

        switch (layerFilters.heatmap as HeatmapFilterKey) {
          case "duration":
            // Example: longer open faults weigh higher
            weight = f.hoursOpen > 72 ? 4 : f.hoursOpen > 48 ? 3 : f.hoursOpen > 24 ? 2 : 1;
            break;

          case "thematic":
            // Example: weight by category or cause
            weight =
              f.cause === "storm" ? 4 :
              f.cause === "equipment_failure" ? 3 :
              f.cause === "planned" ? 1 : 2;
            break;

          case "intensity":
            // Combine severity & frequency (dummy example)
            weight = (f.frequency ?? 1) * (f.severity === "critical" ? 3 : f.severity === "major" ? 2 : 1);
            break;

          case "severity":
            weight = f.severity === "critical" ? 3 : f.severity === "major" ? 2 : 1;
            break;

          case "density":
            // Suppose each fault object has density pre-calculated (per km²)
            weight = f.density ? Math.min(f.density / 5, 5) : 1;
            break;

          case "assetType":
            weight =
              f.assetType === "transformer" ? 3 :
              f.assetType === "overhead" ? 2 :
              f.assetType === "meter" ? 1 : 1;
            break;

          default:
            weight = 1;
        }

        return {
          latitude: f.coords.latitude,
          longitude: f.coords.longitude,
          weight,
        };
      });
  }, [faultsData, layerFilters.heatmap, normalizedCoords]);







  const adminData = null; // supposed to be some array of modes perhaps and their data, configure api

  // const adminViewMode = useMemo(() => {
  //   const mode = layerFilters.adminmap as ModeKey;
  //   if (mode === "all") return adminData;
  //   return adminData.filter((m) => (m.mode as ModeKey) === mode);
  // }, [adminData, layerFilters.adminmap]);  



  // Clustering (simple distance-based)
  const clusteredJobs = useMemo(() => {
    if (!mapRegion || mapRegion.latitudeDelta < CLUSTER_VISIBLE_ZOOM) return filteredFaults;
    const clusters: { latitude: number; longitude: number; count: number }[] = [];
    // Simple grid-based clustering
    const gridSize = mapRegion.latitudeDelta / 20;
    const added = new Set<number>();

    faults.forEach((job, i) => {
      if (added.has(i)) return;
      let clusterLat = job.coords.latitude;
      let clusterLng = job.coords.longitude;
      let count = 1;

      faults.forEach((otherJob, j) => {
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
  }, [faults, mapRegion]);



  const initialRegion = useMemo(
    () => ({
      latitude: userLocation?.latitude ?? -17.8292,
      longitude: userLocation?.longitude ?? 31.0522,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }),
    [userLocation]
  );

  // pan map to cover user locaton and all filtered data faults in view - to beextracted, common in both maps
  const fitToUserAndData = useCallback(() => {
    const points: LatLng[] = [];
    if (userLocation?.latitude && userLocation?.longitude) {
      points.push({ latitude: userLocation.latitude, longitude: userLocation.longitude });
    }
    if (layers.faultjobs?.enabled) {
      faults.forEach(f => points.push({ latitude: f.coords.latitude, longitude: f.coords.longitude }));
    }
    if (layers.facilities?.enabled) {
      transformers.forEach((t) => points.push({ latitude: t.latitude, longitude: t.longitude }));
      meters.forEach((m) => points.push({ latitude: m.longitude, longitude: m.latitude}));
    }
    if (layers.heatmap?.enabled) {
      heatmapPoints.forEach(p => points.push({ latitude: p.latitude, longitude: p.longitude }));
    }
    if (points.length > 0) {
      mapRef.current?.fitToCoordinates(points, { edgePadding: EDGE_PADDING, animated: true });
    } else if (userLocation) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [layers, faults, filteredFacilities, transformers, meters, heatmapPoints, userLocation]);


  // useEffect(() => {
  //   fitToUserAndData();
  // }, [fitToUserAndData]);

  // useEffect(() => {
  //   if (mapReady) {
  //     fitToFilteredData();
  //   }
  // }, [mapReady]);

  // New effect: auto-pan when layers or selected change
  // useEffect(() => {
  //   const coords: any[] = [];
  //   if (layers.faultjobs.enabled && faults) {
  //     faults.forEach(f => coords.push(getCoords(f)));
  //   }
  //   if (layers.facilities.enabled && facilities) {
  //     facilities.forEach(f => coords.push({ latitude: f.lat, longitude: f.lng }));
  //   }
  //   if (layers.heatmap.enabled && heatmapPoints.length > 0) {
  //     heatmapPoints.forEach(p => coords.push({ latitude: p.latitude, longitude: p.longitude }));
  //   }
  //   if (coords.length && mapRef.current) {
  //     mapRef.current.fitToCoordinates(coords, {
  //       edgePadding: { top: 100, right: 100, bottom: 200, left: 100 },
  //       animated: true,
  //     });
  //   }
  // }, [layers, faults, facilities, heatmapPoints]);

  // const fitToFilteredData = useCallback(() => {
  //   const points: LatLng[] = [];
  //   if (layers.faultjobs?.enabled) {
  //     faults.forEach(f => points.push({ latitude: f.coords.latitude, longitude: f.coords.longitude }));
  //   }
  //   if (layers.facilities?.enabled) {
  //     // filteredFacilities.forEach(f => {
  //     //   if (isValidLatLng(f.latitude, f.longitude)) {
  //     //     points.push({ latitude: Number(f.latitude), longitude: Number(f.longitude) });
  //     //   }
  //     // });
  //     transformers.forEach((t) => points.push({ latitude: t.latitude, longitude: t.longitude }));
  //     meters.forEach((m) => points.push({ latitude: m.longitude, longitude: m.latitude}));
  //   }
  //   if (layers.heatmap?.enabled) {
  //     heatmapPoints.forEach(p => points.push({ latitude: p.latitude, longitude: p.longitude }));
  //   }
  //   // if (layers.adminmap?.enabled) {
  //   //   const filter = layerFilters.adminmap;
  //   //   const adminPoints = getAdminFilterPoints(filter); // helper function
  //   //   adminPoints.forEach(p => points.push(p));
  //   // }
  //   if (points.length > 0) {
  //     mapRef.current?.fitToCoordinates(points, { edgePadding: EDGE_PADDING, animated: true });
  //   }
  // }, [layers, faults, filteredFacilities, transformers, meters,  heatmapPoints]);


  const fitToFilteredData = useCallback(
    (includeUser = false) => {
      const points: LatLng[] = [];
      if (includeUser && (userLocation?.latitude && userLocation?.longitude)) {
        points.push({ latitude: userLocation.latitude, longitude: userLocation.longitude, });
      }
      if (layers.faultjobs?.enabled) {
        faults.forEach(f => points.push({ latitude: f.coords.latitude, longitude: f.coords.longitude }));
      }
      if (layers.facilities?.enabled) {
        // filteredFacilities.forEach(f => {
        //   if (isValidLatLng(f.latitude, f.longitude)) {
        //     points.push({ latitude: Number(f.latitude), longitude: Number(f.longitude) });
        //   }
        // });        
        transformers.forEach((t) => points.push({ latitude: t.latitude, longitude: t.longitude }));
        meters.forEach((m) => points.push({ latitude: m.longitude, longitude: m.latitude}));
      }
      if (layers.heatmap?.enabled) {
        heatmapPoints.forEach(p => points.push({ latitude: p.latitude, longitude: p.longitude }));
      }
      // if (layers.adminmap?.enabled) {
      //   const adminPoints = getAdminFilterPoints(layerFilters.adminmap);
      //   points.push(...adminPoints);
      // }
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
    // [ layers, faults, filteredFacilities, transformers, meters, heatmapPoints, getAdminFilterPoints, layerFilters.adminmap, userLocation, ]
    [ layers, faults, filteredFacilities, transformers, meters, heatmapPoints, userLocation, ]
  );


  const handleFitTap = () => {
    if (tapTimeout.current) {
      // Double tap detected
      clearTimeout(tapTimeout.current);
      tapTimeout.current = null;
      fitToUserAndData(); // include user location
      // fitToFilteredData(true); // just filtered data
    } else {
      // First tap → wait to see if double
      tapTimeout.current = setTimeout(() => {
        fitToFilteredData(); // just filtered data
        tapTimeout.current = null;
      }, 250); // 250ms window
    }
  };




  const handleFilterChange = (layer: LayerKey, key: string) => {
    setLayerFilters(prev => ({ ...prev, [layer]: key }));
    setTimeout(fitToFilteredData, 20);
    // setTimeout(() => {
    //   const hasData =
    //     (layer === "faultjobs" && filteredFaults.length > 0) ||
    //     (layer === "facilities" && filteredFacilities.length > 0) ||
    //     (layer === "heatmap" && heatmapPoints.length > 0) ||
    //     // (layer === "adminmap" && getAdminFilterPoints(key).length > 0);

    //   if (!hasData) {
    //     Toast.show({
    //       type: "info",
    //       text1: "No data available",
    //       text2: `No items match the selected ${key} filter.`,
    //     });
    //   } else {
    //     fitToFilteredData();
    //   }
    // }, 100);
  };

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
        setLoadingLocation(true);
      });
      const coords = await waitForLocation;
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    } catch (err: any) {
      Alert.alert("Location issue", err.message || "Could not retrieve location.");
    } finally {
      scale.value = withSpring(1);
      setLoadingLocation(false);
    }
  }, [userLocation, errorMsg, scale]);



  // Top-level map controls
  // const zoom = useCallback((delta: number) => {
  //   mapRef.current?.getCamera().then((cam) => {
  //     if (!cam?.zoom && cam?.zoom !== 0) return;
  //     mapRef.current?.animateCamera({ zoom: cam.zoom + delta });
  //   });
  // }, []);
  const zoom = (direction: 1 | -1) => {
    if (isZooming || !mapRef.current) return; // block spamming
    setIsZooming(true);
    mapRef.current.getCamera().then((cam) => {
      const newZoom = direction === 1 ? cam.zoom + 1 : cam.zoom - 1;
      mapRef.current?.animateCamera({ ...cam, zoom: newZoom }, { duration: 300 });
    });
    setTimeout(() => setIsZooming(false), 350); // throttle ~350ms
  };

  const resetCompass = useCallback(() => {
    mapRef.current?.animateCamera({ heading: 0, pitch: 0 });
  }, []);

  const controlButtons = useMemo(
    () => [
      { key: "zoom-in", icon: <Plus size={22} />, onPress: () => zoom(1) },
      { key: "zoom-out", icon: <Minus size={22} />, onPress: () => zoom(-1) },
      { key: "stats", icon: <BarChart2 size={22} />, onPress: () => setStatsVisible(true)},
      { key: "reset", icon: <Compass size={22} />, onPress: resetCompass },
      // { key: "fit", icon: <Crosshair size={22} />, onPress: fitToFilteredData },
      { key: "fit", icon: <Crosshair size={22} />, onPress: handleFitTap },
    ],
    [zoom, resetCompass, fitToUserAndData]
  );



  // --- Layers toggle with admin-exclusive logic ---
  const handleLayerToggle = useCallback((key: string) => {
    setLayers((prev) => {
      if (key === "adminmap") {
        return Object.fromEntries(
          Object.entries(prev).map(([k, v]) => [k, { ...v, enabled: k === "adminmap" }])
        ) as typeof prev;
      } else {
        // Normal layers (faults, heatmap, facilities) can be combined
        return { ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled }, adminmap: { ...prev.adminmap, enabled: false } };
      }
    });
    setTimeout(fitToFilteredData, 20);
  }, []);  


  const handleLayerToggle2 = (key: keyof typeof layers) => {
    if (key === 'adminmap') {
      // Enable only adminmap, disable all others
      setLayers(prev => {
        const updated = {} as typeof prev;
        for (const k in prev) { updated[k as LayerKey] = { ...prev[k as LayerKey], enabled: k === 'adminmap', }; }
        return updated;
      });
    } else {
      setLayers(prev => ({
        ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled, },
        adminmap: { ...prev.adminmap, enabled: false, }, }));
    }
  };  





  const renderFilterBar = useCallback(() => {
    if (activeLayers.length === 1) {
      const [onlyLayerKey] = activeLayers[0] as [LayerKey, { label: string; enabled: boolean }];

      const FILTERS_MAP: Record<LayerKey, { key: string; label: string }[]> = {
        faultjobs: FAULT_STATUS_FILTERS.slice(),
        adminmap: ADMIN_MODES.slice(),
        heatmap: HEATMAP_FILTERS.slice(),
        facilities: FACILITIES_FILTERS.slice(),
      };
      const filters = FILTERS_MAP[onlyLayerKey];

      return (
        <>
          <FlatList
            horizontal
            data={filters}
            keyExtractor={(i) => i.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: GAP }}
            renderItem={({ item }) => {
              const active = layerFilters[onlyLayerKey] === item.key;

              return (
                <TouchableOpacity
                  onPress={() => handleFilterChange(onlyLayerKey, item.key)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
                </TouchableOpacity>

              );
            }}
          />

    
        </>     
      );
    }

    // multiple layers → show a pill per layer that opens a popup
    // add logic to cose popup by touching outside of the popup
    return (
      <View style={{ flexDirection: "row", justifyContent: "space-around", width: "100%", paddingHorizontal: 12 }}>
        {activeLayers.map(([key]) => {
          const lk = key as LayerKey;
          const activeKey = layerFilters[lk];
          const activeLabel =
            (lk === "faultjobs" ? FAULT_STATUS_FILTERS : lk === "adminmap" ? ADMIN_MODES : lk === "heatmap" ? HEATMAP_FILTERS : FACILITIES_FILTERS
            ).find((f) => f.key === activeKey)?.label;

          return (
            <View key={lk} style={{ position: "relative" }}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  popupLayer === lk && { borderColor: "#007aff", borderWidth: 1 },
                  { minWidth: layerFilterWidths[lk] || 80 }, // fallback width
                ]}
                onPress={() => setPopupLayer((prev) => (prev === lk ? null : lk))}
              >
                <View style={{ alignItems: "center" }}>
                  {/* Layer label */}
                  <Text style={styles.chipText}>{layers[lk].label}</Text>

                  {/* Active filter label (if any) */}
                  {activeLabel ? (
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 1,  }}>
                      <ChevronDown size={12} color="#555" style={{ marginRight: 4 }} />
                      <Text
                        style={[styles.chipText, { fontSize: 10, color: "#555" }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {activeLabel}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>


              {popupLayer === lk && (
                <View style={[styles.popup, { minWidth: layerFilterWidths[lk] || 80 }]}>
                  {(lk === "faultjobs" ? FAULT_STATUS_FILTERS : lk === "adminmap" ? ADMIN_MODES : lk === "heatmap" ? HEATMAP_FILTERS : FACILITIES_FILTERS
                  ).map((f) => {
                    const active = layerFilters[lk] === f.key;
                    return (
                      <TouchableOpacity
                        key={f.key}
                        onPress={() => {
                          handleFilterChange(lk, f.key);
                          setPopupLayer(null);
                        }}
                        style={[
                          styles.popupChip, active && styles.chipActive, 
                          {  minWidth: layerFilterWidths[lk] || 80 },
                        ]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  }, [activeLayers, layerFilters, popupLayer, layers]);


  const handleNavigateToFault = useCallback(() => {
    if (!selectedFault?.coords) {
      Alert.alert("No coordinates available");
      return;
    } else {
      Alert.alert('Navigation', `Navigating to: ${selectedFault.title} (${selectedFault.coords.latitude}, ${selectedFault.coords.longitude})`);
      const { lat, lng } = selectedFault.coords;
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);
    }
  }, [selectedFault]); 



  // Overlay renderers for admin mode
  const adminOverlayRenderers: Record<string, () => JSX.Element> = {
    storm: () => (
      <Polygon
        coordinates={[
          { latitude: initialRegion.latitude + 0.08, longitude: initialRegion.longitude - 0.08 },
          { latitude: initialRegion.latitude + 0.08, longitude: initialRegion.longitude + 0.08 },
          { latitude: initialRegion.latitude - 0.08, longitude: initialRegion.longitude + 0.08 },
          { latitude: initialRegion.latitude - 0.08, longitude: initialRegion.longitude - 0.08 },
        ]}
        fillColor="rgba(255,165,0,0.2)"
        strokeColor="orange"
        strokeWidth={3}
      />
    ),

    iot: () => (
      <>
        {/* Example IoT sensors */}
        <Marker
          coordinate={{ latitude: initialRegion.latitude + 0.03, longitude: initialRegion.longitude }}
          title="IoT Sensor - Transformer Health"
          pinColor="blue"
          onPress={() => {
            mapRef.current?.animateToRegion({
              latitude: initialRegion.latitude + 0.03,
              longitude: initialRegion.longitude,
              latitudeDelta: 0.01, // zoom tighter
              longitudeDelta: 0.01,
            }, 500);}}
          
        />
        <Marker
          coordinate={{ latitude: initialRegion.latitude, longitude: initialRegion.longitude + 0.05 }}
          title="IoT Sensor - Water Pump"
          pinColor="blue"
        />
      </>
    ),

    droneinspects: () => (
      <>
        {/* Flight path */}
        <Polyline
          coordinates={[
            { latitude: initialRegion.latitude + 0.05, longitude: initialRegion.longitude - 0.05 },
            { latitude: initialRegion.latitude, longitude: initialRegion.longitude },
            { latitude: initialRegion.latitude - 0.05, longitude: initialRegion.longitude + 0.05 },
          ]}
          strokeColor="purple"
          strokeWidth={4}
        />
        {/* Drone snapshot marker */}
        <Marker
          coordinate={{ latitude: initialRegion.latitude, longitude: initialRegion.longitude }}
          title="Drone Inspection Point"
          pinColor="purple"
        />
      </>
    ),

    load: () => (
      <>
        {/* Load heat zones */}
        <Circle
          center={{ latitude: initialRegion.latitude + 0.02, longitude: initialRegion.longitude + 0.02 }}
          radius={1200}
          strokeColor="red"
          fillColor="rgba(255,0,0,0.2)"
        />
        <Circle
          center={{ latitude: initialRegion.latitude - 0.03, longitude: initialRegion.longitude - 0.03 }}
          radius={800}
          strokeColor="green"
          fillColor="rgba(0,255,0,0.2)"
        />
      </>
    ),

    predictive: () => (
      <>
        {/* Predictive AI outage risk polygons */}
        <Polygon
          coordinates={[
            { latitude: initialRegion.latitude + 0.06, longitude: initialRegion.longitude - 0.06 },
            { latitude: initialRegion.latitude + 0.04, longitude: initialRegion.longitude - 0.02 },
            { latitude: initialRegion.latitude + 0.02, longitude: initialRegion.longitude - 0.06 },
          ]}
          fillColor="rgba(0,0,255,0.2)"
          strokeColor="blue"
          strokeWidth={2}
        />
        <Marker
          coordinate={{ latitude: initialRegion.latitude + 0.04, longitude: initialRegion.longitude - 0.04 }}
          title="Predicted Fault Zone"
          description="High probability of transformer failure within 72h"
          pinColor="navy"
          onPress={() => {
            mapRef.current?.animateToRegion({
              latitude: initialRegion.latitude + 0.04,
              longitude: initialRegion.longitude + 0.04,
              latitudeDelta: 0.01, // zoom tighter
              longitudeDelta: 0.01,
            }, 500);}}
        />
      </>
    ),
  };

  // const getAdminFilterPoints = (filter: string): LatLng[] => {
  //   switch (filter) {
  //     case "iot":
  //       return iotSensors.map(s => ({ latitude: s.lat, longitude: s.lng }));
  //     case "droneinspects":
  //       return droneInspections.map(d => ({ latitude: d.lat, longitude: d.lng }));
  //     case "storm":
  //       return stormZones.map(z => ({ latitude: z.lat, longitude: z.lng }));
  //     case "predictive":
  //       return aiPredictions.map(p => ({ latitude: p.lat, longitude: p.lng }));
  //     default:
  //       return []; // "all" or unknown → handled by overlay logic
  //   }
  // };

  // const getAdminFilterPoints2 = useCallback((filterKey: string) => {
  //   switch (filterKey) {
  //     case "storm":
  //       return stormEvents.map(e => ({ latitude: e.lat, longitude: e.lon, }));
  //     case "iot":
  //       return iotDevices.map(d => ({ latitude: d.lat, longitude: d.lon, }));
  //     case "drone":
  //       return droneInspections.map(d => ({ latitude: d.lat, longitude: d.lon, }));
  //     case "predictive":
  //       return predictiveAlerts.map(a => ({ latitude: a.lat, longitude: a.lon, }));
  //     case "all":
  //     default:
  //       return [
  //         ...stormEvents,
  //         ...iotDevices,
  //         ...droneInspections,
  //         ...predictiveAlerts,
  //       ].map(d => ({
  //         latitude: d.lat,
  //         longitude: d.lon,
  //       }));
  //   }
  // }, [stormEvents, iotDevices, droneInspections, predictiveAlerts]);



  const HeatmapLegend = ({ activeFilter }: HeatmapLegendProps) => {
    const legend = HEATMAP_LEGENDS[activeFilter];

    if (!legend) return null;

    return (
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>
          {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Legend
        </Text>
        {legend.map((item, idx) => (
          <View key={idx} style={styles.legendRow}>
            <View style={[styles.legendBox, { backgroundColor: item.color }]} />
            <Text>{item.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Define the camera with 3D tilt
  // const initialCamera: Partial<Camera> = {
  //   center: {
  //     latitude: selectedFault?.coordinates?.lat ?? -17.824858,
  //     longitude: selectedFault?.coordinates?.lng ?? 31.053028,
  //   },
  //   pitch: 60, // 0 is flat, 60+ gives good 3D tilt
  //   heading: 0, // optional: direction the camera is facing
  //   altitude: 1000, // controls zoom; higher is farther away
  //   zoom: zoom, // if supported; otherwise tune altitude
  // };

  // --- Render Map ---
  return (
    <View style={[styles.container, {backgroundColor: themeColors.colors.background}]}>
      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            // initialRegion={initialRegion}
            // provider={PROVIDER_GOOGLE}
            onMapReady={() => {
              // setMapReady(true);
              // setTimeout(fitToUserAndData, 1);
              fitToUserAndData(); // pan once map is ready
            }}
            // customMapStyle={mode === "dark" ? mapThemes.dark : mapThemes.light}
            showsMyLocationButton={false}
            mapType={layers.adminmap?.enabled ? 'hybrid' : 'standard'}
            showsUserLocation
            // followsUserLocation
            // indoorEnabled
            // showsCompass
            // onRegionChangeComplete={(r) => setRegion(r)}
            // camera={initialCamera}
            // showsBuildings={true}
            // mapPadding={{ top: 80, right: 12, bottom: 140, left: 12 }}
            {...(Platform.OS === "ios" ? { compassOffset: { x: 16, y: 96 } } : {})}
          >
            {/* OpenStreetMap tiles */}
            <UrlTile
              // urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
              urlTemplate="https://api.maptiler.com/tiles/streets/{z}/{x}/{y}.png?key=fWWaNtSVZXRXIkWPhbG5"
              maximumZ={19}
              flipY={false}
            />
                  
            {/* Offline tiles (optional, replace path if used) */}
            {/* <LocalTile
              pathTemplate={`${FileSystem.documentDirectory}tiles/{z}/{x}/{y}.png`}
              tileSize={256}
            /> */}


            {/* Fault markers */}
            {layers.faultjobs?.enabled &&
              faults.map((f) => (
                <>
                  <Marker
                    key={f.id}
                    coordinate={{ latitude: Number(f.coords.latitude), longitude: Number(f.coords.longitude) }}
                    // onPress={() => setSelectedFault(f)}
                    onPress={() => {
                      setSelectedFault(f);
                      mapRef.current?.animateToRegion({
                        latitude: f.coords.latitude,
                        longitude: f.coords.longitude,
                        latitudeDelta: 0.01, // zoom tighter
                        longitudeDelta: 0.01,
                      }, 500);}}
                    title={String(`${f.title ?? "Fault"} @ ${f.locationName ?? "this location."}`)}
                    description={`Possible ${f.rootCauseCategory ?? "cause unknown"} | ${f.assignedTo ?? "NoOne"} Assigned`}
                    pinColor={f.severity === "critical" ? "red" : "yellow"}
                  >
                    {/* <View style={{ alignItems: "center" }}>
                      <View
                        style={
                          (f as any).assignedTo != null ? styles.inProgressMarker : styles.defaultMarker
                        }
                      />
                      {f.timeline.reported &&
                        Date.now() - new Date(f.timeline.reported).getTime() < 1000 * 60 * 60 && (
                          <RNAnimated.View
                            style={[styles.blinkWrap, { opacity: blinkAnim }]}
                            pointerEvents="none"
                          />
                        )}
                    </View> */}
                    {/* <Callout tooltip> 
                      <View style={mapStyles.calloutContainer}>
                        <Text style={mapStyles.faultName}>{fault.name}</Text>
                        <Text style={mapStyles.faultLocation}>{fault.location_name}</Text>
                        <Text numberOfLines={2} style={mapStyles.reportedTime}>
                          Reported: {formatDateTime(fault.reported_time)}
                        </Text>
                      </View>
                    </Callout>                     */}
                  </Marker>
                  <Circle
                    key={`geofence-${f.id}`}
                    center={{ latitude: Number(f.coords.latitude), longitude: Number(f.coords.longitude) }}
                    radius={f.geofence.radius ?? 100} // default to 10m if not specified
                    strokeColor="rgba(255,165,0,0.6)"
                    fillColor="rgba(255, 102, 0, 0.2)"
                  />
                </> 
              ))
            }

            {/* Heatmap */}
            {layers.heatmap?.enabled && heatmapPoints.length > 0 && (
              <Heatmap points={heatmapPoints} radius={50} opacity={0.7} 
                // gradient={{
                //   colors: [themeColors.colors.success, themeColors.colors.warning, themeColors.colors.danger],
                //   startPoints: [0.1, 0.5, 1],
                //   colorMapSize: 256,
                // }}
              />
            )}

            {/* To implement below */}
            {/* {layers.heatmap?.enabled && heatmapPoints.length > 0 && (
            showHeatmap ? (
              <Heatmap
                points={heatmapPoints}
                radius={40}
                opacity={0.7}
                // gradient={{
                //   colors: [themeColors.colors.success, themeColors.colors.warning, themeColors.colors.danger],
                //   startPoints: [0.1, 0.5, 1],
                //   colorMapSize: 256,
                // }}
              />
            ) : (
              HeatMapMarkerData.map((point, idx) => (
                <Marker
                  key={idx}
                  coordinate={{
                    latitude: point.latitude,
                    longitude: point.longitude,
                  }}
                  title={`Point #${idx + 1}`}
                  description={`Filter: ${activeFilter}, Value: ${point.weight}`}
                />
              ))
            ))} */}
            
            {/* Outage zones */}
            {layers.heatmap?.enabled &&
              outageZones.map((zone, idx) => (
                <Circle
                  key={`zone-${idx}`}
                  center={zone.center}
                  radius={zone.radius * 111320}
                  strokeColor="rgba(255,0,0,0.6)"
                  fillColor="rgba(255,0,0,0.2)"
                  strokeWidth={2}
                />
              ))}

            {/* Facilities */}
            {/* {layers.facilities?.enabled && (
              <>
                {layerFilters.facilities === "all" && (
                  <>
                    {renderTransformers()}
                    {renderMeters()}
                  </>
                )}
                {layerFilters.facilities === "transformers" && renderTransformers()}
                {layerFilters.facilities === "meters" && renderMeters()}
                {layerFilters.facilities === "overheads" && renderOverheads()}
              </>
            )} */}
            {layers.facilities.enabled && (
              <>
                {renderTransformers()}
                {renderMeters()}
                {/* {renderOverheads()} */}
              </>
            )}

            
            {/* Admin mode overlays */}
            {/* {layers.adminmap?.enabled && adminMode === "storm" && (
              <Polygon
                coordinates={[
                  { latitude: initialRegion.latitude + 0.08, longitude: initialRegion.longitude - 0.08 },
                  { latitude: initialRegion.latitude + 0.08, longitude: initialRegion.longitude + 0.08 },
                  { latitude: initialRegion.latitude - 0.08, longitude: initialRegion.longitude + 0.08 },
                  { latitude: initialRegion.latitude - 0.08, longitude: initialRegion.longitude - 0.08 },
                ]}
                fillColor="rgba(255,165,0,0.2)"
                strokeColor="orange"
                strokeWidth={3}
              />
            )} */}
            {/* {layers.adminmap?.enabled && (
              <>
                {adminModeFilter === "all"
                  ? Object.values(adminOverlayRenderers).map((Renderer, idx) => <React.Fragment key={idx}>{Renderer()}</React.Fragment>)
                  : adminOverlayRenderers[adminModeFilter]?.()}
              </>
            )} */}
            {layers.adminmap.enabled && (
              // Call the renderer for selected admin mode
              adminOverlayRenderers[layerFilters.adminmap]?.()
            )}
            
          </MapView>

          {/* <HeatmapLegend activeFilter={heatmapFilter} /> */}

          {/* To render ony when the HeatMap Layer is selected - to add logic */}
          {/* <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowHeatmapAsMarkers(prev => !prev)}
          >
            <Text style={styles.toggleButtonText}>
              {showHeatmap ? "Show Heatmap" : "Show Markers"}
            </Text>
          </TouchableOpacity> */}


          {/* Controls */}
          <Animated.View style={styles.controls}>
            {controlButtons.map((btn) => (
              <TouchableOpacity key={btn.key}  onPress={btn.onPress} style={styles.controlBtn}>
                {btn.icon}
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={handleLocateMe} style={styles.controlBtn}>
              {loadingLocation ? (
                <ActivityIndicator color="blue" />
              ) : (
                <Locate size={22} />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Layer Selector (top-left) */}
          <View style={styles.layerSelector}>
            {Object.entries(layers).map(([key, layer]) => (
              <TouchableOpacity key={key} style={[styles.layerButton, layer.enabled && styles.activeLayer]} onPress={() => handleLayerToggle(key)}>
                <Text style={styles.layerText}>{layer.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom Drawer for Active Faults */}
          {/* {layers.faultjobs.enabled && faults && faults.length > 0 && (
            <BottomFaultDrawer
              faults={faults}
              selected={selectedFault}
              onSelect={(f) => {
                setSelectedFault(f);
                centerViewToFault(); // center on selection
              }}
            />
          )} */}

          <View style={styles.bottomBar}>
            {renderFilterBar()}

            {/* Locate Me button */}
            <Animated.View style={[animatedStyle,  { width: CONTROL_SIZE, height: CONTROL_SIZE, borderRadius: CONTROL_SIZE / 2 },
              activeLayers.length === 0 || activeLayers.length === 1
              ? styles.locateButton : styles.locateButtonFloating 
            ]}>
              <TouchableOpacity onPress={handleLocateMe} >
                <Locate size={22} />
                {/* {userLocation ? <ActivityIndicator /> : <Locate size={22} />} */}
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Modal visible={statsVisible} transparent animationType="fade" onRequestClose={() => setStatsVisible(false)}>
            <View style={{ flex: 1, backgroundColor: '#00000099', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 20, minWidth: '80%' }}>
                <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 8 }}>Map Statistics</Text>
                {/* <Text>Total Faults: {faults?.length}</Text> */}
                {/* <Text>Total Technicians: {artisans?.length}</Text> */}
                <TouchableOpacity onPress={() => setStatsVisible(false)} style={[styles.closeButton, { marginTop: 20 }]}>
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>     
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1,  },
  controls: {
    position: "absolute",
    top: GAP,
    right: GAP,
    // backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    // padding: GAP,
    // justifyContent: "center",
    // alignItems: "center",
    flexDirection: "column", 
    gap: GAP
  },
  controlBtn: { 
    // padding: 8, marginVertical: 4 ,
    width: GAP*3.5, 
    height: GAP*3.5, 
    borderRadius: 100, 
    backgroundColor: "#fff", 
    justifyContent: "center", 
    alignItems: "center"
    
  },

  defaultMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "yellow",
    borderWidth: 2,
    borderColor: "orange",
  },

  trxMarker: {
    width: GAP,
    height: GAP,
    backgroundColor: "yellow",
    borderWidth: 2,
    borderColor: "orange",
  },
  meterMarker: {
    width: GAP,
    height: GAP,
    borderRadius: 20,
    backgroundColor: "cyan",
    borderWidth: 1,
    borderColor: "blue",
  },

  inProgressMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "red",
    borderWidth: 2,
    borderColor: "darkred",
  },
  blinkWrap: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,0,0,0.4)",
    top: -4,
    left: -4,
  },

  layerSelector: {
    position: "absolute",
    top: GAP,
    left: GAP,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
    gap: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  layerButton: { 
    paddingVertical: 8, 
    paddingHorizontal: 10, 
    borderRadius: 8 
  },
  layerText: { fontSize: GAP },
  activeLayer: { backgroundColor: "#dbeafe" },

  locateButton: {
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    marginRight: GAP,
    marginLeft:GAP/2,
  },
  locateButtonFloating: {
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

  bottomBar: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  filtersBar: {
    position: "absolute",
    bottom: 90, // avoid bottom nav
    left: 0,
    right: 0,
    paddingHorizontal: GAP,
  },  

  chip: {
    backgroundColor: "#c4c8ce80",
    borderColor: "#e1ecfcda",
    borderWidth:1,
    paddingHorizontal: GAP,
    paddingVertical: GAP/2,
    borderRadius: 999,
    // minWidth: 80,
    alignItems: "center",
  },
  chipActive: { backgroundColor: "#1d4ed8" },
  chipText: { color: "#111827", fontWeight: "600" },
  chipTextActive: { color: "#fff" },

  popup: {
    position: "absolute",
    bottom: "100%",
    marginBottom: 6,
    marginLeft: -6,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    zIndex: 100,
  },
  popupChip: {
    backgroundColor: "#F2F4F7",
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: "center",
    marginVertical: GAP/4,
  },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", borderRadius: 12, padding: 12, minWidth: 220, maxHeight: height * 0.6, },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },


// legendContainer: {
//   position: "absolute",
//   bottom: 20,
//   left: 20,
//   backgroundColor: "rgba(255,255,255,0.9)",
//   padding: 10,
//   borderRadius: 8,
// },
// legendRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
// legendBox: { width: 20, height: 20, marginRight: 6, borderRadius: 3 },
// legendTitle: { fontWeight: "bold", marginBottom: 4 },


legendContainer: {
  position: "absolute",
  bottom: 20,
  left: 20,
  backgroundColor: "rgba(255,255,255,0.9)",
  padding: 10,
  borderRadius: 8,
  maxWidth: 200,
},
legendTitle: { fontWeight: "bold", marginBottom: 6 },
legendRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
legendBox: { width: 20, height: 20, marginRight: 6, borderRadius: 3 },

toggleButton: {
  position: "absolute",
  top: 20,
  right: 20,
  backgroundColor: "rgba(0,0,0,0.6)",
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 8,
},
toggleButtonText: {
  color: "#fff",
  fontWeight: "bold",
},












  loaderContainer: { 
    flex: 1, justifyContent: 'center', alignItems: 'center', 
  },
  controlButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center', alignItems: 'center',
    elevation: 2
  },
  mapTypeSelector: {
    position: 'absolute',
    top: 20, left: 20,
    backgroundColor: 'white',
    borderRadius: 8, overflow: 'hidden'
  },
  mapTypeButton: {
    paddingVertical: 6, paddingHorizontal: 12
  },
  mapTypeSelected: {
    backgroundColor: '#f3f4f6'
  },
  mapTypeText: {
    fontSize: 14,
    // color: layer.enabled ? 'white' : 'black''#111827'
    color: '#111827'
  },
  // how to make the sticker stick and always show on the bottom like this
  faultsBottomDrawer: {
    position: 'absolute', bottom: 40,
    left: 20, right: 20,
    backgroundColor: 'white',
    borderRadius: 20, padding: 12,
    elevation: 4, overflow: 'hidden'
  },
  faultHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center'
  },
  faultBadgeContainer: {
    flexDirection: 'row', alignItems: 'center'
  },
  faultBadge: {
    fontSize: 12, paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: 10,
    marginRight: 8, textTransform: 'capitalize'
  },
  faultTitle: {
    fontWeight: '600'
  },
  faultSubtitle: {
    fontSize: 13, color: '#6b7280', marginTop: 2
  },
  faultMeta: {
    fontSize: 12, color: '#9ca3af',
    marginTop: 4, alignItems: "center",
    justifyContent: "center",
  },
  linkButton: {
    color: '#2563eb', fontSize: 14
  },
  modalSubtitle: {
    fontSize: 14, color: '#6b7280'
  },
  modalBadge: {
    marginTop: 6, padding: 4,
    borderRadius: 6, fontSize: 12,
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start'
  },
  sectionTitle: {
    marginTop: 20, fontWeight: '600'
  },
  modalActions: {
    marginTop: 20, flexDirection: 'row', gap: 10
  },
  assignButton: {
    flex: 1, backgroundColor: '#3b82f6',
    padding: 10, borderRadius: 6,
    alignItems: 'center'
  },
  closeButton: {
    // flex: 1,
    backgroundColor: '#6b7280',
    padding: 10, borderRadius: 6,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white', fontWeight: '500',
  },
  artiOption: { 
    fontSize: 16, paddingVertical: 8 
  },
  innerButton: {
    alignItems: 'center', justifyContent: 'center',
  },

  bottomContainer: {
    padding: 12,
  },
  title: {
    fontSize: 18, fontWeight: '600',
    marginBottom: 8,
  },
  faultItem: {
    padding: 10, marginBottom: 6,
    borderRadius: 8, flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', elevation: 2,
    backgroundColor: '#fff', // default background
    // backgroundColor: isDark ? '#222' : '#fff',
  },
  faultItemSelected: {
    backgroundColor: '#e0f2fe',
  },
  faultName: {
    fontWeight: '500',
  },
  faultLocation: {
    color: '#666',
  },
  arrow: {
    color: '#1d4ed8',
  },
  calloutContainer: {
    backgroundColor: 'white',    padding: 8,
    borderRadius: 8,    elevation: 4,
  },
  reportedTime: {
    color: '#444',
  },
});

