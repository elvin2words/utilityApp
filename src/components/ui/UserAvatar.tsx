
// components/common/UserAvatar.tsx
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface UserAvatarProps {
  name?: string;
  avatarUrl?: string;
  size?: number; // optional, default 64
  backgroundColor?: string; // for initials background
}

export default function UserAvatar({
  name,
  avatarUrl,
  size = 64,
  backgroundColor = "#3b82f6",
}: UserAvatarProps) {
  // Generate initials from name
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  return (
    <View
      style={[
        styles.dummyAvatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size / 2.5 }]}>{initials || "?"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    resizeMode: "cover",
  },
  dummyAvatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "#fff",
    fontWeight: "700",
  },
});
