
// components/ScreenLayout.tsx
import React from "react";
import { ScrollView, View } from "react-native";
import HeaderBar from "@/components/common/HeaderBar";

export default function ScreenLayout({ children, role = "Artisan Interface", onOpenSidebar }: any) {
  return (
    <View style={{ flex: 1 }}>
      <HeaderBar role={role} onOpenSidebar={onOpenSidebar} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {children}
      </ScrollView>
    </View>
  );
}



// Then in screens:

// // screens/DashboardScreen.tsx
// import ScreenLayout from "@/components/ScreenLayout";

// export default function DashboardScreen() {
//   return (
//     <ScreenLayout role="Supervisor Interface">
//       {/* Dashboard content here */}
//     </ScreenLayout>
//   );
// }