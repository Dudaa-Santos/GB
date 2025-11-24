import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import {
  buscarSolicitacoesporId,
  assinarDocumento,
  buscarDocumentoporId,
  documentoUrl as obterDocumentoUrl,
} from "../service/authService";

const { width, height } = Dimensions.get("window");

export default function AssinaturasPendentes() {
  const [pendentes, setPendentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const [assinando, setAssinando] = useState(false);
  const [urlDocumento, setUrlDocumento] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  const fetchPendentesAssinatura = async () => {
    try {
      setLoading(true);
      setErro(null);

      const token = await AsyncStorage.getItem("token");
      const id = await AsyncStorage.getItem("id");

      if (!token || !id) {
        setErro("Sessão expirada. Faça login novamente.");
        setPendentes([]);
        return;
      }

      const response = await buscarSolicitacoesporId(id, token);

      let solicitacoesArray = [];
      if (response && response.success && response.data) {
        solicitacoesArray = response.data;
      } else if (Array.isArray(response)) {
        solicitacoesArray = response;
      } else if (response && Array.isArray(response.solicitacoes)) {
        solicitacoesArray = response.solicitacoes;
      } else if (response && response.data && Array.isArray(response.data)) {
        solicitacoesArray = response.data;
      }

      const apenasPendentesAssinatura = solicitacoesArray.filter(
        (sol) =>
          sol?.status &&
          sol.status.toUpperCase() === "PENDENTE_ASSINATURA"
      );

      setPendentes(apenasPendentesAssinatura);
    } catch (err) {
      setErro(`Erro ao carregar assinaturas pendentes: ${err.message}`);
      setPendentes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendentesAssinatura();
  }, []);

  const formatarData = (valorData) => {
    if (!valorData) return "-";
    try {
      const d = new Date(valorData);
      const dia = String(d.getDate()).padStart(2, "0");
      const mes = String(d.getMonth() + 1).padStart(2, "0");
      const ano = d.getFullYear();
      return `${dia}/${mes}/${ano}`;
    } catch {
      return valorData;
    }
  };

  const getTituloSolicitacao = (item) => {
    if (item.beneficio?.nome) return item.beneficio.nome;
    if (item.descricao) return item.descricao;
    if (item.nomeBeneficio) return item.nomeBeneficio;
    return "Documento para assinatura";
  };

  const getSolicitante = (item) => {
    if (item.colaborador?.nome) return item.colaborador.nome;
    if (item.dependente?.nome) return item.dependente.nome;
    if (item.solicitante) return item.solicitante;
    return "-";
  };

  const buscarDocumentoRecibo = async (item) => {
    try {
      setLoadingDoc(true);
      const token = await AsyncStorage.getItem("token");
      const colaboradorId = await AsyncStorage.getItem("id");

      const documentos = await buscarDocumentoporId(item.id, colaboradorId, token);
      
      let documentosArray = [];
      if (Array.isArray(documentos)) {
        documentosArray = documentos;
      } else if (documentos?.data && Array.isArray(documentos.data)) {
        documentosArray = documentos.data;
      } else if (documentos?.documentos && Array.isArray(documentos.documentos)) {
        documentosArray = documentos.documentos;
      }

      const recibo = documentosArray.find(
        (doc) => doc.tipoDocumento?.toUpperCase() === "RECIBO"
      );

      if (recibo && recibo.nomeArquivoUnico) {
        const urlData = await obterDocumentoUrl(recibo.nomeArquivoUnico, token);
        const raw = urlData?.data || "";
        const full = raw.startsWith("http")
          ? raw
          : `${process.env.EXPO_PUBLIC_API_URL || ""}${raw}`;
        
        setUrlDocumento(full);
      } else {
        setUrlDocumento(null);
      }
    } catch (error) {
      setUrlDocumento(null);
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleAssinar = async (item) => {
    setSelecionado(item);
    setUrlDocumento(null);
    setModalVisible(true);
    
    await buscarDocumentoRecibo(item);
  };

  const confirmarAssinatura = async () => {
    if (!selecionado) return;
    try {
      setAssinando(true);
      const token = await AsyncStorage.getItem("token");
      await assinarDocumento(selecionado.id, token);
      setModalVisible(false);
      setSelecionado(null);
      setUrlDocumento(null);
      Alert.alert("Sucesso", "Documento assinado com sucesso!");
      fetchPendentesAssinatura();
    } catch (err) {
      Alert.alert("Erro", err.message || "Falha ao assinar documento");
    } finally {
      setAssinando(false);
    }
  };

  const renderConteudo = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#065F46" />
          <Text style={styles.loadingText}>Carregando pendências...</Text>
        </View>
      );
    }

    if (erro) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{erro}</Text>
          <Text style={styles.retryText} onPress={fetchPendentesAssinatura}>
            Tentar novamente
          </Text>
        </View>
      );
    }

    if (!pendentes.length) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma assinatura pendente encontrada.</Text>
          <Text style={styles.emptySubText}>
            Suas solicitações pendentes de assinatura aparecerão aqui.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
        {pendentes.map((item, index) => (
          <View key={item.id || index} style={styles.card}>
            <View style={styles.leftSection}>
              <Text style={styles.cardTitle}>{getTituloSolicitacao(item)}</Text>
              <Text style={styles.cardSub}>
                DATA: {formatarData(item.dataSolicitacao || item.dataVencimento || item.criadoEm)}
              </Text>
              <Text style={styles.cardSub}>SOLICITANTE: {getSolicitante(item)}</Text>
            </View>

            <Pressable
              onPress={() => handleAssinar(item)}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.85 }]}
            >
              <Image
                source={require("../images/icones/Assinatura_w.png")}
                style={styles.icon}
              />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <Fundo>
      <View style={styles.container}>
        <TituloIcone
          titulo="Assinaturas Pendentes"
          icone={require("../images/icones/File_dock_g.png")}
        />
        {renderConteudo()}

        {/* MODAL DE CONFIRMAÇÃO COM VISUALIZAÇÃO DO PDF */}
        <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalFullScreen}>
            {/* HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Confirmar Assinatura</Text>
              <Pressable
                onPress={() => {
                  setModalVisible(false);
                  setSelecionado(null);
                  setUrlDocumento(null);
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollContent}>
              {/* INFORMAÇÕES DA SOLICITAÇÃO */}
              {selecionado && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoTitle}>Detalhes da Solicitação</Text>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Benefício: </Text>
                      {getTituloSolicitacao(selecionado)}
                    </Text>
                    <Text style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Valor Total: </Text>
                      R$ {selecionado.valorTotal?.toFixed(2) || "0,00"}
                    </Text>
                    <Text style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Parcelas: </Text>
                      {selecionado.qtdeParcelas || "-"}
                    </Text>
                    <Text style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Tipo Pagamento: </Text>
                      {selecionado.tipoPagamento || "-"}
                    </Text>
                  </View>
                </View>
              )}

              {/* VISUALIZAÇÃO DO DOCUMENTO */}
              <View style={styles.documentSection}>
                <Text style={styles.documentTitle}>Pré-visualização do Documento</Text>
                
                {loadingDoc ? (
                  <View style={styles.docLoadingContainer}>
                    <ActivityIndicator size="large" color="#065F46" />
                    <Text style={styles.docLoadingText}>Carregando documento...</Text>
                  </View>
                ) : urlDocumento ? (
                  <View style={styles.pdfContainer}>
                    <WebView
                      source={{ uri: urlDocumento }}
                      style={styles.webview}
                      startInLoadingState={true}
                      renderLoading={() => (
                        <View style={styles.webviewLoading}>
                          <ActivityIndicator size="large" color="#065F46" />
                        </View>
                      )}
                      onError={() => {
                        Alert.alert("Erro", "Não foi possível carregar o documento");
                      }}
                    />
                  </View>
                ) : (
                  <View style={styles.noDocContainer}>
                    <Text style={styles.noDocText}>Nenhum documento de recibo encontrado</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* BOTÕES DE AÇÃO */}
            <View style={styles.actionButtons}>
              <Pressable
                onPress={() => {
                  setModalVisible(false);
                  setSelecionado(null);
                  setUrlDocumento(null);
                }}
                style={[styles.actionButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={confirmarAssinatura}
                style={[styles.actionButton, styles.confirmButton]}
                disabled={assinando}
              >
                {assinando ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Assinar Documento</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </Fundo>
  );
}

const colors = {
  green: "#065F46",
  bgCard: "#F8F7F7",
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-start", padding: 16 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  loadingText: { marginTop: 10, fontSize: 16, color: "#6B7280" },
  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  errorText: { fontSize: 16, color: "#DC2626", textAlign: "center", marginBottom: 10 },
  retryText: { fontSize: 16, color: "#065F46", textDecorationLine: "underline" },
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
  cardsContainer: { marginTop: 24, paddingBottom: 12 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.green,
    width: "100%",
    alignSelf: "center",
  },
  leftSection: { flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 4 },
  cardSub: { fontSize: 14, color: "#6B7280", fontWeight: "400" },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { width: 18, height: 18, resizeMode: "contain" },

  // Modal Full Screen
  modalFullScreen: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#065F46",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    elevation: 4,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#FFF",
    fontWeight: "bold",
  },
  modalScrollContent: {
    flex: 1,
  },

  // Seção de Informações
  infoSection: {
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#065F46",
  },
  infoItem: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
  },
  infoLabel: {
    fontWeight: "600",
    color: "#111827",
  },

  // Seção do Documento
  documentSection: {
    flex: 1,
    padding: 16,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  pdfContainer: {
    flex: 1,
    minHeight: 400,
    backgroundColor: "#FFF",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  docLoadingContainer: {
    flex: 1,
    minHeight: 400,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 8,
  },
  docLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  noDocContainer: {
    flex: 1,
    minHeight: 400,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  noDocText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },

  // Botões de Ação
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#065F46",
  },
  confirmButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
