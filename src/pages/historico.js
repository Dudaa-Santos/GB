import react, {useState} from "react";
import { View, Text, StyleSheet } from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import TabSwitch from "../components/tabSwitch";
import CardStatus from "../components/cardStatus";
import { useNavigation } from "@react-navigation/native";
import { buscarSolicitacoes } from "../service/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Historico() {
    const [selectedTab, setSelectedTab] = useState("historicoConsulta");

    const navigation = useNavigation();
    const [solicitacoes, setSolicitacoes] = useState([]);

    const fetchSolicitacoes = async () => {
        try {
            const token = "seu_token_aqui"; // Substitua pelo token real
            const data = await buscarSolicitacoes(token);
            setSolicitacoes(data);
        } catch (error) {
            console.error("Erro ao buscar solicitações:", error);
        }
    };

    // Dados simulados

    const beneficios = [
        { id: '1', nomeBeneficio: 'Benefício 1', statusBeneficio: 'Aprovado', dataEnvio: '15/08/2023' },
        { id: '2', nomeBeneficio: 'Benefício 2', statusBeneficio: 'Pendente', dataEnvio: '20/08/2023' },
        { id: '3', nomeBeneficio: 'Benefício 3', statusBeneficio: 'Aprovado', dataEnvio: '25/08/2023' },
        { id: '4', nomeBeneficio: 'Benefício 4', statusBeneficio: 'Negado', dataEnvio: '30/08/2023' },
        { id: '5', nomeBeneficio: 'Benefício 5', statusBeneficio: 'Aprovado', dataEnvio: '05/09/2023' },
        { id: '6', nomeBeneficio: 'Benefício 6', statusBeneficio: 'Pendente', dataEnvio: '10/09/2023' },
        { id: '7', nomeBeneficio: 'Benefício 7', statusBeneficio: 'Aprovado', dataEnvio: '15/09/2023' },
        { id: '8', nomeBeneficio: 'Benefício 8', statusBeneficio: 'Negado', dataEnvio: '20/09/2023' },
        { id: '9', nomeBeneficio: 'Benefício 9', statusBeneficio: 'Aprovado', dataEnvio: '25/09/2023' },
        { id: '10', nomeBeneficio: 'Benefício 10', statusBeneficio: 'Pendente', dataEnvio: '30/09/2023' },
    ];

    const consultas = [
        { id: '1', paciente: 'João Silva', especialidade: 'Cardiologia', dataConsulta: '10/08/2023', statusConsulta: 'Realizada' },
        { id: '2', paciente: 'Maria Oliveira', especialidade: 'Dermatologia', dataConsulta: '15/08/2023', statusConsulta: 'Cancelada' },
        { id: '3', paciente: 'Carlos Souza', especialidade: 'Ortopedia', dataConsulta: '20/08/2023', statusConsulta: 'Realizada' },
    ];

    return (
        <Fundo>
            <View style={styles.container}>
                <TituloIcone
                    titulo="Histórico"
                    icone={require("../images/icones/history_g.png")}
                />
                <TabSwitch
                    options={[
                        { label: "Consulta", value: "historicoConsulta" },
                        { label: "Benefícios", value: "historicoBeneficios" },
                    ]}
                    selected={selectedTab}
                    onSelect={setSelectedTab}
                />

                {selectedTab === "historicoConsulta" ? (
                    <View>
                        {consultas.map((consulta) => (
                            <CardStatus
                                key={consulta.id}
                                tipo="consulta"
                                titulo={consulta.paciente}
                                status={consulta.statusConsulta}
                                dataEnvio={consulta.dataConsulta}
                            />
                        ))}
                    </View>
) : (
                    <View>
                        {beneficios.map((beneficio) => (
                            <CardStatus
                                key={beneficio.id}
                                tipo="beneficio"
                                titulo={beneficio.nomeBeneficio}
                                status={beneficio.statusBeneficio}
                                dataEnvio={beneficio.dataEnvio}
                                // navigateTo="DetalheBeneficio"
                                onPress={() => console.log(`Clicou no ${beneficio.nomeBeneficio}`)}
                            />
                        ))}
                    </View>
                )}

            </View>
        </Fundo>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
});