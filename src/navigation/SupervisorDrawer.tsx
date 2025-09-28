
// navigation/SupervisorDrawer.tsx

import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { useWindowDimensions } from "react-native";

import { SupervisorTabs } from "./SupervisorTabs"; 

import AccountScreen from "@/src/screens/supervisor/AccountScreen";
import PreferencesScreen from "@/src/screens/supervisor/PreferencesScreen";
import HelpScreen from "@/src/screens/common/HelpScreen";
import DevSettingsScreen from "@/src/screens/dev/DevSettingsScreen";
import CustomDrawerContent from "@/src/components/CustomDrawerContent";


export type SupervisorDrawerParamList = {
  SupervisorMain: undefined;
  Account: undefined;
  Preferences: undefined;
  Help: undefined;
  DevSettings?: undefined;
};

const Drawer = createDrawerNavigator<SupervisorDrawerParamList>();

export function SupervisorDrawer() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const drawerStyle = {
    width: isLargeScreen ? 280 : 240,
    borderTopLeftRadius: 60,
    borderBottomLeftRadius: 60,
    overflow: "hidden" as "hidden",
    elevation: 50, 
  };

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerPosition: "right",
        headerShown: false,
        drawerType: "front",
        // drawerType: isLargeScreen ? "permanent" : "slide",
        drawerStyle,
        overlayColor: isLargeScreen ? "transparent" : "rgba(0,0,0,0.4)",
      }}
    >
      <Drawer.Screen name="SupervisorMain" component={SupervisorTabs} />
      <Drawer.Screen name="Account" component={AccountScreen} />
      {/* <Drawer.Screen name="Preferences" component={PreferencesScreen} /> */}
      <Drawer.Screen name="Help" component={HelpScreen} />
      {/* <Drawer.Screen name="DevSettings" component={DevSettingsScreen} /> */}
      {/* {__DEV__ && <Drawer.Screen name="DevSettings" component={DevSettingsScreen} />} */}
    </Drawer.Navigator>
  );
}