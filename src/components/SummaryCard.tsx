import React from "react";
import { StyleSheet, Text, View } from "react-native";



type SummaryCardProps = {
  label: string;
  value: number;
};

export const SummaryCard = ({ label, value }: SummaryCardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2563EB",
  },
  label: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
});
