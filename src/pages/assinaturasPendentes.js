import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import { buscarSolicitacoesporId } from "../service/authService";

export default function AssinaturasPendentes() {
  const [pendentes, setPendentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  // carrega só solicitações com status PENDENTE_ASSINATURA
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

      // normalizar formato de resposta (mesma lógica do Historico)
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

      // filtra só status PENDENTE_ASSINATURA
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

  // formata data estilo DD/MM/AAAA
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

  // pega título pra exibir
  const getTituloSolicitacao = (item) => {
    // tenta campos parecidos com o que vc usa em Historico:
    // em Historico você usa:
    //   solicitacao.beneficio?.nome
    //   solicitacao.descricao
    if (item.beneficio && item.beneficio.nome) {
        return item.beneficio.nome;
    }
    if (item.descricao) {
        return item.descricao;
    }
    if (item.nomeBeneficio) {
        return item.nomeBeneficio;
    }
    return "Documento para assinatura";
  };

  // pega solicitante
  const getSolicitante = (item) => {
    // Historico monta colaborador/dependente, então vamos seguir essa vibe
    if (item.colaborador && item.colaborador.nome) {
      return item.colaborador.nome;
    }
    if (item.dependente && item.dependente.nome) {
      // se for dependente, mostra o nome do dependente
      return item.dependente.nome;
    }
    if (item.solicitante) {
      return item.solicitante;
    }
    return "-";
  };

  const handleAssinar = (idSolicitacao) => {
    // aqui você depois navega pra tela que mostra o PDF / termo e coleta assinatura
    console.log("Assinar documento:", idSolicitacao);
  };

  // estados de carregamento/erro/vazio no mesmo padrão do resto do app
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

    if (!pendentes || pendentes.length === 0) {
      return (
        <View style={styles.vazioBox}>
          <Text style={styles.vazioTitulo}>Nenhuma assinatura pendente</Text>
          <Text style={styles.vazioSub}>
            Quando houver documentos aguardando sua assinatura, eles aparecerão aqui.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
      >
        {pendentes.map((item, index) => (
          <View
            key={item.id || item.idSolicitacao || index}
            style={styles.card}
          >
            {/* ESQUERDA */}
            <View style={styles.leftSection}>
              <Text style={styles.cardTitle}>
                {getTituloSolicitacao(item)}
              </Text>

              <Text style={styles.cardSub}>
                DATA:{" "}
                {formatarData(
                  item.dataSolicitacao ||
                  item.dataVencimento ||
                  item.criadoEm
                )}
              </Text>

              <Text style={styles.cardSub}>
                SOLICITANTE: {getSolicitante(item)}
              </Text>
            </View>

            {/* DIREITA (BOTÃO ASSINAR) */}
            <Pressable
              onPress={() =>
                handleAssinar(
                  item.id ||
                  item.idSolicitacao ||
                  index
                )
              }
              style={({ pressed }) => [
                styles.iconButton,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Assinar documento"
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
      </View>
    </Fundo>
  );
}

const colors = {
  green: "#065F46",
  bgCard: "#F8F7F7",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    padding: 16,
  },

  // LOADING / ERRO / VAZIO
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
  vazioBox: {
    backgroundColor: colors.bgCard,
    borderLeftWidth: 4,
    borderLeftColor: colors.green,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
    width: "100%",
    alignSelf: "center",
  },
  vazioTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
    textAlign: "center",
  },
  vazioSub: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
    textAlign: "center",
  },

  // LISTA
  cardsContainer: {
    marginTop: 24,
    paddingBottom: 12,
  },

  /* CARD */
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
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
});
