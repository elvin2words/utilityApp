
// components/ui/charts/BarChart.tsx

import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";

type DataPoint = Record<string, string | number>;

type BarChartProps = {
  data: DataPoint[];
  xKey: string;
  yKey: string;
  targetKey?: string;
  color?: string; // hex color or named color
};

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKey,
  targetKey,
  color = '#3B82F6', // default to Tailwind's 'blue-500'
}) => {
  const maxValue = useMemo(() => {
    if (!data.length) return 100;
    const values = data.map(d =>
      Math.max(
        typeof d[yKey] === 'number' ? (d[yKey] as number) : 0,
        targetKey && typeof d[targetKey] === 'number' ? (d[targetKey] as number) : 0
      )
    );
    return Math.max(...values) * 1.2; // Add 20% padding
  }, [data, yKey, targetKey]);

  if (!data.length) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const barWidth = Math.max(screenWidth / data.length - 16, 30);

  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.chartContainer}
      showsHorizontalScrollIndicator={false}
    >
      {data.map((item, index) => {
        const value = typeof item[yKey] === 'number' ? (item[yKey] as number) : 0;
        const targetValue =
          targetKey && typeof item[targetKey] === 'number' ? (item[targetKey] as number) : null;

        const heightPercent = (value / maxValue) * 100;
        const targetHeightPercent = targetValue !== null ? (targetValue / maxValue) * 100 : null;

        return (
          <View key={index} style={[styles.barItem, { width: barWidth }]}>
            <View style={styles.barWrapper}>
              {targetValue !== null && (
                <View
                  style={[
                    styles.targetLine,
                    {
                      bottom: `${targetHeightPercent}%`,
                    },
                  ]}
                />
              )}
              <View
                style={[
                  styles.bar,
                  {
                    height: `${heightPercent}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            <Text style={styles.label}>{item[xKey]}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#9CA3AF', 
  },
  chartContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'flex-end',
  },
  barItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  barWrapper: {
    height: 200,
    width: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
    backgroundColor: '#E5E7EB', 
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#6B7280', 
  },
  label: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    color: '#374151', 
  },
});
