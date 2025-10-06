import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import ListParcela from "../components/listParcela";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buscarDocumentoporId, documentoUrl } from "../service/authService";

export default function DetalheBeneficio({ route }) {
    const { solicitacao } = route?.params || {};
    const [documentos, setDocumentos] = useState([]);
    const [documentoUrlState, setDocumentoUrlState] = useState("");

    useEffect(() => {
        const fetchDocumentos = async () => {
            const token = await AsyncStorage.getItem("token");
            const ColaboradorId = await AsyncStorage.getItem("id");
            if (!token || !solicitacao) return;

            try {
                const data = await buscarDocumentoporId(solicitacao.id, ColaboradorId, token);
                console.log("✅ Documentos carregados com sucesso:", data);

                // Verificar estrutura dos dados e extrair documentos
                let documentosArray = [];
                if (data && Array.isArray(data)) {
                    documentosArray = data;
                } else if (data && data.data && Array.isArray(data.data)) {
                    documentosArray = data.data;
                } else if (data && data.documentos && Array.isArray(data.documentos)) {
                    documentosArray = data.documentos;
                }

                setDocumentos(documentosArray);
            } catch (error) {
                console.error("Erro ao buscar documentos:", error);
                console.log("❌ Nenhum documento encontrado para esta solicitação");
                setDocumentos([]);
            }
        };

        fetchDocumentos();
    }, [solicitacao]);

    useEffect(() => {
        const fetchDocumentoUrl = async () => {
            if (documentos.length === 0) return;
            const token = await AsyncStorage.getItem("token");
            if (!token) return;
            
            // 1. Garantir que estamos pegando o nome do primeiro arquivo (como discutido anteriormente)
            const nomeArquivoParaBusca = documentos[0]?.nomeArquivoUnico; 
            
            if (!nomeArquivoParaBusca) return;

            try {
                const urlData = await documentoUrl(nomeArquivoParaBusca, token);
                console.log("✅ URL do documento carregada com sucesso:", urlData);
                
                // 🚨 CORREÇÃO ESSENCIAL AQUI: Pegue o valor da chave 'data'
                // O log confirma que a URL está em urlData.data
                setDocumentoUrlState(urlData.data || ""); 
                
            } catch (error) {
                console.error("Erro ao buscar URL do documento:", error);
                setDocumentoUrlState("");
            }
        };

        fetchDocumentoUrl();
    }, [documentos]);

    if (!solicitacao) {
        return (
            <Fundo>
                <View style={styles.container}>
                    <TituloIcone
                        titulo="Detalhes do Benefício"
                        icone={require("../images/icones/history_g.png")}
                    />
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>
                            Não foi possível carregar os detalhes do benefício.
                        </Text>
                    </View>
                </View>
            </Fundo>
        );
    }

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

    // Função para formatar valor monetário
    const formatCurrency = (value) => {
        if (!value) return "R$ 0,00";
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Função para obter cor do status
    const getStatusColor = (status) => {
        if (!status) return "#6B7280";
        const statusLower = status.toLowerCase();
        if (statusLower.includes("pendente")) return "#F59E0B";
        if (statusLower.includes("aprovado")) return "#065F46";
        if (statusLower.includes("negado")) return "#DC2626";
        return "#6B7280";
    };

    // Função para obter o nome do benefício
    const getBeneficioNome = () => {
        if (solicitacao.beneficio && solicitacao.beneficio.nome) {
            return solicitacao.beneficio.nome;
        }
        if (solicitacao.descricao) {
            return solicitacao.descricao;
        }
        return "Benefício";
    };

    // Função para calcular valor da parcela
    const getValorParcela = () => {
        if (solicitacao.valorTotal && solicitacao.qtdeParcelas) {
            return solicitacao.valorTotal / solicitacao.qtdeParcelas;
        }
        return 0;
    };

    return (
        <Fundo>
            <ScrollView>
                <View style={styles.container}>
                    <TituloIcone
                        titulo="Detalhes do Benefício"
                        icone={require("../images/icones/history_g.png")}
                    />

                    {/* Card principal com informações do benefício */}
                    <View style={styles.mainCard}>
                        <View style={styles.headerCard}>
                            <Text style={styles.beneficioTitulo}>{getBeneficioNome()}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(solicitacao.status) }]}>
                                <Text style={styles.statusText}>{solicitacao.status || "PENDENTE"}</Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Data da Solicitação:</Text>
                            <Text style={styles.infoValue}>{formatDate(solicitacao.dataSolicitacao)}</Text>
                        </View>

                        {solicitacao.valorTotal && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Valor Total:</Text>
                                <Text style={styles.infoValue}>{formatCurrency(solicitacao.valorTotal)}</Text>
                            </View>
                        )}

                        {solicitacao.tipoPagamento && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Tipo de Pagamento:</Text>
                                <Text style={styles.infoValue}>
                                    {solicitacao.tipoPagamento === "DESCONTADO_FOLHA" ? "Desconto em Folha" : solicitacao.tipoPagamento}
                                </Text>
                            </View>
                        )}

                        {solicitacao.desconto && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Desconto:</Text>
                                <Text style={styles.infoValue}>{formatCurrency(solicitacao.desconto)}</Text>
                            </View>
                        )}
                    </View>

                    {/* Seção de Descrição */}
                    {solicitacao.descricao && (
                        <View style={styles.descricaoSection}>
                            <Text style={styles.sectionTitle}>Descrição</Text>
                            <View style={styles.descricaoCard}>
                                <Text style={styles.descricaoText}>{solicitacao.descricao}</Text>
                            </View>
                        </View>
                    )}

                    {/* Seção de Documentos */}
                    <View style={styles.documentosSection}>
                        <Text style={styles.sectionTitle}>Documentos</Text>
                        <View style={styles.documentosCard}>
                            {documentos && documentos.length > 0 ? (
                                <>
                                    <Text style={styles.documentosStatus}>
                                        ✅ {documentos.length} documento(s) encontrado(s)
                                    </Text>
                                    {documentos.map((documento, index) => (
                                        <View key={documento.id || index} style={styles.documentoItem}>
                                            <Text style={styles.documentoNome}>
                                                📄 {documento.nomeArquivoOriginal || `Documento ${index + 1}`}
                                            </Text>
                                            {documento.descricao && (
                                                <Text style={styles.documentoDescricao}>
                                                    {documento.descricao}
                                                </Text>
                                            )}
                                        </View>
                                    ))}

                                    {/* Seção da URL do documento */}
// ...
                                    {documentoUrlState && (
                                        <View style={styles.urlSection}>
                                            <Text style={styles.urlLabel}>🔗 URL de Acesso:</Text>
                                            <Text style={styles.urlText} numberOfLines={0}>
                                                {documentoUrlState} {/* <--- EXIBIR DIRETAMENTE O ESTADO */}
                                            </Text>
                                        </View>
                                    )}
// ...
                                </>
                            ) : (
                                <Text style={styles.documentosStatus}>
                                    📄 Busca de documentos realizada - Nenhum documento encontrado
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Seção de Parcelamento */}
                    {solicitacao.qtdeParcelas && solicitacao.qtdeParcelas > 1 && (
                        <View style={styles.parcelamentoSection}>
                            <Text style={styles.sectionTitle}>Parcelamento</Text>
                            <ListParcela
                                nomeParcela={`${solicitacao.qtdeParcelas}x de ${formatCurrency(getValorParcela())}`}
                                quantidadeParcela={solicitacao.qtdeParcelas}
                                valorParcela={formatCurrency(getValorParcela())}
                            />
                        </View>
                    )}

                    {/* Informações do Colaborador */}
                    {solicitacao.colaborador && (
                        <View style={styles.colaboradorSection}>
                            <Text style={styles.sectionTitle}>Solicitante</Text>
                            <View style={styles.colaboradorCard}>
                                <Text style={styles.colaboradorNome}>
                                    {solicitacao.colaborador.nome || "Nome não informado"}
                                </Text>
                                {solicitacao.colaborador.matricula && (
                                    <Text style={styles.colaboradorInfo}>
                                        Matrícula: {solicitacao.colaborador.matricula}
                                    </Text>
                                )}
                                {solicitacao.colaborador.email && (
                                    <Text style={styles.colaboradorInfo}>
                                        Email: {solicitacao.colaborador.email}
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Informações do Dependente (se houver) */}
                    {solicitacao.dependente && (
                        <View style={styles.dependenteSection}>
                            <Text style={styles.sectionTitle}>Dependente</Text>
                            <View style={styles.dependenteCard}>
                                <Text style={styles.dependenteNome}>
                                    {solicitacao.dependente.nome || "Nome não informado"}
                                </Text>
                                <Text style={styles.dependenteInfo}>
                                    Grau de Parentesco: {solicitacao.dependente.grauParentesco || "Não informado"}
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
    mainCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    beneficioTitulo: {
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 12,
    },
    descricaoSection: {
        marginBottom: 16,
    },
    descricaoCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: "#065F46",
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    descricaoText: {
        fontSize: 15,
        color: "#1F2937",
        lineHeight: 22,
        textAlign: "justify",
        fontWeight: "400",
    },
    // Estilos da seção de documentos
    documentosSection: {
        marginBottom: 16,
    },
    documentosCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: "#3B82F6",
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    documentosStatus: {
        fontSize: 15,
        color: "#1F2937",
        fontWeight: "600",
        marginBottom: 8,
    },
    documentosInfo: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 18,
    },
    documentoItem: {
        marginBottom: 8,
        paddingVertical: 4,
    },
    documentoNome: {
        fontSize: 14,
        color: "#1F2937",
        fontWeight: "500",
        marginBottom: 2,
    },
    documentoDescricao: {
        fontSize: 12,
        color: "#6B7280",
        fontStyle: "italic",
    },
    // Estilos para a seção da URL
    urlSection: {
        marginTop: 12,
        padding: 12,
        backgroundColor: "#F3F4F6",
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: "#10B981",
    },
    urlLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 4,
    },
    urlText: {
        fontSize: 12,
        color: "#1F2937",
        backgroundColor: "#FFFFFF",
        padding: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        fontFamily: "monospace",
    },
    parcelamentoSection: {
        marginBottom: 16,
    },
    colaboradorSection: {
        marginBottom: 16,
    },
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
    dependenteSection: {
        marginBottom: 16,
    },
    dependenteCard: {
        backgroundColor: "#EFF6FF",
        borderRadius: 8,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: "#3B82F6",
    },
    dependenteNome: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 4,
    },
    dependenteInfo: {
        fontSize: 14,
        color: "#6B7280",
    },
});