import { StyleSheet, Text, View } from "react-native";
import React from "react";


export default function ApprovalsScreen() {
  return (
    <View style={styles.container}>
      <Text>Welcome to Approvals Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
