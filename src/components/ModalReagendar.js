import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CalendarioSemanalSelecionado from "./calendarioSemanalSelecionado";
import AvailableTimeButton from "./availableTimeButton";
import { disponibilidadeMedico, reagendarConsulta, buscarMedicos } from "../service/authService";

/* =============== Helpers =============== */

// Helper para converter ISO em HH:MM local
function isoToLocalHHMM(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return iso;
  }
}

/**
 * Helpers de disponibilidade do médico
 * (mesma ideia da tela de Agendar Consulta)
 */

// Lê os dias disponíveis do médico, independente de como veio do backend
function getMedicoDiasDisponiveis(medico) {
  if (!medico) return [];

  const diasDisponiveis = [];
  let disponibilidades = null;

  // Variações comuns
  if (Array.isArray(medico.disponibilidade) && medico.disponibilidade.length > 0) {
    disponibilidades = medico.disponibilidade;
  } else if (medico.disponibilidade && typeof medico.disponibilidade === "object") {
    disponibilidades = [medico.disponibilidade];
  } else if (Array.isArray(medico.disponibilidades) && medico.disponibilidades.length > 0) {
    // aqui cobre o que vem em consulta.medico.disponibilidades
    disponibilidades = medico.disponibilidades;
  }

  if (Array.isArray(disponibilidades)) {
    for (const disp of disponibilidades) {
      // campos de dia
      if (disp?.dia || disp?.diaSemana || disp?.dia_semana) {
        diasDisponiveis.push(disp.dia || disp.diaSemana || disp.dia_semana);
      }

      // array de dias
      if (Array.isArray(disp?.dias)) {
        diasDisponiveis.push(...disp.dias);
      }

      // flags por dia da semana
      const diasSemana = [
        "segunda",
        "terca",
        "terça",
        "quarta",
        "quinta",
        "sexta",
        "sabado",
        "sábado",
        "domingo",
      ];

      diasSemana.forEach((dia) => {
        if (disp?.[dia] === true || disp?.[dia] === 1 || disp?.[dia] === "1") {
          diasDisponiveis.push(dia);
        }
      });
    }
  }

  // Fallback: flags direto no objeto do médico
  if (diasDisponiveis.length === 0) {
    const diasSemana = [
      "segunda",
      "terca",
      "terça",
      "quarta",
      "quinta",
      "sexta",
      "sabado",
      "sábado",
      "domingo",
    ];

    diasSemana.forEach((dia) => {
      if (medico?.[dia] === true || medico?.[dia] === 1 || medico?.[dia] === "1") {
        diasDisponiveis.push(dia);
      }
    });

    if (Array.isArray(medico?.dias)) {
      diasDisponiveis.push(...medico.dias);
    }
  }

  return diasDisponiveis;
}

function converterDiaParaNumero(dia) {
  const map = {
    domingo: 0,
    segunda: 1,
    terca: 2,
    "terça": 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    sabado: 6,
    "sábado": 6,
  };

  if (typeof dia === "number") return dia;
  if (typeof dia === "string" && !isNaN(Number(dia))) return parseInt(dia, 10);

  return map[dia?.toString().toLowerCase()] ?? null;
}

// Calcula dias desabilitados baseado na disponibilidade do médico
function calcularDiasDesabilitados(medico) {
  if (!medico) return [];

  const diasDisp = getMedicoDiasDisponiveis(medico)
    .map(converterDiaParaNumero)
    .filter((d) => d !== null);

  // se não tem info de disponibilidade, não bloqueia nada
  if (diasDisp.length === 0) return [];

  const todos = [0, 1, 2, 3, 4, 5, 6];
  return todos.filter((d) => !diasDisp.includes(d));
}

/* =============== Componente =============== */

export default function ModalReagendar({ visible, onClose, consulta, onSuccess }) {
  const [sel, setSel] = useState(null);
  const [slots, setSlots] = useState([]);
  const [horarioSel, setHorarioSel] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [allMedicos, setAllMedicos] = useState([]);
  
  // ✅ Estado para controlar a data inicial do calendário
  const [initialDate, setInitialDate] = useState(new Date());

  const medico = consulta?.medico || {};
  const especialidade = medico?.especialidade || {};

  // ✅ Busca lista completa de médicos ao abrir o modal
  useEffect(() => {
    if (visible) {
      (async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) return;
          
          const resp = await buscarMedicos(token);
          const lista = (resp && resp.data != null ? resp.data : resp) || [];
          setAllMedicos(Array.isArray(lista) ? lista : []);
          
          console.log("📋 Médicos carregados no modal:", lista.length);
        } catch (error) {
          console.error("❌ Erro ao carregar médicos no modal:", error);
        }
      })();

      // ✅ Define a data inicial do calendário baseada no horário da consulta
      if (consulta?.horario) {
        try {
          const dataConsulta = new Date(consulta.horario);
          if (!isNaN(dataConsulta.getTime())) {
            console.log("📅 Calendário iniciará na data:", dataConsulta.toISOString());
            setInitialDate(dataConsulta);
          }
        } catch (error) {
          console.error("❌ Erro ao processar data da consulta:", error);
        }
      }
    }
  }, [visible, consulta?.horario]);

  // ✅ Calcula dias desabilitados buscando o médico completo da lista
  const diasDesabilitados = useMemo(() => {
    if (!medico?.id || allMedicos.length === 0) {
      console.log("⚠️ Médico ou lista de médicos não disponível");
      return [];
    }
    
    // Busca o médico completo na lista (com todas as disponibilidades)
    const medicoCompleto = allMedicos.find((m) => String(m.id) === String(medico.id));
    
    if (!medicoCompleto) {
      console.log("⚠️ Médico não encontrado na lista:", medico.id);
      return [];
    }
    
    console.log("🔍 Médico completo encontrado:", {
      id: medicoCompleto.id,
      nome: medicoCompleto.nome,
      disponibilidades: medicoCompleto.disponibilidade || medicoCompleto.disponibilidades
    });
    
    const diasBloqueados = calcularDiasDesabilitados(medicoCompleto);
    console.log("🚫 Dias bloqueados calculados:", diasBloqueados);
    
    return diasBloqueados;
  }, [medico?.id, allMedicos]);

  // Pré-seleciona a data da consulta quando o modal abre
  useEffect(() => {
    if (visible && consulta?.horario && !sel) {
      try {
        const dataOriginal = consulta.horario.split("T")[0];
        console.log("📅 Pré-selecionando data original:", dataOriginal);
        setSel(dataOriginal);
      } catch (error) {
        console.error("❌ Erro ao extrair data original:", error);
      }
    }
  }, [visible, consulta, sel]);

  // Busca horários disponíveis quando seleciona uma data
  useEffect(() => {
    if (!visible || !medico.id || !sel) {
      if (!sel) {
        setSlots([]);
        setHorarioSel(null);
      }
      return;
    }

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          Alert.alert("Erro", "Sessão expirada. Faça login novamente.");
          return;
        }

        console.log("🔍 Buscando horários para:", {
          medicoId: medico.id,
          data: sel,
          tokenLength: token.length,
        });

        const resp = await disponibilidadeMedico(medico.id, sel, token);
        const horariosArray = resp?.data || resp || [];

        console.log("📅 Horários recebidos:", horariosArray.length);

        const slotsFormatados = horariosArray.map((h) => {
          const iso = h.horario || h;
          const label = isoToLocalHHMM(iso);
          const disponivel = h.disponivel !== false;
          return { iso, label, disponivel };
        });

        setSlots(slotsFormatados);

        // Pré-seleciona o horário original se ainda estiver disponível
        if (consulta?.horario) {
          const horarioOriginal = consulta.horario;
          const horarioDisponivel = slotsFormatados.find(
            (slot) => slot.iso === horarioOriginal && slot.disponivel
          );

          if (horarioDisponivel) {
            console.log("✅ Horário original ainda disponível:", horarioOriginal);
            setHorarioSel(horarioOriginal);
          } else {
            console.log("⚠️ Horário original não está mais disponível");
          }
        }
      } catch (error) {
        console.error("❌ Erro ao buscar horários:", error);
        Alert.alert(
          "Erro",
          error.message || "Não foi possível carregar os horários disponíveis"
        );
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [visible, medico.id, sel, consulta]);

  // Reset ao fechar modal
  useEffect(() => {
    if (!visible) {
      setSel(null);
      setSlots([]);
      setHorarioSel(null);
      setAllMedicos([]);
      setInitialDate(new Date()); // ✅ Reseta data inicial
    }
  }, [visible]);

  const handleConfirmar = async () => {
    if (!horarioSel) {
      Alert.alert("Atenção", "Selecione uma data e horário");
      return;
    }

    const agora = new Date();
    const dtSel = new Date(horarioSel);
    if (dtSel < agora) {
      Alert.alert("Erro", "Esse horário já passou. Selecione um horário futuro.");
      return;
    }

    const slotSelecionado = slots.find((s) => s.iso === horarioSel);
    if (!slotSelecionado || !slotSelecionado.disponivel) {
      Alert.alert("Erro", "O horário selecionado não está mais disponível");
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Erro", "Sessão expirada. Faça login novamente.");
        return;
      }

      console.log("🔄 Reagendando:", {
        idAgendamento: consulta.idAgendamento,
        novoHorario: horarioSel,
      });

      await reagendarConsulta(consulta.idAgendamento, horarioSel, token);

      Alert.alert("Sucesso", "Consulta reagendada com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            onSuccess?.();
          },
        },
      ]);
    } catch (error) {
      console.error("❌ Erro ao reagendar:", error);
      Alert.alert(
        "Erro",
        error.message || "Não foi possível reagendar a consulta"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Reagendar Consulta</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Info da consulta */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Médico:</Text>
                <Text style={styles.infoValue}>
                  {medico.nome || "Não informado"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Especialidade:</Text>
                <Text style={styles.infoValue}>
                  {typeof especialidade === "object"
                    ? especialidade.nome
                    : especialidade || "Não informada"}
                </Text>
              </View>

              {medico.crm && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>CRM:</Text>
                  <Text style={styles.infoValue}>{medico.crm}</Text>
                </View>
              )}

              {consulta?.horario && (
                <View
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: "#D1D5DB",
                  }}
                >
                  <Text style={styles.infoLabel}>Agendamento atual:</Text>
                  <Text style={[styles.infoValue, { color: "#DC2626" }]}>
                    {new Date(consulta.horario).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              )}
            </View>

            {/* Calendário */}
            <Text style={styles.sectionTitle}>Selecione a nova data</Text>
            {/* ✅ Agora usa initialDate ao invés de consulta?.horario direto */}
            <CalendarioSemanalSelecionado
              initialMonth={initialDate}
              selectedISO={sel}
              onChange={setSel}
              holidaysISO={[]}
              dotsISO={[]}
              disabledDaysOfWeek={diasDesabilitados}
              disabled={!medico}
            />

            {sel && (
              <Text style={styles.dataSelecionada}>
                📅 Data selecionada: {sel}
              </Text>
            )}

            {/* Horários */}
            {sel && (
              <View style={styles.horariosSection}>
                <Text style={styles.sectionTitle}>Selecione o novo horário</Text>

                {loadingSlots ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#065F46" />
                    <Text style={styles.loadingText}>
                      Carregando horários...
                    </Text>
                  </View>
                ) : slots.length === 0 ? (
                  <Text style={styles.noSlotsText}>
                    ⚠️ Nenhum horário disponível para esta data
                  </Text>
                ) : (
                  <>
                    <View style={styles.horariosInfo}>
                      <Text style={styles.horariosInfoText}>
                        ✅ {slots.filter((s) => s.disponivel).length} horários
                        disponíveis de {slots.length}
                      </Text>
                    </View>

                    <View style={styles.horariosGrid}>
                      {slots.map((slot) => (
                        <AvailableTimeButton
                          key={slot.iso}
                          title={slot.label}
                          isSelected={horarioSel === slot.iso}
                          isBlocked={!slot.disponivel}
                          onPress={() => {
                            if (slot.disponivel) {
                              setHorarioSel(
                                horarioSel === slot.iso ? null : slot.iso
                              );
                            }
                          }}
                          style={styles.horarioButton}
                        />
                      ))}
                    </View>
                  </>
                )}

                {horarioSel && (
                  <View style={styles.horarioSelecionadoContainer}>
                    <Text style={styles.horarioSelecionado}>
                      🕒 Novo horário: {isoToLocalHHMM(horarioSel)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer com botões */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                (!horarioSel || submitting) && styles.buttonDisabled,
              ]}
              onPress={handleConfirmar}
              disabled={!horarioSel || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  Reagendar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "92%",
    maxHeight: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 24,
    color: "#6B7280",
    fontWeight: "300",
  },
  content: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: "#F3F4F6",
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#065F46",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 8,
    marginBottom: 12,
  },
  dataSelecionada: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: "#065F46",
    marginTop: 8,
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#D1FAE5",
    borderRadius: 6,
  },
  horariosSection: {
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  horariosInfo: {
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  horariosInfoText: {
    fontSize: 13,
    color: "#1E40AF",
    textAlign: "center",
    fontWeight: "500",
  },
  horariosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
  },
  horarioButton: {
    flex: 1,
    minWidth: "30%",
    maxWidth: "32%",
  },
  noSlotsText: {
    textAlign: "center",
    color: "#DC2626",
    fontSize: 14,
    marginVertical: 24,
    fontWeight: "500",
  },
  horarioSelecionadoContainer: {
    marginTop: 12,
  },
  horarioSelecionado: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#065F46",
    padding: 10,
    backgroundColor: "#D1FAE5",
    borderRadius: 8,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#065F46",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#D1D5DB",
    opacity: 0.6,
  },
});
