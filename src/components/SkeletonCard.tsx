import React from 'react';
import { View, StyleSheet } from 'react-native';

const SkeletonItem = () => (
  <View style={styles.skelCard}>
    <View style={styles.skelTitle} />
    <View style={styles.skelLine} />
    <View style={[styles.skelLine, { width: '60%' }]} />
  </View>
);

const SkeletonCard: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={{ width: '100%', padding: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skelCard: { backgroundColor: '#eee', padding: 12, borderRadius: 10, marginBottom: 12 },
  skelTitle: { width: '50%', height: 16, backgroundColor: '#ddd', borderRadius: 4, marginBottom: 8 },
  skelLine: { width: '100%', height: 10, backgroundColor: '#ddd', borderRadius: 4, marginBottom: 6 },
});

export default SkeletonCard;
