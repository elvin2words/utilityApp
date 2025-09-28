//ufms/components/CustomDrawerContent.tsx 

import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, View, useWindowDimensions } from "react-native";

import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";

import {
  User, Sliders, HelpCircle,
  Code2, Moon, Sun, LogOut, } from "lucide-react-native";

import { useTheme } from "@react-navigation/native";

import { useThemeStore } from "@/src/lib/themeStore";
import { useAuth } from "@/src/lib/auth/AuthContext";

import * as Haptics from "expo-haptics";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAppStore } from "@/src/stores/appStore";


const FAB_KEY = "ufms:showFAB";

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { logout, user } = useAuth();
  const mode = useThemeStore((state: any) => state.mode);
  const toggleTheme = useThemeStore((state: any) => state.toggleMode);
  const { colors } = useTheme();

  const [fabEnabled, setFabEnabled] = useState(true);

  // inside component
  const fabVisible = useAppStore((state: any) => state.fabVisible);
  const toggleFAB = useAppStore((state: any) => state.toggleFAB);


  useEffect(() => {
    (async () => {
      const val = await AsyncStorage.getItem(FAB_KEY);
      setFabEnabled(val !== "0"); // default true
    })();
  }, []);


  /** Navigate to a screen inside the drawer safely */
  const handleNavigate = (screen: keyof typeof props.state.routes) => {
    props.navigation.navigate(screen as never);
  };

  /** Logout handler using context-driven auth */
  const handleLogout = async () => {
    try {
      await logout(); // This triggers RootNavigator to show AuthNavigator
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Logout Failed", "Please try again.");
    }
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, backgroundColor: "transparent" }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.text }]}>
          {user?.name ?? "Test User"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          {user?.role === "supervisor" ? "Supervisor Menu" : "Side Menu"}
        </Text>
      </View>

      {/* Drawer Items */}
      <View style={styles.container}>
        <View style={styles.section}>
          <DrawerItem
            label="Account"
            icon={({ color, size }) => <User color={color} size={size} />}
            onPress={() => handleNavigate("Account")}
          />
          <DrawerItem
            label="Preferences"
            icon={({ color, size }) => <Sliders color={color} size={size} />}
            onPress={() => handleNavigate("Preferences")}
          />
          <DrawerItem
            label="Help & Support"
            icon={({ color, size }) => <HelpCircle color={color} size={size} />}
            onPress={() => handleNavigate("Help")}
          />
          {__DEV__ && (
            <DrawerItem
              label="Dev Settings"
              icon={({ color, size }) => <Code2 color={color} size={size} />}
              onPress={() => handleNavigate("DevSettings")}
            />
          )}
        </View>

        {/* Logout & Theme Toggle */}
        <View style={styles.section}>
          <DrawerItem
            label="Logout"
            icon={({ color, size }) => <LogOut color={color} size={size} />}
            onPress={handleLogout}
          />

          {/* <DrawerItem
            label="Show FAB"
            icon={({ color, size }) => <LogOut color={color} size={size} />}
            onPress={handleLogout}
          /> */}

          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Text style={[{ color: colors.text }]}>Hide FAB</Text>
            </View>
            <Switch
              value={fabVisible}
              onValueChange={toggleFAB}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor="#f4f3f4"
              ios_backgroundColor="#3e3e3e"
            />
            <View style={styles.toggleLabel}>
              <Text style={[{ color: colors.text }]}>Show FAB</Text>
            </View>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              {/* {mode === "dark" ? (
                <Moon size={20} color={colors.text} />
              ) : (
                <Sun size={20} color={colors.text} />
              )} */}
              <Sun size={20} color={colors.text} />
              {/* <Text style={[styles.toggleText, { color: colors.text }]}>
                {mode === "dark" ? "Dark" : "Light"} Mode
              </Text> */}
            </View>
            <Switch
              value={mode === "dark"}
              onValueChange={toggleTheme}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor="#f4f3f4"
              ios_backgroundColor="#3e3e3e"
            />
            <Moon size={20} color={colors.text} />

          </View>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginTop: 120, 
    paddingVertical: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  toggleLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleText: {
    marginLeft: 8,
    fontSize: 14,
  },
});
