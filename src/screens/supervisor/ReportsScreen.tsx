import { StyleSheet, Text, View } from "react-native";
import React from "react";


export default function ReportsScreen() {
  return (
    <View style={styles.container}>
      <Text>Welcome to Reports Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
