import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { RadioButton } from "react-native-paper";

export default function RadioGroup({
  options = [],
  value,
  onChange,
  color = "#065F46",
  direction = "row", // "row" ou "column"
}) {
  return (
    <RadioButton.Group onValueChange={onChange} value={value}>
      <View style={[styles.group, direction === "row" ? styles.row : styles.column]}>
        {options.map((opt) => (
          <View key={opt.value} style={styles.option}>
            <RadioButton value={opt.value} color={color} />
            <Text style={styles.label}>{opt.label}</Text>
          </View>
        ))}
      </View>
    </RadioButton.Group>
  );
}

const styles = StyleSheet.create({
  group: {
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  column: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
  },
});
