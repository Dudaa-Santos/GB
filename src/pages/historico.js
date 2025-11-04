import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable } from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import TabSwitch from "../components/tabSwitch";
import CardStatus from "../components/cardStatus";
import Pagination from "../components/pagination";
import { useNavigation } from "@react-navigation/native";
import { buscarSolicitacoesporId, buscarAgendamentoPorId } from "../service/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Historico() {
    const [selectedTab, setSelectedTab] = useState("historicoConsulta");
    const navigation = useNavigation();
    
    // Estados para benefícios
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paginaBeneficio, setPaginaBeneficio] = useState(0);
    const [totalPagesBeneficio, setTotalPagesBeneficio] = useState(1);
    const [filtroStatusBeneficio, setFiltroStatusBeneficio] = useState("TODOS");
    
    // Estados para consultas
    const [consultas, setConsultas] = useState([]);
    const [loadingConsultas, setLoadingConsultas] = useState(false);
    const [errorConsultas, setErrorConsultas] = useState(null);
    const [paginaConsulta, setPaginaConsulta] = useState(0);
    const [totalPagesConsulta, setTotalPagesConsulta] = useState(1);
    const [filtroStatusConsulta, setFiltroStatusConsulta] = useState("TODOS");

    const PAGE_SIZE = 8;

    // Opções de filtro para benefícios
    const STATUS_BENEFICIO = [
        { label: "Todos", value: "TODOS" },
        { label: "Pendente", value: "PENDENTE" },
        { label: "Aprovada", value: "APROVADA" },
        { label: "Recusada", value: "RECUSADA" },
        { label: "Pend. Assinatura", value: "PENDENTE_ASSINATURA" },
    ];

    // Opções de filtro para consultas
    const STATUS_CONSULTA = [
        { label: "Todos", value: "TODOS" },
        { label: "Agendado", value: "AGENDADO" },
        { label: "Concluído", value: "CONCLUIDO" },
        { label: "Cancelado", value: "CANCELADO" },
        { label: "Faltou", value: "FALTOU" },
    ];

    const normalizeStatusBeneficio = (status) => {
        if (!status) return "PENDENTE";
        const statusUpper = status.toUpperCase();
        if (statusUpper === "PENDENTE_ASSINATURA") return "Pend. Assinar";
        return status;
    };

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

    const fetchSolicitacoes = async (pagina = 0, statusFiltro = filtroStatusBeneficio) => {
        try {
            setLoading(true);
            setError(null);
            
            const token = await AsyncStorage.getItem("token");
            const id = await AsyncStorage.getItem("id");
            
            if (!token || !id) {
                setError("Sessão expirada. Faça login novamente.");
                return;
            }
            
            const params = {
                page: pagina,
                size: PAGE_SIZE,
            };

            if (statusFiltro !== "TODOS") {
                params.status = statusFiltro;
            }
            
            console.log("🔍 Buscando benefícios:", params);
            
            const response = await buscarSolicitacoesporId(id, token, params);
            
            console.log("📦 Response completo:", JSON.stringify(response, null, 2));
            
            let solicitacoesArray = [];
            let totalPages = 1;
            
            // ✅ A API retorna: { success: true, data: [...], meta: { pagination: {...} } }
            if (response?.success && response?.data && Array.isArray(response.data)) {
                solicitacoesArray = response.data;
                
                // ✅ Pega totalPages do meta.pagination
                if (response.meta?.pagination) {
                    totalPages = response.meta.pagination.totalPages || 1;
                } else {
                    // Fallback: calcula baseado no total de elementos
                    const totalElements = response.meta?.pagination?.totalElements || solicitacoesArray.length;
                    totalPages = Math.ceil(totalElements / PAGE_SIZE);
                }
            }
            
            console.log("✅ Benefícios:", solicitacoesArray.length, "Total páginas:", totalPages);
            
            setSolicitacoes(solicitacoesArray);
            setTotalPagesBeneficio(totalPages);
            
        } catch (error) {
            console.error("❌ Erro ao buscar benefícios:", error);
            
            if (error.response?.status === 403) {
                setError("Acesso negado. Sua sessão pode ter expirado. Faça login novamente.");
                setTimeout(() => {
                    AsyncStorage.multiRemove(['token', 'id', 'userEmail']);
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                }, 2000);
            } else {
                setError(`Erro ao carregar solicitações: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchConsultas = async (pagina = 0, statusFiltro = filtroStatusConsulta) => {
        try {
            setLoadingConsultas(true);
            setErrorConsultas(null);
            
            const token = await AsyncStorage.getItem("token");
            const id = await AsyncStorage.getItem("id");
            
            if (!token || !id) {
                setErrorConsultas("Sessão expirada. Faça login novamente.");
                return;
            }
            
            const params = {
                page: pagina,
                size: PAGE_SIZE,
            };

            if (statusFiltro !== "TODOS") {
                params.status = statusFiltro;
            }
            
            console.log("🔍 Buscando consultas:", params);
            
            const response = await buscarAgendamentoPorId(id, token, params);
            
            console.log("📦 Response completo:", JSON.stringify(response, null, 2));
            
            let consultasArray = [];
            let totalPages = 1;
            
            // ✅ Verifica se a resposta é um array direto ou vem dentro de um wrapper
            if (Array.isArray(response)) {
                // Se retornar array direto (sem paginação)
                consultasArray = response;
                totalPages = 1;
            } else if (response?.data && Array.isArray(response.data)) {
                // Se retornar com estrutura { data: [...] }
                consultasArray = response.data;
                
                // Tenta pegar paginação de diferentes lugares
                if (response.meta?.pagination) {
                    totalPages = response.meta.pagination.totalPages || 1;
                } else if (response.pagination) {
                    totalPages = response.pagination.totalPages || 1;
                } else {
                    // Fallback: calcula baseado no total
                    const totalElements = response.meta?.pagination?.totalElements || 
                                         response.pagination?.totalElements || 
                                         consultasArray.length;
                    totalPages = Math.ceil(totalElements / PAGE_SIZE);
                }
            }
            
            console.log("✅ Consultas:", consultasArray.length, "Total páginas:", totalPages);
            
            setConsultas(consultasArray);
            setTotalPagesConsulta(totalPages);
            
        } catch (error) {
            console.error("❌ Erro ao buscar consultas:", error);
            
            if (error.response?.status === 403) {
                setErrorConsultas("Acesso negado. Sua sessão pode ter expirado. Faça login novamente.");
                setTimeout(() => {
                    AsyncStorage.multiRemove(['token', 'id', 'userEmail']);
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                }, 2000);
            } else {
                setErrorConsultas(`Erro ao carregar consultas: ${error.message}`);
            }
        } finally {
            setLoadingConsultas(false);
        }
    };

    const handleBeneficioPageChange = (novaPagina) => {
        setPaginaBeneficio(novaPagina);
        fetchSolicitacoes(novaPagina, filtroStatusBeneficio);
    };

    const handleConsultaPageChange = (novaPagina) => {
        setPaginaConsulta(novaPagina);
        fetchConsultas(novaPagina, filtroStatusConsulta);
    };

    const handleFiltroStatusBeneficio = (novoStatus) => {
        setFiltroStatusBeneficio(novoStatus);
        setPaginaBeneficio(0); // Volta para primeira página
        fetchSolicitacoes(0, novoStatus);
    };

    const handleFiltroStatusConsulta = (novoStatus) => {
        setFiltroStatusConsulta(novoStatus);
        setPaginaConsulta(0); // Volta para primeira página
        fetchConsultas(0, novoStatus);
    };

    const getPacienteNome = (consulta) => {
        if (consulta.dependente?.nome) return consulta.dependente.nome;
        if (consulta.colaborador?.nome) return consulta.colaborador.nome;
        return "Paciente não informado";
    };

    const getMedicoNome = (consulta) => {
        return consulta.medico?.nome || "Médico não informado";
    };

    const getEspecialidadeNome = (consulta) => {
        if (consulta.medico?.especialidade) {
            if (typeof consulta.medico.especialidade === "object") {
                return consulta.medico.especialidade.nome;
            }
            return consulta.medico.especialidade;
        }
        return null;
    };

    const getTipoPaciente = (consulta) => {
        if (consulta.dependente?.nome) return "Dependente";
        if (consulta.colaborador?.nome) return "Colaborador";
        return "Não informado";
    };

    useEffect(() => {
        fetchSolicitacoes(0);
        fetchConsultas(0);
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "Data não informada";
        try {
            return new Date(dateString).toLocaleDateString("pt-BR");
        } catch {
            return dateString;
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "Data não informada";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("pt-BR") + " • " + 
                   date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        } catch {
            return dateString;
        }
    };

    const getSolicitacaoNome = (solicitacao) => {
        if (solicitacao.beneficio?.nome) return solicitacao.beneficio.nome;
        if (solicitacao.descricao) return solicitacao.descricao;
        return "Solicitação";
    };

    const handleSolicitacaoPress = (solicitacao) => {
        const solicitacaoSerializavel = {
            id: solicitacao.id,
            status: solicitacao.status,
            dataSolicitacao: solicitacao.dataSolicitacao,
            valorTotal: solicitacao.valorTotal,
            qtdeParcelas: solicitacao.qtdeParcelas,
            tipoPagamento: solicitacao.tipoPagamento,
            desconto: solicitacao.desconto,
            descricao: solicitacao.descricao,
            beneficio: solicitacao.beneficio ? { nome: solicitacao.beneficio.nome } : null,
            colaborador: solicitacao.colaborador ? {
                nome: solicitacao.colaborador.nome,
                matricula: solicitacao.colaborador.matricula,
                email: solicitacao.colaborador.email,
            } : null,
            dependente: solicitacao.dependente ? {
                nome: solicitacao.dependente.nome,
                grauParentesco: solicitacao.dependente.grauParentesco,
            } : null,
        };
        navigation.navigate("DetalheBeneficio", { solicitacao: solicitacaoSerializavel });
    };

    const handleConsultaPress = (consulta) => {
        const consultaSerializavel = {
            idAgendamento: consulta.idAgendamento,
            status: consulta.status,
            horario: consulta.horario,
            observacoes: consulta.observacoes,
            medico: consulta.medico ? {
                id: consulta.medico.id,
                nome: consulta.medico.nome,
                especialidade: getEspecialidadeNome(consulta),
                crm: consulta.medico.crm,
            } : null,
            colaborador: consulta.colaborador ? {
                id: consulta.colaborador.id,
                nome: consulta.colaborador.nome,
                matricula: consulta.colaborador.matricula,
                email: consulta.colaborador.email,
            } : null,
            dependente: consulta.dependente ? {
                id: consulta.dependente.id,
                nome: consulta.dependente.nome,
                grauParentesco: consulta.dependente.grauParentesco,
            } : null,
        };
        navigation.navigate("DetalheConsulta", { consulta: consultaSerializavel });
    };

    // Componente de Filtros
    const renderFiltros = (opcoes, valorAtual, onChangeHandler) => (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filtrosContainer}
            contentContainerStyle={styles.filtrosContent}
        >
            {opcoes.map((opcao) => (
                <Pressable
                    key={opcao.value}
                    onPress={() => onChangeHandler(opcao.value)}
                    style={({ pressed }) => [
                        styles.filtroButton,
                        valorAtual === opcao.value && styles.filtroButtonActive,
                        pressed && styles.filtroButtonPressed,
                    ]}
                >
                    <Text style={[
                        styles.filtroText,
                        valorAtual === opcao.value && styles.filtroTextActive,
                    ]}>
                        {opcao.label}
                    </Text>
                </Pressable>
            ))}
        </ScrollView>
    );

    const renderSolicitacoes = () => {
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
                    <Text style={styles.retryText} onPress={() => {
                        setPaginaBeneficio(0);
                        fetchSolicitacoes(0);
                    }}>
                        Tentar novamente
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.listContainer}>
                {/* Filtros */}
                {renderFiltros(STATUS_BENEFICIO, filtroStatusBeneficio, handleFiltroStatusBeneficio)}
                
                {solicitacoes.length === 0 ? (
                    <View style={styles.emptyContainerSmall}>
                        <Text style={styles.emptyText}>Nenhum benefício encontrado.</Text>
                    </View>
                ) : (
                    <ScrollView 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {solicitacoes.map((solicitacao, index) => (
                            <CardStatus
                                key={solicitacao.id || index}
                                tipo="beneficio"
                                titulo={getSolicitacaoNome(solicitacao)}
                                status={normalizeStatusBeneficio(solicitacao.status || "PENDENTE")}
                                dataEnvio={formatDate(solicitacao.dataSolicitacao)}
                                onPress={() => handleSolicitacaoPress(solicitacao)}
                            />
                        ))}
                        
                        <Pagination
                            currentPage={paginaBeneficio}
                            totalPages={totalPagesBeneficio}
                            onPageChange={handleBeneficioPageChange}
                            loading={loading}
                        />
                    </ScrollView>
                )}
            </View>
        );
    };

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
                    <Text style={styles.retryText} onPress={() => {
                        setPaginaConsulta(0);
                        fetchConsultas(0);
                    }}>
                        Tentar novamente
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.listContainer}>
                {/* Filtros */}
                {renderFiltros(STATUS_CONSULTA, filtroStatusConsulta, handleFiltroStatusConsulta)}
                
                {consultas.length === 0 ? (
                    <View style={styles.emptyContainerSmall}>
                        <Text style={styles.emptyText}>Nenhuma consulta encontrada.</Text>
                    </View>
                ) : (
                    <ScrollView 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {consultas.map((consulta, index) => (
                            <CardStatus
                                key={consulta.idAgendamento || index}
                                tipo="consulta"
                                titulo={getPacienteNome(consulta)}
                                status={normalizeStatusConsulta(consulta.status)}
                                dataEnvio={formatDateTime(consulta.horario)}
                                medico={getMedicoNome(consulta)}
                                tipoPaciente={getTipoPaciente(consulta)}
                                onPress={() => handleConsultaPress(consulta)}
                            />
                        ))}
                        
                        <Pagination
                            currentPage={paginaConsulta}
                            totalPages={totalPagesConsulta}
                            onPageChange={handleConsultaPageChange}
                            loading={loadingConsultas}
                        />
                    </ScrollView>
                )}
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
                        { label: "Benefícios", value: "historicoSolicitacoes" },
                    ]}
                    selected={selectedTab}
                    onSelect={setSelectedTab}
                />

                <View style={styles.contentArea}>
                    {selectedTab === "historicoConsulta" ? renderConsultas() : renderSolicitacoes()}
                </View>
            </View>
        </Fundo>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 16 
    },
    contentArea: { 
        flex: 1 
    },
    listContainer: { 
        flex: 1 
    },
    scrollContent: { 
        paddingBottom: 20,
        flexGrow: 1,
    },
    filtrosContainer: {
        maxHeight: 50,
        marginBottom: 12,
        flexGrow: 0,
    },
    filtrosContent: {
        paddingRight: 16,
        alignItems: 'center',
    },
    filtroButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginRight: 8,
        height: 36,
        justifyContent: 'center',
    },
    filtroButtonActive: {
        backgroundColor: "#065F46",
        borderColor: "#065F46",
    },
    filtroButtonPressed: {
        opacity: 0.7,
    },
    filtroText: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "600",
    },
    filtroTextActive: {
        color: "#FFFFFF",
    },
    loadingContainer: { 
        flex: 1, 
        alignItems: "center", 
        justifyContent: "center", 
        padding: 40 
    },
    loadingText: { 
        marginTop: 10, 
        fontSize: 16, 
        color: "#6B7280" 
    },
    errorContainer: { 
        flex: 1, 
        alignItems: "center", 
        justifyContent: "center", 
        padding: 40 
    },
    errorText: { 
        fontSize: 16, 
        color: "#DC2626", 
        textAlign: "center", 
        marginBottom: 10 
    },
    retryText: { 
        fontSize: 16, 
        color: "#065F46", 
        textDecorationLine: "underline" 
    },
    emptyContainer: { 
        flex: 1, 
        alignItems: "center", 
        justifyContent: "center", 
        padding: 40 
    },
    emptyContainerSmall: { 
        alignItems: "center", 
        justifyContent: "center", 
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyText: { 
        fontSize: 16, 
        color: "#6B7280", 
        textAlign: "center" 
    },
});
