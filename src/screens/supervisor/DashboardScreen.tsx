// ufms/screens/Supervisor/DashboardScreen.tsx

import React from "react";

import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useScrollToTop } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import MapView, { Marker, UrlTile } from "react-native-maps";

import { useQuery } from "@tanstack/react-query";

import Feather from "react-native-vector-icons/Feather";
import { Building2, Users, ListChecks, ActivitySquare, SparklesIcon } from 'lucide-react-native';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart, BarChart } from "react-native-gifted-charts";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { ActivityLog } from "@/src/shared/schema";
import { Fault,  } from "@/src/types/faults";

import mockFaults from "@/assets/data/mockFaults.json";
import mockActivities from "@/assets/data/mockActivities.json";

import { formatDateTime, formatTimeAgo } from "@/src/lib/utils";
import { API_BASE_URL } from "@/src/lib/constants";

import { useAuth } from "@/src/lib/auth/AuthContext";
import { useFaultsQuery } from "@/src/hooks/useFaultsQuery";
import { useStatsQuery } from "@/src/hooks/useStatsQuery";
import { useNetworkStatus } from "@/src/hooks/useNetworkStatus";

import LoadingScreen from "@/src/components/LoadingScreen";
import { StatCardData } from "@/src/types/cards";

import {StatCard, PerformanceChart, PriorityChart, CompletionBar, Card, TodayCenter, PerformanceLineChart, PerformanceBarChart} from "@/src/components/ui/dashItems";
import {MapPreview, RecentActivityItem, QuickActions} from "@/src/components/ui/dashItems";

import { useThemeStore } from "@/src/lib/themeStore";
import { getThemeByMode, AppTheme } from "@/src/lib/colors";
import { RefreshControl } from "react-native-gesture-handler";
import { BOTTOM_NAV_SAFE, GAP } from "@/src/utils/misc";

import { useAppStore } from "@/src/stores/appStore";
import DashboardCard from "@/src/components/ui/supervisor/DashboardCard";
import { useSupervisorDashboard } from "@/src/hooks/supervisor/useSupervisorDashboard";
import CriticalFaultList from "@/src/components/ui/supervisor/CriticalFaultList";
import RecentActivities from "@/src/components/RecentActivities";
import AnalyticsChart from "@/src/components/ui/supervisor/AnalyticsChart";




// Dummy Data
const summaryData = [
  { id: "1", title: "Total Faults", count: 48, icon: "alert-circle", screen: "FaultsScreen" },
  { id: "2", title: "Active Artisans", count: 12, icon: "account-hard-hat", screen: "ArtisansScreen" },
  { id: "3", title: "Open Assignments", count: 27, icon: "clipboard-list", screen: "AssignmentsScreen" },
  { id: "4", title: "Pending Approvals", count: 4, icon: "check-decagram", screen: "ApprovalsScreen" },
];

const quickStats = [
  { id: "1", title: "Resolved Today", value: 9, screen: "ResolvedTodayScreen" },
  { id: "2", title: "Late Tasks", value: 3, screen: "LateTasksScreen" },
  { id: "3", title: "Upcoming Jobs", value: 5, screen: "UpcomingJobsScreen" },
];

const recentActivities = [
  { id: "1", message: "✅ Supervisor approved Task 15", timestamp: "2 mins ago" },
  { id: "2", message: "🛠️ Fault Y closed", timestamp: "10 mins ago" },
  { id: "3", message: "⚠️ Critical fault reported in Zone 7", timestamp: "1 hour ago" },
];




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
  const showMockData = useAppStore();

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



  const filteredFaults = showMockData ? mockFaults : []; // temp until hook ready
  // const filteredFaults = mockFaults; // temp until hook ready

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

  // Maybe add a metric to get new faults reported today

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
  
  const overdueCount = filteredFaults.filter((f: any) => f.is_overdue).length;
  const approvalsCount = filteredFaults.filter((f: any) => f.needs_approval).length;


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

  // 7-day completion series with labels and drill-down
  const last7 = useMemo(() => {
    const today = new Date();
    const arr = [...Array(7)].map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      // mock distribution — swap with real metrics
      const value = Math.max(0, Math.round(Math.random() * 8 - (6 - i === 6 ? 0 : 0))) + (i === 6 ? resolvedToday : 0);
      return { label, date: d, value };
    });
    return arr;
  }, [resolvedToday]);  

  // Priority breakdown for bars
  const prioAgg = useMemo(() => {
    const crit = filteredFaults.filter((f: any) => f.severity === "critical").length;
    const high = filteredFaults.filter((f: any) => f.severity === "high").length;
    const med = filteredFaults.filter((f: any) => f.severity === "moderate" || f.severity === "medium").length;
    const low = filteredFaults.filter((f: any) => f.severity === "low").length;
    return [
      { label: "Critical", value: crit, key: "critical" },
      { label: "High", value: high, key: "high" },
      { label: "Medium", value: med, key: "medium" },
      { label: "Low", value: low, key: "low" },
    ];
  }, [filteredFaults]);

  // Navigation handlers for drill-down
  const goToReportsByDate = (date: Date) =>
    navigation.navigate("Analytics" as never, { filter: "date", value: date.toISOString() } as never);
  const goToReportsByPriority = (key: string) =>
    navigation.navigate("Analytics" as never, { filter: "priority", value: key } as never);

  // ---------- INTERACTIVE CHART TOOLTIP STATES ----------
  const [lineFocusIndex, setLineFocusIndex] = useState<number | null>(null);
  const [barFocusIndex, setBarFocusIndex] = useState<number | null>(null);

  const lineData = last7.map((p, idx) => ({
    value: p.value,
    label: p.label,
    dataPointText: String(p.value),
    onPress: () => {
      setLineFocusIndex(idx);
      goToReportsByDate(p.date);
    },
  }));

  const barData = prioAgg.map((p, idx) => ({
    value: p.value,
    label: p.label,
    onPress: () => {
      setBarFocusIndex(idx);
      goToReportsByPriority(p.key);
    },
  }));

  
const pointerLabel = (idx: number | undefined) => {
    if (idx == null || idx < 0 || idx >= last7.length) return null;
    const p = last7[idx];
    return (
      <View style={styles.tooltip}>
        <Text style={styles.tooltipTitle}>{p.label}</Text>
        <Text style={styles.tooltipText}>{p.value} completed</Text>
      </View>
    );
  };

  const barTooltip = (idx: number | undefined) => {
    if (idx == null || idx < 0 || idx >= prioAgg.length) return null;
    const p = prioAgg[idx];
    return (
      <View style={styles.tooltip}>
        <Text style={styles.tooltipTitle}>{p.label}</Text>
        <Text style={styles.tooltipText}>{p.value} jobs</Text>
      </View>
    );
  };

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
      superscript:"MCFA", // Most Commonly Faulted Asset
      subscript:"MCFZ", // Very high faults region
      subText:`+${filteredFaults?.newToday || 14} today`,
      subtitle: `${criticalFaults.length} critical | 2 moderate`,
      trend: activeFaults < 5 ? "up" : null, // make base on new today, if more than bench, its up, therwise down
      // children:{
      //   <>
      //     <View style={styles.rowWrap}>
      //       <Text style={[styles.badge, styles.badgeText, styles.badgeCritical]}>{filteredFaults?.critical_faults?.length || 3} Critical</Text>
      //       <Text style={[styles.badge, styles.badgeText, styles.badgeModerate]}>{(filteredFaults?.active_faults || 9) - (filteredFaults?.critical_faults?.length || 6)} Moderate</Text>
      //     </View>
      //   </>
      // },
      onPress: () => navigation.navigate("Stats" as never),
    },
    {
      id: "2",
      title: "Pending Approvals",
      superscript:"escalations",
      subscript:"slaBreaches",
      subText:"R.O.A.",
      value: filteredFaults.filter((f) => (f as any).needs_approval).length || 0,
      subtitle: "Development statuses",
      trend: "down",
      // children:{
      //   <>
      //     <View style={styles.rowWrap}>
      //       <Text style={[styles.badge, styles.badgeText, styles.badgeCritical]}>{filteredFaults?.critical_faults?.length || 3} Critical</Text>
      //       <Text style={[styles.badge, styles.badgeText, styles.badgeModerate]}>{(filteredFaults?.active_faults || 9) - (filteredFaults?.critical_faults?.length || 6)} Moderate</Text>
      //     </View>
      //   </>
      // },
      onPress: () => navigation.navigate("Approvals" as never),
    },
    {
      id: "3",
      title: "Avg Resolution",
      superscript:"saidi metric",
      subscript:"caidi metric",
      subText:'min ',
      value: `${filteredFaults?.avg_resolution_time || 0}`,
      subtitle: "trend Metric Update",
      trend: resolvedToday > 5 ? "up" : null,
      // children:{
      //   <>
      //     <Text style={[styles.cardSub, styles.greenText]}>↓ 12% from last week</Text>
      //   </>
      // }
      onPress: () => navigation.navigate("Analytics" as never),
    },
    {
      id: "4",
      title: "Performance",
      superscript:` ${(filteredFaults.filter((f) => (f as any).is_overdue).length || 0)} overdue`,
      subscript:"4 urgent",
      subText:`of ${(filteredFaults?.active_faults || 0) + (filteredFaults?.resolved_today || 0)} tot`,
      value: resolvedToday,
      subtitle: "Progress Bar loading",
      trend: "up", // ake the data dynamic
      // children:{
      //   <>
      //     <View style={styles.progressBg}>
      //       <View style={[styles.progressFill, {
      //         // width: `${(filteredFaults?.resolved_today || 0) / ((filteredFaults?.resolved_today || 0) + (filteredFaults?.active_faults || 0)) * 100}%`
      //         width: filteredFaults?.resolved_today && (filteredFaults?.active_faults + filteredFaults?.resolved_today) > 0
      //         ? `${(filteredFaults.resolved_today / (filteredFaults.active_faults + filteredFaults.resolved_today)) * 100}%`
      //         : '0%',
      //       }]} />
      //     </View>
      //   </>
      // },
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

  const cardStyle = useMemo(() => ({ width: columns === 1 ? '100%' : '48%' }), [columns]);
  
  const renderCriticalFaults = () => (
    // <View style={[styles.sectionRow, ]}>
    <View style={[styles.sectionCard, { backgroundColor: themeColors.colors.card } ]}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>Critical Faults</Text> 
        {/* Add a badge to show number of critical faults, and a ranked update badge too */}
        <TouchableOpacity>
          <Text style={[styles.link,]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.logData}>
        {/* <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true} contentContainerStyle={[styles.CFcontainer,]}> */}
        {/* {filteredFaults?.critical_faults?.length ? filteredFaults.critical_faults.map((fault: Fault) => ( */}
        {criticalFaults && criticalFaults.length > 0 ? (
          // filteredFaults.slice(0, 3).map((fault: Fault) => (
          criticalFaults.slice(0, 3).map((fault) => (
            <TouchableOpacity key={fault.id} style={styles.faultCard}>
              <View style={styles.rowSpaceBetween}>            
                <View style={{ alignItems: 'flex-start' }}>
                  <Text style={styles.faultTitle}>{fault.title}</Text>
                  <Text style={[styles.faultSub,]}>{fault.locationName}</Text>
                  <Text style={[styles.faultSub,]}>Reported: {formatDateTime(fault.timeline.reported)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', }}>
                  <View style={[styles.status, fault.status === 'in_progress' ? styles.statusActive : styles.statusInactive]}>
                    <Text style={[styles.statusText,]}>{fault.status === 'in_progress' ? 'In Progress' : 'Unassigned'}</Text>
                  </View>
                  {/* {fault.status === 'in_progress' && (
                    <Text style={[styles.statusText,]}>Assignee: {fault.assignedTo.name.trim(02)}</Text>
                  )} */}
                  {fault.status !== 'in_progress' && (
                    <TouchableOpacity>
                      <Text style={[styles.status, styles.link, ]}>
                        Assign
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
          </TouchableOpacity>
        ))
       ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="briefcase-outline" size={36} color="#9ca3af" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>No critical faults raised at this time</Text>
          </View>
        )}
        {/* </ScrollView> */}
      </View>
    </View>
  );

  // const renderActivities = () => (
  //   // {/* Recent Activities - Activtieis are diverse ad cover a number of things happenign in the system, assignments, updates, etc */}
  //   <View style={[styles.section, { backgroundColor: themeColors.colors.card }]}>
  //     <View style={styles.sectionHeader}>
  //       <Text style={[styles.sectionTitle, { color: themeColors.colors.text }]}>
  //         Recent Activities
  //       </Text>
  //       <TouchableOpacity
  //         onPress={() => navigation.navigate("Activities" as never)}
  //       >
  //         <Text style={{ color: themeColors.colors.subtext, fontSize: 13 }}>View All</Text>
  //       </TouchableOpacity>
  //     </View>
  //     {/* // Render Activities */}
  //     {activities.length === 0 ? (
  //       <View style={styles.emptyBox}>
  //         <Ionicons name="briefcase-outline" size={36} color="#9ca3af" style={{ marginBottom: 10 }} />
  //         <Text style={[styles.empty, { color: themeColors.colors.text }]}>
  //           No recent activities logged at this time
  //         </Text>
  //       </View>
  //     ) : (
  //       activities.slice(0, 6).map((a) => {
  //         let bg = '#e5e7eb', color = '#4b5563', icon = '✎';
  //         if (a.action === 'CREATE_FAULT') [bg, color, icon] = ['#fef3c7', '#ca8a04', '!'];
  //         if (a.action === 'UPDATE_FAULT_STATUS' && a.description.includes('resolved')) [bg, color, icon] = ['#d1fae5', '#065f46', '✓'];
  //         if (a.action === 'UPDATE_ASSIGNMENT_STATUS') [bg, color, icon] = ['#dbeafe', '#1e40af', '👁️'];
  //         if (a.action === 'CREATE_ASSIGNMENT') [bg, color, icon] = ['#ede9fe', '#5b21b6', '✎'];
  //         return(
  //           <TouchableOpacity
  //             key={a.id}
  //             style={[styles.activityRow, { borderBottomColor: themeColors.colors.border }]}
  //             onPress={() => setSelectedActivity(a)}
  //           >
  //             {/* <View style={styles.activityIconWrap}> */}
  //             <View style={[styles.activityIcon, { backgroundColor: bg }]}>
  //               <Text style={[styles.activityIconText, { color }]}>{icon}</Text>
  //             </View>
  //             <View style={{ flex: 1 }}>
  //               <Text numberOfLines={2} style={{ color: themeColors.colors.text }}>{a.description}</Text>
  //               <Text style={{ color: themeColors.colors.subtext, fontSize: 12 }}>
  //                 {formatTimeAgo(a.timestamp)}
  //               </Text>
  //             </View>
  //           </TouchableOpacity>
  //         );}
  //       )
  //     )}
  //   </View>    
  // );  

  const { dashboard, faults,  refetchAll } = useSupervisorDashboard();
  

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
          {/* <Feather name="search" size={18} color={themeColors.colors.maintext} /> */}
          <SparklesIcon size={18} color={themeColors.colors.maintext} />
          <TextInput
            // placeholder="Ask EDDY... (the System Intelligence)..."
            placeholder="Ask EDDY... (the System AI)..."
            placeholderTextColor={themeColors.colors.subtext}
            style={[styles.searchInput, { color: themeColors.colors.text }]}
            onChangeText={onChangeSearch}
          />
        </View>

        {/* Top 2x2 Grid */}
        <View style={styles.topGrid}>
          {topCards.map((c, i) => (
            <StatCard key={c.id} c={c} width={cardWidth} themeColors={themeColors}/>
          ))}
        </View>

        {/* Critical Faults Section */}
        {renderCriticalFaults()}

        {/* <QuickActions
          onCreate={() => navigation.navigate("FaultJobsScreen" as never)}
          onAcknowledge={() => { activitiesQuery.refetch(); faultsQuery.refetch(); }}
          onAssign={() => navigation.navigate("FaultJobAssignment" as never)}
          onOpenMap={() => navigation.navigate("Map" as never)}
        /> */}

        <TodayCenter
          todayCount={resolvedToday}
          overdueCount={overdueCount}
          approvalsCount={approvalsCount}
          onApproveAll={() => navigation.navigate("Approvals" as never)}
          onViewOverdue={() => navigation.navigate("Stats" as never, { tab: "overdue" } as never)}
          onViewToday={() => navigation.navigate("Stats" as never, { filter: "date", value: new Date().toISOString() } as never)}
          themeColors={themeColors}
        />

        {/* Perfomance Line Chart */}
        <View style={styles.sectionRow}>
          <PerformanceLineChart lineData={lineData} series={chartSeries} themeColors={themeColors} last7={last7} pointerLabel={pointerLabel}/>
          {/* <CompletionBar completed={resolvedToday} total={filteredFaults.length || 1} /> */}
        </View>
        {/* Perfomance Bar Chart */}
        <View style={styles.sectionRow}>
          <PerformanceBarChart barData={barData} prioAgg={prioAgg} themeColors={themeColors} last7={last7} pointerLabel={pointerLabel} barTooltip={barTooltip}/>
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

        {/* <QuickActions
          onCreate={() => navigation.navigate("FaultJobsScreen" as never)}
          onAcknowledge={() => { activitiesQuery.refetch(); faultsQuery.refetch(); }}
          onAssign={() => navigation.navigate("FaultJobAssignment" as never)}
          onOpenMap={() => navigation.navigate("Map" as never)}
          themeColors={themeColors}
        /> */}

        {/* Map Preview */}
        {/* <MapPreview faults={filteredFaults} /> */}
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
                {/* OpenStreetMap tiles */}
                <UrlTile
                  // urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  urlTemplate="https://api.maptiler.com/tiles/streets/{z}/{x}/{y}.png?key=fWWaNtSVZXRXIkWPhbG5"
                  maximumZ={19}
                  flipY={false}
                />                
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

        {/* Recent Activities */}
        {/* {renderActivities()} */}
        <View style={[styles.section, { backgroundColor: themeColors.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.colors.text }]}>
              Recent Activities
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Activities" as never)}
            >
              <Text style={{ color: themeColors.colors.subtext, fontSize: 13 }}>View All</Text>
            </TouchableOpacity>
          </View>
          {/* // Render Activities */}

          {activities.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="briefcase-outline" size={36} color="#9ca3af" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyText}>No recent activities logged at this time</Text>
            </View>
          ) : (
            activities.slice(0, 6).map((a) => <RecentActivityItem key={a.id} activity={a} setSelectedActivity={setSelectedActivity} themeColors={themeColors} />)
          )}
        </View>

        {/* Alerts - To be optimised and sorted in order of latest in hence alerts raised for critical faults, system changes etc not just critical faults */}
        <View style={[styles.section, { backgroundColor: themeColors.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.colors.text }]}>
              Alerts
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Alerts" as never)}
            >
              <Text style={{ color: themeColors.colors.subtext, fontSize: 13 }}>View All</Text>
            </TouchableOpacity>
          </View>
          {criticalFaults.length > 0 ? (
            criticalFaults.slice(0, 5).map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.alertRow}
                onPress={() => setSelectedAlert(f)}
              >
                <Text style={styles.alertDot} />
                <Text style={[styles.alertText, {color: themeColors.colors.subtext,}]}>{`${f.title} — ${f.locationName}`}</Text>
                {/* <Text style={styles.alertSmall}>{formatDateTime(f.timeline.reported)}</Text> */}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="briefcase-outline" size={36} color="#9ca3af" style={{ marginBottom: 10 }} />
              <Text style={[ styles.empty, {color: themeColors.colors.subtext,}]}>No active alerts at this time</Text>
            </View>
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
                <Pressable style={styles.fabActionBtn} onPress={handleQuickAssign}> // use fr acknowledgement and signing of basically
                  <Feather name="check" size={20} color="#fff" />
                </Pressable>
                <Pressable style={styles.fabActionBtn} onPress={handleOpenMap}>
                  <Feather name="map" size={20} color="#fff" />
                </Pressable>
              </View>
            )}
            <TouchableOpacity style={styles.fab} onPress={() => setFabExpanded(!fabExpanded)}>
              <Feather name={fabExpanded ? "x" : "plus"} size={24} color="#fff" />
              {/* <Text style={{ color: "#fff", fontWeight: "700" }}>QA</Text> */}
            </TouchableOpacity>
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
  container: {flex: 1, padding: GAP },

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

  section: { marginTop: 12, borderRadius: 12, padding: 12, borderWidth:1, borderColor:"#3f527027"},
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  
  activityRow: { paddingVertical: 8, borderBottomWidth: 0.5, flexDirection: 'row', gap:8,  alignItems:"center"},
  mapCard: {  borderRadius: 12, padding: 12 },
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
  alertRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 8, },
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
  cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start', // or 'center'/'flex-end' depending on your desired vertical alignment
      justifyContent: 'space-between', // optional, ensures items don't get spaced out
      // gap: 8, // optional: adds spacing between items (for React Native Web or with custom gap utility)
    },
    titleWrapper: {
      flex: 1, // takes up as much space as possible
      justifyContent: 'center',
    },
    cardValue: { 
      fontSize: 24, fontWeight: '700', color: '#111827' 
    },
    metaWrapper: {
      flexDirection: 'column',
      alignItems: 'flex-end', // aligns sub/sup to the right
      justifyContent: 'center',
    },  
    subText: {
      fontSize: 10, color: 'gray',
    },
    supText: {
      fontSize: 10, color: 'gray',
      marginBottom: 2, // slight spacing above subText
    },
    midwayText: {
      // marginLeft: ,4
      marginHorizontal: 8,
      alignSelf: 'center',
    },
    cardSub: { 
      fontSize: 12, color: '#dc2626', 
      fontWeight: '500', 
    },
  
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








    rowWrap: { 
      flexDirection: 'row', flexWrap: 'wrap', 
      gap: 4, marginTop: 4, 
      alignItems:"center", justifyContent:"space-between",
    },
    badge: {
      borderRadius: 12, paddingHorizontal: 8,
      paddingVertical: 2, // marginRight: 4,
      marginTop: 4, // padding: 4, 
    },
    badgeText: {
      fontSize: 8, fontWeight: '600',
    },
    bgCriticalLight: {
      backgroundColor: '#fee2e2', // red-100
    },
    bgModerateLight: {
      backgroundColor: '#e0e7ff', // indigo-100
    },
    badgeCritical: { 
      backgroundColor: '#fee2e2', color: '#b91c1c', 
    },
    badgeModerate: { 
      backgroundColor: '#e0f2fe', color: '#0284c7', 
    },
    textCriticalDark: {
      color: '#b91c1c', // red-700
    },
    // progressBg: { 
    //   height: 8, backgroundColor: '#e5e7eb', 
    //   borderRadius: 4, marginTop: 8, 
    //   overflow: "hidden",
    // },
    // progressFill: { 
    //   height: 8, backgroundColor: '#10b981', borderRadius: 4 
    // },
    greenText: {
      color: '#10b981',
    },
    grayText: { 
      color: '#6b7280', 
    },


    sectionCard: {
      flex: 1,
      minWidth: 260,
      padding: GAP, 
      borderWidth:1,
      borderRadius: 12, 
      borderColor:"#86555521",
      marginBottom:GAP,
      // marginTop:GAP,
      // ...Platform.select({
      //   ios: {
      //     shadowColor: "#443f3f4b",
      //     shadowOpacity: 0.08,
      //     shadowRadius: 6,
      //   },
      //   android: { elevation: 3 },
      // }),
    },

    rowBetween: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: "center" 
    },
    logData: {
      paddingTop:4,
    },
    faultCard: { 
      // flexDirection: 'row', 
      justifyContent: 'space-between', 
      padding: 10, 
      borderRadius: 8, 
      borderLeftWidth: 4, 
      borderLeftColor: '#dc2626', 
      backgroundColor: '#f871711a', 
      marginBottom: 8 
    },
    faultTitle: { 
      fontWeight: 'bold', color: '#b91c1c' 
    },
    faultSub: { 
      fontSize: 12, color: '#6b7280' 
    },
    status: { 
      paddingVertical: 2, paddingHorizontal: 8, 
      borderRadius: 6, // marginBottom: 4,
     },
    statusText: { fontSize: 12, color: '#1f2937' },
    

    buttonOutline: {
      borderWidth: 1, borderColor: '#3b82f6',
      borderRadius: 8,
      // paddingVertical: 12,
      // paddingHorizontal: 16,
      marginVertical: 8,
      width: '48%', flexDirection: 'row',
      justifyContent: 'center', alignItems: 'center',
      padding: 12,
    },
    buttonOutlineText: {
      color: '#3b82f6', fontWeight: '600',
      fontSize: 16,
    },
    ActivitiesCard: {
      backgroundColor: '#fff',   borderRadius: 8,
      padding: 15,  // flexBasis: '48%',
      // marginTop: 16, marginBottom: 16,  
      shadowColor: '#000',
      shadowOpacity: 1.5,  shadowRadius: 10,
      elevation: 8,  width: '100%',
    },
    statusActive: { 
      backgroundColor: '#dcfce7' 
    }, 
    statusInactive: { 
      backgroundColor: '#f3f4f6' 
    }, 
    activityRowOther: { 
      flexDirection: 'row', paddingVertical: 8,
      gap: 10, alignItems: 'center', 
    },
    activityIcon: { 
      width: 32, height: 32, borderRadius: GAP, 
      justifyContent: 'center', alignItems: 'center', 
      // marginLeft: 15,
      // marginTop: 10,
    },
    time: { fontSize: 10, color: '#6b7280' },

  modalBox: { 
    backgroundColor: '#fff', padding: 20, 
    borderRadius: 12, width: '80%', 
  },
  modalBody: {
    fontSize: 14, color: '#374151',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#3b82f6', paddingVertical: 12,
    borderRadius: 8, alignItems: 'center',
  },
  modalButtonText: {
    color: 'white', fontWeight: '700',
    textAlign: 'center', fontSize: 16,
  },
  rowSpaceBetween: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  bgOnsiteLight: {
    backgroundColor: '#d1fae5', // green-100
  },
  textOnsiteDark: {
    color: '#065f46', // green-700
  },
  bgGrayLight: {
    backgroundColor: '#f3f4f6', // gray-100
  },

  faultLocation: {
    fontSize: 14, color: '#6b7280',
  },




  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardWrapper: { marginBottom: 12 },

});
