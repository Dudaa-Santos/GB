import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";

export default function DetalheConsulta({ route }) {
  const { consulta } = route?.params || {};

  console.log("=== DetalheConsulta ===");
  console.log("Consulta recebida:", JSON.stringify(consulta, null, 2));

  // Função para normalizar o status
  const normalizeStatus = (status) => {
    if (!status) return "PENDENTE";
    
    const statusUpper = status.toUpperCase();
    
    if (statusUpper === "PENDENTE_ASSINATURA") {
      return "Pend. Assinar";
    }
    
    return status;
  };

  const getStatusColor = (status) => {
    if (!status) return "#6B7280";
    const s = status.toLowerCase();
    if (s.includes("pendente")) return "#F59E0B";
    if (s.includes("confirmado") || s.includes("agendado")) return "#065F46";
    if (s.includes("cancelado")) return "#DC2626";
    if (s.includes("realizado")) return "#3B82F6";
    return "#6B7280";
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Data não informada";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }) + " às " + date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
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
    
    // Se for objeto, pega o nome
    if (typeof esp === 'object' && esp.nome) {
      return esp.nome;
    }
    
    // Se for string, retorna direto
    if (typeof esp === 'string') {
      return esp;
    }
    
    return "Não informada";
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

          {/* Card Principal */}
          <View style={styles.mainCard}>
            <View style={styles.headerCard}>
              <Text style={styles.consultaTitulo}>Consulta Médica</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(consulta.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {normalizeStatus(consulta.status) || "PENDENTE"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data e Horário:</Text>
              <Text style={styles.infoValue}>
                {formatDateTime(consulta.horario)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID do Agendamento:</Text>
              <Text style={styles.infoValue}>
                #{consulta.idAgendamento || "Não informado"}
              </Text>
            </View>
          </View>

          {/* Paciente */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paciente</Text>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionNome}>{getPacienteNome()}</Text>
              <Text style={styles.sectionInfo}>
                Tipo: {getTipoPaciente()}
              </Text>
              {consulta.dependente?.grauParentesco && (
                <Text style={styles.sectionInfo}>
                  Grau de Parentesco: {consulta.dependente.grauParentesco}
                </Text>
              )}
            </View>
          </View>

          {/* Médico */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Médico</Text>
            <View style={styles.sectionCard}>
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

          {/* Colaborador (Solicitante) */}
          {consulta.colaborador && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Solicitante</Text>
              <View style={styles.colaboradorCard}>
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

          {/* Observações */}
          {consulta.observacoes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Observações</Text>
              <View style={styles.observacoesCard}>
                <Text style={styles.observacoesText}>
                  {consulta.observacoes}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
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
  },
  errorText: {
    fontSize: 16,
    color: "#DC2626",
    textAlign: "center",
  },

  // Card Principal
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

  // Seções
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
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#065F46",
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

  // Colaborador
  colaboradorCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#065F46",
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

  // Observações
  observacoesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
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
});