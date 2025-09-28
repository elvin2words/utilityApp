
// components/FaultMarker.tsx
import React from 'react';
import { Text, View } from "react-native";
import { Marker, Callout } from 'react-native-maps';

import { getSeverityColor } from '@/utils/misc';

export function FaultMarker({ fault, onPress }: any) {
  return (
    <Marker coordinate={fault.coordinates} pinColor={getSeverityColor(fault.severity)} onPress={() => onPress(fault)}>
      <Callout>
        <View style={{ width: 160 }}>
          <Text style={{ fontWeight: '700' }}>{fault.name}</Text>
          <Text>{fault.location_name}</Text>
          <Text>{fault.travelTime ? `${fault.travelTime} min` : 'N/A'}</Text>
        </View>
      </Callout>
    </Marker>
  );
}