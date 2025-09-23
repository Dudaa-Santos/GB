import react from "react";

import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Fundo from "../components/fundo";

export function AgendarConsulta() {
    return (
        <Fundo>
            <View style={styles.content}>
                <Text style={styles.titulo}>Agendar Consulta</Text>
            </View>
        </Fundo>
    );
}
