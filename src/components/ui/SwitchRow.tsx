
// components/SwitchRow.tsx

import React from "react";
import { StyleSheet, Switch, Text, TextStyle, View, ViewStyle } from "react-native";
import { AppTheme } from "@/src/lib/colors";
import { useTheme } from "@react-navigation/native";

type SwitchRowProps = {
  label1: string;
  label2: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  icon1?: React.ReactNode;
  icon2?: React.ReactNode;
  style?: ViewStyle;
  labelStyle?: TextStyle;
};

export const SwitchRow: React.FC<SwitchRowProps> = ({
  label1,
  label2,
  value,
  onValueChange,
  icon1,
  icon2,
  style,
  labelStyle,
}) => {
  const theme = useTheme() as AppTheme;
  const colors = theme.colors;

  return (
    <View style={[styles.row, style]}>
      <View style={styles.labelContainer}>
        {icon1 && <View style={{ marginRight: 8 }}>{icon1}</View>}
        <Text style={[styles.label, { color: colors.maintext }, labelStyle]}>{label1}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
      <View style={styles.labelContainer}>
        {icon2 && <View style={{ marginRight: 8 }}>{icon2}</View>}
        <Text style={[styles.label, { color: colors.maintext }, labelStyle]}>{label2}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 16,
  },
});
