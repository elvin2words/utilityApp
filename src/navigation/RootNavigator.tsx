// ufms/navigation/RootNavigator.tsx 

import React, { JSX, useCallback } from "react";
import { Alert, Button, Linking, Platform, StyleSheet, Text, View } from "react-native";

import AuthNavigator from "./AuthNavigator";
import ArtisanStackNavigator from "./ArtisanStackNavigator";
import SupervisorStackNavigator from "./SupervisorStackNavigator";

import { useAuth } from "@/src/lib/auth/AuthContext";

import LoadingScreen from "@/src/components/LoadingScreen";


export default function RootNavigator() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  if (loading) return <LoadingScreen message="Checking session..." />;
  if (!isAuthenticated) return <AuthNavigator />;

  // Map user.roles to navigators for scalability
  const roleNavigators: Record<string, JSX.Element> = {
    supervisor: <SupervisorStackNavigator />,
    artisan: <ArtisanStackNavigator />,
  };

  if (user?.role && roleNavigators[user.role]) {
    return roleNavigators[user.role];
    // return roleNavigators["supervisor"];
  }

  // Fallback UI for unexpected role or auth issues
  const handleLogout = useCallback(() => {
    logout?.();
  }, [logout]);

  /** Contact support handler: opens WhatsApp */
  const handleContactSupport = useCallback(async () => {
    const phone = "+263712104928";
    const message = "Hello, I need support with the UFMS / Utility app.";
    const url = Platform.select({
      ios: `https://wa.me/${phone.replace("+", "")}?text=${encodeURIComponent(message)}`,
      android: `https://wa.me/${phone.replace("+", "")}?text=${encodeURIComponent(message)}`,
    });

    if (url && (await Linking.canOpenURL(url))) {
      Linking.openURL(url);
    } else {
      Alert.alert("Error", "Unable to open WhatsApp. Please install it or try later.");
    }
  }, []);

  return (
    <View style={styles.fallbackContainer}>
      <Text style={styles.fallbackText}>
        Unable to identify user role. Please restart the app or contact support.
      </Text>
      <View style={{ width: "100%", marginBottom: 12 }}>
        <Button title="Logout & Retry" onPress={handleLogout} />
      </View>

      <View style={{ width: "100%" }}>
        <Button title="Contact Support" onPress={handleContactSupport} color="#25D366" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 24,
  },
  fallbackText: {
    textAlign: "center",
    fontSize: 16,
    color: "#374151",
    marginBottom: 16,
  },
});
