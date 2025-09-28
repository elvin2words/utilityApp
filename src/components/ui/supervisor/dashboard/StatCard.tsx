
// components/dashboard/StatCard.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatCardProps {
  title: string;
  value: number;
  color: string;
}

export default function StatCard({ title, value, color }: StatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: color + "20" }]}>
      <Text style={[styles.title, { color }]}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  value: { fontSize: 24, fontWeight: "bold" },
});
