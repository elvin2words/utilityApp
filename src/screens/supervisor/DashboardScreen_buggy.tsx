
// ufms/screens/Supervisor/DashboardScreen.tsx
 import React from "react";

import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useScrollToTop } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";

import { useQuery } from "@tanstack/react-query";

import Feather from "react-native-vector-icons/Feather";
import { LineChart, BarChart } from "react-native-gifted-charts";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Fault, ActivityLog } from "@/src/shared/schema";

import mockFaults from "@/assets/mocks/mockFaults.json";
import mockActivities from "@/assets/mocks/mockActivities.json";

import { formatDateTime, formatTimeAgo } from "@/src/lib/utils";
import { API_BASE_URL } from "@/src/lib/constants";

import { useAuth } from "@/src/lib/auth/AuthContext";
import { useFaultsQuery } from "@/src/hooks/useFaultsQuery";
import { useStatsQuery } from "@/src/hooks/useStatsQuery";
import { useNetworkStatus } from "@/src/hooks/useNetworkStatus";

import LoadingScreen from "@/src/components/LoadingScreen";
import { StatCardData } from "@/src/types/cards";

import {StatCard, PerformanceChart, PriorityChart, CompletionBar} from "@/src/components/ui/analytics";
import {MapPreview, RecentActivityItem, QuickActions} from "@/src/components/ui/dashItems";

import { useThemeStore } from "@/src/lib/themeStore";
import { getThemeByMode, AppTheme } from "@/src/lib/colors";
import { RefreshControl } from "react-native-gesture-handler";
import { BOTTOM_NAV_SAFE, GAP } from "@/src/utils/misc";

import { useAppStore } from "@/src/stores/appStore";



const FAULTS_CACHE_KEY = "ufms:dashboard:faults_v2";
const ACTIVITIES_CACHE_KEY = "ufms:dashboard:activities_v2";
const LAST_SYNC_KEY = "ufms:dashboard:last_sync_v1";
const STATUS_FILTERS = ["All", "Active", "Pending", "Resolved"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];


export default function DashboardScreen() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const ref = useRef<ScrollView>(null);
  const mapRef = useRef<MapView>(null);
  
  const mode = useThemeStore((s) => s.mode);
  const themeColors: AppTheme = getThemeByMode(mode);

  const [refreshing, setRefreshing] = useState(false);
  
  const [search, setSearch] = useState("");

  const [lastSync, setLastSync] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fabExpanded, setFabExpanded] = useState(false);
  const fabVisible = useAppStore((state) => state.fabVisible);

  const [selectedAlert, setSelectedAlert] = useState<Fault | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);

  const [chartModalVisible, setChartModalVisible] = useState(false);
  const lastTapChart = useRef<number | null>(null);
  const lastTap = useRef<number | null>(null);

  const [tooltipText, setTooltipText] = useState<string | null>(null);
  const showTooltip = (text: string) => {
    setTooltipText(text);
    setTimeout(() => setTooltipText(null), 1500); // hide after 1.5s
  };

  // Dynamic actions arrays
  const activityActions = selectedActivity ? [
    { icon: "check-circle", color: "#10b981", onPress: () => console.log("Mark Reviewed", selectedActivity.id), tooltip: "Mark Reviewed" },
    { icon: "file-text", color: "#3b82f6", onPress: () => console.log("View Related Fault", selectedActivity.relatedFaultId), tooltip: "View Fault" },
    { icon: "activity", color: "#f59e0b", onPress: () => console.log("Take Action", selectedActivity.id), tooltip: "Take Action" },
    ]
  : [];

  const alertActions = selectedAlert ? [
    { icon: "check-circle", color: "#10b981", onPress: () => { console.log("Resolve", selectedAlert.id); setSelectedAlert(null); }, tooltip: "Resolve" },
    { icon: "user", color: "#3b82f6", onPress: () => console.log("Assign Technician", selectedAlert.id), tooltip: "Assign" },
    { icon: "map-pin", color: "#f59e0b", onPress: () => console.log("View on Map", selectedAlert.id), tooltip: "Locate" },
    ]
  : [];



  const filteredFaults = mockFaults; // temp until hook ready

  // Stable user object to prevent hook reordering
  const stableUser = useMemo(() => {
    return user! ?? { id: "anon", role: "supervisor" as const };
  }, [user?.id, user?.role]);


  // API Hook calls - Stats, Faults, Activities, Alerts - 4 map

  const { stats, isLoading:StatsLoading } = useStatsQuery({ isOnline: true });

  const {loading:isFaultsLoading} = useFaultsQuery({
    isOnline,
    user: user ?? { id: "anon", role: "supervisor" },
    // location, // for travelTime enrichment, not necessary
    useMockData: true,
    selectedFilter: "all",
  });

  // Fetch activities (with cache + mock)
  const activitiesQuery = useQuery<ActivityLog[], Error>({
    queryKey: ["dashboard:activities"],
    queryFn: async () => {
      try {
        if (!isOnline) throw new Error("offline");
        const res = await fetch(`${API_BASE_URL}/activity-logs`);
        if (!res.ok) throw new Error("server error");
        const json = await res.json();
        await AsyncStorage.setItem(ACTIVITIES_CACHE_KEY, JSON.stringify(json));
        return json;
      } catch {
        const cached = await AsyncStorage.getItem(ACTIVITIES_CACHE_KEY);
        if (cached) return JSON.parse(cached);
        return mockActivities as ActivityLog[];
      }
    },
    staleTime: 120000,
    retry: false,
  });

  const activities = activitiesQuery.data ?? [];

  // const alerts = ...


  const isLoading = StatsLoading || isFaultsLoading;

  // // fetch from stats query
  const criticalFaults = useMemo(
    () => filteredFaults.filter((f) => (f as any).severity === "critical"),
    [filteredFaults]
  );

  const activeFaults = useMemo(
    () => filteredFaults.filter((f) => (f.status || "") !== "resolved").length,
    [filteredFaults]
  );

  const resolvedToday = useMemo(() => {
    try {
      const today = new Date().toDateString();
      return filteredFaults.filter((f) => {
        const reported = new Date((f as any).reported_time);
        return (
          reported.toDateString() === today &&
          (f.status || "") === "resolved"
        );
      }).length;
    } catch {
      return 0;
    }
  }, [filteredFaults]);
  
  const priorityCounts = useMemo(() => {
    const count = { high: 0, medium: 0, low: 0 };
    for (const f of filteredFaults) {
      const p = ((f as any).priority || "low");
      if (p === "high") count.high++;
      else if (p === "medium") count.medium++;
      else count.low++;
    }
    return count;
  }, [filteredFaults]);

  const chartSeries = useMemo(() => {
    return [3, 5, 2, 6, 4, 8, resolvedToday || 0];
  }, [resolvedToday]);


  // Pull-to-refresh
  // const onRefresh = useCallback(async () => {
  //   setRefreshing(true);
  //   try {
  //     refreshStats();      
  //     refreshActivities();      
  //     refreshAlerts();      
  //   } finally {
  //     setTimeout(() => setRefreshing(false), 500);
  //   }    
  // }, [refreshFaults]);


  // debounce search
  const onChangeSearch = useCallback((txt: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setSearch(txt), 200);
  }, []);

  // handlers
  const handleCreateJob = () =>
    navigation.navigate("FaultJobs" as never);
  const handleQuickAssign = () =>
    navigation.navigate("FaultJobAssignment" as never);
  const handleOpenMap = () =>
    navigation.navigate("Map" as never);
  const handleDoubleTapMap = () => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      // Double tap detected → go to Map tab
      navigation.navigate("Map" as never);
    } else {
      lastTap.current = now;
    }
  };

  const handleChartDoubleTap = () => {
    const now = Date.now();
    if (lastTapChart.current && now - lastTapChart.current < 300) {
      // Double tap detected → open chart modal
      setChartModalVisible(true);
    } else {
      lastTapChart.current = now;
    }
  };


  // grid layout
  const columns = width < 420 ? 2 : width < 900 ? 3 : 4;
  const cardWidth = columns === 2 ? "48%" : `${Math.floor(100 / columns) - 1}%`;

  // top stat cards - fetch all data from statistics api hook with dynamic updates to the icons, and all that, redeisn this
  const topCards: StatCardData[] = [
    {
      id: "1",
      title: "Active Jobs",
      value: activeFaults,
      subtitle: `${criticalFaults.length} critical`,
      trend: activeFaults > 5 ? "up" : null, // make it kinda dynamic, dependng with statsData
      onPress: () => navigation.navigate("Stats" as never),
    },
    {
      id: "2",
      title: "Pending Approvals",
      value: filteredFaults.filter((f) => (f as any).needs_approval).length || 0,
      subtitle: "Pending",
      trend: "down",
      onPress: () => navigation.navigate("Approvals" as never),
    },
    {
      id: "3",
      title: "Completed Today",
      value: resolvedToday,
      subtitle: "Today",
      trend: resolvedToday > 5 ? "up" : null,
      onPress: () => navigation.navigate("Analytics" as never),
    },
    {
      id: "4",
      title: "Overdue",
      value: filteredFaults.filter((f) => (f as any).is_overdue).length || 0,
      subtitle: "Urgent",
      trend: "up", // ake the data dynamic
      onPress: () => navigation.navigate("Analytics" as never),
    },
  ];

  // Header last sync
  useEffect(() => {
    (async () => {
      if (!lastSync) {
        const saved = await AsyncStorage.getItem(LAST_SYNC_KEY);
        if (saved) setLastSync(saved);
      }
    })();
  }, [lastSync]);

  // loading fallback
  if (isLoading && filteredFaults.length === 0) {
    return <LoadingScreen />;
  }

  const renderModal = (item: ActivityLog | Fault, type: "activity" | "alert") => {
    const actions = type === "activity" ? activityActions : alertActions;
    return (
      <Modal visible={!!item} animationType="slide" transparent onRequestClose={() => type === "activity" ? setSelectedActivity(null) : setSelectedAlert(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => type === "activity" ? setSelectedActivity(null) : setSelectedAlert(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: themeColors.colors.card }]} onPress={(e) => e.stopPropagation()}>
            
            {/* Top X button */}
            <Pressable style={styles.modalCloseBtn} onPress={() => type === "activity" ? setSelectedActivity(null) : setSelectedAlert(null)}>
              <Feather name="x" size={20} color="#fff" />
            </Pressable>

            <Text style={[styles.modalTitle, { color: themeColors.colors.text }]}>
              {type === "activity" ? "Activity Details" : "Alert Details"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {type === "activity" ? (
                <>
                  <Text style={{ color: themeColors.colors.text, marginVertical: 8 }}>{item.description}</Text>
                  <Text style={{ color: themeColors.colors.subtext, fontSize: 12 }}>Timestamp: {formatDateTime(item.timestamp)}</Text>
                  {item.extraInfo && <Text style={{ color: themeColors.colors.subtext, marginTop: 8 }}>{item.extraInfo}</Text>}
                </>
              ) : (
                <>
                  <Text style={{ color: themeColors.colors.text, marginVertical: 8 }}>{item.title}</Text>
                  <Text style={{ color: themeColors.colors.subtext }}>Location: {item.locationName}</Text>
                  <Text style={{ color: themeColors.colors.subtext }}>Severity: {item.severity}</Text>
                  <Text style={{ color: themeColors.colors.subtext }}>Reported: {formatDateTime(item.reported_time)}</Text>
                  {item.details && <Text style={{ color: themeColors.colors.subtext, marginTop: 8 }}>{item.details}</Text>}
                </>
              )}
            </ScrollView>

            {/* Action buttons row */}
            <View style={styles.modalActionsRow}>
              {actions.map((btn, idx) => (
                <Pressable key={idx} style={[styles.modalActionBtn, { backgroundColor: btn.color }]} onPress={btn.onPress}>
                  <Feather name={btn.icon} size={18} color="#fff" />
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  useScrollToTop(ref);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          { paddingBottom: insets.bottom + BOTTOM_NAV_SAFE },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={null} />} 
      >
        {/* Search */}
        <View style={[styles.searchBox, { borderColor: themeColors.colors.border }]}>
          <Feather name="search" size={18} color={themeColors.colors.maintext} />
          <TextInput
            placeholder="Search faults..."
            placeholderTextColor={themeColors.colors.subtext}
            style={[styles.searchInput, { color: themeColors.colors.text }]}
            onChangeText={onChangeSearch}
          />
        </View>

        {/* Top Grid */}
        <View style={styles.topGrid}>
          {topCards.map((c) => (
            <Pressable
              key={c.id}
              onPress={c.onPress}
              style={[
                styles.statCard,
                { width: cardWidth, backgroundColor: themeColors.colors.card },
              ]}
            >
              <Text style={[styles.statTitle, { color: themeColors.colors.maintext }]}>
                {c.title}
              </Text>
              <Text style={[styles.statValue, { color: themeColors.colors.text }]}>
                {c.value}
              </Text>
              <Text style={[styles.statSubtitle, { color: themeColors.colors.subtext }]}>
                {c.subtitle}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Perfomance Line Chart */}
        <View style={styles.sectionRow}>
          {/* <TouchableOpacity onPress={() => navigation.navigate("Stats" as never)}> */}
          {/* <Pressable onPress={handleChartDoubleTap}> */}
            <View style={[styles.chartCard, { backgroundColor: themeColors.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: themeColors.colors.text }]}>
                Performance
              </Text>
              <LineChart 
                data={chartSeries.map((v) => ({ value: v }))} 
                curved 
                // areaChart 
                color={themeColors.colors.subtext}
                showVerticalLines={false} 
                // onPress={(point) => console.log("Tapped point:", point.value)}
              />
            </View>
          {/* </Pressable> */}
          {/* </TouchableOpacity> */}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, marginHorizontal: 4}}>
          {/* Resolution Rate */}
          <TouchableOpacity style={[styles.completionWrap, {backgroundColor: themeColors.colors.card }]} onPress= {() => navigation.navigate("Stats" as never)} >
            <Text style={[ styles.sectionTitle, , { color: themeColors.colors.text }]}>Resolution Rate</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${Math.round((resolvedToday / (filteredFaults.length || 1)) * 100)}%` }]} />
            </View>
            <Text style={styles.completionText}>{`${resolvedToday} / ${filteredFaults.length || 1}`}</Text>
          </TouchableOpacity>

          {/* Priority Distribution */}
          <TouchableOpacity style={[styles.completionWrap, { flex: 1, backgroundColor: themeColors.colors.card }]} onPress= {() => navigation.navigate("Stats" as never)} >
            <Text style={[ styles.sectionTitle, , { color: themeColors.colors.text } ]}>Priority Distribution</Text>
            <View style={{ marginTop: 8, flexDirection:"row", justifyContent:"space-between" }}>
              <Text style={{ color: "#ef4444" }}>H: {priorityCounts.high}</Text>
              <Text style={{ color: "#fbbf24" }}>M: {priorityCounts.medium}</Text>
              <Text style={{ color: "#10b981" }}>L: {priorityCounts.low}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.section, {backgroundColor: themeColors.colors.card,  marginHorizontal: 4, marginBottom: 12 }]}
          onPress= {() => navigation.navigate("Stats" as never)}
        >
          <View >
            <Text style={[ styles.sectionTitle, , { color: themeColors.colors.text } ]}>Other Stats Chart</Text>
            {(["high","medium","low"] as const).map((level) => {
              const colors = { high: "#ef4444", medium: "#fbbf24", low: "#10b981" };
              const value = priorityCounts[level];
              const total = filteredFaults.length || 1;
              return (
                <View key={level} style={{ marginBottom: 4 }}>
                  <Text style={{ color: colors[level], fontSize: 12, marginBottom: 2 }}>{level.charAt(0).toUpperCase() + level.slice(1)}: {value}</Text>
                  <View style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 3 }}>
                    <View style={{ width: `${Math.round((value / total) * 100)}%`, height: 6, backgroundColor: colors[level], borderRadius: 3 }} />
                  </View>
                </View>
              )
            })}
          </View>
        </TouchableOpacity>

        {/* Quick Actions - Though added in FAB */}
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: themeColors.colors.accent }]}
            onPress={handleCreateJob}
          >
            <Feather name="plus" size={16} color={themeColors.colors.text} />
            <Text style={[ styles.primaryText,  { color: themeColors.colors.text }]}>Log Fault</Text>
          </Pressable>
          <Pressable
            style={[styles.ghostBtn, { borderColor: themeColors.colors.border }]}
            onPress={handleQuickAssign}
          >
            <Feather name="user-check" size={16} color={themeColors.colors.text} />
            <Text style={[styles.ghostText, { color: themeColors.colors.text }]}>
              Quick Assign
            </Text>
          </Pressable>
        </View>

        {/* Recent Activities - Activtieis are diverse ad cover a number of things happenign in the system, assignments, updates, etc */}
        <View style={[styles.section, { backgroundColor: themeColors.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.colors.text }]}>
              Recent Activities
            </Text>
            <Pressable
              onPress={() => navigation.navigate("Activities" as never)}
            >
              <Text style={{ color: themeColors.colors.subtext, fontSize: 13 }}>View All</Text>
            </Pressable>
          </View>
          {/* // Render Activities */}
          {activities.length === 0 ? (
            <Text style={[styles.empty, { color: themeColors.colors.text }]}>
              No recent activities
            </Text>
          ) : (
            activities.slice(0, 6).map((a) => (
              <Pressable
                key={a.id}
                style={[styles.activityRow, { borderBottomColor: themeColors.colors.border }]}
                onPress={() => setSelectedActivity(a)}
              >
                <Text style={{ color: themeColors.colors.text }}>{a.description}</Text>
                <Text style={{ color: themeColors.colors.subtext, fontSize: 12 }}>
                  {formatTimeAgo(a.timestamp)}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        {/* Map Preview */}
        <View style={[styles.mapCard, { backgroundColor: themeColors.colors.card }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent:"center" }}>
            <Text style={[styles.sectionTitle, { color: themeColors.colors.text }]}>
              Map Preview
            </Text>
            <Text
              style={{
                fontSize: 12,
                marginLeft: 6,
                color: themeColors.colors.textSecondary ?? "#6b7280", // fallback gray-500
              }}
            >
              (Double tap to open)
            </Text>
          </View>
          <View style={styles.mapWrapper}>
            <Pressable onPress={handleDoubleTapMap} style={{ flex: 1 }}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: filteredFaults[0]?.coords?.latitude || -17.8252,
                  longitude: filteredFaults[0]?.coords?.longitude || 31.0335,
                  latitudeDelta: 0.12,
                  longitudeDelta: 0.12,
                }}
              >
                {filteredFaults.slice(0, 6).map(f => f.coords && (
                  <Marker
                    key={f.id}
                    coordinate={f.coords}
                    title={f.title}
                  />
                ))}
              </MapView>

              <Pressable
                style={styles.mapLockBtn}
                onPress={() => {
                  if (!mapRef.current || filteredFaults.length === 0) return;
                  const lats = filteredFaults.map(f => f.coords?.latitude || 0);
                  const lngs = filteredFaults.map(f => f.coords?.longitude || 0);
                  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
                  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
                  mapRef.current.animateToRegion({
                    latitude: (minLat + maxLat)/2,
                    longitude: (minLng + maxLng)/2,
                    latitudeDelta: (maxLat - minLat) * 1.8 || 0.12,
                    longitudeDelta: (maxLng - minLng) * 1.8 || 0.12,
                  });
                }}
              >
                <Feather name="crosshair" size={20} color="#fff" />
              </Pressable>
            </Pressable>
          </View>
        </View>

        {/* Alerts - To be optimised and sorted in order of latest in hence alerts raised for critical faults, system changes etc not just critical faults */}
        <View style={[styles.section, { backgroundColor: themeColors.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.colors.text }]}>
              Alerts
            </Text>
            <Pressable
              onPress={() => navigation.navigate("Alerts" as never)}
            >
              <Text style={{ color: themeColors.colors.subtext, fontSize: 13 }}>View All</Text>
            </Pressable>
          </View>
          {criticalFaults.length > 0 ? (
            criticalFaults.slice(0, 5).map((f) => (
              <Pressable
                key={f.id}
                style={styles.alertRow}
                onPress={() => setSelectedAlert(f)}
              >
                <Text style={styles.alertDot} />
                <Text style={[styles.alertText, {color: themeColors.colors.subtext,}]}>{`${f.title} — ${f.locationName}`}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={[ styles.empty, {color: themeColors.colors.subtext,}]}>No active alerts</Text>
          )}
        </View>

      </ScrollView>
      
      {fabVisible && (
          <View style={styles.fabContainer}>
            {fabExpanded && (
              <View style={styles.fabActions}>
                <Pressable style={styles.fabActionBtn} onPress={handleCreateJob}>
                  <Feather name="plus" size={20} color="#fff" />
                </Pressable>
                <Pressable style={styles.fabActionBtn} onPress={handleQuickAssign}>
                  <Feather name="user-check" size={20} color="#fff" />
                </Pressable>
              </View>
            )}
            <Pressable style={styles.fab} onPress={() => setFabExpanded(!fabExpanded)}>
              <Feather name={fabExpanded ? "x" : "plus"} size={24} color="#fff" />
              {/* <Text style={{ color: "#fff", fontWeight: "700" }}>QA</Text> */}
            </Pressable>
          </View>
      )}      

      {/* {renderModal(selectedActivity, "activity")}
      {renderModal(selectedAlert, "alert")} */}

      <Modal visible={!!selectedActivity} animationType="slide" transparent onRequestClose={() => setSelectedActivity(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedActivity(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: themeColors.colors.card }]} onPress={e => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: themeColors.colors.text }]}>Activity Details</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: themeColors.colors.text, marginVertical: 8 }}>{selectedActivity?.description}</Text>
              <Text style={{ color: themeColors.colors.subtext, fontSize: 12, marginBottom: 4 }}>
                Timestamp: {formatDateTime(selectedActivity?.timestamp)}
              </Text>
              {selectedActivity?.extraInfo && (
                <Text style={{ color: themeColors.colors.subtext, marginTop: 8 }}>{selectedActivity.extraInfo}</Text>
              )}
              {/* Render dynamic buttons */}
              <View style={styles.modalActionsRow}>
                {activityActions.map((btn, idx) => (
                  <Pressable
                    key={idx}
                    style={[styles.modalActionBtn, { backgroundColor: btn.color }]}
                    onPress={btn.onPress}
                    onLongPress={() => showTooltip(btn.tooltip)}
                  >
                    {/* <Text style={{ color: "#fff", fontWeight: "700" }}>{btn.title}</Text> */}
                    <Feather name={btn.icon} size={18} color="#fff" />
                  </Pressable>
                ))}
              </View>
              {tooltipText && (
                <View style={styles.tooltip}>
                  <Text style={{ color: "#fff", fontSize: 12 }}>{tooltipText}</Text>
                </View>
              )}
            </ScrollView>
            <Pressable style={[styles.modalCloseBtn, { backgroundColor: themeColors.colors.subtext }]} onPress={() => setSelectedActivity(null)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>X</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!selectedAlert} animationType="slide" transparent onRequestClose={() => setSelectedAlert(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedAlert(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: themeColors.colors.card }]} onPress={e => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: themeColors.colors.text }]}>Alert Details</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: themeColors.colors.text, marginVertical: 8 }}>{selectedAlert?.title}</Text>
              <Text style={{ color: themeColors.colors.subtext }}>Location: {selectedAlert?.locationName}</Text>
              <Text style={{ color: themeColors.colors.subtext }}>Severity: {selectedAlert?.severity}</Text>
              <Text style={{ color: themeColors.colors.subtext }}>
                Reported: {formatDateTime(selectedAlert?.reported_time)}
              </Text>
              {selectedAlert?.details && <Text style={{ color: themeColors.colors.subtext, marginTop: 8 }}>{selectedAlert.details}</Text>}
              <View style={styles.modalActionsRow}>
                {alertActions.map((btn, idx) => (
                  <Pressable
                    key={idx}
                    style={[styles.modalActionBtn, { backgroundColor: btn.color }]}
                    onPress={btn.onPress}
                    onLongPress={() => showTooltip(btn.tooltip)}
                  >
                    {/* <Text style={{ color: "#fff", fontWeight: "700" }}>{btn.title}</Text> */}
                    <Feather name={btn.icon} size={18} color="#fff" />
                  </Pressable>
                ))}
              </View>
              {tooltipText && (
                <View style={styles.tooltip}>
                  <Text style={{ color: "#fff", fontSize: 12 }}>{tooltipText}</Text>
                </View>
              )}
            </ScrollView>
            <Pressable style={[styles.modalCloseBtn, { backgroundColor: themeColors.colors.subtext }]} onPress={() => setSelectedAlert(null)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>X</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={chartModalVisible}
        animationType="slide"
        onRequestClose={() => setChartModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: themeColors.colors.background, padding: 12 }}>
          <Pressable
            style={{ position: "absolute", top: 20, right: 20, zIndex: 10 }}
            onPress={() => setChartModalVisible(false)}
          >
            <Feather name="x" size={24} color={themeColors.colors.text} />
          </Pressable>

          <Text style={{ fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 12 }}>
            Performance (Full View)
          </Text>

          <LineChart
            data={chartSeries.map((v) => ({ value: v }))}
            curved
            showVerticalLines={true}
            spacing={60}
            startFillColor={themeColors.colors.accent + "33"}
            endFillColor={themeColors.colors.accent + "00"}
            color={themeColors.colors.accent}
            showLine
            showPoints
          />
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 12 },

  searchBox: {
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal:4,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: { flex: 1, paddingVertical: 2 },

  topGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    // marginBottom: 12,
    marginHorizontal:4,
  },

  statCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#443f3f4b",
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  statTitle: { fontSize: 13, fontWeight: "600" },
  statValue: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  statSubtitle: { marginTop: 4, fontSize: 12 },

  sectionRow: { flexDirection: "row", gap: 12, flexWrap: "wrap", marginHorizontal:4, marginBottom: 12, },
  chartCard: { flex: 1, minWidth: 260, borderRadius: 12, padding: 12 }, //fix design for this to center neatly nicly and he other stuff commented
  sectionTitle: { fontSize: 15, fontWeight: "700", marginHorizontal:4, textAlign:"center", justifyContent:"center" },
  
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    alignItems:"center",
    justifyContent:"space-evenly",
  },
  primaryBtn: {
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    gap: 6,
  },
  primaryText: { color: "#fff", fontWeight: "700" },

  ghostBtn: {
    backgroundColor: "transparent",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ghostText: { fontWeight: "600" },

  section: { marginTop: 12, borderRadius: 12, padding: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  
  activityRow: { paddingVertical: 8, borderBottomWidth: 0.5 },
  mapCard: { marginTop: 12, borderRadius: 12, padding: 12 },
  mapWrapper: { height: 160, marginTop: 8, borderRadius: 10, overflow: "hidden" },
  map: { flex: 1 },
  empty: { textAlign: "center", paddingVertical: 12 },

  completionWrap: { borderRadius: 12, padding: 12, width: 180 },
  progressBg: { height: 10, backgroundColor: "#e5e7eb", borderRadius: 6, marginTop: 8 },
  progressFill: { height: 10, backgroundColor: "#10b981" },
  completionText: { marginTop: 6, fontSize: 12, color: "#6b7280" },
  outlineBtn: { borderWidth: 1, borderColor: "#3b82f6", padding: 12, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  outlineText: { color: "#3b82f6", fontWeight: "700" },
  alertsSection: { marginTop: 12, backgroundColor: "#fff", borderRadius: 12, padding: 12 },
  alertsSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  link: { color: "#3b82f6", fontSize: 13 },
  activityDescription: { fontSize: 14, color: "#374151" },
  activityTimestamp: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  alertRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 8 },
  alertDot: { width: 10, height: 10, backgroundColor: "#ef4444", borderRadius: 6 },
  alertText: { fontWeight: "700", color: "#111827" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "#1f2937",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerSub: { color: "#cbd5e1", fontSize: 12, marginTop: 2 },
  headerBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerBtnText: { color: "#fff", fontWeight: "700" },

  searchRow: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#f3f4f6" },
  
  filterChips: { paddingTop: 10, gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#dbeafe", borderColor: "#93c5fd" },
  chipText: { color: "#374151", fontWeight: "600", fontSize: 12 },
  chipTextActive: { color: "#1d4ed8" },

  // Top Grid
  statCardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statValueWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  trend: { marginLeft: 6, fontSize: 12, fontWeight: "700" },
  trendUp: { color: "#059669" },
  trendDown: { color: "#ef4444" },
  
  chartCardSmall: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    width: 220,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
  },

  activityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#f59e0b",
    borderWidth: 1,
  },
  activityIconText: { fontSize: 16 },

  mapHint: { color: "#6b7280", fontSize: 12, marginTop: 4 },

  fullEmpty: {
    flex: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  bigEmoji: { fontSize: 68 },
  
  fullTitle: { marginTop: 10, fontSize: 22, fontWeight: "800", color: "#0f172a" },
  fullSubtitle: { marginTop: 6, fontSize: 14, color: "#64748b", textAlign: "center" },
  
  refreshBtn: {
    marginTop: 18,
    flexDirection: "row",
    backgroundColor: "#2563eb",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    gap: 8,
  },
  refreshBtnText: { color: "#fff", fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 12,
    textAlign: 'center'
  },
  modalCloseBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#ef4444",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  modalActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    gap: 12,
  },  
  modalActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  mapLockBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 }, android: { elevation: 4 } }),
  },

  tooltip: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 20,
  },

  fabContainer: {
    position: "absolute",
    right: GAP,
    bottom: BOTTOM_NAV_SAFE ,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  fab: {
    width: GAP*4.5,
    height: GAP*4.5,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12 },
      android: { elevation: 5 },
    }),
  },
  fabActions: {
    marginBottom: 12,
    flexDirection: "column",
    gap: 12,
  },
  fabActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6983bbff",
    alignItems: "center",
    justifyContent: "center",
  },

});
