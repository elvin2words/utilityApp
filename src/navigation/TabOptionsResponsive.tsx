
// ufms/navigation/tabOptionsResponsive.ts
 
import React, { useCallback } from "react";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { useSharedValue, withSpring, withTiming, useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { useTheme } from "@react-navigation/native";

import * as Haptics from "expo-haptics";

import { useBadgeStore } from "@/src/stores/badgeStore";
import { useTabScaling } from "@/src/hooks/useTabScaling";
import { useAppStore } from "@/src/stores/appStore";


type IconComponent = React.ComponentType<{ size: number; color: string }>;
type BadgeCounts = Record<string, number | undefined>;

type Colors = {
  card: string;
  border: string;
  text: string;
  primary: string;
  background: string;
};

export function getResponsiveTabScreenOptions(
  icons: Record<string, IconComponent>,
  badgeCounts: BadgeCounts = {},
  colors?: Colors
) {
  const tabRouteNames = Object.keys(icons);
  const longestLabel = tabRouteNames.reduce((a, b) => (a.length > b.length ? a : b));
  const longestLength = longestLabel.length;

  return ({ route }: { route: { name: string } }) => {
    const Icon = icons[route.name];
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const theme = useTheme();

    // Adaptive font size
    // const fontSize = Math.min(Math.max(10, Math.floor(width / (longestLength * 2.5))), 13);
    const fontSize = Math.max(10, Math.min(width / (longestLength * 1.8), 12));
    // const fontSize = Math.max(10, Math.min(width / (longestLength * 2.2), 14));
    // const fontSize = Math.min(Math.max(10, Math.floor(width / (longestLength * 2.5))), 13);
    const bottomPadding = Math.max(insets.bottom, Platform.OS === "android" ? 10 : 16);
    
    // Badge logic
    const { tasksBadge, notificationsBadge } = useBadgeStore();
    const badgeCount = badgeCounts[route.name];
    const showDot =
      (route.name === "Tasks" && tasksBadge) ||
      (route.name === "Home" && notificationsBadge);

    // Tab scaling
    const { baseIconSize, focusedIconSize, verticalPadding } = useTabScaling(route.name.length);

    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    // Run animation only when focus changes
    // const updateScale = (focused: boolean) => {
    //   scale.value = focused
    //     ? withSpring(1.15, { damping: 12, stiffness: 90 })
    //     : withSpring(1, { damping: 12, stiffness: 90 });
    // };

    const updateScale = useCallback(
      (focused: boolean) => {
        scale.value = withSpring(focused ? 1.15 : 1, {
          damping: 12,
          stiffness: 90,
        });
      },
      [scale]
    );

    const onTabPress = (props: BottomTabBarButtonProps) => (e: any) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const isFocused = props.accessibilityState?.selected;
      if (isFocused) {
        const event = props.navigation?.emit({
          type: "tabPress",
          target: props.accessibilityState?.selected,
          canPreventDefault: true,
        });
        if (!event?.defaultPrevented) {
          props.navigation?.emit({
            type: "scrollToTop",
            target: props?.key ?? "",
          });
        }
      }
      props.onPress?.(e);
    };

    return {
      tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => {
        // scale.value = withTiming(focused ? 1.15 : 1, { duration: 150 });
        updateScale(focused);

        return (
          <Animated.View style={[styles.iconContainer, animatedStyle]}>
            <Icon size={focused ? focusedIconSize : baseIconSize} color={color} />
            {badgeCount != null && badgeCount > 0 && (
              <View style={[
                styles.badge,
                {
                  // Offset relative to icon size
                  top: -(focused ? focusedIconSize : baseIconSize) * 0.2,
                  right: -(focused ? focusedIconSize : baseIconSize) * 0.2,
                },
              ]}>
                <Text style={styles.badgeText}>
                  {badgeCount > 99 ? "99+" : badgeCount}
                </Text>
              </View>
            )}
            {showDot && <Animated.View style={styles.dotBadge} />}
          </Animated.View>
        );
      },
      tabBarLabel: ({ focused, color }: { focused: boolean; color: string }) => (
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={[
            styles.tabLabel,
            { fontSize, color, fontWeight: focused ? "600" : "400" },
          ]}
        >
          {route.name}
        </Text>
      ),
      tabBarButton: (props: BottomTabBarButtonProps) => (
        <Pressable
          {...props}
          android_ripple={{
            color: "rgba(46, 40, 40, 0)",
            borderless: false,
          }}
          onPress={onTabPress(props)}
          style={({ pressed }) => [
            styles.tabButton,
            { backgroundColor: pressed ? "rgba(37,99,235,0.08)" : "transparent" },
          ]}
        />
      ),
      tabBarActiveTintColor: theme.colors.primary ?? "#2563EB",
      tabBarInactiveTintColor: theme.colors.text ?? "#6B7280",
      tabBarStyle: [
        styles.tabBar,
        {
          height: 60 + insets.bottom,
          paddingTop: verticalPadding,
          paddingBottom: bottomPadding,
          backgroundColor: theme.colors.card ?? "#FFFFFF",
        },
      ],
      headerShown: true,
    };
  };
}

const styles = StyleSheet.create({
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },  
  badge: {
    position: "absolute",
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 4,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  badgeText: { color: "white", fontSize: 10, fontWeight: "bold" },
  dotBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF6666",
  },
  tabLabel: {
    paddingTop: 2,
    textAlign: "center",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    marginHorizontal: 6,
  },
  tabBar: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
});
