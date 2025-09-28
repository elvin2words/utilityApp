// ufms/navigation/SupervisorTabs.tsx

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LayoutDashboard, ClipboardList, Map, BarChart2, ShieldCheck } from "lucide-react-native";

import { getResponsiveTabScreenOptions } from "./TabOptionsResponsive";

import DashboardScreen from "@/src/screens/supervisor/DashboardScreen";
import AssignmentsScreen from "@/src/screens/supervisor/FaultJobsScreen";
import MapScreen from "@/src/screens/supervisor/MapScreen";
import AnalyticsScreen from "@/src/screens/supervisor/AnalyticsScreen";
import AdminScreen from "@/src/screens/supervisor/AdminScreen";

import HeaderBar from "@/src/components/HeaderBar";

import { SupervisorDrawerParamList } from "./SupervisorDrawer";
import { DrawerNavigationProp } from "@react-navigation/drawer";


export type SupervisorTabParamList = {
  Dashboard: undefined;
  FaultJobs: undefined;
  Map: undefined;
  Analytics: undefined;
  Admin: undefined;
};

type Props = {
  navigation: DrawerNavigationProp<SupervisorDrawerParamList>;
};

const Tab = createBottomTabNavigator<SupervisorTabParamList>();

const tabIcons: Record<keyof SupervisorTabParamList, React.FC<any>> = {
  Dashboard: LayoutDashboard,
  FaultJobs: ClipboardList,
  Map,
  Analytics: BarChart2,
  Admin: ShieldCheck,
};

export function SupervisorTabs({ navigation }: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          ...getResponsiveTabScreenOptions(tabIcons, {}, colors)({ route }),
          header: () => (
            <HeaderBar
              role="Supervisor"
              onOpenSidebar={() => navigation?.toggleDrawer?.()}
            />
          ),
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="FaultJobs" component={AssignmentsScreen} />
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        <Tab.Screen name="Admin" component={AdminScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

