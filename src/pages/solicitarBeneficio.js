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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Fundo from '../components/fundo';
import TituloIcone from '../components/tituloIcone';
import Select from '../components/select';
import RadioGroup from '../components/radioGroup';
import { buscarColabPorId } from '../service/authService';

const beneficiosMock = [
  { label: 'Plano de Saúde', value: 'plano_saude' },
  { label: 'Vale Alimentação', value: 'vale_alimentacao' },
  { label: 'Auxílio Creche', value: 'auxilio_creche' },
];

const parcelasMock = [
  { label: '1x', value: 1 }, { label: '2x', value: 2 }, { label: '3x', value: 3 },
  { label: '4x', value: 4 }, { label: '5x', value: 5 }, { label: '6x', value: 6 },
];

export default function SolicitarBeneficio({ navigation }) {
  const [colaboradores, setColaboradores] = useState([]);
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [selectedBeneficio, setSelectedBeneficio] = useState(null);
  const [valor, setValor] = useState('');
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorLoad, setErrorLoad] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErrorLoad(null);

        const id = await AsyncStorage.getItem('id');
        const token = await AsyncStorage.getItem('token');

        if (!id || !token) {
          setErrorLoad('Sessão inválida. Faça login novamente.');
          setLoading(false);
          return;
        }

        const resp = await buscarColabPorId(id, token);
        const colab = resp?.data ?? resp ?? null;

        if (!colab) {
          setErrorLoad('Não foi possível carregar colaborador.');
          setLoading(false);
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
        console.log('Erro ao buscar colaborador:', e);
        setErrorLoad('Erro ao buscar colaborador.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    };

    console.log('Payload solicitação:', payload);
    Alert.alert('Sucesso', 'Sua solicitação foi enviada!');
  };

  return (
    <Fundo>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Botão voltar */}
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </Pressable>

        <TituloIcone
          titulo="Solicitar Benefício"
          icone={require("../images/icones/Money_g.png")}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#047857" />
        ) : errorLoad ? (
          <Text style={{ color: '#B91C1C', textAlign: 'center' }}>{errorLoad}</Text>
        ) : (
          <>
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
            <TextInput
              style={styles.input}
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
              style={styles.textArea}
              placeholder="Digite aqui a descrição"
              multiline
              value={descricao}
              onChangeText={setDescricao}
            />

            <Pressable style={styles.submitButton} onPress={handleSolicitar}>
              <Text style={styles.submitButtonText}>SOLICITAR</Text>
            </Pressable>
          </>
        )}
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
  backButtonText: {
    fontSize: 16,
    color: '#047857',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#0B684F',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
