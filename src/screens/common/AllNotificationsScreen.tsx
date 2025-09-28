
// ufms/notifications/AllNotificationScreen.tsx

import React, { useEffect, useState, useMemo } from "react";
import { Alert, FlatList, LayoutAnimation, Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, UIManager, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { NotificationCard } from "@/src/components/ui/NotificationCard";
import { Notification } from "@/src/shared/schema";
import { SystemNotification } from "@/src/types/notification"; // unify types
import Toast from "react-native-toast-message"; 
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import LoadingScreen from "@/src/components/LoadingScreen";

import mockNotifs from "@/assets/mocks/mockNotifs.json";
import { useAppStore } from "@/src/stores/appStore";
import { GAP } from "@/src/utils/misc";


if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Severity colors
const severityColors = {
  low: "#6EE7B7",
  medium: "#FBBF24",
  high: "#F87171",
  critical: "#B91C1C",
};

// Type labels + icons
const typeLabels: Record<string, { label: string; icon: string }> = {
  system: { label: "System", icon: "settings-outline" },
  fault: { label: "Fault", icon: "alert-circle-outline" },
  reminder: { label: "Reminder", icon: "calendar-outline" },
  assignment: { label: "Assignment", icon: "briefcase-outline" },
  update: { label: "Update", icon: "sync-outline" },
  warning: { label: "Warning", icon: "warning-outline" },
  info: { label: "Info", icon: "information-circle-outline" },
  new_assignment: { label: "New Assignment", icon: "add-circle-outline" },
  status_update: { label: "Status Update", icon: "refresh-circle-outline" },
  alert: { label: "Alert", icon: "alert-circle-outline" },
  safety: { label: "Safety", icon: "shield-checkmark-outline" },
};

// groupByDate accepts a list of notifications (any shape that has timestamp)
const groupByDate = (notifications: Notification[]) => {
  const grouped: { [key: string]: Notification[] } = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  const today = dayjs();
  const yesterday = today.subtract(1, "day");

  notifications.forEach((notif) => {
    const date = dayjs(notif.timestamp);
    if (date.isSame(today, "day")) {
      grouped.Today.push(notif);
    } else if (date.isSame(yesterday, "day")) {
      grouped.Yesterday.push(notif);
    } else {
      grouped.Earlier.push(notif);
    }
  });

  return grouped;
};

export default function AllNotificationsScreen() {
  // Local list uses normalized shape (SystemNotification-ish)
  const navigation = useNavigation();
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const [filterSeen, setFilterSeen] = useState<"all" | "seen" | "unseen">("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { showMockData } = useAppStore();

  // Fetch (replace with API)
  const {
    data: notifications = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (showMockData) {
        return mockNotifs;
      }
      // 🔹 Replace with actual API call later
      const response = await fetch("https://api.example.com/notifications");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
  });

  // useEffect(() => {
  //   setLocalNotifications(notifications);
  // }, [notifications]);

  // Normalize incoming data to a predictable shape (ensures read/seen consistency)
  useEffect(() => {
    if (!notifications) {
      setLocalNotifications([]);
      return;
    }
    const normalized = (notifications as any[]).map((n: any) => ({
      ...n,
      // ensure we have a timestamp string
      timestamp: n.timestamp ?? n.created_at ?? new Date().toISOString(),
      // unify read / seen flags
      seen: n.seen ?? n.read ?? false,
    })) as Notification[];

    setLocalNotifications(normalized);
  }, [notifications]);

  // mark as read / seen
  const handleRead = (id: string) => {
    // keep animation for nicer UX
    try {
      // LayoutAnimation may be undefined in some contexts; wrap in try/catch
      // (we kept LayoutAnimation behavior from your original code)
      // @ts-ignore
      LayoutAnimation?.easeInEaseOut?.();
    } catch {}
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, seen: true, read: true } : n))
    );
  };

  const handleDismiss = (id: string) => {
    try {
      // @ts-ignore
      LayoutAnimation?.easeInEaseOut?.();
    } catch {}
    setLocalNotifications((prev) => prev.filter((n) => n.id !== id));
    Toast.show({ type: "success", text1: "Notification dismissed" });
  };

  // when clicking a notification card
  const handleNotificationPress = (notif: Notification) => {
    if (!notif.seen) handleRead(notif.id);
    setSelectedNotification(notif);
    setModalVisible(true);
  };

  // Apply filters
  const filtered = useMemo(() => {
    const now = new Date();
    return localNotifications.filter((n) => {
      if (n.timestamp && n.expires_at && new Date(n.expires_at) < now) return false;
      if (filterType && n.type !== filterType) return false;
      if (filterSeverity && n.severity !== filterSeverity) return false;
      if (filterSeen === "seen" && !n.seen) return false;
      if (filterSeen === "unseen" && n.seen) return false;
      return true;
    });
  }, [localNotifications, filterType, filterSeverity, filterSeen]);

  // Group the filtered notifications
  const grouped = groupByDate(filtered);
  const totalCount = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);

  // Build array of non-empty sections for FlatList
  const sections = Object.entries(grouped).filter(([, items]) => items.length > 0);

  return (
    // <ScrollView
    //   // refreshControl={
    //   //   <RefreshControl refreshing={isFetching} onRefresh={refetch} />
    //   // }
    //   showsVerticalScrollIndicator={false}
    //   contentContainerStyle={styles.container}
    // >
      // {/* <Text style={styles.screenTitle}>All Notifications</Text> */}
    <View style={styles.container}>
  
      {/* Filters row (kept at top inside container) */}
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton label="All Types" active={filterType === null} onPress={() => setFilterType(null)} />
          {Object.entries(typeLabels).map(([key, { label }]) => (
            <FilterButton 
              key={key} 
              label={label} 
              active={filterType === key} 
              onPress={() => setFilterType(key)} 
            />
          ))}

          <FilterButton label="All Severities" active={filterSeverity === null} onPress={() => setFilterSeverity(null)} />
          {Object.keys(severityColors).map((sev) => (
            <FilterButton
              key={sev}
              label={sev.charAt(0).toUpperCase() + sev.slice(1)}
              active={filterSeverity === sev}
              onPress={() => setFilterSeverity(sev)}
            />
          ))}
    
          <FilterButton label="All" active={filterSeen === "all"} onPress={() => setFilterSeen("all")} />
          <FilterButton label="Seen" active={filterSeen === "seen"} onPress={() => setFilterSeen("seen")} />
          <FilterButton label="Unseen" active={filterSeen === "unseen"} onPress={() => setFilterSeen("unseen")} />
        </ScrollView>
      </View>

      {/* Loading */}
      {isLoading && localNotifications.length === 0 ? (
        <View style={styles.loadingContainer}>
        {/* <View> */}
          {/* <Ionicons name="notifications-outline" size={66} color="#9ca3af" style={{ marginBottom: 10 }} /> */}
          <LoadingScreen message="Notifications Loading ..." />
        </View>
      ) : totalCount === 0 ? (
        // Full-screen empty state (centered)
        <View style={styles.emptyBox}>
          <Ionicons name="notifications-outline" size={66} color="#9ca3af" style={{ marginBottom: 10 }} />
          <Text style={styles.emptyTitle}>No Notifications Available</Text>
          <Text style={styles.emptySubtitle}>
            You're all caught up! Pull to refresh or check back later.
          </Text>
        </View>
      ) : (
        // Render grouped sections via FlatList for performance
        <FlatList
          data={sections}
          keyExtractor={([label]) => label}
          showsVerticalScrollIndicator={false}
          // refresh support
          refreshing={isFetching}
          onRefresh={() => refetch()}
          contentContainerStyle={{ padding: 3, paddingBottom: 6 }}
          renderItem={({ item: [label, items] }) => (
            <View style={styles.groupSection}>
              <Text style={styles.groupLabel}>{label}</Text>
              {items.map((n: any) => (
                <Pressable key={n.id} onPress={() => handleNotificationPress(n)}>
                  <NotificationCard
                    notification={n}
                    onRead={() => handleRead(n.id)}
                    onDismiss={() => handleDismiss(n.id)}
                  />
                </Pressable>
              ))}
            </View>
          )}
        />
      )}
       
      {/* Modal details (covers entire screen) */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true} // helps on Android to cover under status bar
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            {/* prevent closing when tapping inside modalContent */}
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {selectedNotification ? (
                  <>
                    <Text style={styles.modalTitle}>Notification Details</Text>

                    <Text style={styles.modalLabel}>Type:</Text>
                    <Text>{typeLabels[selectedNotification.type]?.label || selectedNotification.type}</Text>

                    <Text style={styles.modalLabel}>Message:</Text>
                    <Text>{selectedNotification.message}</Text>

                    <Text style={styles.modalLabel}>Timestamp:</Text>
                    <Text>{format(parseISO(selectedNotification.timestamp), "PPpp")}</Text>

                    {selectedNotification.severity && (
                      <>
                        <Text style={styles.modalLabel}>Severity:</Text>
                        <Text>{selectedNotification.severity}</Text>
                      </>
                    )}

                    {selectedNotification.context && (
                      <>
                        <Text style={styles.modalLabel}>Context:</Text>
                        <Text>{JSON.stringify(selectedNotification.context, null, 2)}</Text>
                      </>
                    )}
                  </>
                ) : (
                  <Text>No details available.</Text>
                )}

                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <Toast />
    </View>
  // {/* </ScrollView> */}
  );
}

function FilterButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterButton, active ? styles.filterButtonActive : styles.filterButtonInactive]}>
      <Text style={active ? styles.filterTextActive : styles.filterTextInactive}>{label}</Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#f9fafb",
    padding: GAP,
    // paddingBottom: 60,
  },
    // Filters
  // filters: {
  //   flexDirection: "row",
  //   paddingHorizontal: 16,
  //   paddingVertical: 10,
  //   alignItems: "center",
  //   flexWrap: "nowrap",
  // },
  filterButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  filterButtonActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  filterButtonInactive: { backgroundColor: "#fff", borderColor: "#9CA3AF" },
  filterTextActive: { color: "#fff", fontWeight: "bold" },
  filterTextInactive: { color: "#4B5563" },
  screenTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    color: "#111827",
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
    marginTop: 16,
  },
  groupSection: {
    marginBottom: 8,
  },
  // emptyBox: {
  //   padding: 20,
  //   marginTop: 40,
  //   borderRadius: 12,
  //   backgroundColor: "#fff",
  //   alignItems: "center",
  //   borderWidth: 1,
  //   borderColor: "#e5e7eb",
  // },
  emptyText: {
    color: "#6b7280",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 16 },
  modalContent: { backgroundColor: "#fff", borderRadius: 8, padding: 16, maxHeight: "80%" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  modalLabel: { fontWeight: "bold", marginTop: 8 },
  modalCloseButton: {
    marginTop: 16,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#2563EB",
    borderRadius: 8,
  },
  modalCloseButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: "700", marginTop: 12, color: "#374151" },
  emptySubtitle: { fontSize: 14, color: "#6b7280", textAlign: "center", marginTop: 6 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    // height: 400, // optional: ensures some minimum height if ScrollView shrinks
    paddingHorizontal: 24,

  },


});
