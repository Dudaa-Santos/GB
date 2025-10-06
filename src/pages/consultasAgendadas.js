import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import CardConsultasAgendadas from "../components/cardConsultasAgendadas";

export default function ConsultasAgendadas() {
  const consultas = [
    { id: 1, nome: "João da Silva", dataHora: "10/10/2025 • 14:30", medico: "Dra. Ana Paula" },
    { id: 2, nome: "Maria Oliveira", dataHora: "12/10/2025 • 09:00", medico: "Dr. Ricardo Lima" },
    { id: 3, nome: "Carlos Pereira", dataHora: "15/10/2025 • 11:15", medico: "Dra. Juliana Torres" },
  ];

  return (
    <Fundo>
      <View style={styles.container}>
        <TituloIcone
          titulo="Consultas Agendadas"
          icone={require("../images/icones/Calendar_add_g.png")}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {consultas.map((c) => (
            <CardConsultasAgendadas
              key={c.id}
              nome={c.nome}
              dataHora={c.dataHora}
              medico={c.medico}
              onEdit={() => console.log("Editar", c.id)}
              onDelete={() => console.log("Excluir", c.id)}
            />
          ))}
        </ScrollView>
      </View>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
  },
  cardsContainer: {
    marginTop: 24, 
    paddingBottom: 12,
    paddingHorizontal: 0,
  },
});
