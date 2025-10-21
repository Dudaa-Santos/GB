import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import Input from "../components/input";
import Select from "../components/select";
import RadioGroup from "../components/radioGroup";
import AvailableTimeButton from "../components/availableTimeButton";
import CalendarioSemanalSelecionado from "../components/calendarioSemanalSelecionado";
import SubmitButton from "../components/submitButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  buscarColabPorId,
  buscarEspecialidade,
  buscarMedicos,
  disponibilidadeMedico,
  agendarConsulta,
} from "../service/authService";

/* ================= Helpers ================= */
function getValueId(value) {
  if (value == null) return null;
  if (typeof value === "object") return value.value != null ? String(value.value) : null;
  return String(value);
}

function getMedEspecialidadeIds(med) {
  const ids = [];
  if (med?.especialidadeId != null) ids.push(med.especialidadeId);
  if (med?.idEspecialidade != null) ids.push(med.idEspecialidade);
  if (med?.id_especialidade != null) ids.push(med.id_especialidade);
  if (med?.especialidade?.id != null) ids.push(med.especialidade.id);
  if (Array.isArray(med?.especialidades)) {
    for (const e of med.especialidades) {
      if (e?.id != null) ids.push(e.id);
      if (e?.especialidadeId != null) ids.push(e.especialidadeId);
      if (e?.id_especialidade != null) ids.push(e.id_especialidade);
    }
  }
  if (Array.isArray(med?.especialidade_ids)) for (const x of med.especialidade_ids) ids.push(x);
  return ids.map(String).filter(Boolean);
}

function getMedicoDiasDisponiveis(medico) {
  if (!medico) return [];
  const diasDisponiveis = [];
  let disponibilidades = null;

  if (Array.isArray(medico.disponibilidade) && medico.disponibilidade.length > 0) {
    disponibilidades = medico.disponibilidade;
  } else if (medico.disponibilidade && typeof medico.disponibilidade === "object") {
    disponibilidades = [medico.disponibilidade];
  }

  if (Array.isArray(disponibilidades)) {
    for (const disp of disponibilidades) {
      if (disp?.dia || disp?.diaSemana || disp?.dia_semana) {
        diasDisponiveis.push(disp.dia || disp.diaSemana || disp.dia_semana);
      }
      if (Array.isArray(disp?.dias)) diasDisponiveis.push(...disp.dias);
      const diasSemana = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
      diasSemana.forEach((dia) => {
        if (disp?.[dia] === true || disp?.[dia] === 1 || disp?.[dia] === "1") diasDisponiveis.push(dia);
      });
    }
  }

  if (diasDisponiveis.length === 0) {
    const diasSemana = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
    diasSemana.forEach((dia) => {
      if (medico?.[dia] === true || medico?.[dia] === 1 || medico?.[dia] === "1") diasDisponiveis.push(dia);
    });
    if (Array.isArray(medico?.dias)) diasDisponiveis.push(...medico.dias);
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
  if (typeof dia === "string" && !isNaN(Number(dia))) return parseInt(dia);
  return map[dia?.toString().toLowerCase()] ?? null;
}

function calcularDiasDesabilitados(medico) {
  if (!medico) return [];
  const diasDisp = getMedicoDiasDisponiveis(medico).map(converterDiaParaNumero).filter((d) => d !== null);
  if (diasDisp.length === 0) return [];
  const todos = [0, 1, 2, 3, 4, 5, 6];
  return todos.filter((d) => !diasDisp.includes(d));
}

// ISO (UTC) -> HH:MM local
function isoToLocalHHMM(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "--:--";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/* ================== Componente ================== */
export default function AgendarConsulta() {
  const navigation = useNavigation();

  const [tipo, setTipo] = useState("colaborador"); // 'colaborador' | 'dependente'
  const [colaborador, setColaborador] = useState(null);
  const [dependenteSel, setDependenteSel] = useState(null);

  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadeSel, setEspecialidadeSel] = useState(null);

  const [allMedicos, setAllMedicos] = useState([]);
  const [medicoSel, setMedicoSel] = useState(null);

  const [sel, setSel] = useState(null); // YYYY-MM-DD (string)
  const [slots, setSlots] = useState([]); // { iso, label, disponivel }
  const [horarioSel, setHorarioSel] = useState(null);

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Colaborador
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
        setColaborador((resp && resp.data != null ? resp.data : resp) || null);
      } catch {
        setError("Não foi possível carregar os dados do colaborador.");
      }
    })();
  }, []);

  // Especialidades
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setError("Sessão inválida. Faça login novamente.");
          return;
        }
        const resp = await buscarEspecialidade(token);
        const lista = (resp && resp.data != null ? resp.data : resp) || [];
        setEspecialidades(Array.isArray(lista) ? lista : []);
      } catch {
        setError("Não foi possível carregar os dados das especialidades.");
      }
    })();
  }, []);

  // Médicos
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setError("Sessão inválida. Faça login novamente.");
          return;
        }
        const resp = await buscarMedicos(token);
        const lista = (resp && resp.data != null ? resp.data : resp) || [];
        setAllMedicos(Array.isArray(lista) ? lista : []);
      } catch {
        setError("Não foi possível carregar os dados dos médicos.");
      }
    })();
  }, []);

  const nomeColab =
    (colaborador && (colaborador.nome || (colaborador.data && colaborador.data.nome))) || "";
  const idColab =
    (colaborador && (colaborador.id || (colaborador.data && colaborador.data.id))) || null;
  const dependentes =
    (colaborador && (colaborador.dependentes || (colaborador.data && colaborador.data.dependentes))) || [];

  // Limpezas quando troca filtro
  useEffect(() => {
    setMedicoSel(null);
    setHorarioSel(null);
    setSlots([]);
  }, [especialidadeSel]);

  useEffect(() => {
    setHorarioSel(null);
    setSel(null);
    setSlots([]);
  }, [medicoSel]);

  // Médicos filtrados
  const medicosFiltrados = useMemo(() => {
    const espSelId = getValueId(especialidadeSel);
    if (!espSelId) return [];
    return (allMedicos || []).filter((med) => {
      const especialidadeIds = getMedEspecialidadeIds(med);
      return especialidadeIds.includes(String(espSelId));
    });
  }, [allMedicos, especialidadeSel]);

  // Desabilitar dias pelo perfil do médico (se houver)
  const diasDesabilitados = useMemo(() => {
    if (!medicoSel) return [];
    const medicoEncontrado = medicosFiltrados.find((m) => String(m.id) === String(medicoSel));
    return calcularDiasDesabilitados(medicoEncontrado);
  }, [medicoSel, medicosFiltrados]);

  // Buscar slots quando mudar médico ou data
  useEffect(() => {
    (async () => {
      if (!medicoSel || !sel) {
        setSlots([]);
        return;
      }
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setError("Sessão inválida. Faça login novamente.");
          return;
        }

        console.log("🔍 Buscando disponibilidade:", { medicoSel, sel });
        const resp = await disponibilidadeMedico(medicoSel, token, sel);
        console.log("📥 Resposta da API:", resp);

        const horarios = resp?.data ?? [];

        const lista = horarios.map((it) => {
          const disponivel =
            it.disponivel === true ||
            it.disponivel === 1 ||
            it.disponivel === "1" ||
            it.disponivel === "true";

          console.log(`⏰ Horário: ${it.horario}, disponível: ${it.disponivel} -> ${disponivel}`);

          return {
            iso: it.horario, // ISO UTC do backend
            label: isoToLocalHHMM(it.horario),
            disponivel,
          };
        });

        console.log("📅 Slots processados:", lista);
        setSlots(lista);
      } catch (e) {
        console.error("❌ Erro ao buscar disponibilidade:", e);
        setSlots([]);
        setError(e?.message || "Erro ao buscar disponibilidade do médico.");
      }
    })();
  }, [medicoSel, sel]);

  // Se mudar slots, garantir que o selecionado ainda existe e está disponível
  useEffect(() => {
    if (horarioSel) {
      const slotAtual = slots.find((s) => s.iso === horarioSel);
      if (!slotAtual || !slotAtual.disponivel) {
        console.log("⚠️ Removendo seleção - slot indisponível");
        setHorarioSel(null);
      }
    }
  }, [slots, horarioSel]);

  /** ✅ Monta o payload exatamente como o backend espera (IDs simples) */
  function buildPayload() {
    const depObj =
      tipo === "dependente"
        ? (dependentes || []).find((d) => String(d.id) === String(dependenteSel))
        : null;

    const payload = {
      idAgendamento: "",                   // servidor gera depois
      idColaborador: String(idColab),      // << REQUIRED
      idMedico: String(medicoSel),         // << REQUIRED
      horario: horarioSel,                 // ISO UTC vindo do endpoint
      status: "AGENDADO",                  // << REQUIRED (maiúsculo)
      ...(tipo === "dependente" && depObj
        ? { idDependente: String(depObj.id) }
        : {}),
    };

    console.log("📦 Payload final pronto para envio:", payload);
    return payload;
  }

  async function handleSubmit() {
    setError(null);

    // Validações
    if (!idColab) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }
    if (!medicoSel || !sel || !horarioSel) {
      setError("Selecione especialidade, médico, data e horário.");
      return;
    }
    if (tipo === "dependente" && !dependenteSel) {
      setError("Selecione o dependente.");
      return;
    }

    // 1) Bloqueia horário passado
    const agora = new Date();
    const dtSel = new Date(horarioSel); // ISO UTC
    if (isNaN(dtSel.getTime())) {
      setError("Horário inválido.");
      return;
    }
    if (dtSel < agora) {
      setError("Esse horário já passou. Selecione um horário futuro.");
      return;
    }

    // 2) Confirma slot disponível
    const slotSelecionado = slots.find((s) => s.iso === horarioSel);
    if (!slotSelecionado || !slotSelecionado.disponivel) {
      setError("O horário selecionado não está mais disponível.");
      return;
    }

    // 3) Monta payload
    const payload = buildPayload();

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setError("Sessão inválida. Faça login novamente.");
        return;
      }

      console.log("📤 Payload completo para agendamento:");
      console.log(JSON.stringify(payload, null, 2));
      console.log("🚀 Chamando agendarConsulta...");

      const resp = await agendarConsulta(payload, token);

      console.log("✅ Consulta agendada com sucesso:", resp);
      Alert.alert(
        "Sucesso", 
        "Consulta agendada com sucesso!",
        [
          {
            text: "OK",
            onPress: () => {
              // Reset dos states
              setHorarioSel(null);
              setSel(null);
              setSlots([]);
              setMedicoSel(null);
              setEspecialidadeSel(null);
              setTipo("colaborador");
              setDependenteSel(null);
              
              // Volta para a Home
              navigation.navigate("Home");
            }
          }
        ]
      );

    } catch (e) {
      console.error("❌ Erro completo:", e);
      let errorMessage = "Erro ao agendar consulta";
      if (e?.message) errorMessage = e.message;
      setError(errorMessage);
      Alert.alert("Erro", errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Fundo scrollable={true}>
      <View style={styles.container}>
        <TituloIcone titulo="Agendar Consulta" icone={require("../images/icones/Calendar_add_g.png")} />

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
            errorText={error && error.includes("colaborador") ? error : undefined}
          />
        ) : (
          <Select
            placeholder="Selecione o dependente"
            data={(dependentes || []).map((dep) => ({ label: dep.nome, value: String(dep.id) }))}
            label="Dependente"
            selectedValue={dependenteSel}
            onValueChange={(val) => setDependenteSel(getValueId(val))}
          />
        )}

        <Text style={styles.label}>Selecione a especialidade e o médico</Text>

        <Select
          placeholder="Selecione a especialidade"
          data={(especialidades || []).map((esp) => ({ label: esp.nome, value: String(esp.id) }))}
          selectedValue={getValueId(especialidadeSel)}
          onValueChange={(val) => setEspecialidadeSel(val)}
          label="Especialidade"
        />

        <Select
          placeholder={getValueId(especialidadeSel) ? "Selecione o médico" : "Escolha uma especialidade antes"}
          data={medicosFiltrados.map((med) => ({ label: med.nome, value: String(med.id) }))}
          selectedValue={medicoSel}
          onValueChange={(val) => setMedicoSel(getValueId(val))}
          label="Médico"
          containerStyle={
            (!getValueId(especialidadeSel) || medicosFiltrados.length === 0) && styles.selectDisabled
          }
        />

        <View style={{ flex: 1, justifyContent: "center" }}>
          <CalendarioSemanalSelecionado
            initialMonth={new Date()}
            selectedISO={sel}
            onChange={setSel}
            holidaysISO={[]}
            dotsISO={[]}
            disabledDaysOfWeek={diasDesabilitados}
            disabled={!medicoSel}
            title="Selecione uma data"
          />
          {sel && <Text style={styles.dataSelecionada}>Data selecionada: {sel}</Text>}
        </View>

        {medicoSel && (
          <View style={styles.horariosSection}>
            <Text style={styles.label}>Selecione o horário</Text>

            {slots.length === 0 ? (
              <Text style={styles.noSlotsText}>
                {sel ? "Nenhum horário disponível para esta data" : "Selecione uma data primeiro"}
              </Text>
            ) : (
              <>
                <View style={styles.horariosInfo}>
                  <Text style={styles.horariosInfoText}>
                    {slots.filter((s) => s.disponivel).length} horários disponíveis de {slots.length}
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
                          setHorarioSel(horarioSel === slot.iso ? null : slot.iso);
                        } else {
                          console.log("⚠️ Tentativa de selecionar horário indisponível");
                        }
                      }}
                      style={styles.horarioButton}
                    />
                  ))}
                </View>
              </>
            )}

            {horarioSel && (
              <Text style={styles.horarioSelecionado}>
                Horário selecionado: {isoToLocalHHMM(horarioSel)}
              </Text>
            )}
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.submitContainer}>
          <SubmitButton
            title={submitting ? "Agendando..." : "Agendar Consulta"}
            disabled={submitting || !medicoSel || !sel || !horarioSel}
            onPress={handleSubmit}
          />
          {submitting && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#047857" />
              <Text style={styles.loadingText}>Processando agendamento...</Text>
            </View>
          )}
        </View>
      </View>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  label: { fontSize: 18, marginTop: 10, marginBottom: 6, color: "#000000" },
  dataSelecionada: {
    fontSize: 14,
    color: "#047857",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
  },
  horariosSection: { marginVertical: 16 },
  horariosInfo: {
    backgroundColor: "#E8F5E8",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#047857",
  },
  horariosInfoText: {
    fontSize: 14,
    color: "#047857",
    fontWeight: "600",
  },
  horariosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  horarioButton: { flex: 1, minWidth: "30%", maxWidth: "32%" },
  horarioSelecionado: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#047857",
    textAlign: "center",
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#047857",
  },
  selectDisabled: { opacity: 0.6, pointerEvents: "none" },
  noSlotsText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    padding: 20,
    fontStyle: "italic",
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
    marginVertical: 8,
  },
  errorText: { color: "#B91C1C", fontSize: 14, fontWeight: "500" },
  submitContainer: { marginTop: 16, gap: 8 },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: { fontSize: 14, color: "#6B7280" },
});
