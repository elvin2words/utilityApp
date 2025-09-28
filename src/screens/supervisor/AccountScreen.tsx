
// ufms/screens/Supervisor/AccountScreen.tsx
import React from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import HeaderBar from "@/src/components/HeaderBar";  
import { useAuth } from '@/src/lib/auth/AuthContext';
import UserAvatar from "@/src/components/ui/UserAvatar";
import { Ionicons } from '@expo/vector-icons';

export default function AccountScreen() {
  const { user, logout } = useAuth();

  // Grouped Features
  const featureGroups = [
    {
      title: "Account",
      features: [
        { title: "Change Password", icon: "lock-closed" },
        { title: "Notifications", icon: "notifications" },
        { title: "Preferences", icon: "settings" },
      ],
    },
    {
      title: "Billing & Support",
      features: [
        { title: "Billing", icon: "card" },
        { title: "Support", icon: "help-circle" },
        { title: "Legal / About", icon: "document-text" },
      ],
    },
    {
      title: "Danger Zone",
      features: [
        { title: "Logout", icon: "log-out", destructive: true },
      ],
    },
  ];

  const handleFeaturePress = (feature: any) => {
    if (feature.destructive) logout?.();
    else console.log(feature.title, "tapped");
  };

  return (
    <View style={{ flex: 1 }}>
      <HeaderBar role="Supervisor Interface" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <UserAvatar
            name={user?.name}
            avatarUrl={user?.avatarUrl}
            size={90}
            backgroundColor="#3b82f6"
          />
          <Text style={styles.name}>{user?.name || "Unknown User"}</Text>
          <Text style={styles.email}>{user?.email || "no-email@example.com"}</Text>

          {/* Edit Profile Pencil */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => console.log("Edit Profile tapped")}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Feature Groups */}
        {featureGroups.map((group, gIdx) => (
          <View key={gIdx} style={styles.groupCard}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.featuresWrapper}>
              {group.features.map((f, idx) => {
                const isFullWidth = f.destructive;
                return (
                  <AnimatedPressable
                    key={idx}
                    style={[
                      styles.featureButton,
                      f.destructive && { borderColor: '#ef4444', backgroundColor: '#fee2e2' },
                      isFullWidth && { width: '100%' },
                    ]}
                    onPress={() => handleFeaturePress(f)}
                  >
                    <View style={styles.buttonContent}>
                      {f.icon && <Ionicons
                        name={f.icon as any}
                        size={20}
                        color={f.destructive ? '#ef4444' : '#3b82f6'}
                        style={{ marginRight: 8 }}
                      />}
                      <Text
                        style={[
                          styles.featureText,
                          f.destructive && { color: '#ef4444' },
                        ]}
                      >
                        {f.title}
                      </Text>
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
        ))}

      </ScrollView>
    </View>
  );
}

// Animated Pressable for scale effect
const AnimatedPressable = ({ style, onPress, children }: any) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  avatarCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
    color: '#111827',
  },
  email: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 4,
  },
  editButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#e0f2fe',
    padding: 8,
    borderRadius: 12,
  },

  groupCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  featuresWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: '#fff',
    marginBottom: 12,
    minWidth: '48%',
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
