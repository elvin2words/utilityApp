// ufms/components/AppContent.tsx

import React, { useEffect, useState, useCallback } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

import RootNavigator from "@/src/navigation/RootNavigator";
import SplashLottie from "@/src/components/SplashLottie";

import { useAuth } from "@/src/lib/auth/AuthContext";

import { MyDarkTheme, MyLightTheme } from "@/src/lib/colors";
// import { resetAppData } from "@/lib/devUtils";

import { useThemeHydration } from "@/src/hooks/useThemeHydration";
// import { useNetworkStatus } from "@/hooks/useNetworkStatus";
// import { useGeofenceStatus } from "@/hooks/useGeofenceStatus";
// import { useAnimatedTheme } from "@/hooks/useAnimatedTheme";

// import { useAppStore } from "@/stores/appStore";


/**
 * AppContent handles:
 * 1. Splash screen during app & theme hydration
 * 2. StatusBar & Android nav bar color
 * 3. Theme provider for navigation
 * 4. Toast notification root
 * 5. Reactive online/offline awareness
 */

export default function AppContent() {
  const { loading } = useAuth();
  const { hydrated, mode } = useThemeHydration();
  const [splashDone, setSplashDone] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // useNetworkStatus();
  // const isOnline = useAppStore((state: any) => state.isOnline);

  const theme = mode === "dark" ? MyDarkTheme : MyLightTheme;
  const barStyle = mode === "dark" ? "light" : "dark";
  const backgroundColor = theme.colors.background;

  // Using default themes
  // const theme =
  //   mode === "dark"
  //     ? require("@react-navigation/native").DarkTheme
  //     : require("@react-navigation/native").DefaultTheme;

  const onSplashFinish = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
      setSplashDone(true);
    } catch (err) {
      console.warn("Error hiding splash screen", err);
      setSplashDone(true);
    }
  }, []);

  // Wait for auth, theme hydration, and optionally online state before hiding splash
  useEffect(() => {
    if (!loading && hydrated /* && isOnline */) {
      onSplashFinish();
    }
  }, [loading, hydrated, onSplashFinish /*, isOnline */]);

  // Apply Android nav bar color
  useEffect(() => {
    if (hydrated && Platform.OS === "android") {
      SystemUI.setBackgroundColorAsync(backgroundColor);
    }
  }, [hydrated, backgroundColor]);

  if (!splashDone || !hydrated) {
    return <SplashLottie onAnimationFinish={onSplashFinish} />;
  }

  // Development-only reset
  // useEffect(() => {
  //   if (__DEV__ && !global.__DEV_RESET_DONE__) {
  //     resetAppData();
  //     global.__DEV_RESET_DONE__ = true;
  //   }
  // }, []);

    /** Error fallback rendering */
  const renderErrorFallback = (err: Error) => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{err.message}</Text>
    </View>
  );

  /** If error occurred during navigation or theme setup */
  if (error) {
    return renderErrorFallback(error);
  }

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <StatusBar style={barStyle} animated />
      <NavigationContainer 
        theme={theme}
        onUnhandledAction={(err: any) => {
          console.error("Navigation error:", err);
          setError(new Error("Navigation failed"));
        }}
      >
        <RootNavigator />
      </NavigationContainer>
      <Toast />
    </View>
  );
}


const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#D32F2F",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
});

