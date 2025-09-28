
// components/dashItems.tsx

import React, { useMemo, useState,} from "react";
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart, BarChart } from "react-native-gifted-charts";

import {StatCardData} from "@/src/types/cards"
import MapView, { Marker } from "react-native-maps";
import { Feather as Quill } from "react-native-feather";
import Feather from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";

import { AppTheme } from "@/src/lib/colors";
import { GAP } from "@/src/utils/misc";

import { Fault, ActivityLog } from "@/src/shared/schema"; 
import { formatDateTime, formatTimeAgo } from "@/src/lib/utils";



export const QuickActions: React.FC<{
  onCreate: () => void; // Maybe creat a fault job, or task geerally
  onAcknowledge: () => void; // Bacically Close the job formally
  onAssign: () => void; // Maybe take us to one fo the Assignment Screens for particular FaultJob
  onOpenMap: () => void; // Make this take us to MapScreen
  themeColors:AppTheme;
}> = ({ onCreate, onAcknowledge, onAssign, onOpenMap, themeColors}) => (
  <View style={styles.actionsRow}>
    <Pressable style={[styles.primaryBtn, , { borderColor: themeColors.colors.border }]} onPress={onCreate} accessibilityRole="button">
      <Feather name="plus" size={16} color="#fff" />
      <Text style={[styles.primaryText, { color: themeColors.colors.text }]}>Log Fault</Text>
    </Pressable>

    <Pressable style={styles.outlineBtn} onPress={onAcknowledge} accessibilityRole="button">
      <Feather name="check" size={16} color="#3b82f6" />
      <Text style={styles.outlineText}>Acknowledge</Text>
    </Pressable>

    <Pressable style={styles.ghostBtn} onPress={onAssign} accessibilityRole="button">
      <Feather name="user-check" size={16} color="#111827" />
      <Text style={styles.ghostText}>Quick Assign</Text>
    </Pressable>

    <Pressable style={styles.ghostBtn} onPress={onOpenMap} accessibilityRole="button">
      <Feather name="map" size={16} color="#111827" />
      <Text style={styles.ghostText}>Open Map</Text>
    </Pressable>
  </View>
);


export const RecentActivityItem: React.FC<{ 
  activity: ActivityLog;
  themeColors: AppTheme;
  setSelectedActivity: any; // Make this take us to MapScreen
}> = React.memo(({ 
  activity, 
  setSelectedActivity,
  themeColors}) => {
  let bg = '#e5e7eb', color = '#4b5563', icon = '✎';
  if (activity.action === 'CREATE_FAULT') [bg, color, icon] = ['#fef3c7', '#ca8a04', '!'];
  if (activity.action === 'UPDATE_FAULT_STATUS' && activity.description.includes('resolved')) [bg, color, icon] = ['#d1fae5', '#065f46', '✓'];
  if (activity.action === 'UPDATE_ASSIGNMENT_STATUS') [bg, color, icon] = ['#dbeafe', '#1e40af', '👁️'];
  if (activity.action === 'CREATE_ASSIGNMENT') [bg, color, icon] = ['#ede9fe', '#5b21b6', '✎'];
  return(
    <TouchableOpacity
      key={activity.id}
      style={[styles.activityRow, { borderBottomColor: themeColors.colors.border }]}
      onPress={() => setSelectedActivity(activity)}
    >
      <View style={[styles.activityIcon, { backgroundColor: bg }]}>
        <Text style={[styles.activityIconText, { color }]}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={{ color: themeColors.colors.text }}>{activity.description}</Text>
        <Text style={{ color: themeColors.colors.subtext, fontSize: 12 }}>
          {formatTimeAgo(activity.timestamp)}
        </Text>
      </View>
    </TouchableOpacity>
  );}
)


export const TodayCenter: React.FC<{
  todayCount: number;
  overdueCount: number;
  approvalsCount: number;
  onApproveAll: () => void;
  onViewOverdue: () => void;
  onViewToday: () => void;
  themeColors:AppTheme;
}> = ({ todayCount, overdueCount, approvalsCount, onApproveAll, onViewOverdue, onViewToday, themeColors }) => {
  const [open, setOpen] = useState(true);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => !o);
  };

  return (
    <View style={[styles.sectionCard, , { backgroundColor: themeColors.colors.card }]}>
      <Pressable onPress={toggle} style={styles.todayHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Quill size={18} color="#111827" />
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{todayCount} Jobs</Text>
          </View>
        </View>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={18} color="#6b7280" />
      </Pressable>

      {open && (
        <View style={styles.todayBody}>
          <View style={styles.todayRow}>
            <Text style={styles.todayLabel}>Overdue</Text>
            <Text style={styles.todayValue}>{overdueCount}</Text>
            <Pressable onPress={onViewOverdue}>
              <Text style={styles.link}>View</Text>
            </Pressable>
          </View>

          <View style={styles.todayRow}>
            <Text style={styles.todayLabel}>Pending Approvals</Text>
            <Text style={styles.todayValue}>{approvalsCount}</Text>
            <Pressable onPress={onApproveAll}>
              <Text style={styles.link}>Approve All</Text>
            </Pressable>
          </View>

          <View style={styles.todayRow}>
            <Text style={styles.todayLabel}>Completed Today</Text>
            <Text style={[styles.todayValue, { color: "#059669" }]}>{todayCount}</Text>
            <Pressable onPress={onViewToday}>
              <Text style={styles.link}>Details</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};


export const StatCard: React.FC<{ c: StatCardData; width: string | number; themeColors:AppTheme}> = React.memo(({ c, width, themeColors }) => {
  return (
    <TouchableOpacity
      key={c.id}
      onPress={c.onPress}
      style={[
        styles.statCard,
        {width: width},
        {backgroundColor:themeColors.colors.card},
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${c.title} ${c.value}`}
      testID={`stat-card-${c.id}`}
    >
      <Text style={[styles.statTitle, { color: themeColors.colors.maintext }]}>
        {c.title}
      </Text>
      <View style={styles.cardHeader}>
        <View style={styles.titleWrapper}>
          {/* <Text style={[styles.cardValue, { color: themeColors.colors.maintext }]}>
            {c.value}
          </Text> */}
          <Text style={[styles.statValue, { color: themeColors.colors.text }]}>
            {c.value}
          </Text>
        </View>

        { c.subText && 
          <Text style={styles.midwayText}>
            <Text style={[styles.cardSub, { color: themeColors.colors.danger }]}>
              {c.subText}
            </Text>
            <Text style={[styles.trend, c.trend === "up" ? styles.trendUp : styles.trendDown]}>
              {c.trend === "up" ? "↑" : "↓"}
            </Text>
          </Text>
        }
        { (c.subscript || c.superscript) && 
          <View style={styles.metaWrapper}>
            <Text style={[styles.subText, { color: themeColors.colors.secondary }]}>
              {c.subscript}
            </Text>
            <Text style={[styles.subText, { color: themeColors.colors.subtext }]}>
              {c.superscript}
            </Text>
          </View>
        }
      </View>
      <Text style={[styles.statSubtitle, { color: themeColors.colors.subtext }]}>
        {c.subtitle}
      </Text>
      {c.children}
    </TouchableOpacity>
  );
});


// export const Card = ({ title, value, superscript, subscript ,subText, children }: any) => (
//     <TouchableOpacity style={styles.card}>
//       <Text style={styles.cardTitle}>{title}</Text>
//       <View style={styles.cardHeader}>
//         <View style={styles.titleWrapper}>
//           <Text style={styles.cardValue}>{value}</Text>
//         </View>
//         <Text style={styles.midwayText}>
//           {subText && <Text style={styles.cardSub}>{subText}</Text>}
//         </Text>
//         {/* Only render the section below if any info */}
//         <View style={styles.metaWrapper}>
//           {/* <Text style={styles.supText}>{superscript}</Text> */}
//           {/* <Text style={styles.supText}>{superscript}</Text> */}
//           <Text style={styles.subText}>subscript</Text>
//           <Text style={styles.subText}>subscript</Text>
//         </View>        
//       </View>
//       {children}
//     </TouchableOpacity>
//   );


export const PerformanceLineChart: React.FC<{ series: number[], themeColors: AppTheme, last7:any, pointerLabel:any, lineData:any }> = React.memo(({ series, themeColors, last7, pointerLabel, lineData }) => {
  const dataPoints = series.map((v) => ({ value: v }));
  return (
    <View style={[styles.chartCard, { backgroundColor: themeColors.colors.card }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.colors.text }]}>
        Performance (last 7 days)
      </Text>
      <LineChart
        // data={dataPoints}
        data={lineData}
        thickness={3}
        curved
        areaChart
        showVerticalLines={false}
        showHorizontalLines={false}
        yAxisTextStyle={{ color: "#6b7280" }}
        xAxisLabelTextStyle={{ color: "#6b7280" }}
        // hideDataPoints
        // hideRules
        spacing={40}
        initialSpacing={12}
        isAnimated
        // maxValue={Math.max(...series, 10)}
        maxValue={Math.max(...last7.map((d) => d.value), 10)}
        style={{ marginTop: 8 }}
        pointerConfig={{
          pointerStripHeight: 140,
          pointerStripUptoDataPoint: true,
          pointerLabelComponent: (items: any) => {
            const idx = items?.[0]?.index;
            return pointerLabel(idx);
          },
        }}
      />
    </View>
  );
});


export const PerformanceBarChart: React.FC<{ prioAgg: any, barTooltip:any, themeColors: AppTheme, last7:any, pointerLabel:any, barData:any }> = React.memo(({ prioAgg, themeColors, last7, pointerLabel, barData, barTooltip}) => {
  const navigation = useNavigation();
  // ---------- INTERACTIVE CHART TOOLTIP STATES ----------
  const [lineFocusIndex, setLineFocusIndex] = useState<number | null>(null);
  const [barFocusIndex, setBarFocusIndex] = useState<number | null>(null);
  // Navigation handlers for drill-down
  const goToReportsByDate = (date: Date) =>
    navigation.navigate("Analytics" as never, { filter: "date", value: date.toISOString() } as never);
  const goToReportsByPriority = (key: string) =>
    navigation.navigate("Analytics" as never, { filter: "priority", value: key } as never);

  return (
    <View style={[styles.chartCard, { backgroundColor: themeColors.colors.card }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.colors.text }]}>
        By Severities (last 7 days)
      </Text>
      <BarChart
        data={barData}
        barWidth={28}
        spacing={31}
        hideRules
        yAxisTextStyle={{ color: "#6b7280" }}
        xAxisLabelTextStyle={{ color: "#6b7280" }}
        // show tooltip near bar (custom label)
        focusedBarIndex={barFocusIndex ?? -1}
        showScrollIndicator={false}
        onPress={(item: any, idx: number) => {
          setBarFocusIndex(idx);
          goToReportsByPriority(prioAgg[idx].key);
        }}
        renderTooltip={(item: any, idx: number) => barTooltip(idx)}
      />
    </View>
  );
});

export const PriorityChart: React.FC<{ high: number; medium: number; low: number }> = React.memo(
  ({ high, medium, low }) => {
    const data = useMemo(
      () => [
        { value: high, label: "High" },
        { value: medium, label: "Medium" },
        { value: low, label: "Low" },
      ],
      [high, medium, low]
    );
    return (
      <View style={styles.chartCardSmall}>
        <Text style={styles.sectionTitle}>Priority Distribution</Text>
        <BarChart
          data={data}
          barWidth={28}
          spacing={22}
          hideRules
          yAxisTextStyle={{ color: "#6b7280" }}
          xAxisLabelTextStyle={{ color: "#6b7280" }}
          isAnimated
          style={{ marginTop: 8 }}
        />
      </View>
    );
  }
);

export const CompletionBar: React.FC<{ completed: number; total: number }> = ({ completed, total }) => {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <View style={styles.completionWrap}>
      <Text style={styles.sectionTitle}>Resolution Rate</Text>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.completionText}>{`${completed} / ${total} • ${pct}%`}</Text>
    </View>
  );
};


export const MapPreview: React.FC<{ faults: Fault[]; onOpen: () => void }> = ({ faults, onOpen }) => {
  const fallbackRegion = {
    latitude: -17.8252,
    longitude: 31.0335,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  const initialRegion =
    faults && faults.length > 0 && (faults[0] as any).coordinates
      ? {
          latitude: (faults[0] as any).coordinates.latitude,
          longitude: (faults[0] as any).coordinates.longitude,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        }
      : fallbackRegion;
      
  return (
    <Pressable style={styles.mapCard} onPress={onOpen} accessibilityRole="button">
      <Text style={styles.sectionTitle}>Map Preview</Text>
      <Text style={styles.mapHint}>Tap to open full map</Text>
      <View style={styles.mapWrapper}>
        <MapView pointerEvents="none" style={styles.map} initialRegion={initialRegion} loadingEnabled>
          {faults?.slice(0, 8).map((f) => {
            const c = (f as any).coordinates;
            if (!c) return null;
            return (
              <Marker
                key={f.id}
                coordinate={{ latitude: c.latitude, longitude: c.longitude }}
                title={(f as any).name}
                description={(f as any).location_name}
              />
            );
          })}
        </MapView>
      </View>
    </Pressable>
  );
};


export const MapPreview2: React.FC<{ faults: Fault[] }> = ({ faults }) => {
  const fallbackRegion = { latitude: -17.8252, longitude: 31.0335, latitudeDelta: 0.5, longitudeDelta: 0.5 };
  const initialRegion =
    faults && faults.length > 0 && (faults as any)[0]?.coordinates
      ? {
          latitude: (faults as any)[0].coordinates.latitude,
          longitude: (faults as any)[0].coordinates.longitude,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        }
      : fallbackRegion;

  return (
    <View style={styles.mapCard}>
      <Text style={styles.sectionTitle}>Map Preview</Text>
      <Text style={styles.mapHint}>Tap to open full map</Text>
      <View style={styles.mapWrapper}>
        <MapView pointerEvents="none" style={styles.map} initialRegion={initialRegion} loadingEnabled>
          {faults?.slice(0, 6).map((f) => {
            // @ts-ignore coordinates might be optional in your schema
            if (!f.coordinates) return null;
            return (
              <Marker
                key={f.id}
                coordinate={{
                  // @ts-ignore
                  latitude: f.coordinates.latitude,
                  // @ts-ignore
                  longitude: f.coordinates.longitude,
                }}
                title={f.name}
                description={f.location_name}
              />
            );
          })}
        </MapView>
      </View>
    </View>
  );
};




// ----------------------------- Styles -----------------------------
const styles = StyleSheet.create({
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },

  // Actions
  actionsRow: {
    flexDirection: "row",
    // marginTop: GAP,
    marginBottom: GAP,
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  primaryBtn: {
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 10,
    justifyContent:"center",
    flexDirection: "row",
    alignItems: "center",
    width:"48%",
    gap: 8,
    minWidth: 130,
  },
  primaryText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: "#3b82f6",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:"center",
    gap: 8,
    width:"48%",
    minWidth: 130,
    backgroundColor: "#fff",
  },
  outlineText: { color: "#3b82f6", fontWeight: "700", marginLeft: 6 },
  ghostBtn: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    width:"48%",
    alignItems: "center",
    justifyContent:"center",
    gap: 8,
    minWidth: 130,
  },
  ghostText: { color: "#111827", fontWeight: "600" },


  activityRow: { flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 8, 
    borderBottomWidth: 0.5, 
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    justifyContent: "center",
    alignItems: "center",
    // borderColor: "#f59e0b",
    // borderWidth: 1,
  },
  activityIconText: { fontSize: 16 },
  activityDescription: { fontSize: 14, color: "#374151" },
  activityTimestamp: { fontSize: 12, color: "#6b7280", marginTop: 4 },

  // Map
  mapCard: { marginTop: 12, borderRadius: 12, overflow: "hidden", backgroundColor: "#fff", padding: 12 },
  mapHint: { color: "#6b7280", fontSize: 12, marginTop: 4 },
  mapWrapper: { height: 180, marginTop: 8, borderRadius: 10, overflow: "hidden" },
  map: { flex: 1 },



  
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
    statCardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    statTitle: { fontSize: 13, fontWeight: "600", },
    statValueWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
    statValue: { fontSize: 22, fontWeight: "800", },
    trend: { marginLeft: 6, fontSize: 12, fontWeight: "700" },
    trendUp: { color: "#059669" },
    trendDown: { color: "#ef4444" },
    statSubtitle: { marginTop: 4, fontSize: 12 },
  
    // Section row for charts
    sectionRow: {
      marginTop: 6,
      flexDirection: "row",
      gap: 12,
      alignItems: "stretch",
      flexWrap: "wrap",
    },
    // chartCard: {
    //   backgroundColor: "#fff",
    //   borderRadius: 12,
    //   padding: 12,
    //   flex: 1,
    //   minWidth: 260,
    //   marginBottom: 12,
    //   ...Platform.select({
    //     ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12 },
    //     android: { elevation: 2 },
    //   }),
    // },
  
    chartCard: { borderRadius: 12, padding: 12 }, //fix design for this to center neatly nicly and he other stuff commented
    // sectionTitle: { fontSize: 15, fontWeight: "700", marginHorizontal:4, textAlign:"center", justifyContent:"center" },
    
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
    // sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
    completionWrap: {
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 12,
      width: 200,
      minHeight: 120,
      justifyContent: "center",
      marginBottom: 12,
    },
    progressBg: { height: 10, backgroundColor: "#e5e7eb", borderRadius: 6, marginTop: 8, overflow: "hidden" },
    progressFill: { height: 10, backgroundColor: "#10b981" },
    completionText: {
      marginTop: 8,
      fontSize: 12,
      color: "#6b7280",
    },
    // Recent Activities
    section: {
      marginTop: 12,
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 12,
      ...Platform.select({
        ios: { shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
        android: { elevation: 1 },
      }),
    },
  
  
  
  
  
      card: {
        backgroundColor: '#fff',   borderRadius: 8,
        padding: 12,  // flexBasis: '48%',
        marginBottom: 2,  shadowColor: '#000',
        shadowOpacity: 0.5,  shadowRadius: 4,
        elevation: 8,  width: '48%',
      },
      cardTitle: {
        fontSize: 14, fontWeight: '600', color: '#374151', // gray-700
        marginBottom: 2,
      },
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
      
  
  
  
    // Map
    // mapCard: { marginTop: 12, borderRadius: 12, overflow: "hidden", backgroundColor: "#fff", padding: 12 },
    // mapHint: { color: "#6b7280", fontSize: 12, marginTop: 4 },
    // mapWrapper: { height: 160, marginTop: 8, borderRadius: 10, overflow: "hidden" },
    // map: { flex: 1 },
  
    // Alerts
    alertRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 8 },
    alertDot: { width: 10, height: 10, backgroundColor: "#ef4444", borderRadius: 6, marginRight: 8 },
    alertText: { fontWeight: "700", color: "#111827" },
    alertSmall: { color: "#6b7280", fontSize: 12 },    
  
  
  
  
  
    container: { padding: 16, paddingBottom: 120 },
    offlineBanner: {
      backgroundColor: "#fde68a",
      color: "#92400e",
      textAlign: "center",
      padding: 8,
      fontWeight: "600",
    },
  
    // Top Grid
    topGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 12 },
  
    // Collapsible Today Center
    sectionCard: {
      flex: 1,
      minWidth: 260,
      padding: GAP, 
      marginBottom:GAP,
      // marginTop:GAP,
      borderWidth:1,
      borderRadius: 12, 
      borderColor:"#1615152f",
        // ...Platform.select({
        //   ios: {
        //     shadowColor: "#443f3f4b",
        //     shadowOpacity: 0.08,
        //     shadowRadius: 6,
        //   },
        //   android: { elevation: 3 },
        // }),
    },
    todayHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    pill: { backgroundColor: "#e5e7eb", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    pillText: { fontSize: 12, color: "#111827", fontWeight: "600" },
    todayBody: { marginTop: 8, gap: 10 },
    todayRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    todayLabel: { color: "#374151", fontWeight: "600" },
    todayValue: { color: "#111827", fontWeight: "800" },
  
    // Charts
  
    chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    chartHint: { fontSize: 11, color: "#6b7280" },
  
    // Actions
    // actionsRow: { flexDirection: "row", marginTop: 8, justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
    // primaryBtn: { backgroundColor: "#3b82f6", padding: 12, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 8, minWidth: 120 },
    // primaryText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
    // outlineBtn: { borderWidth: 1, borderColor: "#3b82f6", padding: 12, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 8, minWidth: 120 },
    // outlineText: { color: "#3b82f6", fontWeight: "700", marginLeft: 6 },
    // ghostBtn: { backgroundColor: "#fff", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", flexDirection: "row", alignItems: "center", gap: 8, minWidth: 120 },
    // ghostText: { color: "#111827", fontWeight: "600" },
  
    
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    link: { color: "#3b82f6", fontSize: 13 },
  
    // Activities
    // activityRow: { flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 8 },
    // activityIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#fff7ed", justifyContent: "center", alignItems: "center", borderColor: "#f59e0b", borderWidth: 1 },
    // activityIconText: { fontSize: 16 },
    // activityDescription: { fontSize: 14, color: "#374151" },
    // activityTimestamp: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  
   
    // Tooltips
    tooltip: {
      backgroundColor: "#111827",
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    tooltipTitle: { color: "#fff", fontWeight: "700", fontSize: 12 },
    tooltipText: { color: "#e5e7eb", fontSize: 12, marginTop: 2 },
  
    // Empty / loader
    empty: { textAlign: "center", color: "#9ca3af", paddingVertical: 16 },
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  
});

