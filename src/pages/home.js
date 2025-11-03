import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Animated,       // ⬅ adicionado
  Easing,         // ⬅ adicionado
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Fundo from "../components/fundo";
import { buscarColabPorId, buscarAgendamentoPorId, buscarSolicitacoesporId } from "../service/authService";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import WeekPillStatic from "../components/calendarioSemanal";
import CardHome from "../components/CardHome";
import ButtonTextIcon from "../components/buttonTextIcon";
import IconButton from "../components/iconButton";

/* ----------------------------
   Botão flutuante com pulso
-----------------------------*/
function FloatingChatButton({ onPress }) {
  const ring1 = React.useRef(new Animated.Value(0)).current;
  const ring2 = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeLoop = (val, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        { iterations: -1 }
      );

    ring1.setValue(0);
    ring2.setValue(0);

    const a1 = makeLoop(ring1, 0);
    const a2 = makeLoop(ring2, 600);
    a1.start(); a2.start();

    return () => { a1.stop(); a2.stop(); };
  }, [ring1, ring2]);

  const ringStyle = (v) => ({
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.8] }) }],
    opacity: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.35, 0.08, 0] }),
  });

  return (
    <View pointerEvents="box-none" style={styles.floatWrap}>
      <Animated.View pointerEvents="none" style={[styles.pulseRing, ringStyle(ring1)]} />
      <Animated.View pointerEvents="none" style={[styles.pulseRing, ringStyle(ring2)]} />

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.floatingBtn, pressed && { transform: [{ scale: 0.98 }] }]}
        android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: true }}
        accessibilityRole="button"
        accessibilityLabel="Abrir chat com a Oirem"
      >
        <Image source={require("../images/oirem.jpg")} style={styles.mascoteFace} resizeMode="cover" />
      </Pressable>
    </View>
  );
}

export default function Home({ navigation }) {
  const [colaborador, setColaborador] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);

  const fetchUser = async () => {
    try {
      const id = await AsyncStorage.getItem("id");
      const token = await AsyncStorage.getItem("token");
      if (id && token) {
        const data = await buscarColabPorId(id, token);
        setColaborador(data);
      }
    } catch (error) {}
  };

  const fetchAgendamentos = async () => {
    try {
      const id = await AsyncStorage.getItem("id");
      const token = await AsyncStorage.getItem("token");
      if (id && token) {
        const data = await buscarAgendamentoPorId(id, token);
        setAgendamentos(data);
      }
    } catch (error) {}
  };

  const fetchSolicitacoes = async () => {
    try {
      const id = await AsyncStorage.getItem("id");
      const token = await AsyncStorage.getItem("token");
      if (id && token) {
        const data = await buscarSolicitacoesporId(id, token);
        setSolicitacoes(data);
      }
    } catch (error) {}
  };

  useEffect(() => {
    fetchUser();
    fetchAgendamentos();
    fetchSolicitacoes();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAgendamentos();
      fetchSolicitacoes();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("id");
      navigation.replace("Login");
    } catch (error) {}
  };

  const contarConsultasAgendadas = () => {
    const lista = Array.isArray(agendamentos)
      ? agendamentos
      : Array.isArray(agendamentos?.data)
      ? agendamentos.data
      : [];
    return lista.filter((ag) => ag?.status?.toUpperCase() === "AGENDADO").length;
  };

  const contarBeneficiosPendentes = () => {
    const lista = Array.isArray(solicitacoes)
      ? solicitacoes
      : Array.isArray(solicitacoes?.data)
      ? solicitacoes.data
      : [];
    return lista.filter((sol) => sol?.status?.toUpperCase() === "PENDENTE").length;
  };

  const contarAssinaturasPendentes = () => {
    const lista = Array.isArray(solicitacoes)
      ? solicitacoes
      : Array.isArray(solicitacoes?.data)
      ? solicitacoes.data
      : [];
    return lista.filter((sol) => sol?.status?.toUpperCase() === "PENDENTE_ASSINATURA").length;
  };

  return (
 <Fundo isHome={true} scrollable={true} onLogout={handleLogout}>
      <View style={styles.content}>
        <Text style={styles.titulo}>
          Olá, {colaborador ? colaborador.data.nome : "Carregando..."}
        </Text>
        <Text style={styles.subtitulo}>Status resumido</Text>

        {/* CARD PRINCIPAL (inalterado) */}
        <View style={styles.card}>
          <Image
            source={require("../images/prancheta.png")}
            style={styles.prancheta} // se não existir no StyleSheet, tudo bem manter como estava
            resizeMode="contain"
          />

          {/* STATUS BOXES (inalterados) */}
          <View style={styles.statusContainer}>
            <Pressable
              onPress={() => navigation.navigate('ConsultasAgendadas')}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              style={({ pressed }) => [styles.statusBox, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel="Ver consultas agendadas"
            >
              <Image source={require("../images/icones/Calendar_add_w.png")} style={{ width: 17, height: 17, resizeMode: "contain" }} />
              <Text style={styles.statusLabel}>CONSULTAS{"\n"}AGENDADAS</Text>
              <Text style={styles.statusNumber}>{contarConsultasAgendadas()}</Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('AssinaturasPendentes')}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              style={({ pressed }) => [styles.statusBox, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel="Ver assinaturas pendentes"
            >
              <Image source={require("../images/icones/File_dock_w.png")} style={{ width: 17, height: 17, resizeMode: "contain" }} />
              <Text style={styles.statusLabel}>ASSINATURAS{"\n"}PENDENTES</Text>
              <Text style={styles.statusNumber}>{contarAssinaturasPendentes()}</Text>
            </Pressable>

            <View style={styles.statusBox}>
              <Image source={require("../images/icones/File_dock_search_w.png")} style={{ width: 17, height: 17, resizeMode: "contain" }} />
              <Text style={styles.statusLabel}>BENEFÍCIOS{"\n"}EM ANÁLISE</Text>
              <Text style={styles.statusNumber}>{contarBeneficiosPendentes()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.calendarContainer}>
          <WeekPillStatic highlightToday={true} />
        </View>

        <Text style={styles.subtitulo}>O que você deseja fazer?</Text>
        <View style={styles.cardContainer}>
          <CardHome
            title="Agendar Consulta"
            icon={<Image source={require("../images/icones/Calendar_add_g.png")} style={{ width: 26, height: 26, resizeMode: "contain" }} />}
            onPress={() => navigation.navigate("AgendarConsulta")}
          />
          <CardHome
            title="Solicitar Benefício"
            icon={<Image source={require("../images/icones/Money_g.png")} style={{ width: 26, height: 26, resizeMode: "contain" }} />}
            onPress={() => navigation.navigate("SolicitarBeneficio")}
          />
          <CardHome
            title="Parcelamento Aberto"
            icon={<Image source={require("../images/icones/Wallet_alt_g.png")} style={{ width: 26, height: 26, resizeMode: "contain" }} />}
            onPress={() => navigation.navigate("ParcelamentoAberto")}
          />
          <CardHome
            title="Documentos Enviados"
            icon={<Image source={require("../images/icones/Folder_check_g.png")} style={{ width: 26, height: 26, resizeMode: "contain" }} />}
            onPress={() => navigation.navigate("Chat")}
          />
        </View>

        <View style={styles.buttonContainer}>
          <ButtonTextIcon title="HISTÓRICO" icon={<Image source={require("../images/icones/history_w.png")} style={{ width: 26, height: 26, resizeMode: "contain" }} />} onPress={() => navigation.navigate("Historico")} />
        </View>
      </View>

      {/* Botão flutuante que pulsa (abre o Chat) */}
      <FloatingChatButton onPress={() => navigation.navigate("Chat")} />
    </Fundo>
  );
}

const colors = {
  brand: "#065F46",
  textInverse: "#FFFFF6",
  cardBg: "#058A62",
  boxBg: "#41AE8C",
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 16,
    color: "#444",
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    width: "100%",
    borderWidth: 2,
    borderColor: "#065F46",
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 12,
  },
  statusContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 4,
  },
  statusBox: {
    borderWidth: 1,
    borderColor: "#fff",
    backgroundColor: colors.boxBg,
    width: 81,
    borderRadius: 4,
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  statusLabel: {
    color: "#fff",
    fontSize: 10,
  },
  statusNumber: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  calendarContainer: {
    marginTop: 16,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 12,
    gap: 12,
  },
  button: {
    marginTop: 16,
    backgroundColor: colors.brand,
    borderRadius: 8,
    width: 120,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: "bold",
  },

  /* --------- Somente o botão flutuante (não altera seus cards) --------- */
  floatWrap: {
    position: "absolute",
    right: 4,
    bottom: 74, // ajuste se tiver TabBar
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#BFEFF0", // glow claro
  },
  floatingBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#065F46",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6, // Android
    shadowColor: "#000", // iOS
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  mascoteFace: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
});
