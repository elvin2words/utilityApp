import { StyleSheet, Text, View } from "react-native";
import React from "react";


export default function ShiftsScreen() {
  return (
    <View style={styles.container}>
      <Text>Welcome to Shifts Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
