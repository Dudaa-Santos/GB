import React, { use, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import Input from "../components/input";
import Select from "../components/select";
import RadioGroup from "../components/radioGroup";
import CalendarioSemanalSelecionado from "../components/calendarioSemanalSelecionado";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buscarColabPorId, buscarEspecialidade, buscarMedicos } from "../service/authService";

export default function AgendarConsulta() {
  const navigation = useNavigation();
  const [tipo, setTipo] = useState("colaborador");
  const [colaborador, setColaborador] = useState(null);
  const [dependenteSel, setDependenteSel] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadeSel, setEspecialidadeSel] = useState(null);
  const [medicos, setMedicos] = useState([]);
  const [medicoSel, setMedicoSel] = useState(null);
  const [sel, setSel] = useState("2025-07-24");



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

        setColaborador(resp?.data ?? resp ?? null);
      } catch (e) {
        console.log("Erro ao buscar colaborador:", e);
        setError("Não foi possível carregar os dados do colaborador.");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setError("Sessão inválida. Faça login novamente.");
          return;
        }

        const resp = await buscarMedicos(token);
        setMedicos(resp?.data ?? resp ?? null);
      } catch (e) {
        console.log("Erro ao buscar médicos:", e);
        setError("Não foi possível carregar os dados dos médicos.");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setError("Sessão inválida. Faça login novamente.");
          return;
        }
        const resp = await buscarEspecialidade(token);
        setEspecialidades(resp?.data ?? resp ?? null);
      } catch (e) {
        console.log("Erro ao buscar especialidades:", e);
        setError("Não foi possível carregar os dados das especialidades.");
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
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </Pressable>

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
            disabled={true}
            errorText={error || undefined}
          />
        ) : (
          <>
            <Select
              placeholder="Selecione o dependente"
              data={dependentes.map((dep) => ({ label: dep.nome, value: dep.id }))}
              label="Dependente"
              selectedValue={dependenteSel}
              onValueChange={(val) => setDependenteSel(val)}
            />
          </>
        )}
        <Text style={styles.label}>Selecione a especialidade e o médico</Text>

        <Select
          placeholder="Selecione a especialidade"
          data={especialidades?.map((esp) => ({ label: esp.nome, value: esp.id })) || []}
          selectedValue={especialidadeSel}
          onValueChange={(val) => setEspecialidadeSel(val)}
          label="Especialidade"
        />

        <Select
          placeholder="Selecione o médico"
          data={medicos?.map((med) => ({ label: med.nome, value: med.id })) || []}
          selectedValue={medicoSel}
          onValueChange={(val) => setMedicoSel(val)}
          label="Médico"
        />
        <View style={{ flex: 1, justifyContent: "center" }}>
          <CalendarioSemanalSelecionado
            initialMonth={new Date(2025, 6, 1)}
            selectedISO={sel}
            onChange={setSel}
            holidaysISO={["2025-07-09"]}
            dotsISO={["2025-07-23", "2025-07-25"]}
            title="Selecione a data"
          />
          <Text style={{ textAlign: "center", marginTop: 10 }}>Selecionado: {sel}</Text>
        </View>

      </View>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 8
  },
  label: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 6,
    color: "#000000"
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#047857',
    fontWeight: '500',
  },
});
