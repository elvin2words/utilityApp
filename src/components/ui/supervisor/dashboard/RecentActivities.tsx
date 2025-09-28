
// components/dashboard/RecentActivities.tsx
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

interface Activity {
  id: string;
  message: string;
  time: string;
}

interface Props {
  data: Activity[];
}

export default function RecentActivities({ data }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recent Activities</Text>
      {data.length === 0 ? (
        <Text style={styles.empty}>No recent activity</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.activityItem}>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16, backgroundColor: "#fff", borderRadius: 12, padding: 12 },
  header: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  empty: { textAlign: "center", color: "#666", padding: 12 },
  activityItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },
  message: { fontSize: 14, color: "#333" },
  time: { fontSize: 12, color: "#999", marginTop: 4 },
});
