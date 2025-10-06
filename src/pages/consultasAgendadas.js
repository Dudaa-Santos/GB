import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";

export default function ConsultasAgendadas() {
  return (
    <Fundo>
      <View style={styles.container}>
        <TituloIcone
          titulo="Consultas Agendadas"
          icone={require("../images/icones/Calendar_add_g.png")}
        />

        <Text style={styles.texto}>
          Nenhuma consulta agendada no momento.
        </Text>
      </View>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 24,
  },
  texto: {
    fontSize: 16,
    color: "#444",
    marginTop: 24,
    textAlign: "center",
  },
});
