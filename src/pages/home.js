import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Fundo from "../components/fundo"; 
import { buscarColabPorId } from "../service/authService";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function HomeScreen({ route, navigation }) {
  const [colaborador, setColaborador] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const id = await AsyncStorage.getItem("id");
        const token = await AsyncStorage.getItem("token");

        if (id && token) {
          const data = await buscarColabPorId(id, token);
          console.log("Dados do colaborador:", data);
          setColaborador(data);
        }
      } catch (error) {
        console.log("Erro ao buscar colaborador:", error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("id");
      navigation.replace("Login");
    } catch (error) {
      console.log("Erro ao sair:", error);
    }
  };

  return (
    <Fundo>
      <View style={styles.content}>
        <Text style={styles.titulo}>
          Olá, {colaborador ? colaborador.data.nome : "Carregando..."}
        </Text>
        <Text style={styles.subtitulo}>Status resumido</Text>

        {/* CARD PRINCIPAL */}
        <View style={styles.card}>
          <Image
            source={require("../images/prancheta.png")}
            style={styles.prancheta}
            resizeMode="contain"
          />

          {/* STATUS BOXES */}
          <View style={styles.statusContainer}>
            <View style={styles.statusBox}>
              <Icon name="calendar" size={28} color="#fff" style={{ marginBottom: 4}} />
              <Text style={styles.statusLabel}>CONSULTAS{"\n"}AGENDADAS</Text>
              <Text style={styles.statusNumber}>02</Text>
            </View>

            <View style={styles.statusBox}>
              <Icon name="file-document" size={28} color="#fff" />
              <Text style={styles.statusLabel}>ASSINATURAS{"\n"}PENDENTES</Text>
              <Text style={styles.statusNumber}>12</Text>
            </View>

            <View style={styles.statusBox}>
              <Icon name="file-search" size={28} color="#fff" />
              <Text style={styles.statusLabel}>BENEFÍCIOS{"\n"}EM ANÁLISE</Text>
              <Text style={styles.statusNumber}>20</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Sair</Text>
        </Pressable>
      </View>
    </Fundo>
  );
}

const colors = {
  brand: "#065F46",
  textInverse: "#FFFFF6",
  cardBg: "#058A62",
  boxBg: "#41AE8C",
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    padding: 20,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 16,
    color: "#444",
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#065F46", // borda verde escura
    paddingVertical: 12,    // diminui altura do card
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  prancheta: {
    width: 110,
    height: 150,
    marginRight: 16,
    marginLeft: -20, // prancheta "salta"
  },
  statusContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
  },
  statusBox: {
    backgroundColor: colors.boxBg,
    borderWidth: 2,
    borderColor: "#fff", // borda branca
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    width: 95,
    alignItems: "center",
    marginHorizontal: 4,
  },
  statusLabel: {
    color: "#fff",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 14,
    fontWeight: "500",
  },
  statusNumber: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 6,
  },
  button: {
    marginTop: 16,
    backgroundColor: colors.brand,
    borderRadius: 8,
    width: 120,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: "bold",
  },
});
