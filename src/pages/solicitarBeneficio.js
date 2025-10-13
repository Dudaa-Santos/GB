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
import { buscarColabPorId, buscarBeneficios, criarSolicitacao, uploadDoc } from '../service/authService';
import Input from '../components/input';
import SubmitButton from '../components/submitButton';

const parcelasMock = [
  { label: '1x', value: 1 }, { label: '2x', value: 2 }, { label: '3x', value: 3 },
  { label: '4x', value: 4 }, { label: '5x', value: 5 }, { label: '6x', value: 6 },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

const paymentMap = {
  'Sim': 'DESCONTADO_FOLHA',
  'Não': 'PAGAMENTO_PROPRIO',
  'Doação': 'DOACAO',
};

export default function SolicitarBeneficio() {
  const [colaboradores, setColaboradores] = useState([]);
  const [selectedColaborador, setSelectedColaborador] = useState(null);

  const [beneficios, setBeneficios] = useState([]);
  const [selectedBeneficio, setSelectedBeneficio] = useState(null);

  const [valor, setValor] = useState('');
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [descricao, setDescricao] = useState('');
  const [descricaoFocused, setDescricaoFocused] = useState(false);

  const [tipo, setTipo] = useState(''); // 'Sim' | 'Não' | 'Doação'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorLoad, setErrorLoad] = useState(null);
  const [documento, setDocumento] = useState(null);

  const [titularId, setTitularId] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErrorLoad(null);

        const id = await AsyncStorage.getItem('id');
        const tk = await AsyncStorage.getItem('token');
        setToken(tk);

        if (!id || !tk) {
          setErrorLoad('Sessão inválida. Faça login novamente.');
          return;
        }

        // 1) Buscar titular e dependentes
        const resp = await buscarColabPorId(id, tk);
        const colab = resp?.data ?? resp ?? null;

        if (!colab?.id) {
          setErrorLoad('Não foi possível carregar colaborador.');
          return;
        }

        setTitularId(colab.id);

        const titularLabel = colab.nome || colab.nomeCompleto || 'Colaborador';
        const lista = [
          { label: `${titularLabel} (Titular)`, value: `COLAB_${colab.id}` },
          ...(Array.isArray(colab.dependentes) ? colab.dependentes : []).map((dep) => ({
            label: dep.nome,
            value: `DEP_${dep.id}`,
          })),
        ];

        setColaboradores(lista);
        setSelectedColaborador(null);

        // 2) Buscar benefícios
        const bResp = await buscarBeneficios(tk);
        const raw = bResp?.data ?? bResp ?? [];
        const listBenef = (Array.isArray(raw) ? raw : []).map((b) => ({
          label: b.nome || b.titulo || b.descricao || 'Benefício',
          value: b.id,
        }));
        setBeneficios(listBenef);
      } catch (e) {
        setErrorLoad('Falha ao carregar dados iniciais.');
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

  const handleSolicitar = async () => {
    if (submitting) return;

    // ===== validações obrigatórias =====
    if (!selectedColaborador) return Alert.alert('Atenção', 'Selecione para quem será o benefício.');
    if (!selectedBeneficio)   return Alert.alert('Atenção', 'Selecione um benefício.');
    if (!valor)               return Alert.alert('Atenção', 'Informe o valor.');
    if (!tipo)                return Alert.alert('Atenção', 'Selecione o tipo de pagamento.');
    if (tipo === 'Sim' && !selectedParcela) {
      return Alert.alert('Atenção', 'Selecione a quantidade de parcelas.');
    }
    if (!descricao.trim())    return Alert.alert('Atenção', 'Informe a descrição.');
    if (!documento)           return Alert.alert('Documento obrigatório', 'Envie o documento para continuar.');
    if (!titularId)           return Alert.alert('Erro', 'Não foi possível identificar o titular.');
    if (!token)               return Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');

    // ===== montar payload =====
    const isDep = selectedColaborador?.startsWith('DEP_');
    const idDependente = isDep ? selectedColaborador.replace('DEP_', '') : null;

    const valorTotal = Number(
      String(valor).replace(/\./g, '').replace(',', '.')
    );

    const payload = {
      idColaborador: titularId,                       // sempre envia o titular
      idBeneficio: selectedBeneficio,
      valorTotal,
      descricao,
      qtdeParcelas: tipo === 'Sim' ? Number(selectedParcela) : 1, // 1 por padrão
      tipoPagamento: paymentMap[tipo],                // Sim/Não/Doação -> enum da API
      ...(idDependente ? { idDependente } : {}),      // envia se for dependente
    };

    try {
      setSubmitting(true);

      // 1) Criar solicitação
      const created = await criarSolicitacao(payload, token);
      const solicitacaoId =
        created?.id || created?.solicitacaoId || created?.data?.id;

      if (!solicitacaoId) {
        throw new Error('ID da solicitação não retornado pela API');
      }

      // 2) Upload do documento (obrigatório)
      const fileToSend = {
        uri: documento.uri,
        name: documento.name,
        type: documento.type,
      };

      await uploadDoc(solicitacaoId, titularId, fileToSend, token);

      Alert.alert('Sucesso', 'Solicitação criada e documento enviado!');
      // Reset
      setSelectedBeneficio(null);
      setValor('');
      setTipo('');
      setSelectedParcela(null);
      setDescricao('');
      setDocumento(null);
    } catch (err) {
      console.error('Erro ao solicitar benefício:', err);
      Alert.alert('Erro', err?.message || 'Falha ao enviar a solicitação.');
    } finally {
      setSubmitting(false);
    }
  };

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
          data={beneficios}
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

        <Text style={styles.label}>Tipo de pagamento</Text>
        <RadioGroup
          value={tipo}
          onChange={setTipo}
          options={[
            { label: 'Sim', value: 'Sim' },       // DESCONTADO_FOLHA
            { label: 'Não', value: 'Não' },       // PAGAMENTO_PROPRIO
            { label: 'Doação', value: 'Doação' }, // DOACAO
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
            <Text style={styles.uploadText}>
              {documento ? 'Trocar documento' : 'Enviar documento'}
            </Text>
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

        <SubmitButton title={submitting ? "ENVIANDO..." : "SOLICITAR"} onPress={handleSolicitar} />
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
