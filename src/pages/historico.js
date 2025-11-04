import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import TabSwitch from "../components/tabSwitch";
import CardStatus from "../components/cardStatus";
import { useNavigation } from "@react-navigation/native";
import { buscarSolicitacoesporId, buscarAgendamentoPorId } from "../service/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Historico() {
    const [selectedTab, setSelectedTab] = useState("historicoConsulta");
    const navigation = useNavigation();
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [consultas, setConsultas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [loadingConsultas, setLoadingConsultas] = useState(false);
    const [errorConsultas, setErrorConsultas] = useState(null);

    // Função para normalizar o status e deixá-lo mais curto
    const normalizeStatus = (status) => {
        if (!status) return "PENDENTE";
        
        const statusUpper = status.toUpperCase();
        
        // Transforma PENDENTE_ASSINATURA em PEND. Assinar
        if (statusUpper === "PENDENTE_ASSINATURA") {
            return "PEND. Assinar";
        }
        
        return status;
    };

    // Função para buscar solicitações
    const fetchSolicitacoes = async () => {
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
            
            const response = await buscarSolicitacoesporId(id, token);
            
            // Extrai os dados da estrutura da API
            let solicitacoesArray = [];
            if (response && response.success && response.data) {
                solicitacoesArray = response.data;
            } else if (Array.isArray(response)) {
                solicitacoesArray = response;
            } else if (response && Array.isArray(response.solicitacoes)) {
                solicitacoesArray = response.solicitacoes;
            } else if (response && response.data && Array.isArray(response.data)) {
                solicitacoesArray = response.data;
            } else {
                solicitacoesArray = [];
            }
            
            setSolicitacoes(Array.isArray(solicitacoesArray) ? solicitacoesArray : []);
            
        } catch (error) {
            setError(`Erro ao carregar solicitações: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Função para obter nome do paciente da consulta
    const getPacienteNome = (consulta) => {
        if (consulta.dependente && consulta.dependente.nome) {
            return consulta.dependente.nome;
        }
        if (consulta.colaborador && consulta.colaborador.nome) {
            return consulta.colaborador.nome;
        }
        return "Paciente não informado";
    };

    // Função para obter nome do médico
    const getMedicoNome = (consulta) => {
        if (consulta.medico && consulta.medico.nome) {
            return consulta.medico.nome;
        }
        return "Médico não informado";
    };

    // Função para obter especialidade (extrai o nome do objeto)
    const getEspecialidadeNome = (consulta) => {
        if (consulta.medico && consulta.medico.especialidade) {
            if (typeof consulta.medico.especialidade === "object" && consulta.medico.especialidade.nome) {
                return consulta.medico.especialidade.nome;
            }
            if (typeof consulta.medico.especialidade === "string") {
                return consulta.medico.especialidade;
            }
        }
        return null;
    };

    // Função para determinar o tipo de paciente
    const getTipoPaciente = (consulta) => {
        if (consulta.dependente && consulta.dependente.nome) {
            return "Dependente";
        }
        if (consulta.colaborador && consulta.colaborador.nome) {
            return "Colaborador";
        }
        return "Não informado";
    };

    // Função para buscar consultas (agendamentos)
    const fetchConsultas = async () => {
        try {
            setLoadingConsultas(true);
            setErrorConsultas(null);
            
            const token = await AsyncStorage.getItem("token");
            const id = await AsyncStorage.getItem("id");
            
            if (!token) {
                setErrorConsultas("Token não encontrado. Faça login novamente.");
                return;
            }

            if (!id) {
                setErrorConsultas("ID do colaborador não encontrado. Faça login novamente.");
                return;
            }
            
            const response = await buscarAgendamentoPorId(id, token);
            
            let consultasArray = [];
            if (Array.isArray(response)) {
                consultasArray = response;
            } else if (response && Array.isArray(response.data)) {
                consultasArray = response.data;
            } else if (response && response.success && Array.isArray(response.data)) {
                consultasArray = response.data;
            } else {
                consultasArray = [];
            }
            
            setConsultas(consultasArray);
            
        } catch (error) {
            setErrorConsultas(`Erro ao carregar consultas: ${error.message}`);
        } finally {
            setLoadingConsultas(false);
        }
    };

    // Carregar dados quando o componente montar
    useEffect(() => {
        fetchSolicitacoes();
        fetchConsultas();
    }, []);

    // Recarregar quando trocar de aba
    useEffect(() => {
        if (selectedTab === "historicoSolicitacoes") {
            fetchSolicitacoes();
        } else if (selectedTab === "historicoConsulta") {
            fetchConsultas();
        }
    }, [selectedTab]);

    // Função para formatar data
    const formatDate = (dateString) => {
        if (!dateString) return "Data não informada";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("pt-BR");
        } catch (error) {
            return dateString;
        }
    };

    // Função para formatar data e hora da consulta
    const formatDateTime = (dateString) => {
        if (!dateString) return "Data não informada";
        try {
            const date = new Date(dateString);
            return (
                date.toLocaleDateString("pt-BR") +
                " • " +
                date.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                })
            );
        } catch (error) {
            return dateString;
        }
    };

    // Função para obter o "nome" da solicitação (ex: nome do benefício ou descrição)
    const getSolicitacaoNome = (solicitacao) => {
        // A API ainda usa o campo beneficio, então mantemos essa leitura
        if (solicitacao.beneficio && solicitacao.beneficio.nome) {
            return solicitacao.beneficio.nome;
        }
        if (solicitacao.descricao) {
            return solicitacao.descricao;
        }
        return "Solicitação";
    };

    // Função para navegar para detalhes da solicitação
    const handleSolicitacaoPress = (solicitacao) => {
        try {
            const solicitacaoSerializavel = {
                id: solicitacao.id,
                status: solicitacao.status,
                dataSolicitacao: solicitacao.dataSolicitacao,
                valorTotal: solicitacao.valorTotal,
                qtdeParcelas: solicitacao.qtdeParcelas,
                tipoPagamento: solicitacao.tipoPagamento,
                desconto: solicitacao.desconto,
                descricao: solicitacao.descricao,
                beneficio: solicitacao.beneficio
                    ? {
                          nome: solicitacao.beneficio.nome,
                      }
                    : null,
                colaborador: solicitacao.colaborador
                    ? {
                          nome: solicitacao.colaborador.nome,
                          matricula: solicitacao.colaborador.matricula,
                          email: solicitacao.colaborador.email,
                      }
                    : null,
                dependente: solicitacao.dependente
                    ? {
                          nome: solicitacao.dependente.nome,
                          grauParentesco: solicitacao.dependente.grauParentesco,
                      }
                    : null,
            };

            navigation.navigate("DetalheBeneficio", {
                solicitacao: solicitacaoSerializavel,
            });
        } catch (error) {
            navigation.navigate("DetalheBeneficio", {
                solicitacao: {
                    id: solicitacao.id,
                    status: solicitacao.status || "PENDENTE",
                    descricao: solicitacao.descricao || "Solicitação",
                },
            });
        }
    };

    // Função para navegar para detalhes da consulta
    const handleConsultaPress = (consulta) => {
        console.log("=== handleConsultaPress ===");
        console.log("Consulta original:", JSON.stringify(consulta, null, 2));

        try {
            const consultaSerializavel = {
                idAgendamento: consulta.idAgendamento,
                status: consulta.status,
                horario: consulta.horario,
                observacoes: consulta.observacoes,
                medico: consulta.medico
                    ? {
                          id: consulta.medico.id,
                          nome: consulta.medico.nome,
                          especialidade: getEspecialidadeNome(consulta),
                          crm: consulta.medico.crm,
                      }
                    : null,
                colaborador: consulta.colaborador
                    ? {
                          id: consulta.colaborador.id,
                          nome: consulta.colaborador.nome,
                          matricula: consulta.colaborador.matricula,
                          email: consulta.colaborador.email,
                      }
                    : null,
                dependente: consulta.dependente
                    ? {
                          id: consulta.dependente.id,
                          nome: consulta.dependente.nome,
                          grauParentesco: consulta.dependente.grauParentesco,
                      }
                    : null,
            };

            console.log(
                "Consulta serializada:",
                JSON.stringify(consultaSerializavel, null, 2)
            );

            navigation.navigate("DetalheConsulta", {
                consulta: consultaSerializavel,
            });
        } catch (error) {
            console.error("=== ERRO ao navegar ===");
            console.error("Erro:", error);
            console.error("Stack:", error.stack);
        }
    };

    // Renderizar seção de solicitações
    const renderSolicitacoes = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#065F46" />
                    <Text style={styles.loadingText}>Carregando solicitações...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Text style={styles.retryText} onPress={fetchSolicitacoes}>
                        Tentar novamente
                    </Text>
                </View>
            );
        }

        if (!solicitacoes || solicitacoes.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        Nenhuma solicitação encontrada.
                    </Text>
                </View>
            );
        }

        return (
            <View>
                {solicitacoes.map((solicitacao, index) => (
                    <CardStatus
                        key={solicitacao.id || index}
                        tipo="solicitacao"
                        titulo={getSolicitacaoNome(solicitacao)}
                        status={normalizeStatus(solicitacao.status || "PENDENTE")}
                        dataEnvio={formatDate(solicitacao.dataSolicitacao)}
                        onPress={() => handleSolicitacaoPress(solicitacao)}
                    />
                ))}
            </View>
        );
    };

    // Renderizar seção de consultas
    const renderConsultas = () => {
        if (loadingConsultas) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#065F46" />
                    <Text style={styles.loadingText}>Carregando consultas...</Text>
                </View>
            );
        }

        if (errorConsultas) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorConsultas}</Text>
                    <Text style={styles.retryText} onPress={fetchConsultas}>
                        Tentar novamente
                    </Text>
                </View>
            );
        }

        if (!consultas || consultas.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nenhuma consulta encontrado.</Text>
                </View>
            );
        }

        return (
            <View>
                {consultas.map((consulta, index) => {
                    const paciente = getPacienteNome(consulta);
                    const medico = getMedicoNome(consulta);
                    const tipoPaciente = getTipoPaciente(consulta);

                    return (
                        <CardStatus
                            key={consulta.idAgendamento || index}
                            tipo="consulta"
                            titulo={`${paciente}`}
                            status={normalizeStatus(consulta.status)}
                            dataEnvio={formatDateTime(consulta.horario)}
                            medico={medico}
                            tipoPaciente={tipoPaciente}
                            onPress={() => handleConsultaPress(consulta)}
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <Fundo>
            <View style={styles.container}>
                <TituloIcone
                    titulo="Histórico"
                    icone={require("../images/icones/history_g.png")}
                />
                <TabSwitch
                    options={[
                        { label: "Consultas", value: "historicoConsulta" },
                        { label: "Solicitações", value: "historicoSolicitacoes" },
                    ]}
                    selected={selectedTab}
                    onSelect={setSelectedTab}
                />

                <View style={styles.contentArea}>
                    {selectedTab === "historicoConsulta"
                        ? renderConsultas()
                        : renderSolicitacoes()}
                </View>
            </View>
        </Fundo>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    contentArea: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#6B7280",
    },
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    errorText: {
        fontSize: 16,
        color: "#DC2626",
        textAlign: "center",
        marginBottom: 10,
    },
    retryText: {
        fontSize: 16,
        color: "#065F46",
        textDecorationLine: "underline",
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
    },
});
