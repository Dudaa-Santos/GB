import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";

export default function CardConsultasAgendadas({
  nome,
  dataHora,
  medico,
  onEdit = () => {},
  onDelete = () => {},
}) {
  return (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        <Text style={styles.nome}>{nome}</Text>
        <Text style={styles.info}>{dataHora}</Text>
        <Text style={styles.medico}>{medico}</Text>
      </View>

      <View style={styles.rightSection}>
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [styles.iconButton, styles.deleteButton, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel="Excluir consulta"
        >
          <Image source={require("../images/icones/Delet_w.png")} style={styles.icon} />
        </Pressable>

        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [styles.iconButton, styles.editButton, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel="Editar consulta"
        >
          <Image source={require("../images/icones/Edit_w.png")} style={styles.icon} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F7F7",
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#065F46",
    width: "100%",
  },

  leftSection: {
    flex: 1,
  },

  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  nome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },

  info: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },

  medico: {
    fontSize: 14,
    fontWeight: "700",
    color: "#065F46",
    marginTop: 4,
  },

  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButton: {
    backgroundColor: "#EF4444",
  },

  editButton: {
    backgroundColor: "#065F46",
  },

  icon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
  },
});

