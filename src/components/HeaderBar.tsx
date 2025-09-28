
// ufms/components/HeaderBar.tsx

import React, { useRef, useEffect, useMemo } from "react"; 
import { Animated, Pressable, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Moon, Sun, SlidersHorizontal } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";

import { StatusIndicator } from "@/src/components/ui/StatusIndicator";

import { useAppStore } from "@/src/stores/appStore";

import { useGeofenceStatus } from "@/src/hooks/useGeofenceStatus";

import { useThemeStore } from "@/src/lib/themeStore";
import { getThemeByMode, AppTheme } from "@/src/lib/colors";

import { formatDate } from "@/src/lib/utils";
import { useAuth } from "@/src/lib/auth/AuthContext";



type HeaderBarProps = {
  onOpenSidebar?: () => void;
  role?: string;
};

export default function HeaderBar({ onOpenSidebar, role = "Artisan Interface" }: HeaderBarProps) {
  const username = useAppStore((state) => state.username);
  const isOnline = useAppStore((state) => state.isOnline);
  const { isInGeofence, activeTask } = useGeofenceStatus();
  const { colors } = useTheme();
  const mode = useThemeStore((state) => state.mode);
  const toggle = useThemeStore((state) => state.toggleMode);
  const themeColors: AppTheme = getThemeByMode(mode);

  const { showMockData, toggleMockData } = useAppStore();

  const { width } = useWindowDimensions();
  const scale = width / 375;
  const isSupervisor = role.toLowerCase().includes("supervisor");

  const formattedDate = useMemo(() => formatDate(new Date()), []);

  // Animations
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const onlineOpacity = useRef(new Animated.Value(isOnline ? 1 : 0.4)).current;
  const geofenceOpacity = useRef(new Animated.Value(isInGeofence ? 1 : 0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(onlineOpacity, {
      toValue: isOnline ? 1 : 0.4,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  useEffect(() => {
    Animated.timing(geofenceOpacity, {
      toValue: isInGeofence && activeTask ? 1 : 0.4,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isInGeofence, activeTask]);

  const dynamicStyles = useMemo(() => createStyles(scale, themeColors.colors.text), [scale, themeColors.colors.text]);

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: themeColors.colors.card, transform: [{ translateY: slideAnim }], opacity: fadeAnim },
      ]}
    >
      <View>
        <Text style={[
          dynamicStyles.title, 
          {color:themeColors.colors.primary}
        ]}>Utility</Text>
        <Text style={dynamicStyles.subtitle}>{role}</Text>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.info}>
          <Text style={dynamicStyles.dateText}>{formattedDate}</Text>

          <View style={styles.statusRow}>
            <Animated.View style={[styles.statusItem, { opacity: onlineOpacity }]}>
              <StatusIndicator status={isOnline ? "online" : "offline"} active={isOnline} />
              <Text style={dynamicStyles.statusLabel}>{isOnline ? "Online" : "Offline"}</Text>
            </Animated.View>

            {!isSupervisor && (
              <Animated.View style={[styles.statusItem, { opacity: geofenceOpacity, marginLeft: 6 }]}>
                <StatusIndicator status={isInGeofence ? "inGeofence" : "outGeofence"} active={isInGeofence && activeTask} />
                <Text style={dynamicStyles.statusLabel}>{isInGeofence ? "In Geofence" : "Out of Geofence"}</Text>
              </Animated.View>
            )}
          </View>
        </View>

        {!isSupervisor && (
          <Pressable onPress={toggle} style={styles.iconButton}>
            {mode === "light" ? <Moon color={colors.text} size={22 * scale} /> : <Sun color={colors.text} size={22 * scale} />}
          </Pressable>
        )}
        
        <TouchableOpacity onPress={toggleMockData} >
          <Ionicons
            name={showMockData ? "albums" : "ban"}
            size={22 * scale}
            color={showMockData ? "#10b981" : themeColors.colors.primary}
          />
        </TouchableOpacity>       

        {onOpenSidebar && (
          <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
            <SlidersHorizontal color={colors.text} size={24 * scale} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>

       // Below is just another implmentation for the Header
    // <View style={[styles.container, { backgroundColor: colors.card }]}>
    //   <Pressable onPress={() => navigation.openDrawer()} style={styles.iconButton}>
    //     <Menu color={colors.text} size={24} />
    //   </Pressable>
    //   <Text style={[styles.title, { color: colors.text }]}>Mazenel</Text>
    //   <Pressable onPress={toggle} style={styles.iconButton}>
    //     {mode === "dark" ? (
    //       <Moon color={colors.text} size={22} />
    //     ) : (
    //       <Sun color={colors.text} size={22} />
    //     )}
    //   </Pressable>
    // </View>    
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // borderWidth: 1,
    zIndex: 10,
    // borderBottomRightRadius: 8,
    // borderBottomLeftRadius: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  info: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    flexWrap: "wrap",
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: { padding: 6 },
  menuButton: { padding: 6, marginLeft: 4 },
});

const createStyles = (scale: number, textColor: string) =>
  StyleSheet.create({
    title: { fontSize: 20 * scale, fontWeight: "bold", color: textColor },
    subtitle: { fontSize: 12 * scale, color: "#6b7280" },
    dateText: { fontSize: 13 * scale, fontWeight: "500", color: textColor },
    statusLabel: { fontSize: 11.5 * scale, marginHorizontal: 4, color: textColor },
  });
