
// screens/supervisor/FaultJobsScreen.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, LayoutAnimation, Linking, Modal, Platform, Pressable, RefreshControl, StyleSheet, Switch, Text, TextInput, TouchableOpacity, UIManager, View } from "react-native";

import { ScrollView, Swipeable } from "react-native-gesture-handler";
import { Filter, Search, RefreshCw, ChevronUp, ChevronDown, Inbox, List, Table, CalendarDays, Sparkles } from "lucide-react-native";
import Toast from "react-native-toast-message";

import { useAuth } from "@/src/lib/auth/AuthContext";
import { useNetworkStatus } from "@/src/hooks/useNetworkStatus";
import { useFaultsQuery } from "@/src/hooks/useFaultsQuery";
import { useAssignmentOptionsQuery } from "@/src/hooks/useAssignmentOptionsQuery";

import { FaultJobsScreenFilters } from "@/src/types/filters";
import { SLAInfo, Fault, FaultSeverity, FaultStatus } from "@/src/types/faults";
import { Team } from "@/src/types/user";

import { FaultCard } from "@/src/components/FaultJobCard";

import { DataTable } from "react-native-paper";
import { Calendar } from "react-native-calendars";

import LoadingScreen from "@/src/components/LoadingScreen";
import { Chip, SLABadge } from "@/src/components/ui/uiAccessories";

import { useThemeStore } from "@/src/lib/themeStore";
import { getThemeByMode, AppTheme } from "@/src/lib/colors";

import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "react-native-feather";
import { useAppStore } from "@/src/stores/appStore";

import mockFaults from "@/assets/data/mockFaults.json"; 


if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}



const defaultFilters: FaultJobsScreenFilters = {
  search: "",
  statuses: [
    "active",
    "pending",
    "in_progress",
    "resolved",
    "closed",
    "cancelled",
    "on_hold",
    "escalated",
  ],
  severities: ["critical", "major", "moderate", "minor"],
  assignedTo: "all",
  sla: "all",
  dateRange: "7d",
  sort: "priority",
  teamId: "all",
};


// Assign Fault job to artisan modal - Enhance this
          // <Modal visible={assignModalVisible} transparent animationType="slide" onRequestClose={() => setAssignModalVisible(false)}>
          //   <View style={mapStyles.modalContainer}>
          //     <View style={mapStyles.modalContent}>
          //       <Text style={mapStyles.modalTitle}>Assign Artisan</Text>
          //       {artisans?.map(arti => (
          //         <TouchableOpacity key={arti.id} onPress={() => assignFaultJob(arti)}>
          //           <Text style={mapStyles.artiOption}>{arti.name}</Text>
          //         </TouchableOpacity>
          //       ))}
          //       <TouchableOpacity style={mapStyles.closeButton} onPress={() => setAssignModalVisible(false)}>
          //         <Text style={mapStyles.buttonText}>Cancel</Text>
          //       </TouchableOpacity>
          //     </View>
          //   </View>
          // </Modal>  

function AssignModal({
  visible,
  teams,
  themeColors,
  onClose,
  onSelect,
}: {
  visible: boolean;
  teams: Team[] | undefined;
  themeColors: AppTheme;
  onClose: () => void;
  onSelect: (teamId: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View 
      style={[
          styles.modalBackdrop,
          // { backgroundColor: themeColors.colors.background },
        ]}>
        <View 
        style={[
            styles.modalCard,
            { backgroundColor: themeColors.colors.card },
          ]}>
          <Text 
          style={[
              styles.modalTitle,
              { color: themeColors.colors.maintext },
            ]}>Assign to Team</Text>

          {!teams || teams.length === 0 ? (
            <View style={{ paddingVertical: 20 }}>
              <Text style={{ color: themeColors.colors.subtext }}>No teams available</Text>
            </View>
          ) : (
            <FlatList
              data={teams}
              keyExtractor={(t) => t.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.teamRow}
                  onPress={() => {
                    onSelect(item.id);
                  }}
                >
                  <View>
                    <Text 
                    style={[
                        styles.teamName,
                        { color: themeColors.colors.maintext },
                      ]}
                      >{item.name}</Text>
                    <Text 
                    style={[
                        styles.teamMeta,
                        { color: themeColors.colors.subtext },
                      ]}>
                      {(item.skills || []).join(", ")} · cap {item.capacity ?? 0}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          )}

          <Pressable 
          style={[
              styles.modalClose,
              { backgroundColor: themeColors.colors.danger },
            ]}
             onPress={onClose}>
            <Text style={styles.modalCloseText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}


const views = ["List", "Table", "Schedule"] as const;
const tabs = [
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
];

type TabType = "list" | "table" | "schedule";
type FilterType = "all" | "in_progress" | "active" | "resolved";

export default function FaultJobsScreen() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  const [activeTab, setActiveTab] = useState<"pending" | "in_progress" | "resolved">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState(false);
  const [filters, setFilters] = useState<FaultJobsScreenFilters>(defaultFilters);
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<FilterType>("all");
  
  const [view, setView] = useState<typeof views[number]>("List");
  const [tab, setTab] = useState<TabType>("list");

  const [faults, setFaults] = useState<any[]>([]);

  const [autoAssignMode, setAutoAssignMode] = useState(false);

  const [assignTarget, setAssignTarget] = useState<Fault | null>(null);

  const [assignModalVisible, setAssignModalVisible] = useState(false);

  const [filterExpanded, setFilterExpanded] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const mode = useThemeStore((s) => s.mode);
  const themeColors: AppTheme = getThemeByMode(mode);

  const { showMockData } = useAppStore();
  

  // queries
  const { artisans, teams, isLoading: isAssignOptionsLoading } = useAssignmentOptionsQuery({ isOnline: true });
  const {
    assignMut,
    statusMut,
    loading: isFaultsLoading,
    error,
    refreshFaults,
    filteredFaults,
  } = useFaultsQuery({
    isOnline,
    user: user! ?? { id: "anon", role: "supervisor" } as any,
    useMockData: true,
    selectedFilter: "all",
  });

  const isLoading = isFaultsLoading || isAssignOptionsLoading;

  // const handleAssign = (faultId: string, assigneeId: string) => {
  //   updateFaultAssignment(faultId, assigneeId);
  // };

  const filteredJobs = useMemo(() => {
    if (showMockData) {
      if (filter === "all") return mockFaults;

      if (filter === "active") {
        // active means in_progress + pending + assigned
        return mockFaults.filter(
          (j) =>
            j.status === "in_progress" ||
            j.status === "pending" ||
            j.status === "assigned"
        );
      }

      return mockFaults.filter((j) => j.status === filter);
    }

    // if no mock data
    return [];
  }, [mockFaults, filter, showMockData]);

  const searchedFaults = useMemo(() => {
    if (!filteredFaults) return [];
    const q = searchQuery.trim().toLowerCase();
    return filteredFaults.filter((f) => {
      const hay = `${f.referenceNumber ?? ""} ${f.title ?? ""} ${f.description ?? ""} ${f.locationName ?? ""} ${f.assetType ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [filteredFaults, searchQuery]);

  // Work out one finer logic for filtering, given period filter, period filters2, and dataforTab, as well as searched faults, and filtered faults. where searched faults affect whats rendered, and so does the different filter implmented in top scroll bar,  and filters modal
  const periodfilters = useMemo(() => {
    if (!searchedFaults) return [] as (Fault & { slaState?: SLAInfo })[];
    const now = new Date();
    const q = filters.search?.trim().toLowerCase();
    const matched: (Fault & { slaState?: SLAInfo })[] = [];
    for (const j of searchedFaults) {
      // Tab filter
      if (activeTab && j.status !== activeTab) continue;

      // Date range
      const reported = new Date(j.timeline?.reportedAt ?? j.reported_time ?? j.createdAt ?? now).getTime();
      const ageMin = (now.getTime() - reported) / 60000;
      if (filters.dateRange === "24h" && ageMin > 24 * 60) continue;
      if (filters.dateRange === "7d" && ageMin > 7 * 24 * 60) continue;
      if (filters.dateRange === "30d" && ageMin > 30 * 24 * 60) continue;

      // statuses and severities
      if (filters.statuses?.length && !filters.statuses.includes(j.status)) continue;
      if (filters.severities?.length && !filters.severities.includes(j.severity)) continue;

      // assigned/team
      if (filters.teamId && filters.teamId !== "all" && j.assignedTeamId !== filters.teamId) continue;

      // sla (if job has slaState)
      if (filters.sla !== "all" && j.slaState?.state !== filters.sla) continue;

      // full text (also check the per-filter text)
      if (q) {
        const hay = `${j.referenceNumber ?? j.reference_number ?? ""} ${j.title ?? j.name ?? ""} ${j.description ?? ""} ${j.assetId ?? ""} ${j.assetType ?? ""}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }

      matched.push(j);
    }

    // Sort
    matched.sort((a, b) => {
      if (filters.sort === "priority") {
        const s: Record<FaultSeverity, number> = { critical: 4, major: 3, moderate: 2, minor: 1 };
        return (s[(b.severity as FaultSeverity) ?? "minor"] ?? 0) - (s[(a.severity as FaultSeverity) ?? "minor"] ?? 0);
      }
      if (filters.sort === "sla") {
        return (a.slaState?.minutesLeft ?? 0) - (b.slaState?.minutesLeft ?? 0);
      }
      // createdAt descending
      return (new Date(b.timeline?.reportedAt ?? b.createdAt ?? 0).getTime() - new Date(a.timeline?.reportedAt ?? a.createdAt ?? 0).getTime());
    });

    return matched;
  }, [searchedFaults, filters, activeTab]);

  const periodfilters2 = useMemo(() => {
    if (!searchedFaults) return [];
    const now = new Date();
    return searchedFaults.filter((j) => {
      if (activeTab && j.status !== activeTab) return false;
      const reported = new Date(
        j.timeline?.reportedAt ??
          j.reported_time ??
          j.createdAt ??
          now
      ).getTime();
      const ageMin = (now.getTime() - reported) / 60000;
      if (filters.dateRange === "24h" && ageMin > 24 * 60) return false;
      if (filters.dateRange === "7d" && ageMin > 7 * 24 * 60) return false;
      if (filters.dateRange === "30d" && ageMin > 30 * 24 * 60)
        return false;
      return true;
    });
  }, [searchedFaults, filters, activeTab]);

  const dataForTab = periodfilters; // already filtered for tab
  // const dataForTab = searchedFaults.filter((f) => f.status === activeTab);

  const toggleSelect = useCallback((id: string) => setSelection((s) => ({ ...s, [id]: !s[id] })), []);
  const selectedIds = useMemo(() => Object.keys(selection).filter((k) => selection[k]), [selection]);

  const bulkResolve = useCallback(() => {
    if (!selectedIds.length) {
      return Alert.alert("Bulk Resolve", "No jobs selected.");
    }
    selectedIds.forEach((id) => statusMut.mutate({ faultId: id, status: "resolved" }));
    setSelection({});
    Toast.show({ type: "success", text1: "Jobs resolved", text2: `${selectedIds.length} jobs marked resolved` });
  }, [selectedIds, statusMut]);

  const bulkAssign = useCallback(() => {
    if (!teams || teams.length === 0) return Alert.alert("Bulk Assign", "No teams available");
    if (!selectedIds.length) return Alert.alert("Bulk Assign", "No jobs selected.");
    const teamId = teams[0].id;
    selectedIds.forEach((id) => assignMut.mutate({ faultId: id, teamId }));
    setSelection({});
    Toast.show({ type: "success", text1: "Assigned", text2: `${selectedIds.length} jobs assigned to ${teams[0].name}` });
  }, [teams, selectedIds, assignMut]);

  // ReImplement this such that its also called by the auto toggle for assignments mode, and it logic should allow unassigned jobs to be assigned to availble artisans or teams as required by each fault job
  const autoAssign = useCallback(() => {
    if (!periodfilters.length || !teams?.length) return Alert.alert("Auto-assign", "No eligible jobs or teams.");
    const sevScore: Record<FaultSeverity, number> = { critical: 4, major: 3, moderate: 2, minor: 1 };
    const skillMap: Record<string, string> = { Transformer: "HV", RMU: "LV", Line: "LV", Comms: "Comms" };

    const caps: Record<string, number> = Object.fromEntries((teams || []).map((t) => [t.id, t.capacity ?? 1]));

    const candidates = periodfilters
      .filter((j) => !j.assignedTo && (j.status === "active" || j.status === "pending" || j.status === "in_progress"))
      .map((j) => {
        const minutesLeft = j.slaState?.targetMinutes ?? 0;
        const slaFactor = Math.max(0, 10000 - Math.max(0, minutesLeft));
        const score = (sevScore[j.severity as FaultSeverity] ?? 1) * 1000 + slaFactor;
        return { job: j, score };
      })
      .sort((a, b) => b.score - a.score);

    const plan: { faultId: string; teamId: string }[] = [];
    for (const c of candidates) {
      const skill = c.job.assetType ? skillMap[c.job.assetType] : undefined;
      const eligible = teams.filter((t) => (skill ? t.skills?.includes(skill) : true) && (caps[t.id] ?? 0) > 0);
      if (!eligible.length) continue;
      const chosen = eligible.sort((a, b) => (caps[b.id] ?? 0) - (caps[a.id] ?? 0))[0];
      caps[chosen.id] = (caps[chosen.id] ?? 0) - 1;
      plan.push({ faultId: c.job.id, teamId: chosen.id });
    }

    if (!plan.length) return Alert.alert("Auto-assign", "No assignments produced.");

    plan.forEach((p) => assignMut.mutate({ faultId: p.faultId, teamId: p.teamId }));
    Toast.show({ type: "success", text1: "Auto-assign", text2: `Assigned ${plan.length} jobs` });
  }, [periodfilters, teams, assignMut]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedJob((prev) => (prev === id ? null : id));
  };
  
  // To redesign this such that it can best represent the data we have for Fault Data type as well as essential one
  // const renderItem = useCallback(
  //   ({ item }: { item: Fault & { slaState?: SLAInfo } }) => {
  //     const isSelected = !!selection[item.id];
  //     return (
  //       <Pressable
  //         style={[styles.card,  
  //           { backgroundColor: themeColors.colors.taskCard },
  //           isSelected && {
  //             borderWidth: 1,
  //             borderColor: themeColors.colors.primary,
  //           },]}
  //         onLongPress={() => toggleSelect(item.id)}
  //         onPress={() => setExpandedJob((prev) => (prev === item.id ? null : item.id))}
  //       >
  //         <View style={styles.cardHeader}>
  //           <Text 
  //           style={[
  //               styles.cardTitle,
  //               { color: themeColors.colors.maintext },
  //             ]}>
  //             {item.code ?? item.id} · {item.name ?? item.title}
  //           </Text>
  //           <SLABadge state={item.slaState?.state ?? "ok"} minutesLeft={item.slaState?.minutesLeft ?? 0} />
  //         </View>

  //         <Text 
  //         style={[styles.cardSubtitle, { color: themeColors.colors.subtext }]}
  //         >
  //           {item.assetType ?? "—"} · {item.region ?? "—"} · {item.district ?? "—"}
  //         </Text>
  //         <Text style={[styles.cardMeta, { color: themeColors.colors.subtext }]}>
  //           Severity: {(item.severity ?? "—").toString().toUpperCase()} · Status: {(item.status ?? "—").toString().replace("_", " ")}
  //         </Text>
  //         {!!item.customerImpact && <Text style={[styles.cardMeta, { color: theme.colors.subtext }]}>Impact: ~{item.customerImpact} customers</Text>}

  //         {expandedJob === item.id && !!item.description && (
  //           <Text 
  //                         style={[
  //               styles.cardMeta,
  //               { marginTop: 8, color: themeColors.colors.subtext },
  //             ]}
  //             >{item.description}</Text>
  //         )}

  //         <View style={styles.actionsRow}>
  //           <Pressable style={styles.actionBtn} onPress={() => setAssignTarget(item)}>
  //             <Text style={styles.actionBtnText}>{item.assignedTo ? "Reassign" : "Assign"}</Text>
  //           </Pressable>

  //           <Pressable
  //             style={styles.actionBtn}
  //             onPress={() =>
  //               statusMut.mutate({
  //                 faultId: item.id,
  //                 status: item.status === "in_progress" ? "resolved" : "in_progress",
  //               })
  //             }
  //           >
  //             <Text style={styles.actionBtnText}>{item.status === "in_progress" ? "Mark Resolved" : "Start"}</Text>
  //           </Pressable>

  //           {item.coords && (
  //             <Pressable
  //               style={styles.actionBtn}
  //               onPress={() => {
  //                 const { latitude, longitude } = item.coords!;
  //                 const url = Platform.select({
  //                   ios: `http://maps.apple.com/?ll=${latitude},${longitude}`,
  //                   android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
  //                   default: `https://maps.google.com/?q=${latitude},${longitude}`,
  //                 });
  //                 Linking.openURL(url!);
  //               }}
  //             >
  //               <Text style={styles.actionBtnText}>Map</Text>
  //             </Pressable>
  //           )}

  //           <Pressable style={[styles.actionBtn, styles.selectBtn]} onPress={() => toggleSelect(item.id)}>
  //             <Text style={styles.actionBtnText}>{isSelected ? "Deselect" : "Select"}</Text>
  //           </Pressable>
  //         </View>
  //       </Pressable>
  //     );
  //   },
  //   [selection, toggleSelect, statusMut, expandedJob]
  // );


  const renderItem = useCallback(
    // ({ item }) => {
    ({ item }: { item: Fault & { slaState?: SLAInfo } }) => (
      // return (
        <Swipeable renderRightActions={() => null}>
          <FaultCard
            fault={item}
            type="supervisor"
            themeColors={themeColors}
            expanded={expandedJob === item.id}
            isSelected = {!!selection[item.id]}
            onToggleExpand={() => toggleExpand(item.id)}
            onToggleSelect={() => toggleSelect(item.id)} // recheck selection toggling logic
            onStatusChange={(status) => statusMut.mutate({ faultId: item.id, status })} //recheck logic
            // onExpandedJob={expandedJob}
            // type={item.status}
            onAssign={() => setAssignTarget(item)} // to be implmented
            actionButtons={[
              {
                label: "View Details",
                action: () => Toast.show({ type: "info", text1: "Open detail" }),
                primary: true,
              },
              {
            label: item.status === "in_progress" ? "Mark Resolved" : "Start",
            action: () =>
              statusMut.mutate({
                faultId: item.id,
                status:
                  item.status === "in_progress"
                    ? "resolved"
                    : "in_progress",
              }),
          },
          ...(item.coords
            ? [
                {
                  label: "Map",
                  action: () => {
                    const { latitude, longitude } = item.coords!;
                    const url = Platform.select({
                      ios: `http://maps.apple.com/?ll=${latitude},${longitude}`,
                      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
                      default: `https://maps.google.com/?q=${latitude},${longitude}`,
                    });
                    Linking.openURL(url!);
                  },
                },
              ]
            : []),
          {
            label: !!selection[item.id] ? "Deselect" : "Select",
            action: () => toggleSelect(item.id),
          },
        ]}
      />
        </Swipeable>
      ),
    // },
    [selection, expandedJob, toggleSelect, toggleExpand, setAssignTarget, statusMut,  themeColors]
  );

  const assignFaultJob = (arti: User) => {
    console.log(`Assigned ${arti.name} to fault ${selectedFault?.id}`);
    setAssignModalVisible(false);
  };

  const onRefresh = useCallback(() => {
    refreshFaults();
  }, [refreshFaults]);

  const renderTable = () => (
    <DataTable>
      <DataTable.Header>
        <DataTable.Title style={{ flex: 2, }}>
            <Text style={{ color: themeColors.colors.subtext }}>Title</Text>
        </DataTable.Title>
        <DataTable.Title>
            <Text style={{ color: themeColors.colors.subtext }}>Status</Text>
        </DataTable.Title>
        <DataTable.Title>
            <Text style={{ color: themeColors.colors.subtext }}>Priority</Text>
        </DataTable.Title>
        <DataTable.Title>
            <Text style={{ color: themeColors.colors.subtext }}>Team</Text>
        </DataTable.Title>
      </DataTable.Header>
      {filteredFaults.map((job) => (
        <DataTable.Row key={job.id}>
          <DataTable.Cell style={{ flex: 2,}}>
            <Text style={{ color: themeColors.colors.subtext }}>{job.title}</Text>
          </DataTable.Cell>
          <DataTable.Cell >
            <Text style={{ color: themeColors.colors.subtext }}>{job.status}</Text>
          </DataTable.Cell>
          <DataTable.Cell>
            <Text style={{ color: themeColors.colors.subtext }}>{job.priority}</Text>
          </DataTable.Cell>
          <DataTable.Cell>
            <Text style={{ color: themeColors.colors.subtext }}>{job.isTeamJob}</Text>
          </DataTable.Cell>
        </DataTable.Row>
      ))}
    </DataTable>
  );

  const renderTable2 = () => (
    <ScrollView horizontal>
      <View style={styles.table}>
        <View style={[styles.row, styles.header]}>
          <Text style={styles.cell}>Ref</Text>
          <Text style={styles.cell}>Title</Text>
          <Text style={styles.cell}>Location</Text>
          <Text style={styles.cell}>Assigned</Text>
          <Text style={styles.cell}>SLA</Text>
          <Text style={styles.cell}>Status</Text>
        </View>
        {filteredJobs.map((j) => (
          <View key={j.id} style={styles.row}>
            <Text style={styles.cell}>{j.code ?? j.id}</Text>
            <Text style={styles.cell}>{j.title}</Text>
            <Text style={styles.cell}>{j.location ?? "-"}</Text>
            <Text style={styles.cell}>{j.assignedTo?.name ?? "Unassigned"}</Text>
            <Text style={styles.cell}>{j.slaState?.due ?? "-"}</Text>
            <Text style={styles.cell}>{j.status}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderSchedule = () => {
    const marked: Record<string, any> = {};
    filteredJobs.forEach((job) => {
      if (job.date) {
        marked[job.date] = {
          marked: true,
          dotColor: job.priority === "High" ? "red" : "blue",
        };
      }
    });
    return <Calendar markedDates={marked} style={[{backgroundColor:themeColors.colors.background}]} />;
  };

  // Schedule View (simplified timeline)
  const renderSchedule2 = () => (
    <ScrollView>
      {filteredJobs.map((j) => (
        <View key={j.id} style={styles.scheduleItem}>
          <Text style={styles.scheduleTime}>
            {j.slaState?.due ?? j.createdAt}
          </Text>
          <View style={styles.scheduleCard}>
            <Text style={styles.scheduleTitle}>{j.title}</Text>
            <Text style={styles.scheduleMeta}>
              {j.assignedTo?.name ?? "Unassigned"} | {j.status}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );  

  const ListHeader = useMemo(
    () => (
      <View>
        {selectedIds.length > 0 && (
          <View style={styles.bulkBar}>
            <Text style={styles.bulkText}>{selectedIds.length} selected</Text>
            <Pressable style={styles.bulkBtn} onPress={bulkAssign}>
              <Text style={styles.bulkBtnText}>Bulk Assign</Text>
            </Pressable>
            <Pressable style={styles.bulkBtn} onPress={bulkResolve}>
              <Text style={styles.bulkBtnText}>Mark Resolved</Text>
            </Pressable>
            <Pressable style={styles.bulkBtn} onPress={() => setSelection({})}>
              <Text style={styles.bulkBtnText}>Clear</Text>
            </Pressable>
          </View>
        )}
      </View>
    ),
    [searchQuery, filterExpanded, autoAssignMode, selectedIds, teams, filters, view, periodfilters]
  );

  if (isLoading) return <LoadingScreen message="Loading FaultJobs" />;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: themeColors.colors.danger ?? "#f87171" }}>Failed to load. Using cached data if available.</Text>
      </View>
    );
  }

  // useEffect(() => {
  //   if (autoAssignMode) {
  //     autoAssign();
  //   }
  // }, [autoAssignMode, autoAssign]);


  return (
    <>
      <View style={[ styles.container, { backgroundColor: themeColors.colors.background }]}>
        {/* 1. Tabs (use contentContainerStyle so children layout is controlled inside the scroll area) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsRow}
          contentContainerStyle={styles.tabsContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {tabs.map((tab) => (
            <TouchableOpacity 
              key={tab.key} 
              onPress={() => setActiveTab(tab.key as any)} 
              style={[styles.tabButton, activeTab === tab.key && {
                // borderBottomColor: themeColors.colors.primary,
                backgroundColor: themeColors.colors.primary,
                // borderBottomWidth: 2,
              },]}
            >
              <Text style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}>
                {tab.key.replace("_", " ").toUpperCase()}
                {/* {tab.label} */}
              </Text>
            </TouchableOpacity>
          ))}

          {/* <View style={{ flex: 1 }} /> */}

          <TouchableOpacity style={[styles.tabButton, { marginLeft: 8 }]} onPress={() => refreshFaults()}>
            {/* Change the following to a more filters drop down ChevronDown button isnteadd */}
            <RefreshCw size={16} color={themeColors.colors.subtext} /> 
          </TouchableOpacity>
        </ScrollView>

        {/* <View style={styles.filters}>
        {(["all", "active", "in_progress", "resolved"] as FilterType[]).map(
          (f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                filter === f && { backgroundColor: colors.primary },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && { color: colors.onPrimary },
                ]}
              >
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View> */}

        {/* 2. Assignment + Actions row */}
        <View style={styles.assignmentRow}>
          {/* Assignment Mode toggle */}
          <View style={styles.assignmentToggle}>
            <Text style={[styles.assignmentLabel, { color: themeColors.colors.maintext }]}>
              Assignments
            </Text>
            <Text style={[styles.switchLabel, { color: themeColors.colors.subtext }]}>Manual</Text>
            <Switch
              value={autoAssignMode}
              onValueChange={setAutoAssignMode}
              trackColor={{ true: themeColors.colors.primary, false: themeColors.colors.border }}
              thumbColor={autoAssignMode ? themeColors.colors.secondary : themeColors.colors.card }
            />
            <Text style={[styles.switchLabel, { color: themeColors.colors.subtext }]}>Auto</Text>
          </View>
          
          {/* Right-side action icons */}
          <View style={styles.actionsRight}>
            {/* Make search toggle showSearch */}
            <TouchableOpacity onPress={() => setShowSearch(true)} style={styles.iconBtn}>
              <Search size={20} color={themeColors.colors.maintext} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setFilterVisible(true)} style={styles.iconBtn}>
              <Filter size={20} color={themeColors.colors.maintext} />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <>
            <View style={styles.searchRow}>
              <TextInput
                placeholder="Search faults, jobs, work orders..."
                placeholderTextColor="#6b7280cb"
                value={searchQuery}
                onChangeText={setSearchQuery}
                // onChangeText={(t) => setFilters((f) => ({ ...f, search: t }))}
                style={[
                  styles.searchInput,
                  { borderColor: themeColors.colors.border, color: themeColors.colors.primary },
                ]}
                autoCorrect={false}
                accessible
                accessibilityLabel="Search faults"
              />

              <TouchableOpacity 
                // style={styles.iconButton} 
                onPress={() => setFilterExpanded((s) => !s)}
              >
                <Sparkles size={18} color="#717781c0" />
              </TouchableOpacity>

              
            </View>
          </>
        )}

        <View style={styles.viewSwitcher}>
          {views.map((v) => {
            const Icon = v === "List" ? List : v === "Table" ? Table : CalendarDays;
            return (
              <TouchableOpacity key={v} style={[styles.viewBtn, view === v && styles.viewBtnActive]} onPress={() => setView(v)}>
                <Icon color={themeColors.colors.subtext} size={16} />
                <Text style={[styles.viewBtnText, { color: themeColors.colors.subtext }]}>{v}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

  {/* Tabs */}
        {/* <View style={styles.tabs}>
          {(["list", "table", "schedule"] as TabType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.tab,
                tab === t && { borderBottomColor: colors.primary },
              ]}
              onPress={() => setTab(t)}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === t && { color: colors.primary, fontWeight: "600" },
                ]}
              >
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
         */}
         
        <View style={{ flex: 1 }}>
          {/* {dataForTab.length === 0 ? ( */}
          {filteredJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Inbox size={64} color={themeColors.colors.subtext} />
              <Text style={[styles.emptyText, { color: themeColors.colors.subtext }]}>
                No fault jobs registered in the system
              </Text>
            </View>
          ) : view === "List" ? (
            <FlatList
              // data={dataForTab}
              // data={filteredFaults.filter((f) => f.status === activeTab)}
              data={filteredJobs.filter((f) => f.status === activeTab)}
              keyExtractor={(i) => i.id}
              renderItem={renderItem}
              ListHeaderComponent={ListHeader}
              refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#2563eb" />}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Inbox size={64} color={themeColors.colors.subtext} />
                  <Text style={[styles.emptyText, { color: themeColors.colors.subtext }]}>
                    No fault jobs found in {activeTab.replace("_", " ")}
                  </Text>
                </View>
              }
            />
          ) : view === "Table" ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              contentContainerStyle={styles.tableScrollContent}
            >
              {renderTable()}
            </ScrollView>
          ) : (
            <View style={styles.calendarWrap}>{renderSchedule()}</View>
          )}

          {/* Assign Modal */}
          <AssignModal
            visible={!!assignTarget}
            teams={teams}
            themeColors={themeColors}
            // artisans={artisans}
            // onSelect={(artisanId) => { 
            onClose={() => setAssignTarget(null)}
            onSelect={(teamId) => {
              if (!assignTarget) return;
              assignMut.mutate({ faultId: assignTarget.id, teamId });
              setAssignTarget(null);
              Toast.show({ type: "success", text1: "Assigned", text2: "Assignment updated" });
            }}
          />
        </View>
      </View>

      {/* Search Modal */}
      {/* <Modal visible={showSearch} animationType="slide" transparent onRequestClose={() => setShowSearch(false)}>
        <Pressable style={[styles.modalBackdrop,]}  onPress={() => setShowSearch(false)}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.colors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.colors.maintext }]}>Search Faults</Text>
            <View style={styles.searchRow}>
              <TextInput
                placeholder="Search faults, jobs..."
                placeholderTextColor="#6b7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { borderColor: themeColors.colors.border, color: themeColors.colors.primary }]}
                autoCorrect={false}
                accessible
                accessibilityLabel="Search faults"
              />
              <TouchableOpacity onPress={() => setFilterExpanded((s) => !s)}>
                <Sparkles size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <Pressable
              style={[styles.modalClose, { backgroundColor: themeColors.colors.danger }]}
              onPress={() => setShowSearch(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal> */}

      <Modal visible={filterVisible} animationType="slide" transparent onRequestClose={() => setFilterVisible(false)}>
        <Pressable style={[styles.modalBackdrop]} onPress={() => setFilterVisible(false)}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.colors.card, maxHeight: "80%" }]}>
            <Text style={[styles.modalTitle, { color: themeColors.colors.maintext }]}>Filters</Text>

            <Pressable style={[styles.modalCloseBtn, { backgroundColor: themeColors.colors.subtext }]} onPress={() => setFilterVisible(false)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>X</Text>
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
              <Text style={[styles.filterLabel, { color: themeColors.colors.text }]}>Quick filters</Text>
              <Text style={[styles.filterHint, { color: themeColors.colors.subtext }]}>Tap chips to include/exclude statuses & severities.</Text>

              <View style={styles.filterRow}>
                {(["active", "pending", "in_progress", "resolved"] as FaultStatus[]).map((s) => (
                  <Chip
                    key={s}
                    label={s.replace("_", " ")}
                    active={filters.statuses.includes(s)}
                    onPress={() =>
                      setFilters((f) => ({
                        ...f,
                        statuses: f.statuses.includes(s) ? f.statuses.filter((x) => x !== s) : [...f.statuses, s],
                      }))
                    }
                  />
                ))}
              </View>

              <View style={{ height: 8 }} />

              <View style={styles.filterRow}>
                {(["critical", "major", "moderate", "minor"] as FaultSeverity[]).map((sev) => (
                  <Chip
                    key={sev}
                    label={sev}
                    active={filters.severities.includes(sev)}
                    onPress={() =>
                      setFilters((f) => ({
                        ...f,
                        severities: f.severities.includes(sev) ? f.severities.filter((x) => x !== sev) : [...f.severities, sev],
                      }))
                    }
                  />
                ))}
              </View>

              <View style={{ height: 12 }} />

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {/* Team */}
                <Pressable
                  style={[styles.selectLike, { backgroundColor: themeColors.colors.surface }]}
                  onPress={() =>
                    setFilters((f) => ({ ...f, teamId: f.teamId === "all" && teams?.[0]?.id ? teams[0].id : "all" }))
                  }
                >
                  <Text style={[styles.selectLikeText, { color: themeColors.textPrimary }]}>
                    Team: {filters.teamId === "all" ? "All" : teams?.find((t) => t.id === filters.teamId)?.name ?? filters.teamId}
                  </Text>
                </Pressable>

                {/* SLA */}
                <Pressable
                  style={[styles.selectLike, { backgroundColor: themeColors.colors.surface }]}
                  onPress={() =>
                    setFilters((f) => ({ ...f, sla: f.sla === "all" ? "ok" : f.sla === "ok" ? "at_risk" : f.sla === "at_risk" ? "breached" : "all" }))
                  }
                >
                  <Text style={[styles.selectLikeText, { color: themeColors.textPrimary }]}>SLA: {filters.sla}</Text>
                </Pressable>

                {/* Date */}
                <Pressable
                  style={[styles.selectLike, { backgroundColor: themeColors.colors.surface }]}
                  onPress={() => setFilters((f) => ({ ...f, dateRange: f.dateRange === "24h" ? "7d" : f.dateRange === "7d" ? "30d" : "all" }))}
                >
                  <Text style={[styles.selectLikeText, { color: themeColors.textPrimary }]}>Date: {filters.dateRange}</Text>
                </Pressable>

                {/* Sort */}
                <Pressable
                  style={[styles.selectLike, { backgroundColor: themeColors.colors.surface }]}
                  onPress={() => setFilters((f) => ({ ...f, sort: f.sort === "priority" ? "sla" : f.sort === "sla" ? "createdAt" : "priority" }))}
                >
                  <Text style={[styles.selectLikeText, { color: themeColors.textPrimary }]}>Sort: {filters.sort}</Text>
                </Pressable>
              </View>

            </ScrollView>

            {/* <Pressable
              style={[styles.modalClose, { backgroundColor: themeColors.colors.danger }]}
              onPress={() => setFilterVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable> */}
          </View>
        </Pressable>
      </Modal>

    </>
  );
}


/* ------------------------------- Styles --------------------------------- */
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#f87171" },
  
  tabsRow: { flexGrow: 0, },

  tabsContent: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },

  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },
  tabButtonText: { fontSize: 13, color: "#111827" },
  tabButtonTextActive: { color: "#fff", fontWeight: "700" },

  searchRow: { 
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    flex: 1,
    height: 40, 
    fontSize: 14, 
    color: "#333"
  },

  bulkBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    margin: 12,
    borderRadius: 12,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2533",
  },
  bulkText: { color: "#e5e7eb", marginRight: 8 },
  bulkBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#1f2937", marginRight: 8 },
  bulkBtnText: { color: "#e5e7eb", fontSize: 12 },

  listContent: { paddingHorizontal: 12, paddingBottom: 80 },

  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2533",
    marginBottom: 12,
  },
  cardSelected: { borderColor: "#60a5fa", backgroundColor: "#081028" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  cardTitle: { color: "#e5e7eb", fontWeight: "600" },
  cardSubtitle: { color: "#9ca3af", marginBottom: 4 },
  cardMeta: { color: "#94a3b8", fontSize: 12 },

  actionsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: "#1f2937", marginRight: 8, marginTop: 6 },
  selectBtn: { backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2533" },
  actionBtnText: { color: "#e5e7eb", fontSize: 12 },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalCard: {
    backgroundColor: "#0f1420",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2533",
    maxHeight: "70%",
  },
  modalTitle: { color: "#e5e7eb", fontSize: 16, fontWeight: "600", marginBottom: 10 },
  teamRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1f2533" },
  teamName: { color: "#e5e7eb", fontWeight: "600" },
  teamMeta: { color: "#94a3b8", fontSize: 12 },
  modalClose: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    backgroundColor: "#1f2937",
    borderRadius: 10,
  },
  modalCloseText: { color: "#e5e7eb" },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",  // shift upward
    paddingVertical: 40,
    marginTop: 140,                 // fine-tune how far from the top
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
  },

  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    marginLeft: 8,
    borderRadius: 8,
  },
  filterText: { marginLeft: 6, fontSize: 14, color: "#111827", flex: 1 },

  filterPanel: { padding: 12, backgroundColor: "#071025" },
  filterLabel: { fontSize: 13, fontWeight: "600", color: "#e5e7eb" },
  filterHint: { fontSize: 12, color: "#6b7280", marginTop: 4 },

  filterRow: { flexDirection: "row", marginTop: 8, flexWrap: "wrap" as any },
  filterRowWrap: { flexDirection: "row", marginTop: 8, flexWrap: "wrap" as any },
  selectLike: { padding: 8, borderRadius: 8, backgroundColor: "#0f1420", borderWidth: 1, borderColor: "#1f2533" },
  selectLikeText: { color: "#e5e7eb" },

  viewSwitcher: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom:10,
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewBtnActive: { backgroundColor: "#e1ebf8ff" },
  viewBtnText: { marginLeft: 4, fontSize: 13 },

  tableScrollContent: { flexGrow: 1, padding: 12, alignItems: "stretch" },
  calendarWrap: { padding: 12 },

  container: { flex: 1,  },

  assignmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#e5e7eb",
  },
  assignmentToggle: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4,
  },
  switchLabel: { color: "#9ca3af", fontSize: 12 },
  assignmentLabel: { fontWeight: "300", marginRight: 6 },
  actionsRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  autoAssignBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#1f2937", marginLeft: 8 },
  autoAssignText: { color: "#e5e7eb", fontSize: 12 },
  iconBtn: { padding: 4,  },

  iconButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1f2533",
    backgroundColor: "#0f1420",
    marginLeft: 6,
  },
  modalContainer: { flex: 1, padding: 20 },
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

  closeBtn: { marginTop: 20, padding: 12, borderRadius: 8, alignItems: "center" },
  faultCard: { padding: 12, marginHorizontal: 12, marginVertical: 6, borderRadius: 10, elevation: 2 },
});





