import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { buscarColabPorId } from "../service/authService";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import RadioGroup from "../components/radioGroup";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import Select from "../components/select"; // use quando precisar

export default function AgendarConsulta() {
  const [tipo, setTipo] = useState("colaborador");
  const [colaborador, setColaborador] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const id = await AsyncStorage.getItem("id");
        const token = await AsyncStorage.getItem("token");

        if (id && token) {
          const data = await buscarColabPorId(id, token);
          // Se seu service retorna response.data já “limpo”,
          // então 'data' deve ser { id, nome, ... }
          setColaborador(data);
        }
      } catch (error) {
        console.log("Erro ao buscar colaborador:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const nomeColab =
    // tente primeiro sem .data; se seu backend envolver, troque para colaborador?.data?.nome
    colaborador?.nome ?? colaborador?.data?.nome ?? "";

  return (
    <Fundo>
      <View style={styles.container}>
        <TituloIcone
          titulo="Agendar Consulta"
          icone={require("../images/icones/Calendar_add_g.png")}
        />

        <Text style={styles.label}>Quem irá se consultar</Text>

        <RadioGroup
          value={tipo}
          onChange={setTipo}
          options={[
            { label: "Colaborador", value: "colaborador" },
            { label: "Dependente", value: "dependente" },
          ]}
        />

        <Text style={styles.label}>
          {loading
            ? "Carregando..."
            : tipo === "colaborador"
            ? `Colaborador: ${nomeColab || "(não encontrado)"}`
            : "Selecione o dependente"}
        </Text>
      </View>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 20, marginTop: 10, marginBottom: 8 },
});
