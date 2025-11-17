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
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import MessageBubble from "../components/MessageBubble";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { chatBotMessage, uploadChatDocument } from "../service/authService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function Chat() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [mensagem, setMensagem] = useState("");
  const [kbHeight, setKbHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [conversa, setConversa] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [pendingData, setPendingData] = useState(null);
  const [primeiroUso, setPrimeiroUso] = useState(true);
  const [inputHeight, setInputHeight] = useState(0);
  const [awaitingUpload, setAwaitingUpload] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const show = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(show, (e) => {
      setKbHeight(e.endCoordinates?.height ?? 0);
      // Rola para o final quando o teclado abre
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    const hideSub = Keyboard.addListener(hide, () => {
      setKbHeight(0);
    });

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

  // ---------- ENVIAR DOCUMENTO (/chat/upload) ----------
  const handleEnviarDocumento = async () => {
    try {
      console.log("=== INICIANDO UPLOAD DE DOCUMENTO ===");
      
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: false,
        copyToCacheDirectory: true,
      });

      console.log("Resultado do DocumentPicker:", JSON.stringify(result, null, 2));

      if (result.canceled) {
        console.log("Upload cancelado pelo usuário");
        return;
      }

      const file = result.assets?.[0];
      if (!file) {
        console.error("Nenhum arquivo selecionado");
        return;
      }

      console.log("Arquivo selecionado:", {
        name: file.name,
        size: file.size,
        mimeType: file.mimeType,
        uri: file.uri,
      });

      // mostra no chat o arquivo selecionado
      const msgDocumento = {
        id: Date.now().toString(),
        text: `📎 ${file.name}`,
        fromUser: true,
        time: getHoraAgora(),
      };
      setConversa((prev) => [...prev, msgDocumento]);

      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 150);

      // ✅ Adiciona indicador de "digitando..."
      const typingId = `typing-${Date.now()}`;
      setConversa((prev) => [
        ...prev,
        { id: typingId, typing: true, fromUser: false, time: "" },
      ]);

      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 300);

      setIsLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.error("Token não encontrado no AsyncStorage");
        throw new Error("Token não encontrado. Faça login novamente.");
      }

      console.log("Token recuperado:", token.substring(0, 20) + "...");
      console.log("ConversationId atual:", conversationId);
      console.log("PendingData atual:", pendingData);

      console.log("Chamando uploadChatDocument...");
      const respostaUpload = await uploadChatDocument(
        { file, conversationId, pendingData },
        token
      );

      console.log("Resposta do upload:", JSON.stringify(respostaUpload, null, 2));

      const payload = respostaUpload?.data ?? respostaUpload;
      console.log("Payload extraído:", JSON.stringify(payload, null, 2));

      const novoConversationId = payload?.conversationId || conversationId;
      console.log("Novo conversationId:", novoConversationId);
      setConversationId(novoConversationId);

      const novoPendingData = payload?.pendingData ?? null;
      console.log("Novo pendingData:", novoPendingData);
      setPendingData(novoPendingData);

      const nextAction = payload?.nextAction || null;
      console.log("NextAction recebido:", nextAction);
      setAwaitingUpload(nextAction === "AWAITING_UPLOAD");

      const textoRespostaDoBot =
        payload?.resposta ??
        payload?.message ??
        JSON.stringify(respostaUpload);

      console.log("Texto resposta do bot:", textoRespostaDoBot);

      // ✅ Remove o "digitando..." e adiciona a resposta
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

      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 150);

      console.log("=== UPLOAD CONCLUÍDO COM SUCESSO ===");
    } catch (error) {
      console.error("=== ERRO NO UPLOAD DE DOCUMENTO ===");
      console.error("Tipo do erro:", error.constructor.name);
      console.error("Mensagem:", error.message);
      console.error("Stack:", error.stack);

      // Erros da requisição HTTP
      if (error.response) {
        console.error("=== ERRO DA RESPOSTA HTTP ===");
        console.error("Status:", error.response.status);
        console.error("Status Text:", error.response.statusText);
        console.error("Headers:", JSON.stringify(error.response.headers, null, 2));
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      }

      // Erro na requisição (não chegou no servidor)
      if (error.request) {
        console.error("=== ERRO NA REQUISIÇÃO (SEM RESPOSTA) ===");
        console.error("Request:", error.request);
      }

      // Erro de configuração
      if (error.config) {
        console.error("=== CONFIGURAÇÃO DA REQUISIÇÃO ===");
        console.error("URL:", error.config.url);
        console.error("Method:", error.config.method);
        console.error("Headers:", JSON.stringify(error.config.headers, null, 2));
        console.error("Params:", JSON.stringify(error.config.params, null, 2));
      }

      const msgErro = error.response?.data?.message || error.message || "Erro desconhecido";
      
      const respostaErro = {
        id: (Date.now() + 1).toString(),
        text: `❌ Erro ao enviar documento: ${msgErro}`,
        fromUser: false,
        time: getHoraAgora(),
      };
      
      // ✅ Remove o "digitando..." e adiciona a mensagem de erro
      setConversa((prev) => {
        const semTyping = prev.filter((m) => !m.typing);
        return [...semTyping, respostaErro];
      });
      
      setAwaitingUpload(false);

      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 150);

      console.error("=== FIM DO LOG DE ERRO ===");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- ENVIAR MENSAGEM DE TEXTO (/chat) ----------
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

    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 150);

    const typingId = `typing-${Date.now()}`;
    setConversa((prev) => [
      ...prev,
      { id: typingId, typing: true, fromUser: false, time: "" },
    ]);

    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 300);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado. Faça login novamente.");

      const resposta = await chatBotMessage(textoUsuario, token, conversationId);

      const payload = resposta?.data ?? resposta;

      const novoConversationId = payload?.conversationId || conversationId;
      setConversationId(novoConversationId);

      setPendingData(payload?.pendingData ?? null);

      const nextAction = payload?.nextAction || null;
      setAwaitingUpload(nextAction === "AWAITING_UPLOAD");

      const textoRespostaDoBot =
        payload?.resposta ??
        payload?.message ??
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

      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 150);
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

      setAwaitingUpload(false);

      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 150);
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
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
      <View style={{ flex: 1 }}>
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
          onContentSizeChange={() => {
            setTimeout(() => {
              listRef.current?.scrollToEnd({ animated: true });
            }, 150);
          }}
          onLayout={() => {
            if (conversa.length > 0) {
              setTimeout(() => {
                listRef.current?.scrollToEnd({ animated: false });
              }, 150);
            }
          }}
          maintainVisibleContentPosition={null}
          removeClippedSubviews={false}
        />
      </View>

      {/* INPUT / DOCUMENTO */}
      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: insets.bottom + SCREEN_HEIGHT * 0.02,
          },
        ]}
        onLayout={(e) => setInputHeight(e.nativeEvent.layout.height)}
      >
        {/* Campo de texto sempre visível, mas bloqueado quando awaitingUpload */}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            (primeiroUso || awaitingUpload) && styles.inputDisabled,
          ]}
          placeholder={
            primeiroUso
              ? "Selecione uma ação rápida acima..."
              : awaitingUpload
              ? "Envie o documento solicitado..."
              : "Digite sua mensagem..."
          }
          placeholderTextColor="#9CA3AF"
          value={mensagem}
          onChangeText={setMensagem}
          onFocus={() => {
            setTimeout(() => {
              listRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
          multiline
          maxLength={1000}
          editable={!isLoading && !primeiroUso && !awaitingUpload}
        />

        {/* Botão à direita: seta normal ou clipe */}
        <Pressable
          style={[
            styles.sendButton,
            ((awaitingUpload && isLoading) ||
              (!awaitingUpload &&
                (!mensagem.trim() || isLoading || primeiroUso))) &&
              styles.sendButtonDisabled,
          ]}
          onPress={awaitingUpload ? handleEnviarDocumento : () => handleEnviar()}
          disabled={
            awaitingUpload ? isLoading : !mensagem.trim() || isLoading || primeiroUso
          }
          hitSlop={10}
        >
          {/* ✅ Ícone fixo, sem loading */}
          {awaitingUpload ? (
            <Icon name="paperclip" size={SCREEN_WIDTH * 0.06} color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: "#fff",
  },
  nome: {
    color: "#fff",
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: "bold",
  },
  status: {
    color: "#d1fae5",
    fontSize: SCREEN_WIDTH * 0.035,
  },

  listContent: {
    padding: SCREEN_WIDTH * 0.04,
    paddingBottom: SCREEN_HEIGHT * 0.18,
  },

  // EMPTY
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
    color: "#2E2E2E",
  },

  // INPUT / DOCUMENTO
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: SCREEN_WIDTH * 0.05,
    paddingTop: SCREEN_HEIGHT * 0.015,
    gap: 8,
    backgroundColor: "#FFFEF6",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    elevation: 10,
    minHeight: SCREEN_HEIGHT * 0.095,
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
    opacity: 0.9,
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
    fontWeight: "bold",
  },
});
