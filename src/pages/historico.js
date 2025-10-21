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

    // Função para buscar solicitações (benefícios)
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
        // Verifica se é dependente
        if (consulta.dependente && consulta.dependente.nome) {
            return consulta.dependente.nome;
        }
        
        // Se não tem dependente, é o colaborador
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
            
            // A resposta deve ser um array direto baseado na estrutura fornecida
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
        if (selectedTab === "historicoBeneficios") {
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
            return date.toLocaleDateString('pt-BR');
        } catch (error) {
            return dateString;
        }
    };

    // Função para formatar data e hora da consulta
    const formatDateTime = (dateString) => {
        if (!dateString) return "Data não informada";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR') + ' • ' + date.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch (error) {
            return dateString;
        }
    };

    // Função para obter o nome do benefício
    const getBeneficioNome = (solicitacao) => {
        if (solicitacao.beneficio && solicitacao.beneficio.nome) {
            return solicitacao.beneficio.nome;
        }
        if (solicitacao.descricao) {
            return solicitacao.descricao;
        }
        return "Benefício";
    };

    // Função para navegar para detalhes do benefício
    const handleBeneficioPress = (solicitacao) => {
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
                beneficio: solicitacao.beneficio ? {
                    nome: solicitacao.beneficio.nome
                } : null,
                colaborador: solicitacao.colaborador ? {
                    nome: solicitacao.colaborador.nome,
                    matricula: solicitacao.colaborador.matricula,
                    email: solicitacao.colaborador.email
                } : null,
                dependente: solicitacao.dependente ? {
                    nome: solicitacao.dependente.nome,
                    grauParentesco: solicitacao.dependente.grauParentesco
                } : null
            };
            
            navigation.navigate("DetalheBeneficio", { 
                solicitacao: solicitacaoSerializavel
            });
        } catch (error) {
            navigation.navigate("DetalheBeneficio", { 
                solicitacao: {
                    id: solicitacao.id,
                    status: solicitacao.status || "PENDENTE",
                    descricao: solicitacao.descricao || "Benefício"
                }
            });
        }
    };

    // Renderizar seção de benefícios
    const renderBeneficios = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#065F46" />
                    <Text style={styles.loadingText}>Carregando benefícios...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Text 
                        style={styles.retryText} 
                        onPress={fetchSolicitacoes}
                    >
                        Tentar novamente
                    </Text>
                </View>
            );
        }

        if (!solicitacoes || solicitacoes.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nenhuma solicitação de benefício encontrada.</Text>
                </View>
            );
        }

        return (
            <View>
                {solicitacoes.map((solicitacao, index) => (
                    <CardStatus
                        key={solicitacao.id || index}
                        tipo="beneficio"
                        titulo={getBeneficioNome(solicitacao)}
                        status={solicitacao.status || "PENDENTE"}
                        dataEnvio={formatDate(solicitacao.dataSolicitacao)}
                        onPress={() => handleBeneficioPress(solicitacao)}
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
                    <Text 
                        style={styles.retryText} 
                        onPress={fetchConsultas}
                    >
                        Tentar novamente
                    </Text>
                </View>
            );
        }

        if (!consultas || consultas.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nenhuma consulta encontrada.</Text>
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
                            status={consulta.status}
                            dataEnvio={formatDateTime(consulta.horario)}
                            medico={medico}
                            tipoPaciente={tipoPaciente}
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
                        { label: "Consulta", value: "historicoConsulta" },
                        { label: "Benefícios", value: "historicoBeneficios" },
                    ]}
                    selected={selectedTab}
                    onSelect={setSelectedTab}
                />

                {selectedTab === "historicoConsulta" ? (
                    renderConsultas()
                ) : (
                    renderBeneficios()
                )}
            </View>
        </Fundo>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
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