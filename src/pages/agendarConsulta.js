import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import RadioGroup from "../components/radioGroup"; // garanta o mesmo nome/caso do arquivo

export default function AgendarConsulta() {
  const [tipo, setTipo] = useState("colaborador");

  return (
    <Fundo>
      <View style={styles.container}>
        <TituloIcone
          titulo="Agendar Consulta"
          icone={require("../images/icones/Calendar_add_g.png")}
        />

        <Text style={styles.label}>Quem irá se consultar</Text>

        <RadioGroup
          value={tipo}
          onChange={setTipo}
          options={[
            { label: "Colaborador", value: "colaborador" },
            { label: "Dependente", value: "dependente" },
          ]}
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
  label: {
    fontSize: 20,
    marginTop: 10,
    marginBottom: 8,
  },
});
