
// screens/dev/DevSettingsScreen.tsx

import React, { useCallback, useRef } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { User, Sliders, HelpCircle, Moon, Sun, LogOut } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeStore } from "@/src/lib/themeStore";
import { getThemeByMode, AppTheme } from "@/src/lib/colors";

import { useAuth } from "@/src/lib/auth/AuthContext";
import { useGeofenceSimStore } from "@/src/stores/useGeofenceSimStore";
import { useApiLogger } from "@/src/stores/useApiLogger";
import { useDevConfigStore } from "@/src/lib/dev/devConfigStore";

import Constants from "expo-constants";

import { AppButton } from "@/src/components/ui/AppButton";
import { SwitchRow } from "@/src/components/ui/SwitchRow";

import { useScrollToTop } from "@react-navigation/native";

import HeaderBar from "@/src/components/HeaderBar";  


export default function DevSettingsScreen() {
  const { width } = useWindowDimensions();
  const ref = useRef<ScrollView>(null);
  const isTablet = width >= 768;
  const insets = useSafeAreaInsets();

  const { user, logout, devLogin } = useAuth();
  const { apiLogs, clearLogs } = useApiLogger();
  const { environment, setEnvironment, developerFlags, toggleFlag } = useDevConfigStore();
  const { isSimulatingEntry, isSimulatingExit, toggleEntrySim, toggleExitSim } = useGeofenceSimStore();

  const environments = ["development", "staging", "production"] as const;

  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggleMode);
  const nextMode = mode === "light" ? "dark" : "light";

  const theme: AppTheme = getThemeByMode(mode);


  /** Toast helper */
  const showToast = (message: string) => {
    Toast.show({ type: "success", text1: message });
  };

  /** Storage helpers */
  const handleStorageAction = async (action: "reset" | "clearAuth" | "clearSession") => {
    try {
      if (action === "reset") await AsyncStorage.clear();
      if (action === "clearAuth") await AsyncStorage.removeItem("auth");
      if (action === "clearSession") await AsyncStorage.multiRemove(["token", "role"]);
      Alert.alert("Success", `${action} completed`);
    } catch {
      Alert.alert("Error", "Storage operation failed");
    }
  };

  const clearStorage = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert("Reset", "AsyncStorage cleared.");
    } catch {
      Alert.alert("Error", "Failed to clear storage.");
    }
  }, []);

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem("hasOnboarded");
    Alert.alert("Reset", "Onboarding flag cleared.");
  };

  const clearAuthSession = useCallback(async () => {
    await AsyncStorage.multiRemove(["token", "role"]);
    Alert.alert("Cleared", "Auth session cleared.");
  }, []);

  const clearAuthToken = useCallback(async () => {
    await AsyncStorage.removeItem("auth");
    Alert.alert("Cleared", "Auth token cleared.");
  }, []);

  /** Switch role (dev only) */
  const switchRole = useCallback(async () => {
    const newRole = user?.role === "supervisor" ? "artisan" : "supervisor";
    try {
      await devLogin(newRole);
      Alert.alert("Role switched", `Logged in as ${newRole.toUpperCase()}`);
    } catch {
      Alert.alert("Error", "Failed to switch role");
    }
  }, [user?.role, devLogin]);

  useScrollToTop(ref);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        { paddingHorizontal: isTablet ? 40 : 20, paddingBottom: insets.bottom + 48 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color:  theme.colors.maintext }, { fontSize: isTablet ? 28 : 24 }]}>
        🛠 Developer Tools
      </Text>

      {/* Appearance */}
      <Section title="Appearance" colors={ theme.colors }>
        <SwitchRow
          // label={mode === "dark" ? "Dark Mode" : "Light Mode"}
          label1={"Light Mode"}
          label2={"Dark Mode"}
          value={mode === "dark"}
          onValueChange={toggleTheme}
          // icon={mode === "dark" ? <Moon size={20} color={ theme.colors.text} /> : <Sun size={20} color={ theme.colors.text} />}
          icon1={<Sun size={20} color={ theme.colors.text} />}
          icon2={<Moon size={20} color={ theme.colors.text} />}
        />
        <Text style={[styles.subLabel, { color:  theme.colors.maintext }]}>
          Current Role: {user?.role?.toUpperCase() ?? "UNKNOWN"}
        </Text>
        <AppButton variant="primary" title="Switch Role" onPress={switchRole} />
      </Section>

      {/* Environment */}
      <Section title="Environment" colors={theme.colors}>
        {environments.map((env) => (
          <AppButton 
            variant="primary"
            key={env}
            title={`${env}${env === environment ? " (active)" : ""}`}
            onPress={() => {
              setEnvironment(env);
              showToast(`Switched to ${env}`);
            }}
          />
        ))}
      </Section>

      {/* Authentication */}
      <Section title="Authentication" colors={theme.colors}>
        <AppButton variant="primary" title="Reset Onboarding" onPress={resetOnboarding} />
        <Spacer />
        <AppButton variant="danger" title="Clear Auth Session" onPress={clearAuthSession} />
        <Spacer />
        <AppButton variant="danger" title="Clear Auth Token" onPress={clearAuthToken} />
      </Section>

      {/* Geofence */}
      <Section title="Geofence Simulation" colors={theme.colors}>
        <SwitchRow label1="Entry Sim Off" label2="Entry Sim On" value={isSimulatingEntry} onValueChange={toggleEntrySim} />
        <SwitchRow label1="Exit Sim Off" label2="Exit Sim On" value={isSimulatingExit} onValueChange={toggleExitSim} />
      </Section>

      {/* Developer Flags */}
      <Section title="Developer Flags" colors={theme.colors}>
        {Object.entries(developerFlags).map(([key, value]) => (
          <SwitchRow key={key} label1={key + " Off"} label2={key + " On"} value={value} onValueChange={() => toggleFlag(key as any)} />
        ))}
        <Text style={{ color:  theme.colors.maintext, marginTop: 16 }}>📦 App Version: {Constants.expoConfig?.version}</Text>
      </Section>

      {/* API Logs */}
      <Section title="API Logs" colors={theme.colors}>
        {apiLogs.length === 0 ? (
          <Text style={[styles.emptyText, { color:  theme.colors.maintext }]}>No logs available.</Text>
        ) : (
          apiLogs.map((log, i) => (
            <View key={i} style={[styles.logBlock, { backgroundColor:  theme.colors.taskCard }]}>
              <Text style={[styles.logTitle, { color:  theme.colors.maintext }]}>{log.method} {log.endpoint}</Text>
              <Text>Status: {log.status}</Text>
              <Text numberOfLines={2}>Payload: {JSON.stringify(log.payload)}</Text>
            </View>
          ))
        )}
        <AppButton variant="primary" title="Clear API Logs" onPress={clearLogs} />
      </Section>

      {/* Storage */}
      <Section title="Storage & Session" colors={theme.colors}>
        <AppButton variant="danger" title="Clear All Storage" onPress={clearStorage} />
      </Section>

      {/* Logout */}
      <Section title="Exit" colors={theme.colors}>
        <AppButton variant="danger" title="🚪 Logout" onPress={logout} />
      </Section>
    </ScrollView>
  );
}

/** Small reusable components */
const Section = ({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: AppTheme["colors"];
}) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color:  colors.maintext }]}>{title}</Text>
    {children}
  </View>
);

const Row = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.toggleRow}>{children}</View>
);

const Spacer = () => <View style={styles.spacer} />;

const styles = StyleSheet.create({
  scrollContainer: { paddingVertical: Platform.OS === "android" ? 24 : 32 },
  title: { fontWeight: "bold", textAlign: "center", marginBottom: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12, textAlign: "center" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 8 },
  toggleLabel: { flexDirection: "row", alignItems: "center" },
  toggleText: { marginLeft: 8, fontSize: 16 },
  subLabel: { fontSize: 14, marginVertical: 8, textAlign: "center" },
  emptyText: { textAlign: "center", marginBottom: 12 },
  logBlock: { padding: 10, marginBottom: 10, borderRadius: 8 },
  logTitle: { fontWeight: "600", marginBottom: 4 },
  spacer: { height: 12 },
});
