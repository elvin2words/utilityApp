import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Utility to pick cluster color by severity/type
const getClusterColor = (props: any) => {
  if (props.hasCritical) return "#dc2626"; // red
  if (props.hasMajor) return "#f97316"; // orange
  if (props.hasMinor) return "#facc15"; // yellow
  return "#2563eb"; // default blue
};

type ClusterMarkerProps = {
  count: number;
  representativeType?: string; // first fault type in cluster
  hasCritical?: boolean;
  hasMajor?: boolean;
  hasMinor?: boolean;
};

export const ClusterMarker: React.FC<ClusterMarkerProps> = ({
  count,
  representativeType = "F", // fallback "F" for Fault
  hasCritical,
  hasMajor,
  hasMinor,
}) => {
  const backgroundColor = getClusterColor({ hasCritical, hasMajor, hasMinor });

  const width = Math.min(60 + Math.log(count) * 10, 120); // min 60, max 120
  
  return (
    <View style={[styles.container, { backgroundColor, width }]}>
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.type}>{representativeType.charAt(0).toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 20, // pill shape
    borderBottomRightRadius: 40, // pill shape
    borderColor:"#a02c2cff",
    // borderWidth:1,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3.5,
    elevation: 5,
  },
  type: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    marginRight: 6,
  },
  count: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
});
