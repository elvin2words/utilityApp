
import React from "react";
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View, useColorScheme } from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useThemeStore } from "@/src/lib/themeStore";

export default function SettingsScreen() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";
  const navigation = useNavigation();
  const mode = useThemeStore((state) => state.mode);
  const toggle = useThemeStore((state) => state.toggleMode);


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

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.header, isDark && styles.textLight]}>Settings</Text>

      {/* Theme Toggle */}
      <View style={styles.row}>
        <Text style={[styles.label, isDark && styles.textLight]}>Dark Mode</Text>
        <Switch value={isDark} onValueChange={toggleTheme} />
      </View>

      <Switch
        value={mode === 'dark'}
        onValueChange={toggle}
        thumbColor={mode === 'dark' ? '#fff' : '#000'}
      />

      {/* Permissions */}
      <TouchableOpacity style={styles.button} onPress={requestPermissions}>
        <Text style={styles.buttonText}>Re-request Permissions</Text>
      </TouchableOpacity>

      {/* Reset Onboarding */}
      <TouchableOpacity style={[styles.button, { backgroundColor: "#EF4444" }]} onPress={resetOnboarding}>
        <Text style={styles.buttonText}>Reset Onboarding</Text>
      </TouchableOpacity>

        <View style={styles.row}>
          <Text >Notification Policies</Text>
          <Text >SLA Breach: Email to supervisor, SMS to assigned artisan.</Text>
          <TouchableOpacity onPress={() => Alert.alert('Edit notifications')} ><Text >Edit Policies</Text></TouchableOpacity>
        </View>

        <View style={styles.row}>
          <Text >Approval Workflows</Text>
          <Text >Major equipment replacement requires supervisor approval + admin sign-off.</Text>
          <TouchableOpacity onPress={() => Alert.alert('Edit workflows')} ><Text >Edit Workflow</Text></TouchableOpacity>
        </View>

        <View style={styles.row}>
          <Text >Regional Settings</Text>
          <Text >Manage zones, assign supervisors, set local hours.</Text>
          <TouchableOpacity onPress={() => Alert.alert('Edit regions')} ><Text >Edit Regions</Text></TouchableOpacity>
        </View>
   

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    // paddingTop: 10,
    backgroundColor: "#fff",
  },
  containerDark: {
    backgroundColor: "#121212",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#111",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    color: "#333",
  },
  textLight: {
    color: "#fff",
  },
  button: {
    backgroundColor: "#3B82F6",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
