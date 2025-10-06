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
  const [errors, setErrors] = useState({ matricula: false, senha: false });
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validação simples
  const validate = () => {
    const hasMatricula = Boolean(matricula.trim());
    const hasSenha = Boolean(senha.trim());
    setErrors({
      matricula: !hasMatricula,
      senha: !hasSenha,
    });
    return hasMatricula && hasSenha;
  };

  const handleInputChange = (setter, field, value) => {
    setter(value);
    setErrors(prev => ({ ...prev, [field]: false }));
    setLoginError('');
  };

  const handleSubmit = async () => {
    try {
      setLoginError('');

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
      setLoginError('Código ou senha inválidos.');
      // marca campos como "inválidos"
      setErrors({ matricula: true, senha: true });
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
            onChangeText={text =>
              handleInputChange(setmatricula, 'matricula', text)
            }
            errorText={errors.matricula ? ' ' : undefined} // ativa o estilo vermelho sem mostrar texto
          />

          <Input
            label="Senha"
            placeholder="Digite sua senha"
            secureTextEntry
            showPasswordToggle
            value={senha}
            onChangeText={text =>
              handleInputChange(setSenha, 'senha', text)
            }
            errorText={errors.senha ? ' ' : undefined}
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
    paddingTop: 70,
    paddingHorizontal: 24,
    backgroundColor: colors.brand,
    alignItems: 'center',
    paddingBottom: 24,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginTop: 20,
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
    marginTop: 120,
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
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center'
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
