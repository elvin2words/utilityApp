// ufms/navigation/SupervisorStackNavigator.tsx

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { SupervisorDrawer } from "./SupervisorDrawer";

import AllNotificationsScreen from "@/src/screens/common/AllNotificationsScreen";
import ActivitiesScreen from "@/src/screens/supervisor/ActivitiesScreen";
import FaultJobAssignmentScreen from "@/src/screens/supervisor/FaultJobAssignment";
import ApprovalsScreen from "@/src/screens/supervisor/ApprovalsScreen";
import StatsScreen from "@/src/screens/supervisor/StatsScreen";
import AlertsScreen from "@/src/screens/supervisor/Alerts";
import ArtisansScreen from "@/src/screens/supervisor/Artisans";
import TeamsScreen from "@/src/screens/supervisor/Teams";
import SchedulesScreen from "@/src/screens/supervisor/Schedules";
import ShiftsScreen from "@/src/screens/supervisor/Shifts";
import SLARulesScreen from "@/src/screens/supervisor/SLARules";
import EscalationsScreen from "@/src/screens/supervisor/Escalations";
import AuditLogsScreen from "@/src/screens/supervisor/AuditLogs";
import AccountScreen from "@/src/screens/supervisor/AccountScreen";
import PreferencesScreen from "@/src/screens/supervisor/PreferencesScreen";
import HelpScreen from "@/src/screens/common/HelpScreen";
import DevSettingsScreen from "@/src/screens/dev/DevSettingsScreen";


export type SupervisorStackParamList = {
  SupervisorDrawer: undefined;
  Notifications: undefined;
  Activities: undefined;
  FaultJobAssignment: undefined;
  Approvals: undefined;
  Stats: undefined;
  Alerts: undefined;
  Artisans: undefined;
  Teams: undefined;
  SLARules: undefined;
  Escalations: undefined;
  Schedules: undefined;
  Shifts: undefined;
  AuditLogs: undefined;
  Account: undefined;
  Preferences: undefined;
  Help: undefined;
  DevSettings: undefined;

}; 

const Stack = createNativeStackNavigator<SupervisorStackParamList>();

export default function SupervisorStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="SupervisorDrawer"
      screenOptions={{
        headerStyle: { backgroundColor: "#FFFFFF" }, // Replace with theme.colors.card
        headerTintColor: "#111827", // Replace with theme.colors.text
        headerTitleStyle: { fontSize: 18, fontWeight: "600" },
        // headerBackTitleVisible: false,
        animation: "slide_from_right", // Consistent UX
      }}
    >
      <Stack.Screen
        name="SupervisorDrawer"
        component={SupervisorDrawer}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={AllNotificationsScreen}
        options={{ title: "Notifications" }}
      />
      <Stack.Screen
        name="Activities"
        component={ActivitiesScreen} 
        options={{ title: "Activities" }}
      />  
      <Stack.Screen
        name="FaultJobAssignment"
        component={FaultJobAssignmentScreen}
        options={{ title: "Fault Job Assignment" }}
      /> 
      <Stack.Screen
        name="Approvals"
        component={ApprovalsScreen} 
        options={{ title: "Approvals Elevated" }}
      />          
      <Stack.Screen
        name="Stats"
        component={StatsScreen} 
        options={{ title: "Statistics" }}
      /> 
      <Stack.Screen
        name="Alerts"
        component={AlertsScreen} 
        options={{ title: "Alerts" }}
      />   
      <Stack.Screen
        name="Artisans"
        component={ArtisansScreen} 
        options={{ title: "Artisans" }}
      />   
      <Stack.Screen
        name="Teams"
        component={TeamsScreen} 
        options={{ title: "Teams" }}
      />   
      <Stack.Screen
        name="Schedules"
        component={SchedulesScreen} 
        options={{ title: "Schedules" }}
      />   
      <Stack.Screen
        name="Shifts"
        component={ShiftsScreen} 
        options={{ title: "Shifts" }}
      />   
      <Stack.Screen
        name="SLARules"
        component={SLARulesScreen} 
        options={{ title: "SLARules" }}
      />   
      <Stack.Screen
        name="Escalations"
        component={EscalationsScreen} 
        options={{ title: "Escalations" }}
      />   
      <Stack.Screen
        name="AuditLogs"
        component={AuditLogsScreen} 
        options={{ title: "AuditLogs" }}
      />   
      <Stack.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: "User Account" }}
      /> 
            <Stack.Screen
        name="Preferences"
        component={PreferencesScreen}
        options={{ title: "Preferences" }}
      /> 
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={{ title: "Help & Support" }}
      /> 
      <Stack.Screen
        name="DevSettings"
        component={DevSettingsScreen}
        options={{ title: "Dev Settings" }}
      /> 

    </Stack.Navigator>
  );
}
