
// components/ui/Progress.tsx

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

type ProgressProps = {
  value?: number; // 0–100
  style?: ViewStyle;
  backgroundColor?: string;
  fillColor?: string;
  height?: number;
};

export const Progress = React.forwardRef<View, ProgressProps>(
  (
    {
      value = 0,
      style,
      backgroundColor = '#E5E7EB', // Tailwind gray-200
      fillColor = '#3B82F6',       // Tailwind blue-500
      height = 16,
    },
    ref
  ) => {
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(progressAnim, {
        toValue: value,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }, [value]);

    const widthInterpolated = progressAnim.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });

    return (
      <View
        ref={ref}
        style={[
          styles.container,
          { backgroundColor, height },
          style,
        ]}
      >
        <Animated.View
          style={[
            styles.filler,
            {
              backgroundColor: fillColor,
              width: widthInterpolated,
            },
          ]}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  filler: {
    height: '100%',
  },
});
