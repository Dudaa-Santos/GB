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
import { useNavigation } from '@react-navigation/native';

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
  const navigation = useNavigation();
  
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
        setSelectedColaborador(null); // inicia sem seleção

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

      if (res.canceled || res.cancelled) {
        return;
      }

      // Diferentes estruturas dependendo da versão do expo-document-picker
      let file = null;
      
      if (res.assets && res.assets.length > 0) {
        file = res.assets[0];
      } else if (res.uri) {
        // Versão mais antiga do expo-document-picker
        file = {
          uri: res.uri,
          name: res.name,
          size: res.size,
          mimeType: res.mimeType || res.type
        };
      }

      if (!file || !file.uri) {
        Alert.alert('Erro', 'Arquivo inválido');
        return;
      }

      // Validações de tamanho
      if (typeof file.size === 'number' && file.size > MAX_FILE_SIZE) {
        return Alert.alert('Arquivo muito grande', 'Envie um arquivo de até 10 MB.');
      }

      // Determinar MIME type
      let mimeType = file.mimeType || file.type;
      
      // Se não tem MIME type, tenta adivinhar pela extensão
      if (!mimeType && file.name) {
        const ext = file.name.toLowerCase().split('.').pop();
        const mimeMap = {
          'pdf': 'application/pdf',
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'gif': 'image/gif',
          'bmp': 'image/bmp',
          'webp': 'image/webp'
        };
        mimeType = mimeMap[ext] || 'application/octet-stream';
      }

      // Validar MIME type
      if (mimeType && !ACCEPTED_MIME.includes(mimeType) && !mimeType.startsWith('image/')) {
        return Alert.alert('Tipo não permitido', 'Envie PDF, JPG ou PNG.');
      }

      // Gerar nome se não existir
      let fileName = file.name || file.filename;
      if (!fileName) {
        const timestamp = Date.now();
        const ext = mimeType === 'application/pdf' ? 'pdf' : 
                   mimeType.startsWith('image/') ? 'jpg' : 'file';
        fileName = `documento_${timestamp}.${ext}`;
      }

      // Tratamento especial para web
      let processedFile = {
        uri: file.uri,
        name: fileName,
        type: mimeType || 'application/octet-stream',
        size: file.size ?? null,
      };

      // Na web, às vezes precisa de tratamento especial da URI
      if (Platform.OS === 'web' && file.file) {
        processedFile.file = file.file;
      }

      setDocumento(processedFile);
      Alert.alert('Documento selecionado', `${processedFile.name} selecionado com sucesso!`);

    } catch (e) {
      Alert.alert('Erro', `Não foi possível selecionar o documento: ${e.message}`);
    }
  };

  const handleRemoverDocumento = () => {
    setDocumento(null);
  };

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

    // Validar arquivo antes do envio
    if (!documento.uri && !documento.file) {
      return Alert.alert('Erro', 'Arquivo inválido. Selecione novamente.');
    }

    // ===== montar payload =====
    const isDep = selectedColaborador?.startsWith('DEP_');
    const idDependente = isDep ? selectedColaborador.replace('DEP_', '') : null;

    const valorTotal = Number(
      String(valor).replace(/\./g, '').replace(',', '.')
    );

    const payload = {
      idColaborador: titularId,
      idBeneficio: selectedBeneficio,
      valorTotal,
      descricao,
      qtdeParcelas: tipo === 'Sim' ? Number(selectedParcela) : 1,
      tipoPagamento: paymentMap[tipo],
      ...(idDependente ? { idDependente } : {}),
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

      // 2) Preparar arquivo para upload
      const fileToSend = {
        uri: documento.uri,
        name: documento.name,
        type: documento.type,
      };

      // Se tem o objeto file (web), inclui também
      if (documento.file) {
        fileToSend.file = documento.file;
      }

      // 3) Upload do documento
      const uploadParams = {
        solicitacaoId,
        colaboradorId: titularId,
        file: fileToSend,
      };

      await uploadDoc(uploadParams, token);

      Alert.alert(
        'Sucesso', 
        'Solicitação criada e documento enviado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset do formulário
              setSelectedColaborador(null);
              setSelectedBeneficio(null);
              setValor('');
              setTipo('');
              setSelectedParcela(null);
              setDescricao('');
              setDocumento(null);
              
              // Volta para a Home
              navigation.navigate('Home');
            }
          }
        ]
      );

    } catch (err) {
      let errorMessage = 'Falha ao enviar a solicitação.';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Fundo scrollable={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#047857" />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </Fundo>
    );
  }

  if (errorLoad) {
    return (
      <Fundo scrollable={false}>
        <View style={styles.center}>
          <Text style={styles.errorOnlyText}>{errorLoad}</Text>
        </View>
      </Fundo>
    );
  }

  return (
    <Fundo>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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

        <Text style={styles.label}>Descontar em Folha?</Text>
        <RadioGroup
          value={tipo}
          onChange={setTipo}
          options={[
            { label: 'Sim', value: 'Sim' },
            { label: 'Não', value: 'Não' },
            { label: 'Doação', value: 'Doação' },
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
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                📎 {documento.name}
              </Text>
              {typeof documento.size === 'number' && (
                <Text style={styles.fileSize}>
                  {(documento.size / (1024 * 1024)).toFixed(2)} MB
                </Text>
              )}
              <Text style={styles.fileDebug}>
                URI: {documento.uri ? 'OK' : 'MISSING'} | Type: {documento.type || 'N/A'}
              </Text>
            </View>
            <Pressable onPress={handleRemoverDocumento} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>✕</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <SubmitButton 
            title={submitting ? "ENVIANDO..." : "SOLICITAR"} 
            onPress={handleSolicitar}
            disabled={submitting}
          />
        </View>
      </ScrollView>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 8,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#065F46',
  },
  fileInfo: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  fileDebug: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E11D48',
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
  },
});