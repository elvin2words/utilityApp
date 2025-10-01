import React from "react";
import { View } from "react-native";
import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import LinearGradient from "react-native-linear-gradient";

export const DashboardSkeletons = () => {
  return (
    <SkeletonPlaceholder
    LinearGradientComponent={LinearGradient}
    >

        
      {/* Top Grid - 4 Cards */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginVertical: 12 }}>
        {[...Array(4)].map((_, i) => (
          <View key={i} style={{ width: "48%", height: 100, borderRadius: 12, marginBottom: 12 }} />
        ))}
      </View>

      {/* Performance Chart */}
      <View style={{ height: 160, borderRadius: 12, marginBottom: 16 }} />

      {/* Resolution Rate + Priority Distribution */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
        <View style={{ width: "48%", height: 100, borderRadius: 12 }} />
        <View style={{ width: "48%", height: 100, borderRadius: 12 }} />
      </View>

      {/* Other Stats */}
      <View style={{ height: 120, borderRadius: 12, marginBottom: 16 }} />

      {/* Quick Actions */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
        <View style={{ width: "48%", height: 50, borderRadius: 8 }} />
        <View style={{ width: "48%", height: 50, borderRadius: 8 }} />
      </View>

      {/* Recent Activities */}
      <View style={{ height: 160, borderRadius: 12, marginBottom: 16 }} />

      {/* Map Preview */}
      <View style={{ height: 200, borderRadius: 12, marginBottom: 16 }} />

      {/* Alerts */}
      <View style={{ height: 120, borderRadius: 12, marginBottom: 32 }} />
    </SkeletonPlaceholder>
  );
};
