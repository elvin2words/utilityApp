import React from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// types/nav.ts
export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
};

export type AuthNavProps = NativeStackNavigationProp<AuthStackParamList>;
