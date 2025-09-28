// screens/artisan/ProfileStack.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '@/src/screens/artisan/ProfileScreen';
import SettingsScreen from '@/src/screens/common/SettingsScreen';
import DevSettingsScreen from '@/src/screens/dev/DevSettingsScreen';

const Stack = createNativeStackNavigator(); 

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} 
        options={{
                title: "Settings",
                headerBackTitle: "Back",
              }} />
      <Stack.Screen name="DevSettings" component={DevSettingsScreen} />
    </Stack.Navigator>
  );
}
