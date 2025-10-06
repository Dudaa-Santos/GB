import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';

import Fundo from '../components/fundo';
import TituloIcone from '../components/tituloIcone';
import Select from '../components/select';
import RadioGroup from '../components/radioGroup';
import { buscarColabPorId } from '../service/authService';
import Input from '../components/input';
import SubmitButton from '../components/submitButton';

const beneficiosMock = [
  { label: 'Plano de Saúde', value: 'plano_saude' },
  { label: 'Vale Alimentação', value: 'vale_alimentacao' },
  { label: 'Auxílio Creche', value: 'auxilio_creche' },
];

const parcelasMock = [
  { label: '1x', value: 1 }, { label: '2x', value: 2 }, { label: '3x', value: 3 },
  { label: '4x', value: 4 }, { label: '5x', value: 5 }, { label: '6x', value: 6 },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

export default function SolicitarBeneficio({ navigation }) {
  const [colaboradores, setColaboradores] = useState([]);
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [selectedBeneficio, setSelectedBeneficio] = useState(null);
  const [valor, setValor] = useState('');
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [descricao, setDescricao] = useState('');
  const [descricaoFocused, setDescricaoFocused] = useState(false);
  const [tipo, setTipo] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorLoad, setErrorLoad] = useState(null);
  const [documento, setDocumento] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErrorLoad(null);

        const id = await AsyncStorage.getItem('id');
        const token = await AsyncStorage.getItem('token');

        if (!id || !token) {
          setErrorLoad('Sessão inválida. Faça login novamente.');
          return;
        }

        const resp = await buscarColabPorId(id, token);
        const colab = resp?.data ?? resp ?? null;

        if (!colab) {
          setErrorLoad('Não foi possível carregar colaborador.');
          return;
        }

        const titularLabel = colab.nome || colab.nomeCompleto || 'Colaborador';
        const lista = [
          { label: `${titularLabel} (Titular)`, value: `COLAB_${colab.id}` },
          ...(Array.isArray(colab.dependentes) ? colab.dependentes : []).map((dep) => ({
            label: dep.nome,
            value: `DEP_${dep.id}`,
          })),
        ];

        setColaboradores(lista);
        if (lista.length > 0) setSelectedColaborador(lista[0].value);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleEnviarDocumento = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (res.canceled) return;

      const file = res.assets?.[0];
      if (!file) return;

      const guessedType =
        file.mimeType ||
        (file.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf'
          : file.name?.toLowerCase().endsWith('.png') ? 'image/png'
          : file.name?.toLowerCase().endsWith('.jpg') || file.name?.toLowerCase().endsWith('.jpeg') ? 'image/jpeg'
          : undefined);

      if (typeof file.size === 'number' && file.size > MAX_FILE_SIZE) {
        return Alert.alert('Arquivo muito grande', 'Envie um arquivo de até 10 MB.');
      }

      if (guessedType && !ACCEPTED_MIME.includes(guessedType)) {
        return Alert.alert('Tipo não permitido', 'Envie PDF, JPG ou PNG.');
      }

      const picked = {
        uri: file.uri,
        name: file.name || `documento${Platform.OS === 'ios' ? '' : ''}`,
        type: guessedType || 'application/octet-stream',
        size: file.size ?? null,
      };

      setDocumento(picked);
      Alert.alert('Documento selecionado', picked.name);
    } catch (e) {
      console.log('Erro ao selecionar documento:', e);
      Alert.alert('Erro', 'Não foi possível selecionar o documento.');
    }
  };

  const handleRemoverDocumento = () => setDocumento(null);

  const handleSolicitar = () => {
    if (!selectedColaborador) return Alert.alert('Atenção', 'Selecione para quem será o benefício.');
    if (!selectedBeneficio) return Alert.alert('Atenção', 'Selecione um benefício.');
    if (!valor) return Alert.alert('Atenção', 'Informe o valor.');

    const payload = {
      para: selectedColaborador,
      beneficio: selectedBeneficio,
      valor: Number(valor.replace(',', '.')),
      descontarEmFolha: tipo === 'Sim',
      parcelas: tipo === 'Sim' ? selectedParcela : null,
      descricao,
      documento: documento
        ? { uri: documento.uri, name: documento.name, type: documento.type, size: documento.size }
        : null,
    };

    console.log('Payload solicitação:', payload);
    Alert.alert('Sucesso', 'Sua solicitação foi enviada!');
  };

  /* ======== RENDER NO MESMO PADRÃO DE AgendarConsulta ======== */
  if (loading) {
    return (
      <Fundo>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#047857" />
        </View>
      </Fundo>
    );
  }

  if (errorLoad) {
    return (
      <Fundo>
        <View style={styles.center}>
          <Text style={styles.errorOnlyText}>{errorLoad}</Text>
        </View>
      </Fundo>
    );
  }

  return (
    <Fundo>
      <ScrollView contentContainerStyle={styles.container}>
        <TituloIcone
          titulo="Solicitar Benefício"
          icone={require("../images/icones/Money_g.png")}
        />

        <Text style={styles.label}>Selecione para quem será o benefício</Text>
        <Select
          placeholder="Selecione para quem será"
          data={colaboradores}
          selectedValue={selectedColaborador}
          onValueChange={setSelectedColaborador}
        />

        <Text style={styles.label}>Selecione o benefício</Text>
        <Select
          placeholder="Selecione o benefício"
          data={beneficiosMock}
          selectedValue={selectedBeneficio}
          onValueChange={setSelectedBeneficio}
        />

        <Text style={styles.label}>Valor</Text>
        <Input
          placeholder="Digite o valor"
          keyboardType="numeric"
          value={valor}
          onChangeText={setValor}
        />

        <Text style={styles.label}>Descontar em folha?</Text>
        <RadioGroup
          value={tipo}
          onChange={setTipo}
          options={[
            { label: 'Sim', value: 'Sim' },
            { label: 'Não', value: 'Não' },
          ]}
        />

        {tipo === 'Sim' && (
          <>
            <Text style={styles.label}>Parcela</Text>
            <Select
              placeholder="Selecione a quantidade de parcela"
              data={parcelasMock}
              selectedValue={selectedParcela}
              onValueChange={setSelectedParcela}
            />
          </>
        )}

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[
            styles.textArea,
            descricaoFocused && styles.textAreaFocused,
          ]}
          placeholder="Digite aqui a descrição"
          multiline
          value={descricao}
          onChangeText={setDescricao}
          textAlignVertical="top"
          onFocus={() => setDescricaoFocused(true)}
          onBlur={() => setDescricaoFocused(false)}
          autoCapitalize="sentences"
        />

        <Pressable style={styles.uploadButton} onPress={handleEnviarDocumento}>
          <View style={styles.uploadContent}>
            <Image
              source={require('../images/icones/Envio_w.png')}
              style={styles.uploadIcon}
              resizeMode="contain"
            />
            <Text style={styles.uploadText}>Enviar documento</Text>
          </View>
        </Pressable>

        {documento && (
          <View style={styles.fileRow}>
            <Text style={styles.fileName} numberOfLines={1}>
              {documento.name} {typeof documento.size === 'number' ? `• ${(documento.size / (1024 * 1024)).toFixed(2)} MB` : ''}
            </Text>
            <Pressable onPress={handleRemoverDocumento} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>Remover</Text>
            </Pressable>
          </View>
        )}

        <SubmitButton title="SOLICITAR" onPress={handleSolicitar} />
      </ScrollView>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorOnlyText: {
    fontSize: 16,
    color: '#B91C1C',
    textAlign: 'center',
    lineHeight: 22,
  },
  label: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 6,
    color: "#000000",
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  /* ========= TextArea com a mesma “cara” do Input ========= */
  textArea: {
    borderWidth: 1.2,
    borderColor: '#3A3A3A',
    borderRadius: 4,
    width: '100%',
    minHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    color: '#121212',
  },
  textAreaFocused: {
    borderColor: '#047857',
  },
  /* ===== Botão "Enviar documento" ===== */
  uploadButton: {
    backgroundColor: '#076580',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  uploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadIcon: {
    width: 30,
    height: 30,
    marginRight: 8,
  },
  uploadText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  /* Chip arquivo selecionado */
  fileRow: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    marginRight: 8,
  },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E11D48',
  },
  removeBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});
