import React from "react";
import { View, StyleSheet, ScrollView, Text, Image, Pressable } from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";

export default function AssinaturasPendentes() {
  const itens = [
    { id: 1, titulo: "Termo de Adesão do Plano", data: "10/10/2025", solicitante: "João da Silva" },
    { id: 2, titulo: "Autorização de Desconto", data: "12/10/2025", solicitante: "Maria Oliveira" },
    { id: 3, titulo: "Atualização Cadastral", data: "15/10/2025", solicitante: "Carlos Pereira" },
  ];

  const handleAssinar = (id) => console.log("Assinar documento", id);

  return (
    <Fundo>
      <View style={styles.container}>
        <TituloIcone
          titulo="Assinaturas Pendentes"
          icone={require("../images/icones/File_dock_g.png")}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {itens.map((item) => (
            <View key={item.id} style={styles.card}>
              {/* ESQUERDA */}
              <View style={styles.leftSection}>
                <Text style={styles.cardTitle}>{item.titulo}</Text>
                <Text style={styles.cardSub}>DATA: {item.data}</Text>
                <Text style={styles.cardSub}>SOLICITANTE: {item.solicitante}</Text>
              </View>

              {/* DIREITA (BOTÃO ÚNICO DE ASSINATURA) */}
              <Pressable
                onPress={() => handleAssinar(item.id)}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Assinar documento"
              >
                <Image
                  source={require("../images/icones/Assinatura_w.png")}
                  style={styles.icon}
                />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>
    </Fundo>
  );
}

const colors = {
  green: "#065F46",
  bgCard: "#F8F7F7",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
  },
  cardsContainer: {
    marginTop: 24,
    paddingBottom: 12,
  },
  /* CARD */
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.green,
    width: "100%",
    alignSelf: "center",
  },
  leftSection: { flex: 1, paddingRight: 12 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
});
