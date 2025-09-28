import { StyleSheet, Text, View } from "react-native";
import React from "react";


export default function FaultJobAssignmentScreen() {
  return (
    <View style={styles.container}>
      <Text>Welcome to Fault Job Assignment Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
