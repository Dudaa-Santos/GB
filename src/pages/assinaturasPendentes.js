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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import {
  buscarSolicitacoesporId,
  assinarDocumento,
} from "../service/authService";

export default function AssinaturasPendentes() {
  const [pendentes, setPendentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const [assinando, setAssinando] = useState(false);

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

  const handleAssinar = (item) => {
    setSelecionado(item);
    setModalVisible(true);
  };

  const confirmarAssinatura = async () => {
    if (!selecionado) return;
    try {
      setAssinando(true);
      const token = await AsyncStorage.getItem("token");
      await assinarDocumento(selecionado.id, token);
      setModalVisible(false);
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
      // ✅ empty state alinhado ao ParcelamentoAberto
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma assinatura pendente</Text>
          <Text style={styles.emptySubText}>
            Quando houver documentos aguardando sua assinatura, eles aparecerão aqui.
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

        {/* MODAL DE CONFIRMAÇÃO */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitulo}>Confirmar Assinatura</Text>

              {selecionado && (
                <>
                  <Text style={styles.modalItem}>
                    Benefício: {getTituloSolicitacao(selecionado)}
                  </Text>
                  <Text style={styles.modalItem}>
                    Valor Total: R$ {selecionado.valorTotal?.toFixed(2) || "0,00"}
                  </Text>
                  <Text style={styles.modalItem}>
                    Parcelas: {selecionado.qtdeParcelas || "-"}
                  </Text>
                  <Text style={styles.modalItem}>
                    Tipo Pagamento: {selecionado.tipoPagamento || "-"}
                  </Text>
                </>
              )}

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setModalVisible(false)}
                  style={[styles.modalButton, { backgroundColor: "#9CA3AF" }]}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </Pressable>

                <Pressable
                  onPress={confirmarAssinatura}
                  style={[styles.modalButton, { backgroundColor: "#065F46" }]}
                  disabled={assinando}
                >
                  {assinando ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Assinar</Text>
                  )}
                </Pressable>
              </View>
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
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
    textAlign: "center",
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    width: "100%",
    maxWidth: 350,
  },
  modalTitulo: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 12 },
  modalItem: { fontSize: 15, color: "#374151", marginBottom: 6 },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
