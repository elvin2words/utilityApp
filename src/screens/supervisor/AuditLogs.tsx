import { StyleSheet, Text, View } from "react-native";
import React from "react";


export default function AuditLogsScreen() {
  return (
    <View style={styles.container}>
      <Text>Welcome to AuditLogs Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
