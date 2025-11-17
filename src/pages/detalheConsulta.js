import React, { useState } from "react"; // ✅ Adiciona useState
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import { useNavigation } from "@react-navigation/native";
import { alterarStatusAgendamento } from "../service/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ModalReagendar from "../components/ModalReagendar"; // ✅ Importa o modal

// ✅ Função EXATAMENTE IGUAL ao cardStatus.js - ORDEM CORRETA
function getStatusColor(status) {
    if (!status) return "#6B7280";

    const statusLower = status.toLowerCase();

    // Benefícios
    if (statusLower.includes("pend. assinar") || statusLower.includes("pendente_assinatura")) return "#315fd3ff"; // Azul
    if (statusLower.includes("pendente")) return "#F59E0B"; // Laranja
    if (statusLower.includes("aprovado") || statusLower.includes("aprovada")) return "#065F46"; // Verde escuro
    if (statusLower.includes("recusada") || statusLower.includes("negado")) return "#DC2626"; // Vermelho

    // Consultas
    if (statusLower.includes("agendado") || statusLower.includes("agendada")) return "#315fd3ff"; // Azul
    if (statusLower.includes("concluído") || statusLower.includes("concluida")) return "#065F46"; // Verde
    if (statusLower.includes("cancelada") || statusLower.includes("CANCELADA") || statusLower.includes("cancelado") || statusLower.includes("CANCELADO")) return "#DC2626"; // Vermelho
    if (statusLower.includes("faltou")) return "#F59E0B"; // Laranja

    return "#065F46"; // Verde padrão
}

export default function DetalheConsulta({ route }) {
  const { consulta } = route?.params || {};
  const navigation = useNavigation();
  
  // ✅ Estado para controlar o modal
  const [modalVisible, setModalVisible] = useState(false);

  console.log("=== DetalheConsulta ===");
  console.log("Consulta recebida:", JSON.stringify(consulta, null, 2));

  // ✅ Calcula a cor do status
  const statusColor = getStatusColor(consulta?.status);

  // Função para normalizar o status
  const normalizeStatusConsulta = (status) => {
    if (!status) return "PENDENTE";
    
    const statusUpper = status.toUpperCase();
    
    const statusMap = {
        "AGENDADO": "AGENDADA",
        "CANCELADO": "CANCELADA",
        "CONCLUIDO": "CONCLUÍDA",
        "FALTOU": "FALTOU"
    };
    
    return statusMap[statusUpper] || status;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Data não informada";
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }) +
        " às " +
        date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      return dateString;
    }
  };

  const getPacienteNome = () => {
    if (consulta?.dependente?.nome) {
      return consulta.dependente.nome;
    }
    if (consulta?.colaborador?.nome) {
      return consulta.colaborador.nome;
    }
    return "Paciente não informado";
  };

  const getTipoPaciente = () => {
    if (consulta?.dependente?.nome) {
      return "Dependente";
    }
    if (consulta?.colaborador?.nome) {
      return "Colaborador";
    }
    return "Não informado";
  };

  const getMedicoNome = () => {
    if (consulta?.medico?.nome) {
      return consulta.medico.nome;
    }
    return "Médico não informado";
  };

  const getEspecialidade = () => {
    if (!consulta?.medico?.especialidade) {
      return "Não informada";
    }

    const esp = consulta.medico.especialidade;

    if (typeof esp === "object" && esp.nome) {
      return esp.nome;
    }

    if (typeof esp === "string") {
      return esp;
    }

    return "Não informada";
  };

  const isAgendado = () => {
    if (!consulta?.status) return false;
    const s = consulta.status.toLowerCase();
    return s.includes("agend");
  };

  // ✅ Nova função para verificar se a consulta já passou
  const isConsultaPassada = () => {
    if (!consulta?.horario) return false;
    
    try {
      const dataConsulta = new Date(consulta.horario);
      const dataAtual = new Date();
      
      // Retorna true se a data da consulta for anterior à data atual
      return dataConsulta < dataAtual;
    } catch (error) {
      console.error("Erro ao verificar data:", error);
      return false;
    }
  };

  const handleReagendar = () => {
    // ✅ Verifica se a consulta já passou
    if (isConsultaPassada()) {
      Alert.alert(
        "Atenção",
        "Não é possível reagendar uma consulta que já passou."
      );
      return;
    }
    
    setModalVisible(true);
  };

  const handleReagendamentoSuccess = () => {
    // ✅ Callback quando reagenda com sucesso
    setModalVisible(false);
    navigation.navigate("Historico", { refresh: true });
  };

  const handleCancelar = () => {
    Alert.alert(
      "Cancelar consulta",
      "Tem certeza que deseja cancelar esta consulta?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              
              if (!consulta?.idAgendamento) {
                Alert.alert("Erro", "ID do agendamento não encontrado");
                return;
              }

              console.log("🔄 Cancelando agendamento:", consulta.idAgendamento);

              // ✅ Chama a API para cancelar
              await alterarStatusAgendamento(
                consulta.idAgendamento, 
                "CANCELADO", 
                token
              );

              Alert.alert(
                "Sucesso", 
                "Consulta cancelada com sucesso!",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      // Volta para o histórico e recarrega
                      navigation.navigate("Historico", { refresh: true });
                    }
                  }
                ]
              );

            } catch (error) {
              console.error("❌ Erro ao cancelar consulta:", error);
              Alert.alert(
                "Erro", 
                error.message || "Não foi possível cancelar a consulta"
              );
            }
          },
        },
      ]
    );
  };

  if (!consulta) {
    return (
      <Fundo>
        <View style={styles.container}>
          <TituloIcone
            titulo="Detalhes da Consulta"
            icone={require("../images/icones/Calendar_add_g.png")}
          />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Não foi possível carregar os detalhes da consulta.
            </Text>
          </View>
        </View>
      </Fundo>
    );
  }

  return (
    <Fundo>
      <ScrollView>
        <View style={styles.container}>
          <TituloIcone
            titulo="Detalhes da Consulta"
            icone={require("../images/icones/Calendar_add_g.png")}
          />

          {/* Card Principal - ✅ com borderLeftColor dinâmico */}
          <View style={[styles.mainCard, { borderLeftWidth: 4, borderLeftColor: statusColor }]}>
            <View style={styles.headerCard}>
              <Text style={styles.consultaTitulo}>Consulta Médica</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>
                  {normalizeStatusConsulta(consulta.status) || "PENDENTE"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data e Horário:</Text>
              <Text style={styles.infoValue}>
                {formatDateTime(consulta.horario)}
              </Text>
            </View>
          </View>

          {/* Paciente - ✅ com borderLeftColor dinâmico */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paciente</Text>
            <View style={[styles.sectionCard, { borderLeftColor: statusColor }]}>
              <Text style={styles.sectionNome}>{getPacienteNome()}</Text>
              <Text style={styles.sectionInfo}>Tipo: {getTipoPaciente()}</Text>
              {consulta.dependente?.grauParentesco && (
                <Text style={styles.sectionInfo}>
                  Grau de Parentesco: {consulta.dependente.grauParentesco}
                </Text>
              )}
            </View>
          </View>

          {/* Médico - ✅ com borderLeftColor dinâmico */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Médico</Text>
            <View style={[styles.sectionCard, { borderLeftColor: statusColor }]}>
              <Text style={styles.sectionNome}>{getMedicoNome()}</Text>
              <Text style={styles.sectionInfo}>
                Especialidade: {getEspecialidade()}
              </Text>
              {consulta.medico?.crm && (
                <Text style={styles.sectionInfo}>
                  CRM: {consulta.medico.crm}
                </Text>
              )}
            </View>
          </View>

          {/* Colaborador (Solicitante) - ✅ com borderLeftColor dinâmico */}
          {consulta.colaborador && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Solicitante</Text>
              <View style={[styles.colaboradorCard, { borderLeftColor: statusColor }]}>
                <Text style={styles.colaboradorNome}>
                  {consulta.colaborador.nome || "Nome não informado"}
                </Text>
                {consulta.colaborador.matricula && (
                  <Text style={styles.colaboradorInfo}>
                    Matrícula: {consulta.colaborador.matricula}
                  </Text>
                )}
                {consulta.colaborador.email && (
                  <Text style={styles.colaboradorInfo}>
                    Email: {consulta.colaborador.email}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Observações - ✅ com borderLeftColor dinâmico */}
          {consulta.observacoes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Observações</Text>
              <View style={[styles.observacoesCard, { borderLeftColor: statusColor }]}>
                <Text style={styles.observacoesText}>
                  {consulta.observacoes}
                </Text>
              </View>
            </View>
          )}

          {/* Ações: Reagendar / Cancelar */}
          {isAgendado() && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.reagendarButton,
                  isConsultaPassada() && styles.buttonDisabled // ✅ Estilo desabilitado
                ]}
                onPress={handleReagendar}
                disabled={isConsultaPassada()} // ✅ Desabilita o botão
              >
                <Text style={styles.reagendarButtonText}>
                  {isConsultaPassada() ? "Consulta passada" : "Reagendar"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cancelarButton,
                  isConsultaPassada() && styles.buttonDisabled // ✅ Estilo desabilitado
                ]}
                onPress={handleCancelar}
                disabled={isConsultaPassada()} // ✅ Desabilita o botão
              >
                <Text style={styles.cancelarButtonText}>Cancelar consulta</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ✅ Modal de Reagendamento */}
      <ModalReagendar
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        consulta={consulta}
        onSuccess={handleReagendamentoSuccess}
      />
    </Fundo>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    paddingTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#DC2626",
    textAlign: "center",
  },

  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginTop: 20,
  },
  headerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  consultaTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#00000030",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },

  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: "#F8F7F7",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
  },
  sectionNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  sectionInfo: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },

  colaboradorCard: {
    backgroundColor: "#F8F7F7",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
  },
  colaboradorNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  colaboradorInfo: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },

  observacoesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  observacoesText: {
    fontSize: 15,
    color: "#1F2937",
    lineHeight: 22,
  },

  actionsContainer: {
    marginTop: 8,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  reagendarButton: {
    flex: 1,
    backgroundColor: "#065F46",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  reagendarButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelarButton: {
    flex: 1,
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelarButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  // ✅ Adicionar estilo para botão desabilitado
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
});
