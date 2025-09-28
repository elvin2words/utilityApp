
// screens/artisan/PreferencesScreen.tsx

import React, { useState, useEffect } from "react";
import { Alert, Image, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useAuth } from "@/src/lib/auth/AuthContext";
import { Picker } from "@react-native-picker/picker";

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { FileText, HelpCircle, User as UserIcon } from 'lucide-react-native'; // or react-native
import { useQuery } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
// import { FileText, HelpCircle, User as UserIcon } from 'react-native-feather'; // or react-native-vector-icons

// import HeaderBar from "@/src/components/common/HeaderBar";  

import { apiRequest, queryClient } from "@/src/lib/queryClient";
import { API_BASE_URL, AVAILABILITY_STATUS_OPTIONS, THEME_OPTIONS } from "@/src/lib/constants";
import LoadingScreen from "@/src/components/LoadingScreen";

import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SupervisorStackParamList } from "@/src/navigation/SupervisorStackNavigator";



// Types
type Settings = {
  push_notifications: boolean;
  sound: boolean;
  vibration: boolean;
  auto_sync: boolean;
  cache_safety_docs: boolean;
  theme: "light" | "dark" | "system";
};

type ProfileTabProps = {
  user: {
    id: string;
    name: string;
    status?: string;
    role: string;
    employee_id: string;
    phone: string;
    email: string;
    team: string;
    shift: string;
  };
  onLogout: () => void;
};


// Fake backend API calls
async function saveSettingsToAPI(userId: string, settings: any) {
  const isOffline = Math.random() < 0.3; // simulate network failure
  if (isOffline) throw new Error("Network unavailable");
  try {
    await fetch(`https://api.utility.com/api/users/${userId}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    console.log("Synced to backend:", settings);
  } catch (err) {
    console.log("API sync failed, will retry later", err);
  }
}

// Offline queue handler
async function processQueue(userId: string) {
  const queueRaw = await AsyncStorage.getItem("settingsQueue");
  if (!queueRaw) return;

  const queue = JSON.parse(queueRaw);
  const remainingQueue: any[] = [];

  for (let item of queue) {
    try {
      await saveSettingsToAPI(userId, item);
    } catch {
      remainingQueue.push(item);
    }
  }
  await AsyncStorage.setItem("settingsQueue", JSON.stringify(remainingQueue));
}

async function fetchSettingsFromAPI(userId: string) {
  try {
    const res = await fetch(`https://api.tility.com/api/users/${userId}/settings`);
    return await res.json();
  } catch (err) {
    console.log("API fetch failed, fallback to local");
    return null;
  }
}


export default function PreferencesScreen() {
  
  const navigation = useNavigation<NativeStackNavigationProp<SupervisorStackParamList>>();
  // const navigation = useNavigation<any>();
  const { logout, user } = useAuth();
  const { colors, dark } = useTheme();

  const [activeTab, setActiveTab] = useState<  "Settings" | "Activity">("Settings");

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const [availability, setAvailability] = useState<"Available" | "Busy" | "Offline">("Available");
  const [pushNotifications, setPushNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [cacheDocs, setCacheDocs] = useState(false);

  const userId = user?.id || "artisan_xyz";

  const userdetails = {
    name: user?.name,
    role: user?.role || "Field Artisan",
    email: user?.email,
    phone: "+263 77 123 4567",
    team: "Harare South",
    shift: "Day",
    avatar: "",
    stats: { completed: 124, pending: 12, delayed: 5, resolved: 119 },
    skills: ["Electrical Faults", "Meter Installation", "HV Maintenance"],
    certifications: ["Certified Electrician", "OSHA Safety"],
    upcoming: [
      { id: 1, title: "Fault #932 – Transformer outage", due: "Today 14:00" },
      { id: 2, title: "Fault #928 – Meter issue", due: "Tomorrow 09:00" },
    ],
  };

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: [`${API_BASE_URL}/settings`],
  });

  const requestPermissions = async () => {
    try {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      Alert.alert(
        "Permissions",
        `Location: ${locationStatus}, Notifications: ${notificationStatus}`
      );
    } catch (error) {
      Alert.alert("Permission Error", String(error));
    }
  };

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem("hasOnboarded");
    Alert.alert("Onboarding Reset", "You will see onboarding on next app start.");
  };  

  // Persist setting
  const persistSetting = async (newSettings: any) => {
    const merged = { availability, pushNotifications, theme: settings?.theme, ...newSettings };
    setAvailability(merged.availability);
    await AsyncStorage.setItem("artisanSettings", JSON.stringify(merged));
  try {
      await saveSettingsToAPI(userId, merged);
    } catch {
      const queueRaw = await AsyncStorage.getItem("settingsQueue");
      const queue = queueRaw ? JSON.parse(queueRaw) : [];
      queue.push(merged);
      await AsyncStorage.setItem("settingsQueue", JSON.stringify(queue));
    }
  }

  const handleSettingChange = async (setting: string, value: boolean | string) => {
    try {
      await apiRequest("PATCH", `${API_BASE_URL}/settings`, { [setting]: value });
      queryClient.invalidateQueries({ queryKey: [`${API_BASE_URL}/settings`] });
      Toast.show({ type: "success", text1: "Settings Updated" });
    } catch {
      Toast.show({ type: "error", text1: "Settings Update Failed" });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await apiRequest('PATCH', `${API_BASE_URL}/users/${user.id}/status`, {
        status: newStatus,
      });
      // setStatus(newStatus);
      Toast.show({
        type: 'success',
        text1: 'Status Updated',
        text2: `Your status is now ${newStatus.replace('_', ' ')}`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Settings Update Failed',
        text2: 'Your status update has not been saved',
      });
    }
  };

  const openLink = (url: string) => Linking.openURL(url).catch(() =>
    Toast.show({ type: "error", text1: "Open Link Failed" })
  );

  if (isLoading) return <LoadingScreen message="Loading Settings..." />;

  // async function toggleUserActive(userId: string) {
  //   // optimistic update
  //   setUsers((prev) => prev?.map((u) => (u.id === userId ? { ...u, active: !u.active } : u)) || null);
  //   try {
  //     await api.updateUser(userId, { active: !(users?.find((x) => x.id === userId)?.active) });
  //   } catch (err) {
  //     Alert.alert("Error", "Failed to update user status. Reverting.");
  //     // revert on failure
  //     setUsers((prev) => prev?.map((u) => (u.id === userId ? { ...u, active: !u.active } : u)) || null);
  //   }

  // Load persisted settings - Hydrate settings from AsyncStorage
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const local = await AsyncStorage.getItem("artisanSettings");
  //       if (local) {
  //         const parsed = JSON.parse(local);
  //         setAvailability(parsed.availability);
  //         // setNotificationsEnabled(parsed.notificationsEnabled);
  //         // setTheme(parsed.theme);
  //       }
  //       // Also refresh from backend if online
  //       const remote = await fetchSettingsFromAPI(userId);
  //       if (remote) {
  //         setAvailability(remote.availability);
  //         // setNotificationsEnabled(remote.notificationsEnabled);
  //         // setTheme(remote.theme);
  //         await AsyncStorage.setItem("artisanSettings", JSON.stringify(remote));
  //       }
  //     } catch (err) {
  //       console.log("Load settings error", err);
  //     }
  //   })();
  // }, []);

  // NetInfo listener to retry queue
  // useEffect(() => {
  //   const unsubscribe = NetInfo.addEventListener((state) => {
  //     if (state.isConnected) processQueue(userId);
  //   });
  //   return () => unsubscribe();
  // }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* <HeaderBar role="Supervisor Interface" /> */}
      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {["Settings", "Activity"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? colors.primary : colors.text },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, paddingBottom: 72 }}>

        {activeTab === "Settings" && (
          <>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Universal  Settings</Text>
              <TouchableOpacity
                style={styles.settingRow}
              >
                <Text style={[styles.settingText, { color: colors.text }]}>General Settings</Text>
                <Ionicons style={[{ color: colors.text }]} name="chevron-forward" size={18} />
              </TouchableOpacity>

              {/* Permissions */}
              <TouchableOpacity style={styles.settingRow} onPress={requestPermissions}>
                <Text style={[styles.settingText, { color: colors.text }]}>Re-request Permissions</Text>
                <Ionicons style={[{ color: colors.text }]} name="chevron-forward" size={18} />
              </TouchableOpacity>

              {/* Reset Onboarding */}
              <TouchableOpacity style={[styles.settingRow,]} onPress={resetOnboarding}>
                <Text style={[styles.settingText, { color: colors.text }]}>Reset Onboarding</Text>
                <Ionicons style={[{ color: colors.text }]} name="chevron-forward" size={18} />
              </TouchableOpacity>

              {__DEV__ && (
                <TouchableOpacity
                  style={[styles.settingRow]}
                  onPress={() => navigation.navigate("DevSettings")}
                >
                  <Text style={[styles.settingText, { color: "#3b82f6" }]}>
                    Developer Settings
                  </Text>
                  <Ionicons name="construct" size={18} color="#3b82f6" />
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.settingGroupLabel, { color: colors.text }]}>System Theme</Text>
              <View style={styles.themeButtonsContainer}>
                {THEME_OPTIONS.map((o) => (
                  <TouchableOpacity
                    key={o.value}
                    style={[styles.themeButton, o.value === settings?.theme && { backgroundColor: colors.primary }]}
                    onPress={() => handleSettingChange("theme", o.value)}
                  >
                    <Text style={{ color: o.value === settings?.theme ? "#fff" : colors.primary }}>{o.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
              <View style={[styles.settingRow, { color: colors.text }]}>
                <Text style={[{ color: colors.text }]}>Push Notifications</Text>
                <Switch
                  value={pushNotifications}
                  onValueChange={setPushNotifications}
                />
              </View>
              <View style={[styles.settingRow, { color: colors.text }]}>
                <Text style={[{ color: colors.text }]}>Sound</Text>
                <Switch value={sound} onValueChange={setSound} />
              </View>
              <View style={[styles.settingRow, { color: colors.text }]}>
                <Text style={[{ color: colors.text }]}>Vibration</Text>
                <Switch value={vibration} onValueChange={setVibration} />
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Offline Mode</Text>
              <View style={[styles.settingRow, { color: colors.text }]}>
                <Text style={[{ color: colors.text }]}>Auto-sync</Text>
                <Switch value={autoSync} onValueChange={setAutoSync} />
              </View>
              <View style={[styles.settingRow, { color: colors.text }]}>
                <Text style={[{ color: colors.text }]}>Cache Safety Docs</Text>
                <Switch value={cacheDocs} onValueChange={setCacheDocs} />
              </View>
            </View>

            {/* Docs & Help */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Documentation</Text>
              <TouchableOpacity style={styles.settingRow}>
                <Text style={[styles.settingText, { color: colors.text }]}>Safety Guidelines</Text>
                <Ionicons style={[{ color: colors.text }]} name="open-outline" size={18} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingRow, { color: colors.text }]}>
                <Text style={[styles.settingText, { color: colors.text }]}>Equipment Manuals</Text>
                <Ionicons style={[{ color: colors.text }]} name="open-outline" size={18} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.settingRow, { color: colors.text }]}
                onPress={() => openLink('https://example.com/fault-handling-sops')}
              >
                <Text style={[styles.settingText, { color: colors.text }]}>Fault Handling SOPs</Text>
                <FileText color={colors.text} size={18} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingRow, { color: colors.text }]}>
                <Text style={[styles.settingText, { color: colors.text }]}>Help & Support</Text>
                <Ionicons style={[{ color: colors.text }]} name="help-circle-outline" size={18} />
              </TouchableOpacity>
            </View>           

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Log out</Text>
            </TouchableOpacity>

          </>
        )}
        
        {activeTab === "Activity" && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
            <View style={styles.activityRow}>
              <MaterialIcons name="engineering" size={20} color={colors.primary} />
              <Text style={{ marginLeft: 8, color: colors.text }}>Resolved Fault #932</Text>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  tabText: { fontSize: 14, fontWeight: "600" },
  content: { flex: 1 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  profileHeader: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  dummyAvatar: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  userName: { fontSize: 18, fontWeight: "700" },
  userRole: { fontSize: 14 },
  userSub: { fontSize: 12 },
  section: { borderRadius: 12, padding: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  infoText: { fontSize: 14 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 12 },
  activityRow: { flexDirection: "row", alignItems: "center", marginVertical: 4,
    borderRadius: 4, 
    borderLeftWidth: 4, 
    borderLeftColor: '#2563eb', 
    padding: 8,
   },
  tagsRow: { flexDirection: "row", flexWrap: "wrap" },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, margin: 4 },
  tagText: { fontSize: 13 },
  button: { paddingVertical: 12, borderRadius: 10, alignItems: "center", marginBottom: 10 },
  themeButtonsContainer: { flexDirection: "row", justifyContent: "space-around", marginTop: 8 },
  themeButton: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, marginHorizontal: 4, alignItems: "center" },

  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  settingText: { fontSize: 14, color: "#333" },

  logoutBtn: {
    backgroundColor: "#fee2e2",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10, 
  },
  logoutText: { color: "#dc2626", fontWeight: "600" },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  // avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 12 },
  name: { fontSize: 20, fontWeight: "700", color: "#111" },
  role: { fontSize: 14, color: "#555" },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  rating: { marginLeft: 4, fontSize: 14, color: "#333" },

  pickerButton: { padding: 6, backgroundColor: "#e0f2fe", borderRadius: 6 },

  certTag: { backgroundColor: "#ede9fe", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, margin: 4 },
  certText: { fontSize: 13, color: "#5b21b6" },

  jobCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#f1f5f9", padding: 10, borderRadius: 10, marginBottom: 8 },
  jobTitle: { fontSize: 14, fontWeight: "600", color: "#111" },
  jobDue: { fontSize: 12, color: "#555" },

  buttonText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  logoutButton: { backgroundColor: "#fee2e2" },

  profileDetails: {
    marginLeft: 16,
    flexShrink: 1,
  },


  userSubText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    width: '100%',
  },

  infoLabel: {
    color: '#6b7280',
    width: 80,
    fontWeight: '600',
  },
  infoValue: {
    flex: 1,
    color: '#111827',
  },
  settingGroup: {
    marginBottom: 16,
  },
  settingGroupLabel: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 8,
    color: '#374151',
  },

  settingLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  docLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

});
