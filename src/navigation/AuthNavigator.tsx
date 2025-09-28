
// ufms/navigation/AuthNavigator.tsx

import React, { useEffect, useState, useCallback } from "react"; 
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "@/src/lib/auth/AuthContext";

import LoginScreen from "@/src/screens/auth/LoginScreen";
import OnboardingScreen from "@/src/screens/auth/OnboardingScreen";
import LoadingScreen from "@/src/components/LoadingScreen";

// Other Auth screens 
// import RegisterScreen from "@/src/screens/auth/RegisterScreen";
// import ForgotPasswordScreen from "@/src/screens/auth/ForgotPassword";
// import OTPVerifyScreen from "@/src/screens/auth/OTPVerifyScreen";
// import SocialLoginScreen from "@/src/screens/auth/SocialLogin";


export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register?: undefined;
  ForgotPassword?: undefined;
  VerifyOTP?: undefined;
  SocialLogin?: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

// function AuthLoadingScreen() { 
//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <ActivityIndicator size="large" color="#0000ff" />
//     </View>
//   );
// }


export default function AuthNavigator() {
  const { loading } = useAuth();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  // const checkOnboarding = useCallback(async () => {
  //   try {
  //     const onboarded = await AsyncStorage.getItem("hasOnboarded");
  //     setHasOnboarded(onboarded === "true");
  //   } catch (err) {
  //     console.error("Failed to read onboarding status", err);
  //     setHasOnboarded(false);
  //   }
  // }, []);
  // useEffect(() => {
  //   checkOnboarding();
  // }, [checkOnboarding]);

  // Check onboarding status from AsyncStorage
  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      try {
        const storedValue = await AsyncStorage.getItem("hasOnboarded");
        setHasOnboarded(storedValue === "true");
      } catch (error) {
        console.error("Error fetching onboarding status:", error);
        setHasOnboarded(false);
      }
    };
    fetchOnboardingStatus();
  }, []);

  // Loading state (either auth loading or onboarding check)
  if (loading || hasOnboarded === null) return <LoadingScreen />;

  return (
    <Stack.Navigator
      initialRouteName={hasOnboarded ? "Login" : "Onboarding"}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />

      {/* Future-ready for additional screens */}
      {/* <Stack.Screen name="Register" component={RegisterScreen} /> */}
      {/* <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} /> */}
      {/* <Stack.Screen name="VerifyOTP" component={OTPVerifyScreen} /> */}
      {/* <Stack.Screen name="SocialLogin" component={SocialLoginScreen} /> */}
    </Stack.Navigator>
  );
}

