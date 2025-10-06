import react from "react";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import ListParcela from "../components/listParcela";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";


export default function AgendarConsulta() {

    const Parcelas = [
        { id: '1', nomeParcela: 'Parcela 1', quantidadeParcela: '3/4', valorParcela: '150,00' },
        { id: '2', nomeParcela: 'Parcela 2', quantidadeParcela: '2/5', valorParcela: '200,00' },
        { id: '3', nomeParcela: 'Parcela 3', quantidadeParcela: '2/2', valorParcela: '100,00' },
        { id: '4', nomeParcela: 'Parcela 4', quantidadeParcela: '1/3', valorParcela: '250,00' },
        { id: '5', nomeParcela: 'Parcela 5', quantidadeParcela: '4/6', valorParcela: '300,00' },
        { id: '6', nomeParcela: 'Parcela 6', quantidadeParcela: '1/1', valorParcela: '50,00' },
        { id: '7', nomeParcela: 'Parcela 7', quantidadeParcela: '5/5', valorParcela: '400,00' },
    ];

    return (
        <Fundo>
            <View style={styles.container}>
                <TituloIcone
                    titulo="Parcelamento Aberto"
                    icone={require("../images/icones/Wallet_alt_g.png")}
                />
                {Parcelas.map(parcela => (
                    <ListParcela
                        key={parcela.id}
                        nomeParcela={parcela.nomeParcela}
                        quantidadeParcela={parcela.quantidadeParcela}
                        valorParcela={parcela.valorParcela}
                    />
                ))}
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
