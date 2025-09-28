
// screens/Artisan/TasksScreen.tsx 

import React, { useState, useMemo, useCallback, useRef } from "react";
import { FlatList, KeyboardAvoidingView, Platform, 
  RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { IconButton, Menu, Provider as PaperProvider } from "react-native-paper";
import Toast from "react-native-toast-message";

import { Filter, ArrowDownUp, ClipboardList, CheckCircle, Clock, } from "lucide-react-native";

import { FaultCard } from "@/src/components/FaultJobCard";
import LoadingScreen from "@/src/components/LoadingScreen";

import { useTasks } from "@/src/hooks/useTasks";
import { useTaskActions } from "@/src/hooks/useTaskActions";

import { useThemeStore } from "@/src/lib/themeStore";
import { getThemeByMode, AppTheme } from "@/src/lib/colors";

import mockFaults from "@/assets/mocks/mockFaults.json"; // mock fallback
import { useAppStore } from "@/src/stores/appStore";
import { BOTTOM_NAV_SAFE } from "@/src/utils/misc";



export default function TasksTab() {
  const { tasks: apiTasks, isLoading, refetch, isFetching } = useTasks();
  const { updateStatus } = useTaskActions();
  const { width } = useWindowDimensions();

  const { showMockData } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "delayed" | "pending">("all");
  const [sortOption, setSortOption] = useState<"priority" | "time" | "location">("priority");
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const mode = useThemeStore((s) => s.mode);
  const themeColors: AppTheme = getThemeByMode(mode);

  const allTasks = useMemo(() => {
    if (apiTasks && apiTasks.length > 0) {
      return apiTasks;
    }
    // mockFaults are Fault[] → wrap into same { fault } shape as API
    return (showMockData ? (mockFaults as any[]): []).map((f) => ({ fault: f }));
  }, [apiTasks, showMockData]);

  // const allTasks = useMemo(() => {
  //   if (showMockData) {
  //     // mockFaults are Fault[] → wrap into { fault }
  //     return (mockFaults as any[]).map((f) => ({ fault: f }));
  //   }
  //   return apiTasks ?? [];
  // }, [apiTasks, showMockData]);

  // filter + sort
  const sortedTasks = useMemo(() => {
    const filtered = allTasks.filter((t) =>
      statusFilter === "all" ? true : t.fault.status === statusFilter
    );

    return [...filtered].sort((a, b) => {
      if (sortOption === "priority") {
        const map = { high: 0, medium: 1, low: 2 };
        return map[a.fault.priority ?? 99] - map[b.fault.priority ?? 99];
      }
      if (sortOption === "time") {
        return new Date(a.fault.reported_time).getTime() - 
        new Date(b.fault.reported_time).getTime();
      }
      if (sortOption === "location") {
        return a.fault.location_name.localeCompare(b.fault.location_name);
      }
      return 0;
    });
  }, [allTasks, statusFilter, sortOption]);

  const renderItem = useCallback( 
    ({ item }) => (
      <Swipeable renderRightActions={() => null}>
        <FaultCard
          fault={item.fault}
          // type={item.fault.status}
          type="task" // <-- force default type for all faults
          themeColors={themeColors}
          actionButtons={[
            {
              label: "View Details",
              action: () => Toast.show({ type: "info", text1: "Open detail" }),
              primary: true,
            },
            {
              label: "Complete",
              action: () => updateStatus(item.fault.id, "completed"),
            },
            {
              label: "Delay",
              action: () => updateStatus(item.fault.id, "delayed"),
            },
          ]}
        />
      </Swipeable>
    ), 
    [updateStatus, themeColors]
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyState}>
      <ClipboardList size={66} color={themeColors.colors.subtext} />
      <Text style={[styles.emptyTitle, { color: themeColors.colors.maintext }]}>No Tasks Available</Text>
      <Text style={[styles.emptySubtitle, { color: themeColors.colors.subtext }]}>
        You're all caught up! Pull to refresh or check back later.
      </Text>
    </View>
  );

  return (
    <PaperProvider>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: themeColors.colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View 
          style={[
            styles.header, 
            { 
              backgroundColor: themeColors.colors.card, 
              borderColor: themeColors.colors.border 
            }
          ]}
        >
          <View style={styles.leftActions}>
            {/* Filter Menu */}
            <Menu
              visible={filterMenuVisible}
              onDismiss={() => setFilterMenuVisible(false)}
              anchor={
                <IconButton
                  icon={() => <Filter size={20} color={themeColors.colors.text} />}
                  size={26}
                  onPress={() => {
                    setFilterMenuVisible(true);
                    setSortMenuVisible(false);
                  }}
                />
              }
              style={{ marginTop: -16 }} 
            >
              {["all", "pending", "completed", "delayed"].map((status) => (
                <Menu.Item
                  key={status}
                  onPress={() => {
                    setStatusFilter(status as any);
                    setFilterMenuVisible(false);
                  }}
                  title={status.charAt(0).toUpperCase() + status.slice(1)}
                  leadingIcon={statusFilter === status ? "check" : undefined}
                />
              ))}
            </Menu>

            {/* Sort Menu */}
            <Menu
              visible={sortMenuVisible}
              onDismiss={() => setSortMenuVisible(false)}
              anchor={
                <IconButton
                  icon={() => <ArrowDownUp size={20} color={themeColors.colors.text} />}
                  size={26}
                  onPress={() => {
                    setSortMenuVisible(true);
                    setFilterMenuVisible(false);
                  }}
                />
              }
              style={{ marginTop: -16 }} 
            >
              {[
                { key: "priority", label: "Priority" }, 
                { key: "time", label: "Reported Time" }, 
                { key: "location", label: "Location" }
              ].map((opt) => (
                <Menu.Item
                  key={opt.key}
                  onPress={() => {
                    setSortOption(opt.key as any);
                    setSortMenuVisible(false);
                  }}
                  title={opt.label}
                  leadingIcon={sortOption === opt.key ? "check" : undefined}
                />
              ))}
            </Menu>
          </View>

          <Text style={[styles.title, { fontSize: width < 360 ? 16 : 18, color: themeColors.colors.maintext }]}>
            {statusFilter === "all"
              ? "My Tasks"
              : `My Tasks (${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)})`}
          </Text>

          <View style={styles.rightActions}>
            <IconButton
              icon={() => <Clock size={20} color={statusFilter === "pending" ? themeColors.colors.primary : themeColors.colors.subtext} />}
              size={26}
              onPress={() => {
                setStatusFilter("pending");
                setFilterMenuVisible(false);
                setSortMenuVisible(false);
              }}
            />
            <IconButton
              icon={() => <CheckCircle size={20} color={statusFilter === "completed" ? themeColors.colors.success : themeColors.colors.subtext} />}
              size={26}
              onPress={() => {
                setStatusFilter("completed");
                setFilterMenuVisible(false);
                setSortMenuVisible(false);
              }}
            />
          </View>
        </View>

        {/* Body */}
        {isLoading && allTasks.length === 0 ? (
          <LoadingScreen message="Loading Tasks ..." />
        // ) : sortedTasks.length === 0 ? (
        //   <ScrollView
        //     // ref={scrollRef}
        //     showsVerticalScrollIndicator={false}
        //     contentContainerStyle={[styles.emptyState, { flexGrow: 1 }]}
        //     refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={themeColors.colors.primary} />}
        //     keyboardShouldPersistTaps="handled"
        //   >
        //     <ClipboardList size={66} color={themeColors.colors.subtext} />
        //     <Text style={[styles.emptyTitle, { color: themeColors.colors.maintext }]}>No Tasks Available</Text>
        //     <Text style={[styles.emptySubtitle, { color: themeColors.colors.subtext }]}>
        //       You're all caught up! Pull to refresh or check back later.
        //     </Text>
        //   </ScrollView>
        ) : (
          <FlatList
            data={sortedTasks}
            keyExtractor={({ fault }) => fault.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingTop: 56, 
              paddingBottom: BOTTOM_NAV_SAFE,
              flexGrow: 1,          // important for empty state to center vertically
              justifyContent: sortedTasks.length === 0 ? 'center' : 'flex-start'
            }}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={themeColors.colors.primary} />}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            decelerationRate="fast"
            renderItem={renderItem}
            ListEmptyComponent={renderEmptyComponent}
            // ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            removeClippedSubviews={true} // improves performance
          />
        )}
      </KeyboardAvoidingView>
      <Toast />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding:12
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  leftActions: { flexDirection: "row", alignItems: "center" },
  rightActions: { flexDirection: "row", alignItems: "center" },
  title: { fontWeight: "700", textAlign: "center", flex: 1 },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: "700", marginTop: 12 },
  emptySubtitle: { fontSize: 14, textAlign: "center", marginTop: 6 },
});
