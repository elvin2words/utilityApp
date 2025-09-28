import { Dimensions, StyleSheet, Text, View } from "react-native";
// // components/dashboard/PerformanceChart.tsx
// import React from "react";
// 
// import { LineChart } from "react-native-gifted-charts";

// export default function PerformanceChart({ data, onPointClick }: { data: number[]; onPointClick?: (index: number) => void }) {
//   const chartData = data.map((value, index) => ({ value, label: `Day ${index + 1}` }));

//   return (
//     <View style={styles.chartCard}>
//       <Text style={styles.title}>Performance (last 7 days)</Text>
//       <LineChart
//         data={chartData}
//         curved
//         thickness={3}
//         hideDataPoints={false}
//         dataPointsColor="#3b82f6"
//         showStripOnFocus
//         stripColor="#93c5fd"
//         onPress={(point) => onPointClick && onPointClick(point.index)}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   chartCard: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginVertical: 8 },
//   title: { fontWeight: "bold", fontSize: 16, marginBottom: 8 },
// });


// components/dashboard/PerformanceChart.tsx
import React from "react";

import { VictoryChart, VictoryLine, VictoryTheme, VictoryTooltip, VictoryVoronoiContainer } from "victory-native";

interface Props {
  data: number[];
  onPointClick: (index: number) => void;
}

export default function PerformanceChart({ data, onPointClick }: Props) {
  const formattedData = data.map((y, i) => ({ x: `Day ${i + 1}`, y }));

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Performance Overview</Text>
      <VictoryChart
        width={Dimensions.get("window").width - 40}
        theme={VictoryTheme.material}
        containerComponent={
          <VictoryVoronoiContainer
            labels={({ datum }) => `${datum.x}\n${datum.y}%`}
            labelComponent={<VictoryTooltip flyoutStyle={{ fill: "#333", stroke: "#fff" }} />}
            onActivated={(points) => {
              if (points[0]) onPointClick(formattedData.indexOf(points[0]));
            }}
          />
        }
      >
        <VictoryLine
          data={formattedData}
          style={{ data: { stroke: "#2563eb", strokeWidth: 3 } }}
        />
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 16, backgroundColor: "#fff", borderRadius: 12, padding: 12 },
  header: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
});
