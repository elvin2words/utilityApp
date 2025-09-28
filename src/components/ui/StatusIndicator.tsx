
// ufms/components/StatusIndicator.tsx

import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { statusConfig, type StatusType } from "@/src/lib/utils";

type StatusIndicatorProps = {
  status: StatusType;
  size?: "sm" | "md" | "lg";
  withLabel?: boolean;
  active?: boolean;
};

const baseSizeMap = {
  sm: 6,
  md: 10,
  lg: 14,
};

export function StatusIndicator({
  status,
  size = "md",
  withLabel = false,
  active = false,
}: StatusIndicatorProps) {
  const { width } = useWindowDimensions();
  const scaleFactor = width / 375; // iPhone 12 width baseline
  const { color, label } = statusConfig[status];

  // const dotSize = baseSizeMap[size];
  const dotSize = Math.round((baseSizeMap[size] ?? 10) * scaleFactor);
  const fontSize = Math.max(10, Math.min(scaleFactor * 12, 14));
  
  const scale = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    
    if (!active || !(status === "inGeofence" || status === "online")) return;

    pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 0.65,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseRef.current.start();
    // } else {
    //   scale.setValue(1); // reset scale
    //   pulseRef.current?.stop?.();
    // }

    // return () => {
    //   pulseRef.current?.stop?.();
    // };
    return () => {
      pulseRef.current.stop();
      scale.setValue(1);
    };
  }, [status, active]);

  return (
    <View style={styles.container}>
      <Animated.View
        accessible
        accessibilityRole="image"
        accessibilityLabel={label}
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: color,
            transform:
              active && (status === "inGeofence" || status === "online")
                ? [{ scale }]
                : undefined,
          },
        ]}
      />
      {withLabel && 
        <Text style={[ styles.label, {fontSize,}, ]} >
          {label}
        </Text>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    // marginRight: 4,
  },
  dot: {
    borderRadius: 999,
  },
  label: {
    // fontSize: 12,
    marginLeft: 6,
    color: "#374151",
  },
});
