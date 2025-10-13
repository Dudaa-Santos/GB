import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator, Text, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import CardConsultasAgendadas from "../components/cardConsultasAgendadas";
import { buscarAgendamentoPorId } from "../service/authService";

export default function ConsultasAgendadas() {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ========= Helpers (mesmos do Historico) =========
  const getPacienteNome = (consulta) => {
    if (consulta?.dependente?.nome) return consulta.dependente.nome;
    if (consulta?.colaborador?.nome) return consulta.colaborador.nome;
    return "Paciente não informado";
  };

  const getMedicoNome = (consulta) => {
    if (consulta?.medico?.nome) return consulta.medico.nome;
    return "Médico não informado";
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Data não informada";
    try {
      const date = new Date(dateString);
      const d = date.toLocaleDateString("pt-BR");
      const h = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return `${d} • ${h}`;
    } catch {
      return dateString;
    }
  };

  // ========= Fetch (mesma lógica do Historico) =========
  const fetchConsultas = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("token");
      const id = await AsyncStorage.getItem("id");

      if (!token) {
        setError("Token não encontrado. Faça login novamente.");
        return;
      }
      if (!id) {
        setError("ID do colaborador não encontrado. Faça login novamente.");
        return;
      }

      const response = await buscarAgendamentoPorId(id, token);

      let consultasArray = [];
      if (Array.isArray(response)) {
        consultasArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        consultasArray = response.data;
      } else if (response?.success && Array.isArray(response.data)) {
        consultasArray = response.data;
      } else {
        consultasArray = [];
      }

      setConsultas(consultasArray);
    } catch (err) {
      console.error("❌ Erro ao buscar consultas:", err);
      setError(`Erro ao carregar consultas: ${err?.message || "Tente novamente."}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultas();
  }, []);

  if (loading) {
    return (
      <Fundo>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#065F46" />
          <Text style={styles.loadingText}>Carregando consultas...</Text>
        </View>
      </Fundo>
    );
  }

  if (error) {
    return (
      <Fundo>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={fetchConsultas}>
            Tentar novamente
          </Text>
        </View>
      </Fundo>
    );
  }

  return (
    <Fundo>
      <View style={styles.container}>
        <TituloIcone
          titulo="Consultas Agendadas"
          icone={require("../images/icones/Calendar_add_g.png")}
        />

        {(!consultas || consultas.length === 0) ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Nenhuma consulta encontrada.</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
          >
            {consultas.map((consulta, idx) => (
              <CardConsultasAgendadas
                key={consulta.idAgendamento || consulta.id || idx}
                nome={getPacienteNome(consulta)}
                dataHora={formatDateTime(consulta.horario)}
                medico={getMedicoNome(consulta)}
                onEdit={() => {
                  Alert.alert("Editar", `Consulta ${consulta.idAgendamento || consulta.id || idx}`);
                }}
                onDelete={() => {
                  Alert.alert("Excluir", `Consulta ${consulta.idAgendamento || consulta.id || idx}`);
                }}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
  },
  cardsContainer: {
    marginTop: 24, 
    paddingBottom: 12,
    paddingHorizontal: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10, 
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
  },
});
