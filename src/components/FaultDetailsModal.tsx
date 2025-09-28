
// components/FaultDetailsModal.tsx

import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

export function FaultDetailsModal({ fault, visible = true, onClose }: any) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 16, maxHeight: '80%' }}>
          <ScrollView>
            <Text style={{ fontWeight: '700', fontSize: 18 }}>{fault.name}</Text>
            <Text>Ref: {fault.reference_number ?? 'N/A'}</Text>
            <Text>Status: {fault.status}</Text>
            <Text>Severity: {fault.severity}</Text>
            <Text>Description: {fault.description ?? 'N/A'}</Text>
            <Text>ETA: {fault.estimated_completion_time ?? 'Unknown'}</Text>
            <Text>Weather: {fault.weather?.condition ?? 'N/A'}</Text>
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 12, alignSelf: 'flex-end' }}>
            <Text style={{ color: '#007aff' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
