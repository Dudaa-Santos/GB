import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
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
  agendarConsulta
} from "../service/authService";

/* ================= Helpers ================= */
function getValueId(value) {
  if (value == null) return null;
  if (typeof value === "object")
    return value.value != null ? String(value.value) : null;
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
  if (Array.isArray(med?.especialidade_ids))
    for (const x of med.especialidade_ids) ids.push(x);
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
        if (disp?.[dia] === true || disp?.[dia] === 1 || disp?.[dia] === "1")
          diasDisponiveis.push(dia);
      });
    }
  }

  if (diasDisponiveis.length === 0) {
    const diasSemana = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
    diasSemana.forEach((dia) => {
      if (medico?.[dia] === true || medico?.[dia] === 1 || medico?.[dia] === "1")
        diasDisponiveis.push(dia);
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
  const diasDisp = getMedicoDiasDisponiveis(medico)
    .map(converterDiaParaNumero)
    .filter((d) => d !== null);
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

  const [tipo, setTipo] = useState("colaborador");
  const [colaborador, setColaborador] = useState(null);
  const [dependenteSel, setDependenteSel] = useState(null);

  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadeSel, setEspecialidadeSel] = useState(null);

  const [allMedicos, setAllMedicos] = useState([]);
  const [medicoSel, setMedicoSel] = useState(null);

  const [sel, setSel] = useState(null); // YYYY-MM-DD

  const [slots, setSlots] = useState([]); // { iso, label, disponivel }
  const [horarioSel, setHorarioSel] = useState(null);
  const [error, setError] = useState(null);

  

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

        const resp = await disponibilidadeMedico(medicoSel, token, sel);
        const horarios = resp?.data ?? [];

        // Normaliza `disponivel` (aceita boolean, "true"/"false" e 1/0)
        const lista = horarios.map((it) => {
          const disponivel =
            it.disponivel === true ||
            it.disponivel === 1 ||
            it.disponivel === "1" ||
            it.disponivel === "true";
          return {
            iso: it.horario,
            label: isoToLocalHHMM(it.horario),
            disponivel,
          };
        });

        setSlots(lista);
      } catch (e) {
        setSlots([]);
        setError(e?.message || "Erro ao buscar disponibilidade do médico.");
      }
    })();
  }, [medicoSel, sel]);

  // Se mudar slots, garantir que o selecionado ainda existe
  useEffect(() => {
    if (horarioSel && !slots.find((s) => s.iso === horarioSel)) setHorarioSel(null);
  }, [slots]);

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
            disabled={true}
            errorText={error || undefined}
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
          placeholder={
            getValueId(especialidadeSel) ? "Selecione o médico" : "Escolha uma especialidade antes"
          }
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
          <Text>Data selecionada: {sel}</Text>
        </View>

        {medicoSel && (
          <View style={styles.horariosSection}>
            <Text style={styles.label}>Selecione o horário</Text>

            <View style={styles.horariosGrid}>
              {slots.map((slot) => (
                <AvailableTimeButton
                  key={slot.iso}
                  title={slot.label}
                  isSelected={horarioSel === slot.iso}
                  isBlocked={!slot.disponivel}               // << desativa quando indisponível
                  onPress={() =>
                    setHorarioSel(horarioSel === slot.iso ? null : slot.iso)
                  }
                  style={styles.horarioButton}
                />
              ))}
            </View>

            {horarioSel && (
              <Text style={styles.horarioSelecionado}>
                Horário selecionado: {isoToLocalHHMM(horarioSel)}
              </Text>
            )}
          </View>
        )}

        <SubmitButton
          title="Agendar Consulta"
          onPress={() => {
            if (!medicoSel || !sel || !horarioSel) {
              setError("Selecione especialidade, médico, data e horário.");
              return;
            }
            // Envie horarioSel (ISO UTC) ao backend quando criar o agendamento
            // criarSolicitacao({ medicoId: medicoSel, data: sel, horarioIso: horarioSel, ... })
          }}
        />
      </View>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  label: { fontSize: 18, marginTop: 10, marginBottom: 6, color: "#000000" },
  horariosSection: { marginVertical: 16 },
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
});
