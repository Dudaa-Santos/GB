import React from "react";
import { Text, Pressable, StyleSheet } from "react-native";

export default function AvailableTimeButton({
  onPress,
  title,
  style,
  textStyle,
  isSelected = false,
  isBlocked = false,
  isBooked = false,
}) {
  const handlePress = () => {
    if (isBlocked || isBooked) return;
    onPress && onPress();
  };

  const getButtonStyle = () => {
    if (isBooked) return styles.buttonBooked;
    if (isBlocked) return styles.buttonBlocked;
    if (isSelected) return styles.buttonSelected;
    return styles.button;
  };

  const getTextStyle = () => {
    if (isBooked) return styles.textBooked;
    if (isBlocked) return styles.textBlocked;
    if (isSelected) return styles.textSelected;
    return styles.text;
  };

return (
  <Pressable
    onPress={handlePress}
    style={[getButtonStyle(), style]}
    disabled={isBlocked || isBooked}
    pointerEvents={(isBlocked || isBooked) ? "none" : "auto"}  // <==
    accessibilityState={{ disabled: isBlocked || isBooked }}
  >
    <Text style={[getTextStyle(), textStyle]}>
      {title}
    </Text>
  </Pressable>
);

}

const styles = StyleSheet.create({
  // Estado normal (disponível)
  button: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2D2D2D",
    minHeight: 48,
    justifyContent: "center",
  },
  text: {
    color: "#2D2D2D",
    fontSize: 14,
    fontWeight: "600",
  },

  // Estado selecionado
  buttonSelected: {
    backgroundColor: "#047857",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#047857",
    minHeight: 48,
    justifyContent: "center",
    shadowColor: "#047857",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  textSelected: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Estado bloqueado (indisponível)
  buttonBlocked: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#D1D5DB",
    minHeight: 48,
    justifyContent: "center",
    opacity: 0.6,
  },
  textBlocked: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },

  // Estado ocupado (já agendado)
  buttonBooked: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#EF4444",
    minHeight: 48,
    justifyContent: "center",
  },
  textBooked: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
});
