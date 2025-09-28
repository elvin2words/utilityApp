
// components/FaultBottomSheet.tsx

import React, { forwardRef } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import BottomSheet from '@gorhom/bottom-sheet';


export const FaultBottomSheet = forwardRef(({ faults = [], onSelectFault }: any, ref: any) => {
  const snapPoints = ['25%', '60%'];
  return (
    <BottomSheet ref={ref} index={0} snapPoints={snapPoints} enablePanDownToClose={false}>
      <ScrollView style={{ padding: 12 }}>
        <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>Faults</Text>
        {faults.map((f: any) => (
          <TouchableOpacity key={f.id} onPress={() => onSelectFault(f)} style={{ padding: 10, backgroundColor: '#fff', marginBottom: 8, borderRadius: 6 }}>
            <Text style={{ fontWeight: '700' }}>{f.name}</Text>
            <Text>{f.location_name}</Text>
            <Text>{f.status}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </BottomSheet>
  );
});
