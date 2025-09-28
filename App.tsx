// utility/App.tsx  
 
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import * as SplashScreen from "expo-splash-screen";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AppContent from "@/src/components/AppContent";

import { AuthProvider } from "@/src/lib/auth/AuthContext";

import { useMutationSync } from "@/src/hooks/useMutationSync";



// Prevent native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(console.warn);

// Configure react-query for better caching & retries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // retry failed queries twice
      staleTime: 1000 * 60 * 5, // 5 mins cache
    },
  },
});


export default function App() {
  useMutationSync(); // Keep offline sync active

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
