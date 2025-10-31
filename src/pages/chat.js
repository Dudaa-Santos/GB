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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MessageBubble from "../components/MessageBubble";
import { chatBotMessage } from "../service/authService";

export default function Chat() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [mensagem, setMensagem] = useState("");
  const [kbHeight, setKbHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // histórico da conversa
  const [conversa, setConversa] = useState([
    {
      id: "1",
      text: "Olá, eu sou a Oirem! Como posso te ajudar hoje?",
      fromUser: false,
      time: "07:32",
    },
  ]);

  // id de sessão (pra manter o contexto da IA)
  const [conversationId, setConversationId] = useState(null);

  // FlatList ref pra autoscroll
  const listRef = useRef(null);

  // monitorar teclado pra subir o input
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

  // hora bonitinha tipo 07:41
  function getHoraAgora() {
    const d = new Date();
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  // enviar mensagem
  const handleEnviar = async () => {
    if (!mensagem.trim()) return;

    const textoUsuario = mensagem.trim();

    // adiciona mensagem do usuário
    const novaMensagem = {
      id: Date.now().toString(),
      text: textoUsuario,
      fromUser: true,
      time: getHoraAgora(),
    };

    setConversa((prev) => [...prev, novaMensagem]);

    // limpa input
    setMensagem("");

    // loading ligado
    setIsLoading(true);

    // adiciona a mensagem "digitando..." do bot (bolinhas)
    const typingId = `typing-${Date.now()}`;
    setConversa((prev) => [
      ...prev,
      {
        id: typingId,
        typing: true, // <- isso aciona as bolinhas no MessageBubble
        fromUser: false,
        time: "",
      },
    ]);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado. Faça login novamente.");
      }

      // chama o backend
      const resposta = await chatBotMessage(
        textoUsuario,
        token,
        conversationId
      );

      // atualiza conversationId se o back devolver outro
      const novoConversationId =
        resposta?.data?.conversationId || conversationId;
      setConversationId(novoConversationId);

      // pega o texto do bot
      const textoRespostaDoBot =
        resposta?.data?.resposta ||
        resposta?.data.resposta ||
        JSON.stringify(resposta);

      const respostaBot = {
        id: (Date.now() + 1).toString(),
        text: textoRespostaDoBot,
        fromUser: false,
        time: getHoraAgora(),
        raw: resposta,
      };

      // remove o typing e coloca a resposta final da IA
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

      // remove o typing e coloca mensagem de erro
      setConversa((prev) => {
        const semTyping = prev.filter((m) => !m.typing);
        return [...semTyping, respostaErro];
      });
    } finally {
      setIsLoading(false);
    }
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

        <Image
          source={require("../images/oirem.jpg")}
          style={styles.avatar}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.nome}>Oirem Ture A Mai</Text>

          {/* agora sempre fixo, sem "Digitando..." */}
          <Text style={styles.status}>
            Online - Sempre disponível
          </Text>
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
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 90 + insets.bottom,
        }}
        onContentSizeChange={() => {
          listRef.current?.scrollToEnd({ animated: true });
        }}
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
          style={styles.input}
          placeholder="Digite sua mensagem..."
          placeholderTextColor="#9CA3AF"
          value={mensagem}
          onChangeText={setMensagem}
          multiline
          maxLength={1000}
          editable={!isLoading}
        />

        <Pressable
          style={[
            styles.sendButton,
            (!mensagem.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={handleEnviar}
          disabled={!mensagem.trim() || isLoading}
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
  container: {
    flex: 1,
    backgroundColor: "#FFFEF6",
  },
  headerChat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#065F46",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 100,
    resizeMode: "cover",
    backgroundColor: "#fff",
  },
  nome: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  status: {
    color: "#d1fae5",
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#FFFEF6",
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1F2937",
    maxHeight: 110,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#065F46",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
});
