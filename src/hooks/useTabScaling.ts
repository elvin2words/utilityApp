import React from "react";
import { useWindowDimensions } from "react-native";


export function useTabScaling(labelLength = 8) {
    
  const { width, height } = useWindowDimensions();
  const isPortrait = height >= width;

  //Label font Size
  //   const fontSize = isPortrait ? 10 : 9;
  // const fontSize = Math.max(10, Math.min(width * 0.03, 12)); // responsive text

  const fontSize = Math.min(
    Math.max(10, width / (labelLength * 2.2)),
    13
  );

  // Icon sizes
  const baseIconSize = Math.max(20, Math.min(width * 0.06, 26));
  const focusedIconSize = baseIconSize + 6;
  // const baseIconSize = isPortrait ? 22 : 20;
  // const focusedIconSize = baseIconSize + 6;

  const padding = isPortrait ? 10 : 6;
  const verticalPadding = isPortrait ? 6 : 4;

  return {
    isPortrait,
    fontSize,
    baseIconSize,
    focusedIconSize,
    padding,
    verticalPadding,
  };
}
