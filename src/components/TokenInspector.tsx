
// components/TokenInspector.tsx
import React, { useState } from "react";
import { Button, Modal, Text, View } from "react-native";
import { Camera, CameraType } from "expo-camera";

export default function TokenInspector({ token }: { token: string }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [permission, requestPermission] = Camera.useCameraPermissions();

  if (!permission) {
    // Camera permission status is loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permission denied — ask for permission
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ marginBottom: 10 }}>We need camera access to scan codes.</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View>
      <Button title="Inspect Token" onPress={() => setModalVisible(true)} />

      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Text style={{ fontWeight: "bold", fontSize: 16 }}>Current Token</Text>
          <Text numberOfLines={5} style={{ marginBottom: 20 }}>{token}</Text>

          <Camera
            type={CameraType.back}
            style={{ width: 300, height: 300 }}
            onBarCodeScanned={({ data }) => {
              setScannedData(data);
              setModalVisible(false);
            }}
          />

          {scannedData && (
            <Text style={{ marginTop: 10 }}>Scanned Token: {scannedData}</Text>
          )}

          <Button title="Close" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
}
