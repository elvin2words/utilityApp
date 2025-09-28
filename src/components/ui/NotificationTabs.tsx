import React, { useRef, useEffect, useMemo } from "react"; 
import { Text } from "lucide-react-native";
import { ScrollView } from "react-native-gesture-handler";
import { TouchableOpacity } from "react-native";

const TYPES = ["all", "fault", "task", "system", "alert"];

export function NotificationTabs({ selected, onSelect }: {
  selected: string | null;
  onSelect: (type: string | null) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
      {TYPES.map(type => {
        const active = selected === type || (type === "all" && !selected);
        return (
          <TouchableOpacity key={type} onPress={() => onSelect(type === "all" ? null : type)} style={{
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 9999,
            backgroundColor: active ? "#2563EB" : "#E5E7EB",
            marginRight: 8,
          }}>
            <Text style={{ color: active ? "#fff" : "#374151", fontWeight: "600" }}>
              {type[0].toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
