
// components/AppButton.tsx

import React from "react";
import { ButtonProps, StyleSheet, Text, TouchableOpacity } from "react-native";
import { AppTheme } from "@/src/lib/colors";
import { useTheme } from "@react-navigation/native";

type AppButtonProps = Omit<ButtonProps, "color"> & {
  variant?: "primary" | "danger" | "success" | "warning" | "secondary";
};

export const AppButton: React.FC<AppButtonProps> = ({ title, onPress, variant = "primary", ...props }) => {
  const theme = useTheme() as AppTheme;
  const colors = theme.colors;

  const backgroundColor = (() => {
    switch (variant) {
      case "danger":
        return colors.danger;
      case "success":
        return colors.success;
      case "warning":
        return colors.warning;
      case "secondary":
        return colors.secondary;
      case "primary":
      default:
        return colors.primary;
    }
  })();

  const textColor = variant === "primary" ? colors.onPrimary : "#fff";

  // Use TouchableOpacity for consistent styling across platforms
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.7}
      {...props}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
