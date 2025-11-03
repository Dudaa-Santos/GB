import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  Pressable,
  TextInput,
  Keyboard,
  Platform,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MessageBubble from "../components/MessageBubble";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { chatBotMessage } from "../service/authService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function Chat() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [mensagem, setMensagem] = useState("");
  const [kbHeight, setKbHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [conversa, setConversa] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [primeiroUso, setPrimeiroUso] = useState(true);
  const listRef = useRef(null);

  useEffect(() => {
    const show = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(show, (e) => {
      setKbHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hide, () => setKbHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  function getHoraAgora() {
    const d = new Date();
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  const handleEnviar = async (textOverride) => {
    const textoUsuario = (textOverride ?? mensagem).trim();
    if (!textoUsuario) return;

    const novaMensagem = {
      id: Date.now().toString(),
      text: textoUsuario,
      fromUser: true,
      time: getHoraAgora(),
    };
    setConversa((prev) => [...prev, novaMensagem]);
    setMensagem("");
    setIsLoading(true);

    const typingId = `typing-${Date.now()}`;
    setConversa((prev) => [
      ...prev,
      { id: typingId, typing: true, fromUser: false, time: "" },
    ]);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado. Faça login novamente.");

      const resposta = await chatBotMessage(textoUsuario, token, conversationId);
      const novoConversationId = resposta?.data?.conversationId || conversationId;
      setConversationId(novoConversationId);

      const textoRespostaDoBot =
        resposta?.data?.resposta ??
        resposta?.data?.message ??
        JSON.stringify(resposta);

      const respostaBot = {
        id: (Date.now() + 1).toString(),
        text: textoRespostaDoBot,
        fromUser: false,
        time: getHoraAgora(),
      };

      setConversa((prev) => {
        const semTyping = prev.filter((m) => !m.typing);
        return [...semTyping, respostaBot];
      });
    } catch (error) {
      console.error("Erro ao chamar chatbot:", error);
      const respostaErro = {
        id: (Date.now() + 1).toString(),
        text: "Desculpe, tive um problema ao processar sua mensagem. Tente novamente.",
        fromUser: false,
        time: getHoraAgora(),
      };
      setConversa((prev) => {
        const semTyping = prev.filter((m) => !m.typing);
        return [...semTyping, respostaErro];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuick = (text) => {
    if (isLoading) return;
    setPrimeiroUso(false);
    handleEnviar(text);
  };

  const EmptyState = () => {
    // Ajusta tamanho da mascote baseado na altura da tela
    const mascoteSize = Math.min(SCREEN_HEIGHT * 0.35, 300);
    
    return (
      <View style={styles.emptyWrap}>
        <Image
          source={require("../images/Oirem/OiremCorpoInteiro.png")}
          style={[styles.mascote, { width: mascoteSize, height: mascoteSize }]}
          resizeMode="contain"
        />

        <Text style={styles.acoesTitulo}>AÇÕES RÁPIDAS</Text>

        <View style={styles.cardsLinha}>
          <Pressable
            style={({ pressed }) => [
              styles.cardQuick,
              pressed && { opacity: 0.7, backgroundColor: "#E6F2EE" },
            ]}
            onPress={() => sendQuick("quero agendar consulta")}
          >
            <Image
              source={require("../images/icones/Calendar_add_g.png")}
              style={styles.cardImage}
              resizeMode="contain"
            />
            <Text style={styles.cardText}>Agendar Consultas</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.cardQuick,
              pressed && { opacity: 0.7, backgroundColor: "#E6F2EE" },
            ]}
            onPress={() => sendQuick("quero solicitar beneficio")}
          >
            <Image
              source={require("../images/icones/Money_g.png")}
              style={styles.cardImage}
              resizeMode="contain"
            />
            <Text style={styles.cardText}>Solicitar Benefício</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#065F46" />
      <View
        style={{
          height: StatusBar.currentHeight || insets.top,
          backgroundColor: "#065F46",
        }}
      />

      {/* HEADER */}
      <View style={styles.headerChat}>
        <Pressable
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          hitSlop={10}
        >
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>

        <Image source={require("../images/oirem.jpg")} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.nome}>Oirem Ture A Mai</Text>
          <Text style={styles.status}>Sempre disponível</Text>
        </View>
      </View>

      {/* LISTA DE MENSAGENS */}
      <FlatList
        ref={listRef}
        data={conversa}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            text={item.text}
            fromUser={item.fromUser}
            time={item.time}
            typing={item.typing}
          />
        )}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={[
          styles.listContent,
          conversa.length === 0 && { flex: 1, justifyContent: "space-between" },
        ]}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {/* INPUT */}
      <View
        style={[
          styles.inputContainer,
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: kbHeight > 0 ? kbHeight : insets.bottom,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            primeiroUso && styles.inputDisabled,
          ]}
          placeholder={primeiroUso ? "Selecione uma ação rápida acima..." : "Digite sua mensagem..."}
          placeholderTextColor="#9CA3AF"
          value={mensagem}
          onChangeText={setMensagem}
          multiline
          maxLength={1000}
          editable={!isLoading && !primeiroUso}
        />

        <Pressable
          style={[
            styles.sendButton,
            (!mensagem.trim() || isLoading || primeiroUso) && styles.sendButtonDisabled,
          ]}
          onPress={() => handleEnviar()}
          disabled={!mensagem.trim() || isLoading || primeiroUso}
          hitSlop={10}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFEF6" },
  headerChat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    paddingVertical: 14,
    backgroundColor: "#065F46",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButtonText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  avatar: { 
    width: SCREEN_WIDTH * 0.11, 
    height: SCREEN_WIDTH * 0.11, 
    borderRadius: 100, 
    backgroundColor: "#fff" 
  },
  nome: { 
    color: "#fff", 
    fontSize: SCREEN_WIDTH * 0.04, 
    fontWeight: "bold" 
  },
  status: { 
    color: "#d1fae5", 
    fontSize: SCREEN_WIDTH * 0.035 
  },
  listContent: { 
    padding: SCREEN_WIDTH * 0.04, 
    paddingBottom: SCREEN_HEIGHT * 0.12 
  },

  // ----- EMPTY -----
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: SCREEN_HEIGHT * 0.03,
    paddingBottom: SCREEN_HEIGHT * 0.025,
    gap: SCREEN_HEIGHT * 0.02,
  },
  mascote: { 
    alignSelf: "center",
  },
  acoesTitulo: {
    fontSize: SCREEN_WIDTH * 0.033,
    fontWeight: "700",
    color: "#065F46",
    letterSpacing: 0.5,
    marginTop: "auto",
  },
  cardImage: { 
    width: SCREEN_WIDTH * 0.065, 
    height: SCREEN_WIDTH * 0.065, 
    alignItems: "center",
    justifyContent: "center",
  },
  cardsLinha: {
    flexDirection: "row",
    gap: SCREEN_WIDTH * 0.035,
    paddingHorizontal: SCREEN_WIDTH * 0.025,
    width: "100%",
  },
  cardQuick: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#065F46",
    borderRadius: 12,
    paddingVertical: SCREEN_HEIGHT * 0.022,
    paddingHorizontal: SCREEN_WIDTH * 0.03,
    gap: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardText: { 
    fontSize: SCREEN_WIDTH * 0.035, 
    fontWeight: "600", 
    color: "#2E2E2E" 
  },

  // ----- INPUT -----
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: SCREEN_WIDTH * 0.05,
    paddingVertical: SCREEN_HEIGHT * 0.012,
    gap: 8,
    backgroundColor: "#FFFEF6",
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: SCREEN_WIDTH * 0.038,
    color: "#1F2937",
    maxHeight: SCREEN_HEIGHT * 0.13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputDisabled: {
    backgroundColor: "#E5E7EB",
    color: "#9CA3AF",
  },
  sendButton: {
    width: SCREEN_WIDTH * 0.11,
    height: SCREEN_WIDTH * 0.11,
    borderRadius: SCREEN_WIDTH * 0.055,
    backgroundColor: "#065F46",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { backgroundColor: "#D1D5DB" },
  sendButtonText: { 
    color: "#fff", 
    fontSize: SCREEN_WIDTH * 0.05, 
    fontWeight: "bold" 
  },
});
