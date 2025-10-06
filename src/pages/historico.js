import react from "react";
import { View, Text, StyleSheet } from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";

export default function Historico() {
    return (
        <Fundo>
            <View style={styles.container}>
                <TituloIcone
                    titulo="Histórico"
                    icone={require("../images/icones/history_g.png")}
                />
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