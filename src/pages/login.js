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
} from 'react-native';
import Input from '../components/input';
import { login } from '../service/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [matricula, setmatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!matricula.trim()) e.matricula = 'Informe o código';
    if (!senha.trim()) e.senha = 'Informe a senha';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Limpa os erros assim que o usuário começa a digitar
  const handleInputChange = (setter, value) => {
    setter(value);
    setErrors({});
    setLoginError('');
  };

  const handleSubmit = async () => {
    try {
      setLoginError('');
      setErrors({});

      // Cenário 1: Erro de Validação (campos vazios)
      if (!validate()) {
        setLoginError('Preencha todos os campos!');
        return;
      }

      setLoading(true);

      const data = await login(matricula, senha);

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('id', String(data.id));

      Alert.alert('Sucesso', 'Login efetuado!');
      navigation.replace('Home', { id: data.id });
    } catch (err) {
      // Cenário 2: Erro de Autenticação (dados incorretos)
      setLoginError('Código ou senha inválidos.');
      // Define o erro nos campos para que fiquem vermelhos
      setErrors({
        matricula: ' ',
        senha: ' ',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require('../images/logo_gb.png')}
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
            onChangeText={text => handleInputChange(setmatricula, text)}
            errorText={errors.matricula}
          />

          <Input
            label="Senha"
            placeholder="Digite sua senha"
            secureTextEntry
            showPasswordToggle
            value={senha}
            onChangeText={text => handleInputChange(setSenha, text)}
            errorText={errors.senha}
          />

          {loginError ? (
            <Text style={styles.errorText}>{loginError}</Text>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const colors = {
  brand: '#0B684F',
  bg: '#FDFBF6',
  textPrimary: '#111827',
  textInverse: '#FFFFFF',
  error: '#ef4444',
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: colors.brand,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    backgroundColor: colors.brand,
    alignItems: 'center',
  },
  logo: {
    width: 130,
    height: 130,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  textBlock: {
    width: '100%',
    alignItems: 'flex-start',
  },
  ola: {
    color: colors.textInverse,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sub: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    marginBottom: 24,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  button: {
    marginTop: 8,
    backgroundColor: colors.brand,
    borderRadius: 8,
    width: 178,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
});