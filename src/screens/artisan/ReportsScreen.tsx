
// screens/artisan/ReportsScreen.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutAnimation, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View, useWindowDimensions } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { Analytics } from "@/src/shared/schema";
import { API_BASE_URL, CHART_PERIOD_OPTIONS } from "@/src/lib/constants";
import LoadingScreen from "@/src/components/LoadingScreen";
import { Button } from "@/src/components/ui/Button";
import { BarChart } from "@/src/components/ui/charts/BarChart";
import { Progress } from "@/src/components/ui/Progress";
import { useAppStore } from "@/src/stores/appStore";






// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FilterKey = "performance" | "jobHistory" | "faultsAnalysis";

const dummyAnalytics = {
  faultTrends: [
    { month: "Jan", faults: 12 },
    { month: "Feb", faults: 8 },
    { month: "Mar", faults: 15 },
    { month: "Apr", faults: 20 },
    { month: "May", faults: 10 },
    { month: "Jun", faults: 18 },
    { month: "Jul", faults: 25 },
  ],
  jobCompletion: 0.72,
  completionRate: 86,
  averageRepairTime: 3.4,
  topFaultCategories: [
    { name: "Transformers", count: 45 },
    { name: "Power Lines", count: 32 },
    { name: "Substations", count: 28 },
    { name: "Switchgear", count: 20 },
  ],
  jobHistory: [
    { id: 1, title: "Transformer Repair", location: "Glen View Substation", date: "2025-08-15", status: "Completed" },
    { id: 2, title: "Line Inspection", location: "Kuwadzana", date: "2025-08-18", status: "Completed" },
    { id: 3, title: "Breaker Replacement", location: "Borrowdale", date: "2025-08-20", status: "Delayed" },
    { id: 4, title: "Switchgear Upgrade", location: "Mufakose", date: "2025-08-25", status: "In Progress" },
  ],
topArtisans: [
    { name: "Eng. Chirwa", resolved: 20 },
    { name: "Tech. Moyo", resolved: 18 },
    { name: "Eng. Banda", resolved: 15 },
    { name: "Tech. Dube", resolved: 13 },
  ],
  topZones: [
    { zone: "Harare South", faults: 22 },
    { zone: "Borrowdale", faults: 18 },
    { zone: "Mabvuku", faults: 14 },
    { zone: "Highfield", faults: 12 },
  ],
  users: [
    { id: "u1", name: "Alice Smith", role: "Supervisor", active: true },
    { id: "u2", name: "Brian Moyo", role: "Technician", active: true },
    { id: "u3", name: "Clara Banda", role: "Engineer", active: false },
  ],
  teams: [
    { id: "t1", name: "North Ops", members: 12, performance: 88 },
    { id: "t2", name: "Central Ops", members: 9, performance: 92 },
    { id: "t3", name: "South Ops", members: 15, performance: 81 },
  ],
  slas: [
    { id: "sla1", name: "Response < 1hr", compliance: 82 },
    { id: "sla2", name: "Resolution < 8hrs", compliance: 74 },
    { id: "sla3", name: "Communication < 30min", compliance: 91 },
  ],
  escalations: [
    { id: "esc1", case: "Transformer Explosion", severity: "Critical", escalatedTo: "Supervisor" },
    { id: "esc2", case: "Line Down", severity: "High", escalatedTo: "Manager" },
  ],
  shifts: [
    { id: "sh1", team: "North Ops", start: "08:00", end: "16:00" },
    { id: "sh2", team: "Central Ops", start: "16:00", end: "00:00" },
    { id: "sh3", team: "South Ops", start: "00:00", end: "08:00" },
  ],  
};

export default function ReportsTab() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const { showMockData, toggleMockData } = useAppStore();

  const [activeFilter, setActiveFilter] = useState<FilterKey>("performance");
  const [timePeriod, setTimePeriod] = useState<string>(
    CHART_PERIOD_OPTIONS?.[0]?.value ?? "daily"
  );

  const fetchAnalytics = useCallback(async (): Promise<Analytics[]> => {
    const res = await fetch(`${API_BASE_URL}/analytics`);
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return (await res.json()) as Analytics[];
  }, []);

  const {
    data: analytics,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery<Analytics[]>({
    queryKey: ["analytics", { period: timePeriod }],
    queryFn: fetchAnalytics,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [activeFilter, timePeriod]);

  // const latestAnalytics = analytics?.length ? analytics[0] : dummyAnalytics;

  const latestAnalytics = showMockData
    ? dummyAnalytics
    : analytics?.length
      ? analytics[0]
      : null;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const resolutionTimeData = useMemo(
    () => [
      { day: "Mon", time: 75 },
      { day: "Tue", time: 95 },
      { day: "Wed", time: 60 },
      { day: "Thu", time: 120 },
      { day: "Fri", time: 135 },
      { day: "Sat", time: 80 },
      { day: "Sun", time: 100 },
    ],
    []
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <LoadingScreen message="Loading Reports Metrics ..." />
      </SafeAreaView>
    );
  }

  if (error && !latestAnalytics) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.centerBox]}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} />}
        >
          <Ionicons name="warning-outline" size={64} color={colors.notification} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Couldn't load reports
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            {(error as Error).message}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Pull down to refresh
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} />}
      >
        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
          <FilterButton active={activeFilter === "performance"} label="Performance" onPress={() => setActiveFilter("performance")} />
          <FilterButton active={activeFilter === "jobHistory"} label="Job History" onPress={() => setActiveFilter("jobHistory")} />
          <FilterButton active={activeFilter === "faultsAnalysis"} label="Faults Analysis" onPress={() => setActiveFilter("faultsAnalysis")} />
        </ScrollView>

        {activeFilter === "performance" && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance Metrics</Text>

            <View style={styles.periodSelector}>
              {CHART_PERIOD_OPTIONS.map((option) => (
                <PeriodButton
                  key={option.value}
                  active={timePeriod === option.value}
                  label={option.label}
                  onPress={() => setTimePeriod(option.value)}
                />
              ))}
            </View>

            {/* Efficiency cards */}
            <View style={styles.grid2}>
              <EfficiencyCard title="SAIDI" value={latestAnalytics?.saidi ?? "-"} unit="min" trend="down" trendPercent={12} />
              <EfficiencyCard title="SAIFI" value={latestAnalytics?.saifi ?? "-"} trend="down" trendPercent={5} />
              <EfficiencyCard title="CAIDI" value={latestAnalytics?.caidi ?? "-"} unit="min" trend="up" trendPercent={3} />
              <EfficiencyCard title="Overtime" value={latestAnalytics?.overtime ?? "—"} unit="hrs" trend="none" note="This week" />
            </View>

            <View style={styles.chartBox}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Resolution Time Trend</Text>
              <BarChart data={resolutionTimeData} xKey="day" yKey="time" style={{ height: 200 }} />
            </View>

            <View style={styles.chartBox}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Completion Rate</Text>
              <View style={styles.progressRow}>
                <View style={{ flex: 1 }}>
                  <Progress value={latestAnalytics?.completionRate ?? 85} height={16} />
                </View>
                <Text style={[styles.progressPercent, { color: colors.primary }]}>
                  {`${latestAnalytics?.completionRate ?? 85}%`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeFilter === "jobHistory" && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Job History</Text>
            <JobHistoryItem title="Transformer Repair" location="Glen View Substation" status="Completed: Yesterday" resolution="1h 45m" resolved />
            <JobHistoryItem title="Power Line Repair" location="Kuwadzana Extension" status="Completed: 2 days ago" resolution="2h 10m" resolved />
            <JobHistoryItem title="Circuit Breaker Replacement" location="Borrowdale Substation" status="Delayed: 3 days ago" resolution="Parts unavailable" moderate />
          </View>
        )}

        {activeFilter === "faultsAnalysis" && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Faults Analysis</Text>
            <FaultResolutionCard title="Avg. Repair Time" value="3h 20m" />
            <FaultResolutionCard title="Longest Outage" value="12h" />
          </View>
        )}

        <Button style={{ marginTop: 16 }}>Export Report</Button>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Helper Components themed ---------- */

function FilterButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterButton,
        active ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
      ]}
    >
      <Text style={{ color: active ? colors.background : colors.text, fontWeight: "700" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function PeriodButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.periodButton,
        active ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.border },
      ]}
    >
      <Text style={{ color: active ? colors.background : colors.text, fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function EfficiencyCard({ title, value, unit, trend, trendPercent, note }: any) {
  const { colors } = useTheme();
  return (
    <View style={[styles.efficiencyCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.efficiencyTitle, { color: colors.primary }]}>{title}</Text>
      <Text style={[styles.efficiencyValue, { color: colors.text }]}>
        {value} {unit}
      </Text>
      {trend !== "none" && (
        <Text style={{ color: trend === "up" ? colors.notification : colors.primary }}>
          {trend === "up" ? "▲" : "▼"} {trendPercent}%
        </Text>
      )}
      {note && <Text style={{ color: colors.primary }}>{note}</Text>}
    </View>
  );
}

function JobHistoryItem({ title, location, status, resolution, resolved, moderate }: any) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.jobHistoryItem,
        { backgroundColor: colors.card, borderColor: colors.border },
        moderate && { backgroundColor: colors.primary },
      ]}
    >
      <Text style={[styles.jobHistoryTitle, { color: colors.text }]}>{title}</Text>
      <Text style={{ color: colors.text }}>{location}</Text>
      <Text style={{ color: resolved ? colors.primary : colors.notification }}>{status}</Text>
      <Text style={{ color: colors.text }}>{resolution}</Text>
    </View>
  );
}

function FaultResolutionCard({ title, value }: { title: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.faultCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.faultCardTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.faultCardValue, { color: colors.primary }]}>{value}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {paddingHorizontal: 16 },
  contentContainer: { paddingBottom: 100, paddingTop: 12 },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  filterPills: { flexDirection: "row", gap: 8, paddingVertical: 8 },
  filterButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 9999 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  periodSelector: { flexDirection: "row", gap: 8, marginBottom: 12, justifyContent: "center" },
  periodButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 9999, borderWidth: 1 },
  grid2: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  efficiencyCard: { padding: 12, borderRadius: 10, marginBottom: 12, minWidth: "48%" },
  efficiencyTitle: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  efficiencyValue: { fontSize: 22, fontWeight: "800" },
  chartBox: { marginBottom: 20 },
  chartTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressPercent: { fontSize: 16, fontWeight: "700" },
  jobHistoryItem: { padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1 },
  jobHistoryTitle: { fontWeight: "700", fontSize: 16, marginBottom: 4 },
  faultCard: { padding: 12, borderRadius: 10, width: "48%", marginBottom: 12 },
  faultCardTitle: { fontWeight: "700", fontSize: 14, marginBottom: 6 },
  faultCardValue: { fontSize: 20, fontWeight: "800" },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 12 },
  emptySubtitle: { fontSize: 14, textAlign: "center", marginTop: 6 },
});
