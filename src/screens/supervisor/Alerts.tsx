import { StyleSheet, Text, View } from "react-native";
import React from "react";


export default function AlertsScreen() {
  return (
    <View style={styles.container}>
      <Text>Welcome to Alerts Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
