import React from "react";
import { Dimensions, PixelRatio } from "react-native";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base width from iPhone 11 (375)
const BASE_WIDTH = 375;

export function RFValue(size: number) {
  return Math.round(PixelRatio.roundToNearestPixel(size * (SCREEN_WIDTH / BASE_WIDTH)));
}

export function RFPercentage(percent: number) {
  return (SCREEN_HEIGHT * percent) / 100; // percentage of screen height
}
