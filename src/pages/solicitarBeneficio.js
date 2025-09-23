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

const radioOptions = [
  { label: 'Sim', value: 'sim' },
  { label: 'Não', value: 'nao' },
];

export default function SolicitarBeneficio({ navigation }) {
  const [colaboradores, setColaboradores] = useState([]);
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [selectedBeneficio, setSelectedBeneficio] = useState(null);
  const [valor, setValor] = useState('');
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const id = await AsyncStorage.getItem("id");

        if (id && token) {
          const data = await buscarColabPorId(id);
          console.log("Dados do colaborador:", data);
          setColaborador(data);
        }
      } catch (error) {
        console.log("Erro ao buscar colaborador:", error);
      }
    };
    fetchUser();
  }, []);

  const handleDescontarChange = (value) => {
    setDescontarFolha(value);
    if (value === 'nao') {
      setSelectedParcela(null); // Limpa a parcela se escolher 'Não'
    }
  };

  const handleSolicitar = () => {
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
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={valor}
            onChangeText={setValor}
          />
          
          <Text style={styles.label}>Descontar em folha?</Text>

          <RadioGroup
            value={tipo}
            onChange={setTipo}
            options={[
            { label: "Sim", value: "Sim" },
            { label: "Não", value: "Não" },
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
            placeholderTextColor="#9CA3AF"
            multiline
            value={descricao}
            onChangeText={setDescricao}
          />

          <Pressable style={styles.documentButton}>
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
  secondary: '#049669',
  background: '#FDFBF6',
  textPrimary: '#374151',
  textInput: '#1F2937',
  border: '#E5E7EB',
  placeholder: '#9CA3AF',
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: colors.background,
    marginHorizontal: 20,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: colors.textInput,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textInput,
    height: 120,
    textAlignVertical: 'top',
  },
  documentButton: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  documentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: colors.primary,
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
  buttonIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
});