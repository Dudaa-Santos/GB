import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Fundo from "../components/fundo"; 
import { buscarColabPorId } from "../service/authService";

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
        <Text style={styles.ola}>Olá,</Text>
        {colaborador ? (
          <Text style={styles.nome}>{colaborador.nome}</Text>
        ) : (
          <Text style={styles.nome}>Carregando...</Text>
        )}

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
  brand: "#047857", 
  textInverse: "#FFFFF6",
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: "flex-start", 
    justifyContent: "flex-start",
    padding: 20,
  },
  ola: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 4,
  },
  nome: {
    fontSize: 18,
    fontWeight: "600",
  },
  button: {
    marginTop: 32,
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
