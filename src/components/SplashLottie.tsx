// components/SplashLottie.tsx

import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import LottieView from "lottie-react-native";


type SplashLottieProps = {
  onAnimationFinish?: () => void;
};

export default function SplashLottie({ onAnimationFinish }: SplashLottieProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    animationRef.current?.play();
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        ref={animationRef}
        source={require("@/assets/lottie/loadHP.json")}
        autoPlay={false}
        loop={false}
        style={styles.animation}
        onAnimationFinish={() => {
          if (onAnimationFinish) {
            onAnimationFinish();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    zIndex: 1000,
  },
  animation: {
    width: 200,
    height: 200,
  },
});
