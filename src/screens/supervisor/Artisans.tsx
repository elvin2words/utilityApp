import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { DashboardSkeletons } from "@/src/components/ui/skeletons";


export default function ArtisansScreen() {
  return (
    <View style={styles.container}>
      <Text>Welcome to Artisans Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
