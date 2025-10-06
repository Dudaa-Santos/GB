import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import TabSwitch from "../components/tabSwitch";
import CardStatus from "../components/cardStatus";
import { useNavigation } from "@react-navigation/native";
import { buscarSolicitacoesporId } from "../service/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Historico() {
    const [selectedTab, setSelectedTab] = useState("historicoConsulta");
    const navigation = useNavigation();
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSolicitacoes = async () => {
        try {
            console.log("🚀 Iniciando fetchSolicitacoes...");
            setLoading(true);
            setError(null);
            
            const token = await AsyncStorage.getItem("token");
            const id = await AsyncStorage.getItem("id");
            
            console.log("🔑 Token obtido:", token ? "Token existe" : "Token não encontrado");
            console.log("👤 ID do colaborador:", id);
            
            if (!token) {
                setError("Token não encontrado. Faça login novamente.");
                return;
            }

            if (!id) {
                setError("ID do colaborador não encontrado. Faça login novamente.");
                return;
            }
            
            console.log("📞 Chamando buscarSolicitacoesporId com ID:", id);
            const response = await buscarSolicitacoesporId(id, token);
            
            console.log("📥 Resposta completa:", response);
            
            // Extrai os dados da estrutura da API
            let solicitacoesArray = [];
            if (response && response.success && response.data) {
                solicitacoesArray = response.data;
                console.log("✅ Dados extraídos com sucesso:", solicitacoesArray);
            } else if (Array.isArray(response)) {
                solicitacoesArray = response;
                console.log("✅ Resposta é array direto:", solicitacoesArray);
            } else if (response && Array.isArray(response.solicitacoes)) {
                solicitacoesArray = response.solicitacoes;
                console.log("✅ Dados em response.solicitacoes:", solicitacoesArray);
            } else if (response && response.data && Array.isArray(response.data)) {
                solicitacoesArray = response.data;
                console.log("✅ Dados em response.data:", solicitacoesArray);
            } else {
                console.log("⚠️ Estrutura de resposta inesperada:", response);
                solicitacoesArray = [];
            }
            
            setSolicitacoes(Array.isArray(solicitacoesArray) ? solicitacoesArray : []);
            console.log("✅ Solicitações definidas no state:", solicitacoesArray.length, "itens");
            
        } catch (error) {
            console.error("❌ Erro completo:", error);
            console.error("❌ Mensagem do erro:", error.message);
            setError(`Erro ao carregar solicitações: ${error.message}`);
        } finally {
            setLoading(false);
            console.log("🏁 fetchSolicitacoes finalizado");
        }
    };

    // Carregar solicitações quando o componente montar
    useEffect(() => {
        fetchSolicitacoes();
    }, []);

    // Recarregar quando a aba de benefícios for selecionada
    useEffect(() => {
        if (selectedTab === "historicoBeneficios") {
            fetchSolicitacoes();
        }
    }, [selectedTab]);

    // Dados simulados para consultas (manter até ter API específica)
    const consultas = [
        { id: '1', paciente: 'João Silva', especialidade: 'Cardiologia', dataConsulta: '10/08/2023', statusConsulta: 'Realizada' },
        { id: '2', paciente: 'Maria Oliveira', especialidade: 'Dermatologia', dataConsulta: '15/08/2023', statusConsulta: 'Cancelada' },
        { id: '3', paciente: 'Carlos Souza', especialidade: 'Ortopedia', dataConsulta: '20/08/2023', statusConsulta: 'Realizada' },
    ];

    // Função para formatar data
    const formatDate = (dateString) => {
        if (!dateString) return "Data não informada";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch (error) {
            return dateString; // Retorna a string original se não conseguir formatar
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

    // Função para navegar para detalhes do benefício - CORRIGIDA
    const handleBeneficioPress = (solicitacao) => {
        try {
            console.log("📋 Navegando para detalhes do benefício:", solicitacao);
            
            // Cria um objeto serializable com apenas as propriedades necessárias
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
            console.error("Erro ao navegar:", error);
            // Fallback: tentar com menos dados
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
                    <View>
                        {consultas.map((consulta) => (
                            <CardStatus
                                key={consulta.id}
                                tipo="consulta"
                                titulo={consulta.paciente}
                                status={consulta.statusConsulta}
                                dataEnvio={consulta.dataConsulta}
                                paciente={consulta.paciente}
                                especialidade={consulta.especialidade}
                            />
                        ))}
                    </View>
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