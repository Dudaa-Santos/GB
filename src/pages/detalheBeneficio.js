import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert } from "react-native";
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
            
            const nomeArquivoParaBusca = documentos[0]?.nomeArquivoUnico; 
            
            if (!nomeArquivoParaBusca) return;

            try {
                const urlData = await documentoUrl(nomeArquivoParaBusca, token);
                console.log("✅ URL do documento carregada com sucesso:", urlData);
                setDocumentoUrlState(urlData.data || ""); 
                
            } catch (error) {
                console.error("Erro ao buscar URL do documento:", error);
                setDocumentoUrlState("");
            }
        };

        fetchDocumentoUrl();
    }, [documentos]);

    // Função para visualizar documento
    const handleVisualizar = async (documento) => {
        try {
            if (!documentoUrlState) {
                Alert.alert("Erro", "URL do documento não disponível");
                return;
            }

            console.log("👁️ Abrindo documento:", getNomeArquivo(documento));
            console.log("🔗 URL:", documentoUrlState);

            const supported = await Linking.canOpenURL(documentoUrlState);
            if (supported) {
                await Linking.openURL(documentoUrlState);
            } else {
                Alert.alert("Erro", "Não foi possível abrir este tipo de arquivo");
            }
        } catch (error) {
            console.error("Erro ao visualizar documento:", error);
            Alert.alert("Erro", "Não foi possível abrir o documento");
        }
    };

    // Função para baixar/abrir documento (mesmo comportamento do visualizar)
    const handleBaixar = async (documento) => {
        try {
            if (!documentoUrlState) {
                Alert.alert("Erro", "URL do documento não disponível");
                return;
            }

            console.log("📥 Abrindo documento para download:", getNomeArquivo(documento));
            
            const supported = await Linking.canOpenURL(documentoUrlState);
            if (supported) {
                await Linking.openURL(documentoUrlState);
            } else {
                Alert.alert("Erro", "Não foi possível abrir o documento");
            }
        } catch (error) {
            console.error("Erro ao abrir documento:", error);
            Alert.alert("Erro", "Não foi possível abrir o documento");
        }
    };

    // Função para obter o nome do arquivo
    const getNomeArquivo = (documento) => {
        return documento.nomeArquivoOriginal || 
               documento.nomeArquivo || 
               documento.nome || 
               documento.filename || 
               `Documento_${documento.id || 'sem_id'}`;
    };

    // Função para obter a extensão do arquivo
    const getExtensaoArquivo = (documento) => {
        const nomeArquivo = getNomeArquivo(documento);
        if (nomeArquivo.includes('.')) {
            return nomeArquivo.split('.').pop().toUpperCase();
        }
        return 'DOC';
    };

    // Função para obter o ícone da extensão
    const getIconeExtensao = (extensao) => {
        const ext = extensao.toLowerCase();
        switch (ext) {
            case 'pdf': return '📄';
            case 'doc':
            case 'docx': return '📝';
            case 'xls':
            case 'xlsx': return '📊';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif': return '🖼️';
            case 'zip':
            case 'rar': return '🗜️';
            case 'txt': return '📃';
            case 'mp4':
            case 'avi':
            case 'mov': return '🎥';
            case 'mp3':
            case 'wav': return '🎵';
            default: return '📋';
        }
    };

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
                        {documentos && documentos.length > 0 ? (
                            <>
                                <Text style={styles.documentosStatus}>
                                    ✅ {documentos.length} documento(s) encontrado(s)
                                </Text>
                                
                                {documentos.map((documento, index) => (
                                    <View key={documento.id || index} style={styles.documentoCard}>
                                        <View style={styles.documentoRow}>
                                            {/* Ícone da extensão */}
                                            <View style={styles.iconeExtensaoContainer}>
                                                <Text style={styles.iconeExtensao}>
                                                    {getIconeExtensao(getExtensaoArquivo(documento))}
                                                </Text>
                                            </View>

                                            {/* Nome do arquivo */}
                                            <View style={styles.nomeArquivoContainer}>
                                                <Text style={styles.nomeArquivo}>
                                                    {getNomeArquivo(documento)}
                                                </Text>
                                                {documento.tamanho && (
                                                    <Text style={styles.tamanhoArquivo}>
                                                        {documento.tamanho}
                                                    </Text>
                                                )}
                                            </View>

                                            {/* Ações - apenas ícones */}
                                            <View style={styles.acoesContainer}>
                                                <Pressable 
                                                    style={[styles.iconeAcao, !documentoUrlState && styles.iconeAcaoDisabled]}
                                                    onPress={() => handleVisualizar(documento)}
                                                    disabled={!documentoUrlState}
                                                >
                                                    <Text style={styles.iconeAcaoText}>👁️</Text>
                                                </Pressable>
                                                
                                                <Pressable 
                                                    style={[styles.iconeAcao, !documentoUrlState && styles.iconeAcaoDisabled]}
                                                    onPress={() => handleBaixar(documento)}
                                                    disabled={!documentoUrlState}
                                                >
                                                    <Text style={styles.iconeAcaoText}>📥</Text>
                                                </Pressable>
                                            </View>
                                        </View>

                                        {/* Informações adicionais */}
                                        {(documento.descricao || documento.dataUpload) && (
                                            <View style={styles.infoAdicional}>
                                                {documento.descricao && (
                                                    <Text style={styles.descricaoArquivo}>
                                                        {documento.descricao}
                                                    </Text>
                                                )}
                                                {documento.dataUpload && (
                                                    <Text style={styles.dataArquivo}>
                                                        Enviado em: {formatDate(documento.dataUpload)}
                                                    </Text>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </>
                        ) : (
                            <View style={styles.noDocumentosCard}>
                                <Text style={styles.noDocumentosText}>
                                    📄 Nenhum documento encontrado para esta solicitação
                                </Text>
                            </View>
                        )}
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
        textAlign: "left",
        fontWeight: "400",
    },
    // Estilos da seção de documentos - LAYOUT LIMPO
    documentosSection: {
        marginBottom: 16,
    },
    documentosStatus: {
        fontSize: 15,
        color: "#1F2937",
        fontWeight: "600",
        marginBottom: 12,
    },
    documentoCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: "#3B82F6",
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    documentoRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    iconeExtensaoContainer: {
        marginRight: 12,
    },
    iconeExtensao: {
        fontSize: 24,
    },
    nomeArquivoContainer: {
        flex: 1,
        marginRight: 12,
    },
    nomeArquivo: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1F2937",
        marginBottom: 2,
    },
    tamanhoArquivo: {
        fontSize: 12,
        color: "#6B7280",
    },
    acoesContainer: {
        flexDirection: "row",
        gap: 8,
    },
    iconeAcao: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    iconeAcaoDisabled: {
        backgroundColor: "#E5E7EB",
        opacity: 0.5,
    },
    iconeAcaoText: {
        fontSize: 18,
    },
    infoAdicional: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    descricaoArquivo: {
        fontSize: 14,
        color: "#6B7280",
        fontStyle: "italic",
        marginBottom: 4,
    },
    dataArquivo: {
        fontSize: 12,
        color: "#9CA3AF",
    },
    noDocumentosCard: {
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderStyle: "dashed",
        alignItems: "center",
    },
    noDocumentosText: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
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