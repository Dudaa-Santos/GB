import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

export default function RadioGroup({
  options = [],
  value,
  onChange,
  color = "#065F46",
  direction = "row", // "row" ou "column"
}) {
  return (
    <View style={[styles.group, direction === "row" ? styles.row : styles.column]}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        
        return (
          <Pressable
            key={opt.value}
            style={styles.option}
            onPress={() => onChange(opt.value)}
          >
            <View style={[styles.radioOuter, isSelected && { borderColor: color }]}>
              {isSelected && (
                <View style={[styles.radioInner, { backgroundColor: color }]} />
              )}
            </View>
            <Text style={styles.label}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
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
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    fontSize: 16,
    color: "#374151",
  },
});
