import React from "react";
import { Dimensions, PixelRatio } from "react-native";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base width & height are from iPhone 11 / 375 x 812
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export function normalizeWidth(size: number) {
  return Math.round(PixelRatio.roundToNearestPixel((SCREEN_WIDTH / BASE_WIDTH) * size));
}

export function normalizeHeight(size: number) {
  return Math.round(PixelRatio.roundToNearestPixel((SCREEN_HEIGHT / BASE_HEIGHT) * size));
}

export function normalizeFont(size: number) {
  return Math.round(PixelRatio.roundToNearestPixel(size * (SCREEN_WIDTH / BASE_WIDTH)));
}
