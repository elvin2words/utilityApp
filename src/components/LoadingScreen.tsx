
// ufms/components/LoadingScreen.tsx

import React, { useRef, useEffect, useMemo } from "react"; 
import { Dimensions, Platform, StyleSheet, Text, View, useColorScheme } from "react-native";
import LottieView from "lottie-react-native";
import { getThemeByMode, AppTheme } from "@/src/lib/colors";
import { useThemeStore } from "@/src/lib/themeStore";


// function LoadingScreen() {
//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <ActivityIndicator size="large" color="#0000ff" />
//     </View>
//   );
// }

const { width, height } = Dimensions.get("window");

type LoadingScreenProps = {
  message?: string;
  backgroundColor?: string;
};

export default function LoadingScreen({
  message = "Loading...",
  backgroundColor,
}: LoadingScreenProps) {
  const mode = useThemeStore((s) => s.mode);
  const theme: AppTheme = getThemeByMode(mode);

  const lottieSize = Math.min(width, height) * 0.25; // 25% of screen width

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: backgroundColor || theme.colors.background },
      ]}
    >
      <LottieView
        source={require("@/assets/lottie/loadYingYang.json")}
        autoPlay
        loop
        style={{ width: lottieSize, height: lottieSize }}
      />
      {message ? (
        <Text style={[styles.text, { color: theme.colors.maintext }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  text: {
    marginTop: 16,
    fontSize: Platform.OS === "ios" ? 16 : 15,
    fontWeight: "500",
    textAlign: "center",
  },
});
