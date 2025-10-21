import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Image, StatusBar, Pressable, TextInput,
  Keyboard, Platform, ScrollView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Chat() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [mensagem, setMensagem] = useState("");
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    const show = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(show, (e) => {
      setKbHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hide, () => setKbHeight(0));

    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const handleEnviar = () => {
    if (!mensagem.trim()) return;
    console.log("Enviando mensagem:", mensagem);
    setMensagem("");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#065F46" />
      <View style={{ height: (StatusBar.currentHeight || insets.top), backgroundColor: "#065F46" }} />

      {/* HEADER */}
      <View style={styles.headerChat}>
        <Pressable onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        <Image source={require("../images/oirem.jpg")} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.nome}>Oirem ture a mai</Text>
          <Text style={styles.status}>Online - Sempre disponível</Text>
        </View>
      </View>

      {/* LISTA / CONTEÚDO */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 90 + insets.bottom }} // espaço p/ não ficar atrás do input
        keyboardShouldPersistTaps="handled"
      />

      {/* INPUT RENTE AO TECLADO */}
      <View
        style={[
          styles.inputContainer,
          {
            position: "absolute",
            left: 0,
            right: 0,
            // quando teclado abre: cola exatamente na borda superior dele; quando fecha: encosta na safe area
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
        />
        <Pressable
          style={[styles.sendButton, !mensagem.trim() && styles.sendButtonDisabled]}
          onPress={handleEnviar}
          disabled={!mensagem.trim()}
        >
          <Text style={styles.sendButtonText}>➤</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#065F46",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButtonText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  avatar: { width: 45, height: 45, borderRadius: 100, resizeMode: "cover" },
  nome: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  status: { color: "#d1fae5", fontSize: 14 },

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
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#065F46", alignItems: "center", justifyContent: "center",
  },
  sendButtonDisabled: { backgroundColor: "#D1D5DB" },
  sendButtonText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
});
