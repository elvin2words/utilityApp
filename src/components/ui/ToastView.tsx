
// components/ui/ToastView.tsx

import React from 'react';
import { StyleSheet, Text, View } from "react-native";

export const ToastView = ({
  message,
  type = 'info',
}: {
  message: string;
  type?: 'success' | 'error' | 'info';
}) => {
  return (
    <View style={[styles.toast, styles[type]]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 8,
    zIndex: 9999,
    elevation: 4,
  },
  text: {
    color: '#fff',
    fontSize: 14,
  },
  success: {
    backgroundColor: '#16a34a',
  },
  error: {
    backgroundColor: '#dc2626',
  },
  info: {
    backgroundColor: '#2563eb',
  },
});
