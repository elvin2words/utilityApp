
// components/SplashFade.tsx
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, StyleSheet, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";

const SplashFade = ({ onFinish }: { onFinish: () => void }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const run = async () => {
      await SplashScreen.preventAutoHideAsync();

      Animated.timing(opacity, {
        toValue: 0,
        duration: 1000,
        delay: 1000, // logo stays fully visible for 1s
        useNativeDriver: true,
      }).start(async () => {
        await SplashScreen.hideAsync();
        onFinish(); // notify parent to render main app
      });
    };

    run();
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, { opacity }]}>
      <Image
        // source={require("@/assets/splash-logo.png")} // replace with your logo
        style={styles.logo}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff", // match your SplashScreen background
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
  },
});

export default SplashFade;
