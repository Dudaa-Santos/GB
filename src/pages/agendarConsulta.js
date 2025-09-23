import React from "react";
import { View, Text, StyleSheet,  } from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";


export default function AgendarConsulta() {
    return (
        <Fundo>
            <TituloIcone
                titulo="Agendar Consulta"
                icone={require('../images/icones/Calendar_add_g.png')}
            />
        </Fundo>
    );
}

const styles = StyleSheet.create({
    icone: {
        width: 34,
        height: 34,
        resizeMode: "contain"},
    titulo: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#065F46", // evita texto “sumir” em fundo claro
    },
});
