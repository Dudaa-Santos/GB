import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Pressable } from "react-native";
import Fundo from "../components/fundo";
import CardStatus from "../components/cardStatus";
import TituloIcone from "../components/tituloIcone";
import { buscarSolicitacoesporId, buscarDocumentoporId, documentoUrl } from "../service/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking } from "react-native";

export default function DocumentosEnviados() {
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Função para buscar todos os documentos do colaborador
    const fetchDocumentos = async () => {
        try {
            console.log("🚀 Iniciando fetchDocumentos...");
            setLoading(true);
            setError(null);
            
            const token = await AsyncStorage.getItem("token");
            const colaboradorId = await AsyncStorage.getItem("id");
            
            if (!token || !colaboradorId) {
                setError("Sessão inválida. Faça login novamente.");
                return;
            }
            
            console.log("📞 Buscando solicitações do colaborador:", colaboradorId);
            
            // 1. Buscar todas as solicitações do colaborador
            const solicitacoesResponse = await buscarSolicitacoesporId(colaboradorId, token);
            console.log("📥 Solicitações encontradas:", solicitacoesResponse);
            
            let solicitacoes = [];
            if (Array.isArray(solicitacoesResponse)) {
                solicitacoes = solicitacoesResponse;
            } else if (solicitacoesResponse && Array.isArray(solicitacoesResponse.data)) {
                solicitacoes = solicitacoesResponse.data;
            } else if (solicitacoesResponse && solicitacoesResponse.success && Array.isArray(solicitacoesResponse.data)) {
                solicitacoes = solicitacoesResponse.data;
            }
            
            console.log("📊 Solicitações processadas:", solicitacoes);
            
            // 2. Para cada solicitação, buscar seus documentos
            const todosDocumentos = [];
            
            for (const solicitacao of solicitacoes) {
                try {
                    console.log(`📄 Buscando documentos da solicitação ${solicitacao.id}...`);
                    
                    const documentosResponse = await buscarDocumentoporId(
                        solicitacao.id, 
                        colaboradorId, 
                        token
                    );
                    
                    console.log(`📥 Documentos da solicitação ${solicitacao.id}:`, documentosResponse);
                    
                    let documentosDaSolicitacao = [];
                    if (Array.isArray(documentosResponse)) {
                        documentosDaSolicitacao = documentosResponse;
                    } else if (documentosResponse && Array.isArray(documentosResponse.data)) {
                        documentosDaSolicitacao = documentosResponse.data;
                    } else if (documentosResponse && documentosResponse.success && Array.isArray(documentosResponse.data)) {
                        documentosDaSolicitacao = documentosResponse.data;
                    }
                    
                    // Adicionar informações da solicitação a cada documento
                    const documentosComInfo = documentosDaSolicitacao.map(doc => ({
                        ...doc,
                        solicitacao: {
                            id: solicitacao.id,
                            status: solicitacao.status,
                            beneficio: solicitacao.beneficio,
                            dataSolicitacao: solicitacao.dataSolicitacao
                        }
                    }));
                    
                    todosDocumentos.push(...documentosComInfo);
                    
                } catch (docError) {
                    console.log(`⚠️ Erro ao buscar documentos da solicitação ${solicitacao.id}:`, docError);
                    // Continua para próxima solicitação mesmo se uma falhar
                }
            }
            
            console.log("📋 Todos os documentos encontrados:", todosDocumentos);
            setDocumentos(todosDocumentos);
            
        } catch (error) {
            console.error("❌ Erro ao buscar documentos:", error);
            setError(`Erro ao carregar documentos: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Carregar dados quando o componente montar
    useEffect(() => {
        fetchDocumentos();
    }, []);

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

    // Função para obter nome do documento
    const getNomeDocumento = (documento) => {
        if (documento.nomeOriginal) {
            return documento.nomeOriginal;
        }
        if (documento.nome) {
            return documento.nome;
        }
        if (documento.nomeArquivo) {
            return documento.nomeArquivo;
        }
        
        // Se não tem nome, usa informações da solicitação
        const beneficioNome = documento.solicitacao?.beneficio?.nome || "Benefício";
        return `Documento - ${beneficioNome}`;
    };

    // Função para obter status do documento
    const getStatusDocumento = (documento) => {
        // Se o documento tem status próprio
        if (documento.status) {
            return documento.status;
        }
        
        // Se não, usa o status da solicitação
        if (documento.solicitacao?.status) {
            return documento.solicitacao.status;
        }
        
        return "ENVIADO";
    };

    // Função para abrir documento
    const handleAbrirDocumento = async (documento) => {
        try {
            console.log("🔍 Tentando abrir documento:", documento);
            
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Erro", "Sessão inválida. Faça login novamente.");
                return;
            }
            
            // Se tem nome único do arquivo, busca a URL
            if (documento.nomeArquivoUnico) {
                console.log("🔗 Buscando URL para:", documento.nomeArquivoUnico);
                
                const urlResponse = await documentoUrl(documento.nomeArquivoUnico, token);
                console.log("📥 URL recebida:", urlResponse);
                
                let url = null;
                if (typeof urlResponse === 'string') {
                    url = urlResponse;
                } else if (urlResponse.url) {
                    url = urlResponse.url;
                } else if (urlResponse.data && urlResponse.data.url) {
                    url = urlResponse.data.url;
                }
                
                if (url) {
                    console.log("🌐 Abrindo URL:", url);
                    const supported = await Linking.canOpenURL(url);
                    if (supported) {
                        await Linking.openURL(url);
                    } else {
                        Alert.alert("Erro", "Não foi possível abrir o documento.");
                    }
                } else {
                    Alert.alert("Erro", "URL do documento não encontrada.");
                }
            } else {
                Alert.alert("Informação", "Documento não disponível para visualização.");
            }
            
        } catch (error) {
            console.error("❌ Erro ao abrir documento:", error);
            Alert.alert("Erro", `Não foi possível abrir o documento: ${error.message}`);
        }
    };

    // Renderizar conteúdo
    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#065F46" />
                    <Text style={styles.loadingText}>Carregando documentos...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable 
                        style={styles.retryButton}
                        onPress={fetchDocumentos}
                    >
                        <Text style={styles.retryText}>Tentar novamente</Text>
                    </Pressable>
                </View>
            );
        }

        if (!documentos || documentos.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nenhum documento encontrado.</Text>
                    <Text style={styles.emptySubText}>
                        Os documentos enviados aparecerão aqui quando você fizer solicitações de benefícios.
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.documentosContainer}>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerText}>
                        📄 {documentos.length} documento{documentos.length !== 1 ? 's' : ''} encontrado{documentos.length !== 1 ? 's' : ''}
                    </Text>
                </View>

                {documentos.map((documento, index) => {
                    console.log(`🎯 Renderizando documento ${index + 1}:`, documento);
                    
                    return (
                        <Pressable
                            key={documento.id || index}
                            onPress={() => handleAbrirDocumento(documento)}
                            style={({ pressed }) => [
                                pressed && styles.pressedCard
                            ]}
                        >
                            <CardStatus
                                tipo="documento"
                                titulo={getNomeDocumento(documento)}
                                status={getStatusDocumento(documento)}
                                dataEnvio={formatDate(documento.dataEnvio || documento.solicitacao?.dataSolicitacao)}
                            />
                        </Pressable>
                    );
                })}

                <View style={styles.infoContainer}>
                    <Text style={styles.infoText}>
                        💡 Toque em um documento para visualizá-lo
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <Fundo>
            <View style={styles.content}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={{ marginBottom: 16 }}>
                        <TituloIcone
                            titulo="Documentos Enviados"
                            icone={require("../images/icones/Folder_check_g.png")}
                        />
                    </View>

                    {renderContent()}
                </ScrollView>
            </View>
        </Fundo>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        padding: 16,
    },
    documentosContainer: {
        flex: 1,
    },
    headerInfo: {
        backgroundColor: '#E8F5E8',
        padding: 12,
        borderRadius: 6,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#065F46',
    },
    headerText: {
        fontSize: 14,
        color: '#065F46',
        fontWeight: '600',
    },
    pressedCard: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    infoContainer: {
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    infoText: {
        fontSize: 14,
        color: '#92400E',
        textAlign: 'center',
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
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#065F46',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
    },
    retryText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
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
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: "#9CA3AF",
        textAlign: "center",
        lineHeight: 20,
    },
});