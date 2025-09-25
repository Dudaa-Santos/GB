import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import Input from "../components/input";
import Select from "../components/select";
import RadioGroup from "../components/radioGroup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buscarColabPorId } from "../service/authService";

export default function AgendarConsulta() {
  const [tipo, setTipo] = useState("colaborador");
  const [colaborador, setColaborador] = useState(null);
    const [dependenteSel, setDependenteSel] = useState(null);

  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const id = await AsyncStorage.getItem("id");
        const token = await AsyncStorage.getItem("token");

        if (!id || !token) {
          setError("Sessão inválida. Faça login novamente.");
          return;
        }

        const resp = await buscarColabPorId(id, token);

        // ⚠️ Ajuste aqui conforme o formato real do retorno
        setColaborador(resp?.data ?? resp ?? null);
      } catch (e) {
        console.log("Erro ao buscar colaborador:", e);
        setError("Não foi possível carregar os dados do colaborador.");
      }
    })();
  }, []);

  const nomeColab =
    colaborador?.nome ??
    colaborador?.data?.nome ??
    "";

  const dependentes =
    colaborador?.dependentes ??
    colaborador?.data?.dependentes ??
    [];

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
 {tipo === "colaborador" ? (
        <Input
          label="Nome do Colaborador"
          placeholder={nomeColab || "Carregando..."}
          value={nomeColab}
          disabled={true}        // seu Input deve mapear para editable={false}
          errorText={error || undefined}
        />
      ) : (
        // 🔧 Envolva os dois elementos com um pai (Fragment ou View)
        <>
          <Text>
            Dependente {dependentes.map((dep) => dep.nome).join(", ")}
          </Text>

          <Select
            placeholder="Selecione o dependente"
            data={dependentes.map((dep) => ({ label: dep.nome, value: dep.id }))}
            selectedValue={dependenteSel}              // ← agora tem estado
            onValueChange={(val) => setDependenteSel(val)} // ← atualiza estado
          />
        </>
      )}

      </View>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  label: { fontSize: 18, marginTop: 10, marginBottom: 6, color: "#111827" },
});
