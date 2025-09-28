// utils/mapThemes.ts

import React from "react";

export const mapThemes = {
  light: [
    {
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#000000" }],
    },
  ],
  dark: [
    {
      elementType: "geometry",
      stylers: [{ color: "#212121" }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#e0e0e0" }],
    },
  ],
};
