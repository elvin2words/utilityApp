
// screens/supervisor/uiAccessories.tsx - Chips and stuff

import React, { useState, useRef, useMemo } from "react";
import { ActivityIndicator, Alert, FlatList, Linking, Modal, Platform, Pressable, RefreshControl, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { 
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
 } from "@tanstack/react-query";
 
import { Fault, FaultType, User } from "@/src/shared/schema";
import { API_BASE_URL } from "@/src/lib/constants";
import { Search, Filter, AlignJustify, AlertTriangle } from "lucide-react-native";
import { formatDateTime } from "@/src/lib/utils";
import Toast from "react-native-toast-message";
import { ScrollView } from "react-native-gesture-handler";
import mockFaults from "@/assets/data/mockFaults.json";
import { useNetworkStatus } from "@/src/hooks/useNetworkStatus";
import { getTravelTime } from "@/src/lib/navigation";
import { fetchWeatherImpact } from "@/src/hooks/useWeather";
import { assignPriorityColor } from "@/src/lib/utils";
import {FaultJobsScreenFilters} from "@/src/types/filters";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SLAState } from "@/src/types/faults";



// UI Components
// -----------------
export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>{label}</Text>
    </Pressable>
  );
}


export function SLABadge({ state, minutesLeft }: { state: SLAState; minutesLeft: number }) {
  const label = minutesLeft >= 0 ? `${minutesLeft}m left` : `${Math.abs(minutesLeft)}m over`;
  return (
    <View style={[styles.slaBadge, state === "ok" ? styles.slaOk : state === "at_risk" ? styles.slaWarn : styles.slaBreach]}>
      <Text style={styles.slaText}>{state.toUpperCase()} · {label}</Text>
    </View>
  );
}

function SLABadge2({ state, minutesLeft }: { state: SLAState; minutesLeft: number }) {
  const label = state === "ok" ? "OK" : state === "at_risk" ? "At risk" : "Breached";
  return (
    <View style={[styles.slaBadge, state === "ok" ? styles.slaOk : state === "at_risk" ? styles.slaWarn : styles.slaBreach]}>
      <Text style={styles.slaText}>{label}</Text>
    </View>
  );
}

/** ---- Styles ---- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0d12" },
  listContent: { padding: 12, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#cfd6e6", marginTop: 8 },
  errorText: { color: "#fca5a5" },

  topBar: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  search: {
    flex: 1,
    backgroundColor: "#141823",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 10, android: 8, default: 8 }),
    color: "#e5e7eb",
    borderWidth: 1,
    borderColor: "#1f2533",
  },
  toggle: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  toggleOn: { backgroundColor: "#064e3b", borderColor: "#065f46" },
  toggleOff: { backgroundColor: "#1f2937", borderColor: "#374151" },
  toggleText: { color: "#e5e7eb", fontSize: 12 },
  autoAssignBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: "#1f2937" },
  autoAssignText: { color: "#e5e7eb", fontSize: 12 },

  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  filterRowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  chipActive: { backgroundColor: "#1f2937", borderColor: "#4b5563" },
  chipInactive: { backgroundColor: "#0b0d12", borderColor: "#1f2533" },
  chipText: { fontSize: 12 },
  chipTextActive: { color: "#e5e7eb" },
  chipTextInactive: { color: "#94a3b8" },

  selectLike: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#141823", borderWidth: 1, borderColor: "#1f2533" },
  selectLikeText: { color: "#cbd5e1", fontSize: 12 },

  bulkBar: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, backgroundColor: "#111827", borderWidth: 1, borderColor: "#1f2533", marginBottom: 8 },
  bulkText: { color: "#e5e7eb" },
  bulkBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#1f2937" },
  bulkBtnText: { color: "#e5e7eb", fontSize: 12 },

  card: { padding: 12, borderRadius: 14, backgroundColor: "#0f1420", borderWidth: 1, borderColor: "#1f2533", marginBottom: 10 },
  cardSelected: { borderColor: "#60a5fa" },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  cardTitle: { color: "#e5e7eb", fontWeight: "600" },
  cardSubtitle: { color: "#9ca3af", marginBottom: 4 },
  cardMeta: { color: "#94a3b8", fontSize: 12 },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: "#1f2937" },
  selectBtn: { backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2533" },
  actionBtnText: { color: "#e5e7eb", fontSize: 12 },

  slaBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999 },
  slaText: { color: "#0b0d12", fontWeight: "700", fontSize: 10 },
  slaOk: { backgroundColor: "#86efac" },
  slaWarn: { backgroundColor: "#fde68a" },
  slaBreach: { backgroundColor: "#fca5a5" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#0f1420", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#1f2533", maxHeight: "70%" },
  modalTitle: { color: "#e5e7eb", fontSize: 16, fontWeight: "600", marginBottom: 10 },
  teamRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1f2533" },
  teamName: { color: "#e5e7eb", fontWeight: "600" },
  teamMeta: { color: "#94a3b8", fontSize: 12 },
  modalClose: { alignSelf: "flex-end", paddingHorizontal: 10, paddingVertical: 8, marginTop: 8, backgroundColor: "#1f2937", borderRadius: 10 },
  modalCloseText: { color: "#e5e7eb" },
});