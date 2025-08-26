import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import Input from "../components/input";
import { login } from "../service/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen({ navigation }) {
  const [matricula, setmatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!matricula.trim()) e.matricula = "Informe o código";
    if (!senha.trim()) e.senha = "Informe a senha";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    try {
      if (!validate()) return;
      setLoading(true);

      const data = await login(matricula, senha);

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("id", String(data.id));

      Alert.alert("Sucesso", "Login efetuado!");
      navigation.replace("Home", { id: data.id });
    } catch (err) {
      Alert.alert("Erro", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require("../images/logo_gb.png")}
            style={styles.logo}
          />
          <View style={styles.textBlock}>
            <Text style={styles.ola}>Olá!</Text>
            <Text style={styles.sub}>Bem-vindo(a) à Gestão de Benefícios</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Login</Text>

          <Input
            label="Código"
            placeholder="Digite seu Código"
            value={matricula}
            onChangeText={setmatricula}
            errorText={errors.matricula}
          />

          <Input
            label="Senha"
            placeholder="Digite sua senha"
            secureTextEntry
            showPasswordToggle
            value={senha}
            onChangeText={setSenha}
            errorText={errors.senha}
          />

          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>
              {loading ? "Entrando..." : "Entrar"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const colors = {
  brand: "#0B684F",
  bg: "#FDFBF6",
  textPrimary: "#111827",
  textInverse: "#FFFFFF",
};

const styles = StyleSheet.create({
  scroll: { 
    flexGrow: 1, 
    backgroundColor: colors.brand 
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    backgroundColor: colors.brand,
    alignItems: "center",
  },
  logo: { 
    width: 130, 
    height: 130, 
    objectFit: "contain",
    marginBottom: 16 
  },
  textBlock: { 
    width: "100%", 
    alignItems: "flex-start" 
  },
  ola: {
    color: colors.textInverse,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sub: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: "500",
  },
  card: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "500",
    marginBottom: 24,
    color: colors.textPrimary,
    textAlign: "center",
  },
  button: {
    marginTop: 16,
    backgroundColor: colors.brand,
    borderRadius: 8,
    width: 178,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: { 
    opacity: 0.85 
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: "bold",
  },
});
