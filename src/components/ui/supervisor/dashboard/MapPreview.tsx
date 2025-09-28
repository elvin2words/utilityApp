
// components/dashboard/MapPreview.tsx
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Fault {
  id: string;
  lat: number;
  lng: number;
}

interface Props {
  faults: Fault[];
}



const MapPreview: React.FC<{ faults: Fault[] }> = ({ faults }) => {
  const fallbackRegion = {
    latitude: -17.8252,
    longitude: 31.0335,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  const initialRegion = faults && faults.length > 0 && faults[0].coordinates
    ? {
        latitude: faults[0].coordinates.latitude,
        longitude: faults[0].coordinates.longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }
    : fallbackRegion;

  return (
    <View style={styles.mapCard}>
      <Text style={styles.sectionTitle}>Map Preview</Text>
      <Text style={styles.mapHint}>Tap to open full map</Text>
      <View style={styles.mapWrapper}>
        <MapView
          pointerEvents="none" // preview-only (no gestures)
          style={styles.map}
          initialRegion={initialRegion}
          loadingEnabled
        >
          {faults?.slice(0, 6).map((f) => {
            if (!f.coordinates) return null;
            return (
              <Marker
                key={f.id}
                coordinate={{
                  latitude: f.coordinates.latitude,
                  longitude: f.coordinates.longitude,
                }}
                title={f.name}
                description={f.location_name}
              />
            );
          })}
        </MapView>
      </View>
    </View>
  );
};

export default function MapPreview({ faults }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Map Preview</Text>
      <TouchableOpacity>
        <Image
          source={{ uri: "https://via.placeholder.com/400x200.png?text=Map+Preview" }}
          style={styles.map}
        />
      </TouchableOpacity>
      <Text style={styles.caption}>{faults.length} faults on the map</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  header: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  map: { width: "100%", height: 180, borderRadius: 12 },
  caption: { fontSize: 12, color: "#666", marginTop: 6, textAlign: "center" },
});
