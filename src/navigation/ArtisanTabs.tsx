// ufms/navigation/ArtisanTabs.tsx

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Home, FileText, Map, BarChart2, User } from "lucide-react-native";

import { getResponsiveTabScreenOptions } from "./TabOptionsResponsive";
import { useAppStore } from "@/src/stores/appStore";

import HomeScreen from "@/src/screens/artisan/HomeScreen";
import TasksScreen from "@/src/screens/artisan/TasksScreen";
import MapScreen from "@/src/screens/artisan/MapScreen";
import ReportsScreen from "@/src/screens/artisan/ReportsScreen";
import ProfileStack from "@/src/screens/artisan/ProfileStack";

import HeaderBar from "@/src/components/HeaderBar";


export type ArtisanTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Map: undefined;
  Reports: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<ArtisanTabParamList>();

const tabIcons: Record<keyof ArtisanTabParamList, React.FC<any>> = {
  Home,
  Tasks: FileText,
  Map,
  Reports: BarChart2,
  Profile: User,
};

function onUserLogin(userData: { username: string }) {
  const setUsername = useAppStore.getState().setUsername;
  const setBadgeCount = useAppStore.getState().setBadgeCount;
  //   setUsername(userData.username);
  //   Dummy initial badge counts
  //   setBadgeCount("Tasks", 5);
  //   setBadgeCount("Notifications", 2);
}

export function ArtisanTabs() {
  const { colors } = useTheme();
  const badgeCounts = useAppStore((state) => state.badges);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          ...getResponsiveTabScreenOptions(tabIcons, badgeCounts, colors)({ route }),
          header: () => <HeaderBar role="Artisan" />,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Tasks" component={TasksScreen} />
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
        <Tab.Screen name="Profile" component={ProfileStack} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}
