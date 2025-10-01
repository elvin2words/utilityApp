// bottomDrawer

import React, { useRef, useState, useEffect, useCallback  } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import GestureRecognizer from "react-native-swipe-gestures";
import { Fault } from "@/src/types/faults"; 

type BottomFaultDrawerProps = {
  faults: Fault[];
  selected: Fault | null;
  onSelect: (f: Fault) => void;
  onAssign: (f: Fault) => void;
  onNavigate: (f: Fault) => void;
  onClose: () => void;
  mapRef?: any;
};

const BottomFaultDrawer: React.FC<BottomFaultDrawerProps> = ({
  faults,
  selected,
  onSelect,
  onAssign,
  onNavigate,
  onClose,
  mapRef,
}) => {
  const sheetRef = useRef<BottomSheet>(null);

  // snap points (peek, mid, full)
//   const snapPoints = ["20%", "60%", "90%"];
  const PEEK_HEIGHT = "50%";
  const FULL_HEIGHT = "90%";
  const snapPoints = [PEEK_HEIGHT, FULL_HEIGHT];

  const [viewAll, setViewAll] = useState(false);

  // Show sheet when a fault is selected, hide when cleared
  useEffect(() => {
    if (selected) {
      sheetRef.current?.snapToIndex(0); // peek up
      setViewAll(false);
        // center map on fault
      mapRef?.current?.animateToRegion(
        {
          latitude: selected.coords.latitude,
          longitude: selected.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    } else {
      sheetRef.current?.close();
    }
  }, [selected]);
  
//   if (!selected) return null; // don’t render until needed

  // swipe gesture to switch faults
  const onSwipeLeft = () => {
    if (!selected) return;
    const currentIndex = faults.findIndex((f) => f.id === selected.id);
    const next = faults[currentIndex + 1];
    if (next) onSelect(next);
  };

  const onSwipeRight = () => {
    if (!selected) return;
    const currentIndex = faults.findIndex((f) => f.id === selected.id);
    const prev = faults[currentIndex - 1];
    if (prev) onSelect(prev);
  };

  const renderFaultItem = ({ item }: { item: Fault }) => {
    const isSelected = selected?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.faultItem, isSelected && styles.faultItemSelected]}
        onPress={() => {
          onSelect(item);
          sheetRef.current?.snapToIndex(0);
        }}
      >
        <View>
          <Text style={styles.faultName}>{item.title}</Text>
          <Text style={styles.faultLocation}>
            {item.locationName ?? "Unknown location"}
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet 
      ref={sheetRef} 
      index={0} 
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose} // when dragged fully down, clear selection
        handleIndicatorStyle={{ backgroundColor: "#ccc" }}
      style={styles.sheet}
    >
      {/* <View style={styles.bottomContainer}>
        <Text style={styles.title}>Active Faults</Text>

        {faults.map((f) => {
          const isSelected = selected?.id === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.faultItem,
                isSelected && styles.faultItemSelected,
              ]}
              onPress={() => {
                onSelect(f);
                sheetRef.current?.snapToIndex(0);
              }}
            >
              <View>
                <Text style={styles.faultName}>{f.description}</Text>
                <Text style={styles.faultLocation}>{f.location_name}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          );
        })}

        {selected && (
          <View style={styles.modalActions}>
            {selected.status === "pending" && !selected.artisan_assigned && (
              <TouchableOpacity
                style={styles.assignButton}
                onPress={() => onAssign(selected)}
              >
                <Text style={styles.buttonText}>Assign Fault Job</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.assignButton}
              onPress={() => onNavigate(selected)}
            >
              <Text style={styles.buttonText}>Navigate to Fault</Text>
            </TouchableOpacity>
          </View>
        )}
      </View> */}


        <View style={styles.container}>
            <Text style={styles.title}>Active Faults</Text>

            <Text style={styles.title}>
                {selected.title}
            </Text>
            <Text style={styles.subtitle}>
                {selected.locationName ?? "Unknown location"}
            </Text>
            <Text style={styles.subtitle}>
                Status: {selected.status ?? "unknown"}
            </Text>

            <View style={styles.actions}>
                {selected.status === "pending" && !selected.artisan_assigned && (
                    <TouchableOpacity
                        style={styles.assignButton}
                        onPress={() => onAssign(selected)}
                    >
                    <Text style={styles.buttonText}>Assign Fault Job</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => onNavigate(selected)}
                >
                    <Text style={styles.buttonText}>Navigate to Fault</Text>
                </TouchableOpacity>
            </View>
        </View>

        {selected && (
            <GestureRecognizer
            onSwipeLeft={onSwipeLeft}
            onSwipeRight={onSwipeRight}
            >
            <View style={styles.container}>
                <Text style={styles.title}>{selected.title}</Text>
                <Text style={styles.subtitle}>
                {selected.locationName ?? "Unknown location"}
                </Text>
                <Text style={styles.subtitle}>
                Status: {selected.status ?? "unknown"}
                </Text>

                <View style={styles.actions}>
                {selected.status === "pending" && !selected.assignedTo && (
                    <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => onAssign(selected)}
                    >
                    <Text style={styles.buttonText}>Assign Fault Job</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => onNavigate(selected)}
                >
                    <Text style={styles.buttonText}>Navigate to Fault</Text>
                </TouchableOpacity>
                </View>

                {!viewAll && (
                <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => {
                    setViewAll(true);
                    sheetRef.current?.snapToIndex(1);
                    }}
                >
                    <Text style={styles.viewAllText}>View All Faults</Text>
                </TouchableOpacity>
                )}
            </View>
            </GestureRecognizer>
        )}

        {/* List of all faults */}
        {viewAll && (
        <BottomSheetFlatList
          data={faults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderFaultItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </BottomSheet>
  );
};

export default BottomFaultDrawer;


const styles = StyleSheet.create({
  sheet: { elevation: 20, zIndex: 999 }, // high elevation
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 8 },
  actions: { flexDirection: "row", gap: 10, marginTop: 8, flexWrap: "wrap" },
  assignButton: {
    backgroundColor: "#1E90FF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  viewAllButton: {
    marginTop: 12,
    alignSelf: "center",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1E90FF",
  },
  viewAllText: { color: "#1E90FF", fontWeight: "600" },
  faultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  faultItemSelected: {
    backgroundColor: "#f0f8ff",
  },
  faultName: { fontSize: 15, fontWeight: "500" },
  faultLocation: { fontSize: 13, color: "#555" },
  arrow: { fontSize: 18, color: "#999" },
});
