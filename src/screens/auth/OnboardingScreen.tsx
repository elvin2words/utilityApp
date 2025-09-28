// ufms/screens/onboarding/OnboardingScreen.tsx

import { useRef, useState, useEffect } from "react";
import { Animated, FlatList, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ViewToken, useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LinearGradient } from "expo-linear-gradient";

import type { AuthNavProps } from "@/src/types/nav";
import { useThemeStore } from "@/src/lib/themeStore";
import { getThemeByMode, AppTheme } from "@/src/lib/colors";

import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";

import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as SystemUI from "expo-system-ui";
import * as NavigationBar from 'expo-navigation-bar';


const slides = [
  {
    key: "intro",
    title: "Welcome to the Utility Management System",
    subtitle:
      "Seamlessly monitor performance metrics, manage fault jobs and smoothly streamline field operations offline & in real-time.",
    animation: require("@/assets/lottie/onboarding.json"),
  },
  {
    key: "permissions",
    title: "Permissions Matter",
    subtitle:
      "We need location and notification access to track field deployment and notify you about critical updates.",
    animation: require("@/assets/lottie/perms.json"),
  },
  {
    key: "features",
    title: "Powerful Features",
    subtitle:
      "Real-time & offline mapping, fault tracking, role-based dashboards, and offline-first syncing included.",
    animation: require("@/assets/lottie/work.json"),
  },
];

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const isPortrait = height >= width;
  const isTablet = Math.min(width, height) >= 768;
  
  const navigation = useNavigation<AuthNavProps>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // const colorScheme = useColorScheme();
  // const isDark = colorScheme === "dark";
  // const themeColors = isDark ? MyDarkTheme : MyLightTheme;

  const mode = useThemeStore((s) => s.mode);
  const isDark = mode === "dark";
  
  const themeColors: AppTheme = getThemeByMode(mode);
    
  // Scale animation for button
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  };

  const animatePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  // Set system nav bar colors
  useEffect(() => {
    if (Platform.OS === "android") {
      SystemUI.setBackgroundColorAsync(themeColors.colors.background);
      NavigationBar.setBackgroundColorAsync(themeColors.colors.background);
      NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
      // SystemUI.setNavigationBarStyleAsync(isDark ? "light" : "dark");
      // SystemUI.setBackgroundColorAsync("white");
      // NavigationBar.setBarStyleAsync(isDark ? "light" : "dark");
    }
  }, [themeColors, isDark]);  

  const handleNext = async () => {
    if (currentSlide === 1) { await requestPermissions(); }
    if (currentSlide === slides.length - 1) {
      await AsyncStorage.setItem("hasOnboarded", "true");
      navigation.reset({ index: 0, routes: [{ name: "Login" }], }); // Resets the entire navigation stack and sets 'Login' as the only screen.
      // navigation.replace("Login"); //Replaces the current screen with 'Login' (or any screen), meaning no "Back" to current screen.
      // navigation.navigate('Login'); // Navigates to the Login screen, but keeps the current screen in the stack hwich we can go back to with Back btn.
      // navigationRef.current?.reset({ index: 0, routes: [{ name: 'Login' }], }); // Same as .reset() above, but done via a navigation ref — useful outside of components.
    } else {
      flatListRef.current?.scrollToIndex({ index: currentSlide + 1 });
    }
  };

  const requestPermissions = async () => {
    try {
      const { status: fglocationStatus } = await Location.requestForegroundPermissionsAsync();
      await Location.requestBackgroundPermissionsAsync();
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      if (fglocationStatus !== "granted") { console.warn("Location permission denied"); }
      if (notificationStatus !== "granted") { console.warn("Notification permission denied"); }
    } catch (error) {
      console.error("Permission error:", error);
    }
  };

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const index = viewableItems[0].index || 0;
        setCurrentSlide(index);
        Animated.spring(animatedValue, {
          toValue: index,
          useNativeDriver: false,
        }).start();
      }
    }
  );

  const renderItem = ({ item }: any) => (
    <View style={[styles.slide, { width, paddingTop: insets.top + 16, paddingBottom: height * 0.15 }]}>
      <LottieView 
        source={item.animation} 
        autoPlay 
        loop 
        style={{
          width: width * (isTablet ? 0.5 : 0.7),
          height: height * (isPortrait ? 0.4 : 0.6),
          marginBottom: 20,    
        }} 
      />
      <Text style={[styles.title,  { color: themeColors.colors.maintext, fontSize: isTablet ? 28 : 22 }]}>{item.title}</Text>
      <Text style={[styles.subtitle,  { color: themeColors.colors.subtext, fontSize: isTablet ? 18 : 15 }]}>{item.subtitle}</Text>
    </View>
  );  

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => {
        const scale = animatedValue.interpolate({
          inputRange: [index - 1, index, index + 1],
          outputRange: [1, 1.4, 1],
          extrapolate: "clamp",
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: 
                currentSlide === index
                ? themeColors.colors.primary || "#3B82F6"
                  : themeColors.colors.border || "#ccc",
               },
              { transform: [{ scale }] },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container,]}>
        <FlatList
          data={slides}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item: { key: string }) => item.key}
          ref={flatListRef}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig}        
        />

        {/* Footer with Dots and Button */}
        <View style={[
          styles.footer,
          { paddingBottom: insets.bottom } // shift entire footer above nav area
          // { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 } // accounts for nav area
        ]}>
          {/* {renderDots()} */}

          <View style={[styles.dotsContainer, { marginBottom: 26 + insets.bottom }]}>
            {renderDots()}
          </View>
          <Animated.View style={{ transform: [{ scale: scaleAnim }], width: "100%" }}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={handleNext}
              onPressIn={animatePressIn}
              onPressOut={animatePressOut}
            >
              <LinearGradient
                colors={ (themeColors.colors as any).primaryGradient ?? ["#3B82F6","#2563EB","#1E40AF"] }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={[ styles.buttonText, ]}>
                  {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
    </SafeAreaView> 
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  subtitle: {
    textAlign: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    // marginBottom: 26,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignItems: "center",
  },
  button: {
    paddingVertical: 14,
    borderTopRightRadius:25, 
    borderTopLeftRadius:25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});