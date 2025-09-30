import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
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
import { Picker } from "@react-native-picker/picker";
import { buscarColabPorId, buscarEspecialidade, buscarMedicos } from "../service/authService";

/* ===== Helpers de normalização (JS puro) ===== */
function getValueId(value) {
  if (value == null) return null;
  if (typeof value === "object") {
    return value.value != null ? String(value.value) : null;
  }
  return String(value);
}

// Retorna TODOS os possíveis IDs de especialidade do médico como strings
function getMedEspecialidadeIds(med) {
  const ids = [];

  // casos simples
  if (med && med.especialidadeId != null) ids.push(med.especialidadeId);
  if (med && med.idEspecialidade != null) ids.push(med.idEspecialidade);
  if (med && med.id_especialidade != null) ids.push(med.id_especialidade);

  // objeto aninhado
  if (med && med.especialidade && med.especialidade.id != null) {
    ids.push(med.especialidade.id);
  }

  // arrays possíveis
  if (med && Array.isArray(med.especialidades)) {
    for (const e of med.especialidades) {
      if (e && e.id != null) ids.push(e.id);
      if (e && e.especialidadeId != null) ids.push(e.especialidadeId);
      if (e && e.id_especialidade != null) ids.push(e.id_especialidade);
    }
  }
  if (med && Array.isArray(med.especialidade_ids)) {
    for (const x of med.especialidade_ids) ids.push(x);
  }

  return ids.map((x) => String(x)).filter(Boolean);
}

// Função para extrair os horários de trabalho do médico
function getMedicoHorarios(medico) {
  if (!medico) return null;
  
  // Busca horários nas disponibilidades ou diretamente no médico
  let horarios = null;
  
  // Verifica se os horários estão nas disponibilidades
  if (medico.disponibilidade && Array.isArray(medico.disponibilidade) && medico.disponibilidade.length > 0) {
    const disp = medico.disponibilidade[0];
    horarios = {
      horaEntrada: disp.horaEntrada,
      horaPausa: disp.horaPausa,
      horaVolta: disp.horaVolta,
      horaSaida: disp.horaSaida
    };
  } else if (medico.disponibilidade && typeof medico.disponibilidade === 'object') {
    horarios = {
      horaEntrada: medico.disponibilidade.horaEntrada,
      horaPausa: medico.disponibilidade.horaPausa,
      horaVolta: medico.disponibilidade.horaVolta,
      horaSaida: medico.disponibilidade.horaSaida
    };
  }
  
  // Se não encontrou nas disponibilidades, busca diretamente no médico
  if (!horarios || (!horarios.horaEntrada && !horarios.horaEntrada && !horarios.horaVolta && !horarios.horaSaida)) {
    horarios = {
      horaEntrada: medico.horaEntrada,
      horaPausa: medico.horaPausa,
      horaVolta: medico.horaVolta,
      horaSaida: medico.horaSaida
    };
  }
  
  return horarios;
}

// Função para converter horário "HH:MM" para minutos desde 00:00
function horarioParaMinutos(horario) {
  if (!horario || typeof horario !== 'string') return null;
  const [horas, minutos] = horario.split(':').map(Number);
  return (horas * 60) + minutos;
}

// Função para converter minutos para "HH:MM"
function minutosParaHorario(minutos) {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Função para gerar horários disponíveis baseado no médico selecionado
function gerarHorarios(medico) {
  if (!medico) return [];
  
  const horariosTrabalho = getMedicoHorarios(medico);
  if (!horariosTrabalho) {
    console.log('Horários não encontrados para o médico, usando padrão');
    return gerarHorariosPadrao();
  }
  
  const horarios = [];
  
  // Converte horários para minutos
  const entrada = horarioParaMinutos(horariosTrabalho.horaEntrada);
  const pausa = horarioParaMinutos(horariosTrabalho.horaPausa);
  const volta = horarioParaMinutos(horariosTrabalho.horaVolta);
  const saida = horarioParaMinutos(horariosTrabalho.horaSaida);
  
  console.log('Horários do médico:', horariosTrabalho);
  console.log('Em minutos - Entrada:', entrada, 'Pausa:', pausa, 'Volta:', volta, 'Saída:', saida);
  
  // Gera horários da manhã (entrada até pausa)
  if (entrada !== null && pausa !== null) {
    for (let minutos = entrada; minutos < pausa; minutos += 30) {
      horarios.push(minutosParaHorario(minutos));
    }
  }
  
  // Gera horários da tarde (volta até saída)
  if (volta !== null && saida !== null) {
    for (let minutos = volta; minutos < saida; minutos += 30) {
      horarios.push(minutosParaHorario(minutos));
    }
  }
  
  console.log('Horários gerados:', horarios);
  return horarios;
}

// Função para gerar horários padrão quando não há horários do médico
function gerarHorariosPadrao() {
  const horarios = [];
  
  // Horários da manhã (8:00 - 12:00)
  for (let hora = 8; hora < 12; hora++) {
    horarios.push(`${hora.toString().padStart(2, '0')}:00`);
    horarios.push(`${hora.toString().padStart(2, '0')}:30`);
  }
  
  // Horários da tarde (14:00 - 18:00)
  for (let hora = 14; hora < 18; hora++) {
    horarios.push(`${hora.toString().padStart(2, '0')}:00`);
    horarios.push(`${hora.toString().padStart(2, '0')}:30`);
  }
  
  return horarios;
}

// Função para extrair os dias da semana que o médico atende
function getMedicoDiasDisponiveis(medico) {
  if (!medico) return [];
  
  const diasDisponiveis = [];
  
  // Busca dias nas disponibilidades ou diretamente no médico
  let disponibilidades = null;
  
  // Verifica se tem array de disponibilidades
  if (medico.disponibilidade && Array.isArray(medico.disponibilidade) && medico.disponibilidade.length > 0) {
    disponibilidades = medico.disponibilidade;
  } else if (medico.disponibilidade && typeof medico.disponibilidade === 'object') {
    disponibilidades = [medico.disponibilidade];
  }
  
  // Extrai os dias das disponibilidades
  if (disponibilidades && Array.isArray(disponibilidades)) {
    for (const disp of disponibilidades) {
      // Procura por diferentes formatos de dias
      if (disp.dia || disp.diaSemana || disp.dia_semana) {
        const dia = disp.dia || disp.diaSemana || disp.dia_semana;
        diasDisponiveis.push(dia);
      }
      
      // Procura por arrays de dias
      if (disp.dias && Array.isArray(disp.dias)) {
        diasDisponiveis.push(...disp.dias);
      }
      
      // Procura por campos individuais de dias da semana
      const diasSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
      diasSemana.forEach(dia => {
        if (disp[dia] === true || disp[dia] === 1 || disp[dia] === '1') {
          diasDisponiveis.push(dia);
        }
      });
    }
  }
  
  // Se não encontrou nas disponibilidades, busca diretamente no médico
  if (diasDisponiveis.length === 0) {
    const diasSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
    diasSemana.forEach(dia => {
      if (medico[dia] === true || medico[dia] === 1 || medico[dia] === '1') {
        diasDisponiveis.push(dia);
      }
    });
    
    // Verifica se tem um array de dias diretamente no médico
    if (medico.dias && Array.isArray(medico.dias)) {
      diasDisponiveis.push(...medico.dias);
    }
  }
  
  console.log(`Dias disponíveis para ${medico.nome}:`, diasDisponiveis);
  return diasDisponiveis;
}

// Função para converter nomes de dias para números (0=domingo, 1=segunda, etc.)
function converterDiaParaNumero(dia) {
  const mapeamento = {
    'domingo': 0,
    'segunda': 1,
    'terca': 2,
    'terça': 2,
    'quarta': 3,
    'quinta': 4,
    'sexta': 5,
    'sabado': 6,
    'sábado': 6
  };
  
  // Se já é um número, retorna
  if (typeof dia === 'number') return dia;
  
  // Se é string numérica, converte
  if (typeof dia === 'string' && !isNaN(dia)) return parseInt(dia);
  
  // Converte nome para número
  const diaLower = dia.toString().toLowerCase();
  return mapeamento[diaLower] ?? null;
}

// Função para calcular quais dias da semana devem ser desabilitados baseado no médico
function calcularDiasDesabilitados(medico) {
  if (!medico) return [];
  
  const diasDisponiveis = getMedicoDiasDisponiveis(medico);
  const diasDisponiveisNumero = diasDisponiveis
    .map(converterDiaParaNumero)
    .filter(dia => dia !== null);
  
  // Se não encontrou dias disponíveis, assume que todos os dias estão disponíveis
  if (diasDisponiveisNumero.length === 0) {
    console.log('Nenhum dia específico encontrado, permitindo todos os dias');
    return [];
  }
  
  // Retorna os dias que NÃO estão disponíveis (0=domingo, 1=segunda, ..., 6=sábado)
  const todosDias = [0, 1, 2, 3, 4, 5, 6];
  const diasDesabilitados = todosDias.filter(dia => !diasDisponiveisNumero.includes(dia));
  
  console.log('Dias disponíveis (números):', diasDisponiveisNumero);
  console.log('Dias desabilitados (números):', diasDesabilitados);
  
  return diasDesabilitados;
}

export default function AgendarConsulta() {
  const navigation = useNavigation();

  // Estado de quem agenda
  const [tipo, setTipo] = useState("colaborador");
  const [colaborador, setColaborador] = useState(null);
  const [dependenteSel, setDependenteSel] = useState(null);

  // Estado de especialidades
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadeSel, setEspecialidadeSel] = useState(null); 

  // Médicos (lista total + selecionado)
  const [allMedicos, setAllMedicos] = useState([]);
  const [medicoSel, setMedicoSel] = useState(null);

  // Calendário
  const [sel, setSel] = useState(null);
  
  // Horário selecionado
  const [horarioSel, setHorarioSel] = useState(null);

  // Erros
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
        setColaborador(resp && resp.data != null ? resp.data : resp || null);
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
        const resp = await buscarEspecialidade(token);
        const lista = (resp && resp.data != null ? resp.data : resp) || [];
        setEspecialidades(Array.isArray(lista) ? lista : []);
      } catch (e) {
        console.log("Erro ao buscar especialidades:", e);
        setError("Não foi possível carregar os dados das especialidades.");
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
        const lista = (resp && resp.data != null ? resp.data : resp) || [];
        const arr = Array.isArray(lista) ? lista : [];
        setAllMedicos(arr);

        // DEBUG opcional:
        console.log("Médicos (amostra 1):", arr[0]);
      } catch (e) {
        console.log("Erro ao buscar médicos:", e);
        setError("Não foi possível carregar os dados dos médicos.");
      }
    })();
  }, []);

  const nomeColab = (colaborador && (colaborador.nome || (colaborador.data && colaborador.data.nome))) || "";
  const dependentes =
    (colaborador && (colaborador.dependentes || (colaborador.data && colaborador.data.dependentes))) || [];

  useEffect(() => {
    setMedicoSel(null);
    setHorarioSel(null);
  }, [especialidadeSel]);

  useEffect(() => {
    setHorarioSel(null);
    setSel(null);
  }, [medicoSel]);

  // Filtra médicos pela especialidade selecionada
  const medicosFiltrados = useMemo(() => {
    const espSelId = getValueId(especialidadeSel);
    
    // Se não há especialidade selecionada, retorna lista vazia
    if (!espSelId) {
      console.log("Nenhuma especialidade selecionada");
      return [];
    }

    // Filtra médicos que possuem a especialidade selecionada
    const result = (allMedicos || []).filter((medico) => {
      const especialidadeIds = getMedEspecialidadeIds(medico);
      const temEspecialidade = especialidadeIds.includes(String(espSelId));
      
      // Debug para cada médico
      if (medico && medico.nome) {
        console.log(`Médico: ${medico.nome}, IDs especialidade: [${especialidadeIds.join(', ')}], Filtrar por: ${espSelId}, Match: ${temEspecialidade}`);
      }
      
      return temEspecialidade;
    });

    console.log(`Filtrando por especialidade ID: ${espSelId} -> ${result.length} médicos encontrados`);
    console.log("Médicos filtrados:", result.map(m => m.nome || m.id));
    
    return result;
  }, [allMedicos, especialidadeSel]);

  // Calcula dias desabilitados baseado no médico selecionado
  const diasDesabilitados = useMemo(() => {
    if (!medicoSel) return [];
    
    const medicoEncontrado = medicosFiltrados.find(m => String(m.id) === String(medicoSel));
    return calcularDiasDesabilitados(medicoEncontrado);
  }, [medicoSel, medicosFiltrados]);

  // Verifica se a data selecionada está em um dia desabilitado pelo médico
  useEffect(() => {
    if (sel && medicoSel && diasDesabilitados.length > 0) {
      const dataSelecionada = new Date(sel);
      const diaSemanaData = dataSelecionada.getDay(); // 0=domingo, 1=segunda, etc.
      
      // Se o dia da semana da data selecionada está na lista de dias desabilitados
      if (diasDesabilitados.includes(diaSemanaData)) {
        console.log(`Data ${sel} (dia ${diaSemanaData}) está desabilitada para este médico. Removendo seleção.`);
        setSel(null);
      }
    }
  }, [diasDesabilitados, sel, medicoSel]);

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
          <>
            <Select
              placeholder="Selecione o dependente"
              data={(dependentes || []).map((dep) => ({
                label: dep.nome,
                value: String(dep.id),
              }))}
              label="Dependente"
              selectedValue={dependenteSel}
              onValueChange={(val) => setDependenteSel(getValueId(val))}
            />
          </>
        )}

        <Text style={styles.label}>Selecione a especialidade e o médico</Text>

        {/* Especialidade */}
        <Select
          placeholder="Selecione a especialidade"
          data={(especialidades || []).map((esp) => ({
            label: esp.nome,
            value: String(esp.id),
          }))}
          selectedValue={getValueId(especialidadeSel)}
          onValueChange={(val) => setEspecialidadeSel(val)}
          label="Especialidade"
        />

        {/* Médico — filtrado no front */}
        <Select
          placeholder={
            getValueId(especialidadeSel)
              ? "Selecione o médico"
              : "Escolha uma especialidade antes"
          }
          data={medicosFiltrados.map((med) => ({
            label: med.nome,
            value: String(med.id),
          }))}
          selectedValue={medicoSel}
          onValueChange={(val) => setMedicoSel(getValueId(val))}
          label="Médico"
          containerStyle={(!getValueId(especialidadeSel) || medicosFiltrados.length === 0) && styles.selectDisabled}
        />

        <View style={{ flex: 1, justifyContent: "center" }}>
          <CalendarioSemanalSelecionado
            initialMonth={new Date(2025, 6, 1)}
            selectedISO={sel}
            onChange={setSel}
            holidaysISO={["2025-07-09"]}
            dotsISO={["2025-07-23", "2025-07-25"]}
            disabledDaysOfWeek={diasDesabilitados}
            disabled={!medicoSel}
            title= "Selecione uma data"
          />
        </View>
        {/* Seção de horários - só aparece se médico estiver selecionado */}
        {medicoSel && (
          <View style={styles.horariosSection}>
            <Text style={styles.label}>Selecione o horário</Text>
            
            {/* Debug: Mostra horários do médico */}
            {(() => {
              const medicoEncontrado = medicosFiltrados.find(m => String(m.id) === String(medicoSel));
              const horariosTrabalho = getMedicoHorarios(medicoEncontrado);
              
              if (horariosTrabalho && (horariosTrabalho.horaEntrada || horariosTrabalho.horaPausa || horariosTrabalho.horaVolta || horariosTrabalho.horaSaida)) {
                return (
                  <View style={styles.horariosInfo}>
                    <Text style={styles.horariosInfoText}>
                      Horário do médico: {horariosTrabalho.horaEntrada || '--'} às {horariosTrabalho.horaPausa || '--'} | {horariosTrabalho.horaVolta || '--'} às {horariosTrabalho.horaSaida || '--'}
                    </Text>
                  </View>
                );
              }
              return null;
            })()}
            
            <View style={styles.horariosGrid}>
              {(() => {
                const medicoEncontrado = medicosFiltrados.find(m => String(m.id) === String(medicoSel));
                return gerarHorarios(medicoEncontrado).map((horario) => (
                  <AvailableTimeButton 
                    key={horario}
                    title={horario}
                    isSelected={horarioSel === horario}
                    onPress={() => {
                      // Toggle: se já está selecionado, deseleciona
                      if (horarioSel === horario) {
                        setHorarioSel(null);
                      } else {
                        setHorarioSel(horario);
                      }
                    }}
                    style={styles.horarioButton}
                  />
                ));
              })()}
            </View>
            
            {/* Mostra horário selecionado */}
            {horarioSel && (
              <Text style={styles.horarioSelecionado}>
                Horário selecionado: {horarioSel}
              </Text>
            )}
          </View>
        )}
        <SubmitButton
          title="Agendar Consulta"
          onPress={() => {
          }}
        />
      </View>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  label: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 6,
    color: "#000000",
  },
  horariosSection: {
    marginVertical: 16,
  },
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
  horariosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  horarioButton: {
    flex: 1,
    minWidth: "30%",
    maxWidth: "32%",
  },
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
  selectDisabled: {
    opacity: 0.6,
    pointerEvents: 'none',
  },
  disabledDaysText: {
    fontSize: 12,
    color: "#D97706",
    marginTop: 4,
    textAlign: "center",
  },
});
