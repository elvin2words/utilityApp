
// components/ui/Button.tsx

import React, { forwardRef } from "react";
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type Size = "default" | "sm" | "lg" | "icon";

interface ButtonProps { 
  variant?: Variant;
  size?: Size;
  asChild?: boolean; // not really needed in RN, can ignore or handle children as is
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[]; // additional styles
  textStyle?: TextStyle | TextStyle[]; // additional text styles
}

// Variant styles
const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: "#3b82f6", // Tailwind bg-primary
    color: "#fff", // primary foreground
  },
  destructive: {
    backgroundColor: "#ef4444", // red-500
    color: "#fff",
  },
  outline: {
    borderWidth: 1,
    borderColor: "#d1d5db", // gray-300
    backgroundColor: "#fff",
    color: "#374151", // gray-700
  },
  secondary: {
    backgroundColor: "#6b7280", // gray-500
    color: "#fff",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "#374151",
  },
  link: {
    backgroundColor: "transparent",
    color: "#3b82f6",
  },
});

// Size styles
const sizeStyles = StyleSheet.create({
  default: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  sm: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  lg: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  icon: {
    height: 40,
    width: 40,
    borderRadius: 6,
    paddingHorizontal: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});

const Button = forwardRef<any, ButtonProps>(({
  variant = "default",
  size = "default",
  children,
  onPress,
  disabled = false,
  style,
  textStyle,
}, ref) => {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        sizeStyle,
        {
          backgroundColor: pressed && !disabled 
            ? darkenColor(variantStyle.backgroundColor || "transparent", 0.1) 
            : variantStyle.backgroundColor,
          opacity: disabled ? 0.5 : 1,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: variant === "outline" ? "#d1d5db" : undefined,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text style={[{ color: variantStyle.color, fontWeight: "600", fontSize: 14 }, textStyle]}>
        {children}
      </Text>
    </Pressable>
  );
});

Button.displayName = "Button";

// Helper function to darken a hex color (simple implementation)
function darkenColor(color: string, amount: number) {
  if (!color.startsWith("#") || color.length !== 7) return color;
  let r = Math.max(0, parseInt(color.slice(1, 3), 16) - amount * 255);
  let g = Math.max(0, parseInt(color.slice(3, 5), 16) - amount * 255);
  let b = Math.max(0, parseInt(color.slice(5, 7), 16) - amount * 255);
  return "#" + [r, g, b].map(x => Math.floor(x).toString(16).padStart(2, "0")).join("");
}

export { Button };
