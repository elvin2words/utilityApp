
// screens/artisan/AnalyticsScreen.tsx
import { Alert, LayoutAnimation, Platform, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View, useWindowDimensions } from "react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar } from "react-native-paper";
import { LineChart, PieChart } from "react-native-gifted-charts";

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

// dummy fallback
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
  completionRate: 85,
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



export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { showMockData } = useAppStore();

  const [activeFilter, setActiveFilter] = useState<FilterKey>("performance");
  const [timePeriod, setTimePeriod] = useState(CHART_PERIOD_OPTIONS?.[0]?.value ?? "daily");

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
    enabled: showMockData, 

  });

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [activeFilter, timePeriod ]);

  // const latestAnalytics = analytics?.length ? analytics[0] : dummyAnalytics;

  const latestAnalytics = showMockData
    ? dummyAnalytics
    : null;

  const onRefresh = useCallback(() => {
    if (!showMockData) {
      refetch();
    }
  }, [refetch, showMockData]);

  if (!showMockData) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.container} contentContainerStyle={[styles.centerBox]}>
          <Ionicons name="analytics-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Analytics Disabled</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Reports are only available in mock/demo mode.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Pie chart for fault distribution
  // const pieData = latestAnalytics.topFaultCategories.map((cat, i) => ({
  //   value: cat.count,
  //   label: cat.name,
  //   color: ["#f87171", "#facc15", "#3b82f6", "#10b981"][i % 4],
  // }));

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <LoadingScreen />
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
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Couldn't load reports</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>{(error as Error).message}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>Pull down to refresh</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Dummy analytics data
  const latestAnalytics2 = {
    topArtisans: [
      { name: "John Doe", resolved: 25 },
      { name: "Alice Smith", resolved: 21 },
      { name: "Brian Moyo", resolved: 18 },
    ],
  };

    // Pie chart for fault distribution
  const pieData = latestAnalytics.topFaultCategories.map((cat, i) => ({
    value: cat.count,
    label: cat.name,
    color: ["#f87171", "#facc15", "#3b82f6", "#10b981"][i % 4],
  }));


  const lineData = [
    { value: 4.1, label: "Mon" },
    { value: 3.5, label: "Tue" },
    { value: 3.9, label: "Wed" },
    { value: 3.2, label: "Thu" },
    { value: 2.8, label: "Fri" },
  ];

  if (!showMockData) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.centerBox]}
        >
          <Ionicons name="analytics-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Analytics Disabled</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Reports are only available in mock/demo mode.
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

            {/* Time Period Selector */}
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

{/* Key Metrics */}
      <View style={styles.card}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Key Metrics</Text>
        <View style={styles.listItem}>
          <Text style={{ color: colors.text }}>System Uptime</Text>
          <Text style={{ color: colors.primary }}>99.2%</Text>
        </View>
        <View style={styles.listItem}>
          <Text style={{ color: colors.text }}>Mean Repair Time</Text>
          <Text style={{ color: colors.primary }}>3.4 hrs</Text>
        </View>
        <View style={styles.listItem}>
          <Text style={{ color: colors.text }}>Fault Recurrence</Text>
          <Text style={{ color: colors.notification }}>7%</Text>
        </View>
      </View>

      {/* Trend Analysis */}
      <View style={styles.card}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Avg Repair Time Trend</Text>
        <LineChart
          data={lineData}
          thickness={3}
          hideRules
          color={colors.primary}
          yAxisTextStyle={{ color: colors.text }}
          xAxisLabelTextStyle={{ color: colors.text }}
          noOfSections={4}
          height={200}
        />
      </View>

      {/* Export Options */}
      <View style={styles.card}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Export Options</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity>
            <Text style={{ color: colors.primary }}>CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={{ color: colors.primary }}>PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={{ color: colors.primary }}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={{ color: colors.primary }}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Predictive Insights */}
      <View style={styles.card}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Predicted Fault Hotspots</Text>
        <Text style={{ color: colors.text, marginBottom: 6 }}>AI model suggests increased faults next week in:</Text>
        <Text style={{ color: colors.notification }}>• Harare South — High Risk</Text>
        <Text style={{ color: colors.text }}>• Borrowdale — Medium Risk</Text>
        <Text style={{ color: colors.text }}>• Mabvuku — Low Risk</Text>
      </View>

      {/* Leaderboard */}
      <View style={styles.card}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Artisan Leaderboard</Text>
        {latestAnalytics.topArtisans.map((a, i) => (
          <View key={i} style={styles.listItem}>
            <Ionicons
              name="trophy"
              size={18}
              color={i === 0 ? "#facc15" : colors.primary}
            />
            <Text style={{ flex: 1, marginLeft: 8, color: colors.text }}>{a.name}</Text>
            <Text style={{ color: colors.primary }}>{a.resolved} jobs</Text>
          </View>
        ))}
      </View>

      {/* SLA Compliance */}
      <View style={styles.card}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>SLA Compliance</Text>
        <Text style={{ color: colors.text }}>Response within SLA</Text>
        <ProgressBar progress={0.82} color={colors.primary} style={styles.progress} />
        <Text style={{ color: colors.text }}>Resolution within SLA</Text>
        <ProgressBar progress={0.74} color={colors.notification} style={styles.progress} />
      </View>            

            {/* Completion Rate */}
            <View style={styles.card}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Completion Rate</Text>
              <View style={styles.progressRow}>
                <View style={{ flex: 1 }}>
                  <Progress value={latestAnalytics.completionRate ?? 85} height={16} />
                </View>
                <Text style={[styles.progressPercent, { color: colors.primary }]}>
                  {`${latestAnalytics.completionRate ?? 85}%`}
                </Text>
              </View>
            </View>

            {/* Fault Trends */}
            <View style={styles.card}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Fault Trends</Text>
              <BarChart data={latestAnalytics.faultTrends} xKey="month" yKey="faults" style={{ height: 200 }} />
            </View>

            {/* Fault Distribution */}
            <View style={styles.card}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Fault Type Distribution</Text>
              <PieChart data={pieData} donut showText innerRadius={50} />
            </View>

            {/* Top Artisans */}
            <View style={styles.card}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Top Performing Artisans</Text>
              {latestAnalytics.topArtisans?.map((a, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={{ color: colors.text }}>{i + 1}. {a.name}</Text>
                  <Text style={{ color: colors.primary }}>{a.resolved} Jobs</Text>
                </View>
              ))}
            </View>

            {/* Faults by Zone */}
            <View style={styles.card}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Faults by Zone</Text>
              {latestAnalytics.topZones?.map((z, i) => (
                <View key={i} style={[styles.zoneCard, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.text, fontWeight: "700" }}>{z.zone}</Text>
                  <Text style={{ color: colors.primary }}>{z.faults} Faults</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeFilter === "jobHistory" && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Job History</Text>
            {latestAnalytics.jobHistory.map((job) => (
              <View key={job.id} style={[styles.jobHistoryItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.jobHistoryTitle, { color: colors.text }]}>{job.title}</Text>
                <Text style={{ color: colors.text }}>{job.location}</Text>
                <Text style={{ color: job.status === "Completed" ? colors.primary : colors.notification }}>{job.status}</Text>
                <Text style={{ color: colors.text }}>{job.date}</Text>
              </View>
            ))}
          </View>
        )}

        {activeFilter === "faultsAnalysis" && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Faults Analysis</Text>
            <FaultResolutionCard title="Avg. Repair Time" value={`${latestAnalytics.averageRepairTime} hrs`} />
            <FaultResolutionCard title="Longest Outage" value="12 hrs" />
          </View>
        )}

        {/* Operational & Regulatory Reports */}
        <View style={styles.card}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Operational Reports</Text>
          <Text style={{ color: colors.text, marginBottom: 8 }}>
            Daily summary, SLA breaches, customer impact.
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => Alert.alert("Export", "Export CSV")}>
              <Text style={{ color: colors.primary }}>Export CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert("Generate", "Generate PDF")}>
              <Text style={{ color: colors.primary }}>Generate PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Regulatory & Customer Impact</Text>
          <Text style={{ color: colors.text, marginBottom: 8 }}>
            Outage minutes by region, customers affected — ready for regulator submissions.
          </Text>
          <TouchableOpacity onPress={() => Alert.alert("Generate", "Regulatory Report")}>
            <Text style={{ color: colors.primary }}>Generate</Text>
          </TouchableOpacity>
        </View>

        <Button style={{ marginTop: 16 }}>Export Report</Button>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Helper Components ---------- */
function FilterButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterButton,
        active
          ? { backgroundColor: colors.primary }
          : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
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

function FaultResolutionCard({ title, value }: { title: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[ styles.faultCardsRow ]}>
      <View style={[styles.faultCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.faultCardTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.faultCardValue, { color: colors.primary }]}>{value}</Text>
      </View>
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16 },
  contentContainer: { paddingBottom: 100, paddingTop: 12 },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  filterPills: { flexDirection: "row", gap: 8, paddingVertical: 8 },
  filterButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 9999 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  periodSelector: { flexDirection: "row", gap: 8, marginBottom: 12, justifyContent: "center" },
  periodButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 9999, borderWidth: 1 },
  chartTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressPercent: { fontSize: 16, fontWeight: "700" },
  jobHistoryItem: { padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1 },
  jobHistoryTitle: { fontWeight: "700", fontSize: 16, marginBottom: 4 },
  faultCardsRow: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap" },
  faultCard: { padding: 12, borderRadius: 10, width: "48%", marginBottom: 12 },
  faultCardTitle: { fontWeight: "700", fontSize: 14, marginBottom: 6 },
  faultCardValue: { fontSize: 20, fontWeight: "800" },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 12 },
  emptySubtitle: { fontSize: 14, textAlign: "center", marginTop: 6 },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  listItem: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  zoneCard: { padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, flexDirection: "row", justifyContent: "space-between" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between" },
});
