// screens/Artisan/HomeScreen.tsx 

import React, { useState, useRef } from "react";
import { Alert, Dimensions, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/lib/auth/AuthContext";
import { useFaultsQuery } from "@/src/hooks/useFaultsQuery";
import { useArtisanNotifications } from "@/src/hooks/artisan/useArtisanNotifs";

import { useAppStore } from "@/src/stores/appStore";
import { useArtisanStore } from "@/src/stores/artisanStore";
import { useActiveJob, useUpcomingJobs } from "@/src/hooks/artisan/useArtisanJobs";

import { FaultCard } from "@/src/components/FaultJobCard";
import { NotificationCard } from "@/src/components/ui/NotificationCard";

import { Fault } from "@/src/types/faults";
import { SystemNotification } from "@/src/types/notification"; // unify types

import { useThemeStore } from "@/src/lib/themeStore";
import { getThemeByMode, AppTheme } from "@/src/lib/colors";

import mockFaults from "@/assets/data/mockFaults.json";
import mockNotifs from "@/assets/data/mockNotifs.json";
import { Notification } from "@/src/shared/schema";
import { BOTTOM_NAV_SAFE, GAP } from "@/src/utils/misc";

const screenHeight = Dimensions.get("window").height;



export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const { showMockData } = useAppStore();

  // Look up purpose of stores, and wher eot use them as to hooks, then assess these
  // const { data: activeJob } = useActiveJob(user?.id); // logic to be implemented inside useFaultsJobHook
  // const activeJob = mockFaults[0]; // logic to be implemented inside useFaultsJobHook
  const activeJob: Fault | null = showMockData ? mockFaults[0] ?? null : null;
  // const userId = useAppStore((state) => state.username);
  // const { upcomingJobs } = useArtisanStore(); // logic to be implemented inside useFaultsJobHook
  const upcomingJobs: Fault[] = showMockData ? (mockFaults as Fault[]) : [];
  // const { upcomingJobs } = useUpcomingJobs(user?.id);  // logic to be implemented inside useFaultsJobHook
  // const { data: notifications = [], refetch: refetchNotifs, isFetching } = useArtisanNotifications(user?.id); // logic to be implemented inside useNotificationsQuryHook
  const { data: notifications = showMockData ? mockNotifs : [], refetch: refetchNotifs, isFetching } = useArtisanNotifications(user?.id); // logic to be implemented inside useNotificationsQuryHook

  const [refreshing, setRefreshing] = useState(false);

  const [aiVisible, setAiVisible] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiChat, setAiChat] = useState< { sender: "user" | "eddy"; text: string }[] >([]);

  const mode = useThemeStore((s) => s.mode);
  const themeColors: AppTheme = getThemeByMode(mode);

  // track expanded upcoming jobs
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);


  const toggleExpand = (jobId: string) => {
    setExpandedJobs((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const toggleExpandEach = (jobId: string) => {
    setExpandedJobId((prevId) => (prevId === jobId ? null : jobId));
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchNotifs(),
      // refetchUpcomingJobs?.(),
      // refetchActiveJob?.(),
    ]);
    setRefreshing(false);
  };


  const handleSendToEddy = () => {
    if (!aiInput.trim()) return;

    // Append user message
    setAiChat((prev) => [...prev, { sender: "user", text: aiInput }]);

    // Simulate Eddy’s response (replace with API call later)
    setTimeout(() => {
      setAiChat((prev) => [
        ...prev,
        { sender: "eddy", text: `EDDY here 👋. I got your message: "${aiInput}"` },
      ]);
    }, 600);

    setAiInput("");
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.colors.background }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent]}
        refreshControl={<RefreshControl refreshing={refreshing || isFetching} onRefresh={onRefresh} tintColor={themeColors.colors.primary} />}
      >
        {/* ACTIVE JOB */}
        <View style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, { color: themeColors.colors.maintext }]}>ACTIVE JOB</Text>
          {activeJob ? (
            <FaultCard fault={activeJob} type="active" themeColors={themeColors}/>
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: themeColors.colors.card, borderColor: themeColors.colors.border }]}>
              <Ionicons name="briefcase-outline" size={36} color={themeColors.colors.subtext} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyText, { color: themeColors.colors.subtext }]}>No active job locked into a.t.m.</Text>
            </View>
          )}
        </View>

        {/* Assigned Tasks */}
        <View style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, { color: themeColors.colors.maintext }]}>ASSIGNED TASKS</Text>
          {/* {upcomingJobs.length > 0 ? ( */}
          {upcomingJobs.filter(job => job.status === "pending").length > 0 ? (
            // upcomingJobs.slice(0, 3).map((task) => (
            upcomingJobs
            .filter(job => job.status === "pending") // show only pending jobs
            .slice(0, 3)
            .map((task) => (
              <FaultCard
                key={task.id}
                fault={task}
                themeColors={themeColors}
                // expanded={!!expandedJobs[task.id]}
                expanded={expandedJobId === task.id}  // only the clicked job is expanded
                // onToggleExpand={() => toggleExpand(task.id)}
                onToggleExpand={() => toggleExpandEach(task.id)}
                type="pending"
                actionButtons={[
                  {
                    label: "View Details",
                    action: () => navigation.navigate("FaultJobDetailed", { faultId: task.id }),
                  },
                  {
                    label: "Start Job", // It should set active job in store (via useArtisanStore
                    action: () => Alert.alert("Manually set this fault job as the active one in store"),
                  },
                ]}
              />
            ))
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: themeColors.colors.card, borderColor: themeColors.colors.border }]}>
              <Ionicons name="calendar-outline" size={36} color={themeColors.colors.subtext} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyText, { color: themeColors.colors.subtext }]}>No Assigned Tasks registered a.t.m</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => navigation.navigate("Tasks")}>
            <Text style={[styles.link, { color: themeColors.colors.primary }]}>See All My Assigned Tasks →</Text>
          </TouchableOpacity>
        </View>

        {/* NOTIFICATIONS */}
        <View style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, { color: themeColors.colors.maintext }]}>NOTIFICATIONS</Text>
          {notifications.length > 0 ? (
            notifications.slice(0, 4).map((n) => <NotificationCard key={n.id} notification={n} />)
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: themeColors.colors.card, borderColor: themeColors.colors.border }]}>
              <Ionicons name="notifications-outline" size={36} color={themeColors.colors.subtext} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyText, { color: themeColors.colors.subtext }]}>No notifications raised a.t.m.</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => navigation.navigate("AllNotifications")}>
            <Text style={[styles.link, { color: themeColors.colors.primary }]}>See All My Notification Updates →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: themeColors.colors.primary }]}
        onPress={() => setAiVisible(true)}
      >
        <Ionicons name="sparkles-outline" size={28} color="#fff" />
      </TouchableOpacity>

      {/* AI Modal */}
      <Modal visible={aiVisible} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setAiVisible(false)}>
          <Pressable
            style={[
              styles.modalBox,
              { backgroundColor: themeColors.colors.card },
            ]}
            onPress={() => {}} // prevents closing when clicking inside
          >
            <Text style={[styles.modalTitle, { color: themeColors.colors.maintext }]}>
              Chat with EDDY (the System AI)
            </Text>

            <ScrollView style={styles.chatArea}>
              {aiChat.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.chatBubble,
                    msg.sender === "user"
                      ? styles.userBubble
                      : styles.eddyBubble,
                  ]}
                >
                  <Text
                    style={{
                      color:
                        msg.sender === "user"
                          ? "#fff"
                          : themeColors.colors.maintext,
                    }}
                  >
                    {msg.text}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: themeColors.colors.border, color: themeColors.colors.maintext },
                ]}
                placeholder="Tell me how I can help..."
                placeholderTextColor={themeColors.colors.subtext}
                value={aiInput}
                onChangeText={setAiInput}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: themeColors.colors.primary }]}
                onPress={handleSendToEddy}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setAiVisible(false)}>
              <Text style={[styles.closeBtn, { color: themeColors.colors.primary }]}>
                Close
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>      
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 65,
  },
  sectionWrapper: {
    flex: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  emptyBox: {
    minHeight: 150,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
  link: {
    textAlign: "center",
    marginVertical: 8,
    fontWeight: "500",
  },

// FAB
  fab: {
    position: "absolute",
    bottom: BOTTOM_NAV_SAFE-10,
    right: GAP,
    width: GAP*4.5,
    height: GAP*4.5,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 16,
    // pointerEvents:"box-none"
  },
  modalBox: {
    borderRadius: 16,
    padding: 16,
    maxHeight: "85%",
    // pointerEvents:"box-none"
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  chatArea: { flexGrow: 0, maxHeight: 300, marginBottom: 12, },
  chatBubble: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 12,
    maxWidth: "80%",
  },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#4a90e2" },
  eddyBubble: { alignSelf: "flex-start", backgroundColor: "#eaeaea" },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendBtn: {
    padding: 10,
    borderRadius: 12,
  },
  closeBtn: {
    textAlign: "center",
    marginTop: 12,
    fontWeight: "600",
  },  
});
