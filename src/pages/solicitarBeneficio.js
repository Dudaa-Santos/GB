// src/screens/SolicitarBeneficioScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import Fundo from '../components/fundo';
import TituloIcone from '../components/tituloIcone';
import Select from '../components/select';
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

export default function SolicitarBeneficioScreen({ navigation }) {
  const [colaboradores, setColaboradores] = useState([]);
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [selectedBeneficio, setSelectedBeneficio] = useState(null);
  const [valor, setValor] = useState('');
  const [descontarFolha, setDescontarFolha] = useState('nao');
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [descricao, setDescricao] = useState('');

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const data = await buscarColabPorId();
        const colaboradoresFormatados = data.map(colab => ({
          label: colab.nome,
          value: colab.id,
        }));
        setColaboradores(colaboradoresFormatados);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar a lista de colaboradores.');
      }
    };
    carregarDados();
  }, []);

  const handleSolicitar = () => {
    // ... sua lógica de solicitação ...
    Alert.alert('Sucesso', 'Sua solicitação foi enviada!');
  };

  return (
    <Fundo>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <TituloIcone
          titulo="Solicitar Benefício"
          icone={require("../images/icones/Money_g.png")}
        />

        <View style={styles.formContainer}>
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
          
          {/* ✨ CORREÇÃO AQUI: Lógica e estilo dos Radio Buttons ajustados */}
          <Text style={styles.label}>Descontar em folha?</Text>
          <View style={styles.radioContainer}>
            <Pressable style={styles.radioOption} onPress={() => setDescontarFolha('sim')}>
              <View style={styles.radioCircle}>
                {descontarFolha === 'sim' && <View style={styles.radioInnerCircle} />}
              </View>
              <Text style={styles.radioText}>Sim</Text>
            </Pressable>
            <Pressable style={styles.radioOption} onPress={() => setDescontarFolha('nao')}>
              <View style={styles.radioCircle}>
                {descontarFolha === 'nao' && <View style={styles.radioInnerCircle} />}
              </View>
              <Text style={styles.radioText}>Não</Text>
            </Pressable>
          </View>
          
          {descontarFolha === 'sim' && (
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
            numberOfLines={5}
            value={descricao}
            onChangeText={setDescricao}
          />

          <Pressable style={styles.documentButton} onPress={() => Alert.alert('Aviso', 'Funcionalidade de envio de documento ainda não implementada.')}>
             <Image source={require('../images/icones/Envio_w.png')} style={styles.buttonIcon} />
            <Text style={styles.documentButtonText}>Enviar documento</Text>
          </Pressable>

          <Pressable style={styles.submitButton} onPress={handleSolicitar}>
            <Text style={styles.submitButtonText}>SOLICITAR</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Fundo>
  );
}

const colors = {
  primary: '#0B684F',
  secondary: '#107c5c',
  background: '#FDFBF6',
  textPrimary: '#111827',
  border: '#D1D5DB',
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    height: 120,
    textAlignVertical: 'top',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  // ✨ CORREÇÃO AQUI: Estilos para o radio button
  radioCircle: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerCircle: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  radioText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.textPrimary,
  },
  documentButton: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  documentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
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
  buttonIcon: {
      width: 20,
      height: 20,
      resizeMode: 'contain',
  }
});