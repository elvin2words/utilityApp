import { StyleSheet, Text, View } from "react-native";
import React from "react";


export default function EscalationsScreen() {
  return (
    <View style={styles.container}>
      <Text>Welcome to Escalations Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
