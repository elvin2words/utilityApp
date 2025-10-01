// ufms/navigation/ArtisanStackNavigator.tsx

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ArtisanTabs } from "./ArtisanTabs";

import AllNotificationsScreen from "@/src/screens/common/AllNotificationsScreen";
import DevSettingsScreen from "@/src/screens/dev/DevSettingsScreen";
import FaultJobDetailedScreen from "@/src/screens/common/FaultJobDetailedScreen";
import AboutApp from "@/src/screens/common/AboutApp";


export type ArtisanStackParamList = {
  ArtisanTabs: undefined;
  AllNotifications: undefined;
  DevSettings: undefined;
  FaultJobDetailed: undefined;
  AboutApp: undefined;
  
};

const Stack = createNativeStackNavigator<ArtisanStackParamList>();

export default function ArtisanStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="ArtisanTabs"
      screenOptions={{
        headerStyle: { backgroundColor: "#FFFFFF" }, // Consider theme.colors.card
        headerTintColor: "#111827", // Use theme.colors.text
        headerTitleStyle: { fontSize: 18, fontWeight: "600" },
        // headerBackTitleVisible: false, // cleaner back button
        animation: "slide_from_right", // smoother navigation
      }}
    > 
      <Stack.Screen
        name="ArtisanTabs"
        component={ArtisanTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AllNotifications"
        component={AllNotificationsScreen}
        options={{ title: "All Notifications" }}
      />
      <Stack.Screen
        name="DevSettings"
        component={DevSettingsScreen}
        options={{ title: "Dev Settings" }}
      />
      <Stack.Screen
        name="FaultJobDetailed"
        component={FaultJobDetailedScreen}
        options={{ title: "Fault Job Details" }}
      />
      <Stack.Screen
        name="AboutApp"
        component={AboutApp}
        options={{ title: "About App" }}
      /> 
    </Stack.Navigator>
  );
}
