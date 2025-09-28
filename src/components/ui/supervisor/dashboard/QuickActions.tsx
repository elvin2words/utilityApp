
// components/dashboard/QuickActions.tsx
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface QuickAction {
  label: string;
  icon: string;
  onPress: () => void;
}

interface Props {
  actions: QuickAction[];
}


const QuickActions: React.FC<{ onCreate: () => void; onAcknowledge: () => void; onAssign: () => void }> = ({
  onCreate,
  onAcknowledge,
  onAssign,
}) => (
  <View style={styles.actionsRow}>
    <Pressable style={styles.primaryBtn} onPress={onCreate} accessibilityRole="button">
      <Feather name="plus" size={16} color="#fff" />
      <Text style={styles.primaryText}>Log Fault</Text>
    </Pressable>

    <Pressable style={styles.outlineBtn} onPress={onAcknowledge} accessibilityRole="button">
      <Feather name="check" size={16} color="#3b82f6" />
      <Text style={styles.outlineText}>Acknowledge</Text>
    </Pressable>

    <Pressable style={styles.ghostBtn} onPress={onAssign} accessibilityRole="button">
      <Feather name="user-check" size={16} color="#111827" />
      <Text style={styles.ghostText}>Quick Assign</Text>
    </Pressable>
  </View>
);

const RecentActivityItem: React.FC<{ activity: ActivityLog }> = ({ activity }) => {
  const icon = activity.action === "CREATE_FAULT" ? "⚠️" : activity.action === "CREATE_ASSIGNMENT" ? "📌" : "🔁";
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityIconWrap}>
        <Text style={styles.activityIconText}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.activityDescription}>{activity.description}</Text>
        <Text style={styles.activityTimestamp}>{formatTimeAgo(activity.timestamp)}</Text>
      </View>
    </View>
  );
};

export default function QuickActions({ actions }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Quick Actions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {actions.map((action, index) => (
          <TouchableOpacity key={index} style={styles.actionButton} onPress={action.onPress}>
            <Ionicons name={action.icon} size={28} color="#2563eb" />
            <Text style={styles.label}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  header: { fontSize: 18, fontWeight: "600", marginBottom: 8, color: "#333" },
  actionButton: {
    width: 90,
    height: 90,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  label: { fontSize: 12, marginTop: 6, textAlign: "center" },
});
