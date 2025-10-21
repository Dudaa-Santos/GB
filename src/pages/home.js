import React, { use, useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Fundo from "../components/fundo";
import { buscarColabPorId, buscarAgendamentoPorId, buscarSolicitacoesporId} from "../service/authService";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import WeekPillStatic from "../components/calendarioSemanal";
import CardHome from "../components/CardHome";
import ButtonTextIcon from "../components/buttonTextIcon";
import IconButton from "../components/iconButton";

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
    } catch (error) {
      // Error handled silently
    }
  };

  const fetchAgendamentos = async () => {
    try {
      const id = await AsyncStorage.getItem("id");
      const token = await AsyncStorage.getItem("token");
      if (id && token) {
        const data = await buscarAgendamentoPorId(id, token);
        setAgendamentos(data);
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const fetchSolicitacoes = async () => {
    try {
      const id = await AsyncStorage.getItem("id");
      const token = await AsyncStorage.getItem("token");

      if (id && token) {
        const data = await buscarSolicitacoesporId(id, token);
        setSolicitacoes(data);
      }
    } catch (error) {
      // Error handled silently
    }
  };

  // Carrega dados iniciais
  useEffect(() => {
    fetchUser();
    fetchAgendamentos();
    fetchSolicitacoes();
  }, []);

  // Atualiza dados sempre que a tela receber foco
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
    } catch (error) {
      // Error handled silently
    }
  };

const contarConsultasAgendadas = () => {
  const lista = Array.isArray(agendamentos)
    ? agendamentos
    : Array.isArray(agendamentos?.data)
    ? agendamentos.data
    : [];

  const count = lista.filter(
    (ag) => ag?.status?.toUpperCase() === "AGENDADO"
  ).length;

  return count;
};

const contarBeneficiosPendentes = () => {
  const lista = Array.isArray(solicitacoes)
    ? solicitacoes
    : Array.isArray(solicitacoes?.data)
    ? solicitacoes.data
    : [];
  const count = lista.filter(
    (sol) => sol?.status?.toUpperCase() === "PENDENTE"
  ).length;
  return count;
};

  return (
    <Fundo isHome={true} scrollable={true}>
      <View style={styles.content}>
        <Text style={styles.titulo}>
          Olá, {colaborador ? colaborador.data.nome : "Carregando..."}
        </Text>
        <Text style={styles.subtitulo}>Status resumido</Text>

        {/* CARD PRINCIPAL */}
        <View style={styles.card}>
          <Image
            source={require("../images/prancheta.png")}
            style={styles.prancheta}
            resizeMode="contain"
          />

      {/* STATUS BOXES */}
      <View style={styles.statusContainer}>
        <Pressable
          onPress={() => navigation.navigate('ConsultasAgendadas')}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          style={({ pressed }) => [
            styles.statusBox,
            pressed && { opacity: 0.9 }
          ]}
          accessibilityRole="button"
          accessibilityLabel="Ver consultas agendadas"
        >
          <Image
            source={require("../images/icones/Calendar_add_w.png")}
            style={{ width: 17, height: 17, resizeMode: "contain" }}
          />
          <Text style={styles.statusLabel}>CONSULTAS{"\n"}AGENDADAS</Text>
          <Text style={styles.statusNumber}>{contarConsultasAgendadas()}</Text>
        </Pressable>
        
        <Pressable
          onPress={() => navigation.navigate('AssinaturasPendentes')}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          style={({ pressed }) => [
            styles.statusBox,
            pressed && { opacity: 0.9 }
          ]}
          accessibilityRole="button"
          accessibilityLabel="Ver assinaturas pendentes"
        >
          <Image
            source={require("../images/icones/File_dock_w.png")}
            style={{ width: 17, height: 17, resizeMode: "contain" }}
          />
          <Text style={styles.statusLabel}>ASSINATURAS{"\n"}PENDENTES</Text>
          <Text style={styles.statusNumber}>12</Text>
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
            onPress={() => navigation.navigate("DocumentosEnviados")}
          />
        </View>
        <View style={styles.buttonContainer}>
          <ButtonTextIcon title="HISTÓRICO" icon={<Image source={require("../images/icones/history_w.png")} style={{ width: 26, height: 26, resizeMode: "contain" }} />} onPress={() => navigation.navigate("Historico")} />
          <IconButton icon={<Icon name="logout" size={24} color="#fff" />} onPress={handleLogout} />
        </View>

      </View>
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
});

