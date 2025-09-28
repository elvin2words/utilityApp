
// ufms/screens/artisan/AdminScreen.tsx

import React, { useState, useEffect, useMemo } from "react";
import { Alert, Dimensions, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Plus, Search, ChevronRight, 
  Users, ShieldAlert, CalendarClock, FileClock,
  RefreshCw, List, Shield, 
  SparklesIcon} from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import PagerView from "react-native-pager-view";

import LoadingScreen from "@/src/components/LoadingScreen";

import { User, ActivityLog } from "@/src/shared/schema";
import { Team } from "@/src/types/user";
import { Escalation } from "@/src/types/faults";
import { formatTimeAgo } from "@/src/lib/utils";

import { useThemeStore } from "@/src/lib/themeStore";
import { getThemeByMode, AppTheme } from "@/src/lib/colors";
import { Shift } from "@/src/types/cards";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SupervisorStackParamList } from "@/src/navigation/SupervisorStackNavigator";

import { useAppStore } from "@/src/stores/appStore"; // add this

import {
  mockUsers,
  mockTeams,
  mockSlaRules,
  mockEscalations,
  mockShifts,
  mockSchedules,
  mockActivityLogs,
} from "@/assets/data/mockAdminData";




const screenWidth = Dimensions.get("window").width;




const api = {
  fetchUsers: async (): Promise<User[]> => [],
  fetchTeams: async (): Promise<Team[]> => [],
  fetchActivityLogs: async (): Promise<ActivityLog[]> => [],
  fetchSLARules: async (): Promise<any[]> => [],
  fetchEscalations: async (): Promise<Escalation[]> => [],
  fetchShifts: async (): Promise<Shift[]> => [],
  fetchSchedules: async (): Promise<any[]> => [],
};

// -------------------- Mock API --------------------
const api2 = {
  fetchUsers: async (): Promise<User[]> => [
    {
      id: "u1",
      name: "Mary Banda",
      phone: "+263 77 123 4567",
      email: "mary@utility.co.zw",
      role: "artisan",
      region: "Harare North",
      active: true,
      lastActive: new Date().toISOString(),
    },
    {
      id: "u2",
      name: "Tendai Chikomo",
      phone: "+263 77 987 6543",
      email: "tendai@utility.co.zw",
      role: "supervisor",
      region: "Harare South",
      active: true,
      lastActive: new Date().toISOString(),
    },
  ],
  fetchTeams: async (): Promise<Team[]> => [
    { id: "t1", name: "Shift A", region: "Harare North", members: ["u1"] },
  ],
  fetchActivityLogs: async (): Promise<ActivityLog[]> => [
    {
      id: "log1",
      user_id: "u1",
      description: "User joined team Shift A",
      timestamp: new Date().toISOString(),
    },
  ],
  fetchSLARules: async (): Promise<any[]> => [
    {
      id: "sla1",
      name: "Transformer Fault SLA",
      description: "Resolve within 6h; auto-escalate at 4.5h",
    },
  ],
  fetchEscalations: async (): Promise<Escalation[]> => [
    {
      id: "e1",
      jobId: "J-2345",
      level: 2,
      reason: "SLA breach predicted",
      createdAt: new Date().toISOString(),
      status: "open",
    },
  ],
  fetchShifts: async (): Promise<any[]> => [
    {
      id: "shift1",
      name: "Morning Shift",
      start: "06:00",
      end: "14:00",
      supervisor: "Tendai",
    },
  ],
  fetchSchedules: async (): Promise<any[]> => [
    {
      id: "sched1",
      title: "Schedule A",
      date: "2025-09-15",
      assignedUsers: 2,
    },
  ],
};


// -------------------- Main --------------------
export default function AdminScreen() {
  // const navigation = useNavigation<NativeStackNavigationProp<SupervisorStackParamList>();
  const navigation = useNavigation();
  const { showMockData } = useAppStore(); // toggle flag
  
  const tabs = [
    { key: "management", label: "Management", icon: Users },
    { key: "sla", label: "SLA & Escalations", icon: ShieldAlert },
    { key: "shifts", label: "Shifts & Schedules", icon: CalendarClock },
    { key: "audit", label: "Audit Logs", icon: FileClock },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [logs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [slaRules, setSlaRules] = useState<any[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const mode = useThemeStore((s) => s.mode);
  const themeColors: AppTheme = getThemeByMode(mode);
  
  const [pageIndex, setPageIndex] = useState(0);

  const { width } = useWindowDimensions();
  const isWide = width > 600;

  useEffect(() => {
    loadData();
  }, [showMockData]); // reload when flag changes


  const loadData = async () => {
    try {
      setLoading(true);
      const apiSource = showMockData ? api2 : api; // pick mock or real

      const [u, t, l, sla, e, sh, sc] = await Promise.all([
        apiSource.fetchUsers(),
        apiSource.fetchTeams(),
        apiSource.fetchActivityLogs(),
        apiSource.fetchSLARules(),
        apiSource.fetchEscalations(),
        apiSource.fetchShifts(),
        apiSource.fetchSchedules(),        
      ]);
      setUsers(u);
      setTeams(t);
      setActivityLogs(l);
      setSlaRules(sla);
      setEscalations(e);
      setShifts(sh);
      setSchedules(sc);
    } catch {
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // const loadData = async () => {
  //   try {
  //     setLoading(true);
  //     const apiSource = showMockData
  //       ? {
  //           fetchUsers: async () => mockUsers,
  //           fetchTeams: async () => mockTeams,
  //           fetchSLARules: async () => mockSlaRules,
  //           fetchEscalations: async () => mockEscalations,
  //           fetchShifts: async () => mockShifts,
  //           fetchSchedules: async () => mockSchedules,
  //           fetchActivityLogs: async () => mockActivityLogs,
  //         }
  //       : api;
  //   } catch {
  //     Alert.alert("Error", "Failed to load data");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // sync tab state ↔ pager
  const onPageSelected = (e: any) => {
    const newIndex = e.nativeEvent.position;
    setActiveTab(tabs[newIndex].key);
    setPageIndex(newIndex);
  };

  // -------------------- Reusable Components --------------------
  const Section = ({ title, onManage, children }: any) => (
    <View 
      style={[
        styles.sectionCard,
        { backgroundColor: themeColors.colors.card, 
          borderColor: themeColors.colors.border },
      ]}    
    >
      <View style={styles.sectionHeader}>
        <Text style={[ styles.sectionTitle, { color: themeColors.colors.maintext } ]}>
          {title}
        </Text>
        {onManage && (
          <TouchableOpacity style={styles.manageBtn} onPress={onManage}>
            <Text style={styles.manageText}>Manage</Text>
            <ChevronRight size={14} color="#2563eb" />
          </TouchableOpacity>
        )}
      </View>
      {/* Add a View More link that appears after scrolling a bit, or should wejust add it next to manage in header */}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );

  // redesign this card for the different datas we have inclduing styling for color which adapts with theme
  // need seperate UserCard, TeamCard, ActivityCard, SLARuleCard, EscallationsCard, ShiftsCard, SchedulesCard, AuditLogCard
  const Card = ({ title, subtitle, extra }: { title: string; subtitle?: string; extra?: string }) => (
    <TouchableOpacity 
      // style={[ styles.card,
      //   { backgroundColor: themeColors.colors.card, 
      //     borderColor: themeColors.colors.border }
      // ]}
      style={styles.dataCard}
      // style={[styles.activityRow, { borderBottomColor: themeColors.colors.border }]}
      onPress={() => Alert.alert("Detailed Data Modal")}
    >
      <Text style={[ styles.cardTitle, { color: themeColors.colors.maintext } ]}>{title}</Text>
      {subtitle && <Text style={[styles.cardSubtitle,  { color: themeColors.colors.subtext }]}>{subtitle}</Text>}
      {extra && <Text style={[styles.cardExtra,  { color: themeColors.colors.subtext }]}>{extra}</Text>}
    </TouchableOpacity>
  );

  const UserCard = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text>{item.region} • {item.status}</Text>
      <Text>{item.phone}</Text>
      <Text style={{ color: "#666" }}>Last active {formatTimeAgo(item.lastActive)}</Text>
    </View>
  );


  const TeamCard = ({ item }: { item: Team }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text>Region: {item.region}</Text>
      <Text>Members: {item.members.length}</Text>
    </View>
  );

  const LogCard = ({ item }: { item: ActivityLog }) => (
    <View style={styles.logRow}>
      <Text style={styles.logDesc}>{item.description}</Text>
      <Text style={styles.logTime}>{formatTimeAgo(item.timestamp)}</Text>
    </View>
  );    

  const renderEmpty = (icon: any, text: string) => (
    <View
      style={[ styles.emptyBox,
        {
          backgroundColor: themeColors.colors.card,
          borderColor: themeColors.colors.border,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={40}
        color={themeColors.colors.subtext}
        style={{ marginBottom: 10 }}
      />
      <Text style={[styles.emptyText, { color: themeColors.colors.subtext }]}>
        {text}
      </Text>
    </View>
  );  
    
  // -------- Filters
  const filteredUsers = useMemo(
    () => users.filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [users, searchQuery]
  );
  const filteredTeams = useMemo(
    () => teams.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [teams, searchQuery]
  );
  const filteredLogs = useMemo(
    () =>
      [...logs, ...auditLogs].filter((l) =>
        l.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [logs, auditLogs, searchQuery]
  );  

  // add the FAB 
  
  if (loading) return <LoadingScreen message="Loading Admin Panel..." />;

  // -------------------- Tab Contents --------------------
  const renderTabContent = () => {
    switch (activeTab) {
      // {activeTab === "management" && ( <> ...
      case "management":
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Maybe make the Sections scrollable, embedded inside */}
            <Section title="Artisans" onManage={() => navigation.navigate("Artisans")}>
              {users.length === 0
                ? renderEmpty("people", "No artisans found")
                : users.slice(0, 3).map((u) => (
                    <Card
                      key={u.id}
                      title={u.name}
                      subtitle={`${u.role} • ${u.region}`}
                      extra={`Last active ${formatTimeAgo(u.lastActive)}`}
                    />
                  )
                )
              }
            </Section>

            <Section title="Teams" onManage={() => navigation.navigate("Teams")}>
              {teams.length === 0
                ? renderEmpty("people-circle-outline", "No teams found")
                : teams.slice(0, 2).map((t) => (
                    <Card
                      key={t.id}
                      title={t.name}
                      subtitle={`Region: ${t.region}`}
                      extra={`${t.members.length} members`}
                    />
                  )
                )
              }
            </Section>

            <Section title="Recent Activity" onManage={() => navigation.navigate("Activities")}>
              {logs.length === 0
                ? renderEmpty("time-outline", "No activity logs yet")
                : logs.slice(0, 3).map((l) => (
                    <Card key={l.id} title={l.description} extra={formatTimeAgo(l.timestamp)} />
                  )
                )
              }
            </Section>
          </ScrollView>
        );

      case "sla":
      // {activeTab === "sla" && ( <> ...
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Section title="SLA Rules" onManage={() => navigation.navigate("SLARules")}>
              {slaRules.length === 0
                ? renderEmpty("document-text-outline", "No SLA rules")
                : slaRules.slice(0, 3).map((r) => (
                    <Card key={r.id} title={r.name} subtitle={r.description} />
                  )
                )
              }
            </Section>

            <Section title="Escalations" onManage={() => navigation.navigate("Escalations")}>
              {escalations.length === 0
                ? renderEmpty("alert-circle-outline", "No escalations yet")
                : escalations.slice(0, 3).map((e) => (
                  <Card
                    key={e.id}
                    title={`Job ${e.jobId} • Level ${e.level}`}
                    subtitle={e.reason}
                    extra={formatTimeAgo(e.createdAt)}
                  />
                ))
              }
            </Section>
            <View style={styles.twoCol}>
              <Section title="SLA Rules" onManage={() => Alert.alert("To be implemented")}>
                {slaRules.length === 0
                  ? renderEmpty("document-text-outline", "No SLA rules")
                  : slaRules.slice(0, 3).map((r) => (
                      <Card key={r.id} title={r.name} subtitle={r.description} />
                    ))}
              </Section>

              <Section title="Escalations" onManage={() => Alert.alert("To be implemented")}>
                {escalations.length === 0
                  ? renderEmpty("alert-circle-outline", "No escalations yet")
                  : escalations.slice(0, 3).map((e) => (
                      <Card
                        key={e.id}
                        title={`Job ${e.jobId} • Level ${e.level}`}
                        subtitle={e.reason}
                        extra={formatTimeAgo(e.createdAt)}
                      />
                    ))}
              </Section>
            </View>
          </ScrollView>
        );

      case "shifts":
      // {activeTab === "shifts" && ( <> ...
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Section title="Schedules" onManage={() => navigation.navigate("Schedules")}>
              {schedules.length === 0
                ? renderEmpty("calendar-outline", "No schedules yet")
                : schedules.map((s) => (
                  <Card
                    key={s.id}
                    title={s.title}
                    subtitle={`Date: ${s.date}`}
                    extra={`${s.assignedUsers} assigned users`}
                  />
                  ))
                }
            </Section>

            <Section title="Shifts" onManage={() => navigation.navigate("Shifts")}>
              {shifts.length === 0
                ? renderEmpty("time-outline", "No shifts assigned")
                : shifts.map((sh) => (
                  <Card
                    key={sh.id}
                    title={sh.name}
                    subtitle={`${sh.start} - ${sh.end}`}
                    extra={`Supervisor: ${sh.supervisor}`}
                  />
                ))
              }
            </Section>

            <View style={styles.twoCol}>
              <Section title="Schedules" onManage={() => Alert.alert("All Schedules")}>
                {renderEmpty("calendar-outline", "No schedules yet")}
              </Section>

              <Section title="Shifts" onManage={() => Alert.alert("All Shifts")}>
                {renderEmpty("time-outline", "No shifts assigned")}
              </Section>
            </View>
          </ScrollView>
        );

      // adjust render empty to fill the space of its mother container, and neatly justify and align its contents too
      case "audit":
      // {activeTab === "audit" && ( <> ...
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Section title="Audit Logs" onManage={() => navigation.navigate("AuditLogs")}>
              {logs.length === 0
                ? renderEmpty("document-outline", "No audit logs yet")
                : logs.slice(0, 5).map((l) => (
                  <Card key={l.id} title={l.description} extra={formatTimeAgo(l.timestamp)} />
                ))
              }
            </Section>
          </ScrollView>
        );
    }
  };
  
  const renderManagement = () => {
      {activeTab === "management" && ( 
        <>
          return (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Maybe make the Sections scrollable, embedded inside */}
              <Section title="Artisans" onManage={() => Alert.alert("More Artisans")}>
                {users.length === 0
                  ? renderEmpty("people", "No artisans found")
                  : users.slice(0, 3).map((u) => (
                      <Card
                        key={u.id}
                        title={u.name}
                        subtitle={`${u.role} • ${u.region}`}
                        extra={`Last active ${formatTimeAgo(u.lastActive)}`}
                      />
                    )
                  )
                }
              </Section>

              <Section title="Teams" onManage={() => Alert.alert("More Teams")}>
                {teams.length === 0
                  ? renderEmpty("people-circle-outline", "No teams found")
                  : teams.slice(0, 2).map((t) => (
                      <Card
                        key={t.id}
                        title={t.name}
                        subtitle={`Region: ${t.region}`}
                        extra={`${t.members.length} members`}
                      />
                    )
                  )
                }
              </Section>

              <Section title="Recent Activity" onManage={() => Alert.alert("All Logs")}>
                {logs.length === 0
                  ? renderEmpty("time-outline", "No activity logs yet")
                  : logs.slice(0, 3).map((l) => (
                      <Card key={l.id} title={l.description} extra={formatTimeAgo(l.timestamp)} />
                    )
                  )
                }
              </Section>
            </ScrollView>
          );
        </>
      )
    }
  };
  
  const renderSLA = () => {
    switch (activeTab) {
      case "sla":
      // {activeTab === "sla" && ( <> ...
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Section title="SLA Rules" onManage={() => Alert.alert("All SLA Rules")}>
              {slaRules.length === 0
                ? renderEmpty("document-text-outline", "No SLA rules")
                : slaRules.slice(0, 3).map((r) => (
                    <Card key={r.id} title={r.name} subtitle={r.description} />
                  )
                )
              }
            </Section>

            <Section title="Escalations" onManage={() => Alert.alert("All Escalations")}>
              {escalations.length === 0
                ? renderEmpty("alert-circle-outline", "No escalations yet")
                : escalations.slice(0, 3).map((e) => (
                  <Card
                    key={e.id}
                    title={`Job ${e.jobId} • Level ${e.level}`}
                    subtitle={e.reason}
                    extra={formatTimeAgo(e.createdAt)}
                  />
                ))
              }
            </Section>
            <View style={styles.twoCol}>
              <Section title="SLA Rules" onManage={() => Alert.alert("All SLA Rules")}>
                {slaRules.length === 0
                  ? renderEmpty("document-text-outline", "No SLA rules")
                  : slaRules.slice(0, 3).map((r) => (
                      <Card key={r.id} title={r.name} subtitle={r.description} />
                    ))}
              </Section>

              <Section title="Escalations" onManage={() => Alert.alert("All Escalations")}>
                {escalations.length === 0
                  ? renderEmpty("alert-circle-outline", "No escalations yet")
                  : escalations.slice(0, 3).map((e) => (
                      <Card
                        key={e.id}
                        title={`Job ${e.jobId} • Level ${e.level}`}
                        subtitle={e.reason}
                        extra={formatTimeAgo(e.createdAt)}
                      />
                    ))}
              </Section>
            </View>
          </ScrollView>
        );
    }
  };
  
  const renderShifts = () => {
    switch (activeTab) {
      case "shifts":
      // {activeTab === "shifts" && ( <> ...
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Section title="Schedules" onManage={() => Alert.alert("All Schedules")}>
              {schedules.length === 0
                ? renderEmpty("calendar-outline", "No schedules yet")
                : schedules.map((s) => (
                  <Card
                    key={s.id}
                    title={s.title}
                    subtitle={`Date: ${s.date}`}
                    extra={`${s.assignedUsers} assigned users`}
                  />
                  ))
                }
            </Section>

            <Section title="Shifts" onManage={() => Alert.alert("All Shifts")}>
              {shifts.length === 0
                ? renderEmpty("time-outline", "No shifts assigned")
                : shifts.map((sh) => (
                  <Card
                    key={sh.id}
                    title={sh.name}
                    subtitle={`${sh.start} - ${sh.end}`}
                    extra={`Supervisor: ${sh.supervisor}`}
                  />
                ))
              }
            </Section>

            <View style={styles.twoCol}>
              <Section title="Schedules" onManage={() => Alert.alert("All Schedules")}>
                {renderEmpty("calendar-outline", "No schedules yet")}
              </Section>

              <Section title="Shifts" onManage={() => Alert.alert("All Shifts")}>
                {renderEmpty("time-outline", "No shifts assigned")}
              </Section>
            </View>
          </ScrollView>
        );
    }
  };
  
  const renderAudit = () => {
    switch (activeTab) {
      // adjust render empty to fill the space of its mother container, and neatly justify and align its contents too
      case "audit":
      // {activeTab === "audit" && ( <> ...
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Section title="Audit Logs" onManage={() => Alert.alert("All Audit Logs")}>
              {logs.length === 0
                ? renderEmpty("document-outline", "No audit logs yet")
                : logs.slice(0, 5).map((l) => (
                  <Card key={l.id} title={l.description} extra={formatTimeAgo(l.timestamp)} />
                ))
              }
            </Section>
          </ScrollView>
        );
    }
  };  

  // -------------------- Render --------------------
  return (
    // Add a swipe to refresh for the page in view
    <SafeAreaView style={[ styles.container, { backgroundColor: themeColors.colors.background }]}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {tabs.map((t, idx) => {
            const isActive = activeTab === t.key;
            const Icon = t.icon; // get component
            return(
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.tab,
                  // {
                  //   backgroundColor: isActive
                  //     ? themeColors.colors.primary
                  //     : themeColors.colors.card,
                  //   borderColor: themeColors.colors.border,
                  // },
                  activeTab === t.key && styles.tabButtonActive,
                ]}
                onPress={() => {
                  setActiveTab(t.key);
                  setPageIndex(idx);
                }}
              >
                <Icon size={16} color={isActive ? themeColors.colors.primary : themeColors.colors.subtext} />
                <Text 
                  style={[
                    styles.tabText,
                    { color: isActive ? themeColors.colors.primary : themeColors.colors.subtext },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Search + Actions */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[ styles.searchBar, {
            backgroundColor: themeColors.colors.card,
            borderColor: themeColors.colors.border,
            },]}
          >
            <SparklesIcon size={18} color={themeColors.colors.subtext} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Ask Eddy about the sys ${activeTab} ...`}
              placeholderTextColor={themeColors.colors.subtext}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <RefreshCw size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        {renderTabContent()}
        {/* <PagerView
          initialPage={0}
          scrollEnabled
          onPageSelected={onPageSelected}
          key={tabs.length} // ensures re-render if tabs change
        >
          <View key="management" style={styles.page}>
            {renderManagement()}
          </View>
        
          <View key="sla" style={styles.page}>
            {renderSLA()}
          </View>
        
          <View key="shifts" style={styles.page}>
            {renderShifts()}
          </View>
        
          <View key="audit" style={styles.page}>
            {renderAudit()}
          </View>
        </PagerView> */}
      </View>
    </SafeAreaView>
  );
}

// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: { flex: 1,},

  // tabs
  tabScroll: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#eeeeee",
    height: 50, // bigger top bar height
    alignItems: "center", // vertically center the tabs
    paddingHorizontal: 8,
  },

  page: {
    flex: 1,
  },
  
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    paddingVertical: 10, // vertical padding for bigger hit area
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderColor: "#007AFF",
  },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginHorizontal: 12,
    // marginBottom: 12,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: { flex: 1, marginLeft: 8, height: 40, fontSize: 14, color: "#333" },

  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "600" },

  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 85,
  },

  // Sections
  sectionCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 8,
    // marginTop: 4,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 8,
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", },
  sectionBody: { paddingHorizontal: 8, flex:1},
  
  manageBtn: { flexDirection: "row", alignItems: "center" },
  manageText: { color: "#2563eb", fontSize: 13, marginRight: 2 },

  // Two-column layout for SLA, Shifts, etc
  twoCol: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },

  emptyBox: {
    flex:1,
    minHeight: 150,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },

  contentWrapper: {
    flex: 1, // fills all remaining space
  },


  // Cards
  card: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  cardSubtitle: { fontSize: 13, color: "#374151", marginTop: 2 },
  cardExtra: { fontSize: 12, color: "#6b7280", marginTop: 4 },

  activityRow: { paddingVertical: 8, borderBottomWidth: 0.5, },

  dataCard: { 
      // flexDirection: 'row', 
      justifyContent: 'space-between', 
      padding: 10, 
      borderRadius: 8, 
      borderLeftWidth: 4, 
      borderLeftColor: '#2563eb', 
      backgroundColor: '#2f6e9217', 
      marginBottom: 8 
    },
});

