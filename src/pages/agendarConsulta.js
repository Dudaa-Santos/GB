import react from "react";

import { View, Text} from "react-native";
import Fundo from "../components/fundo";

export default function AgendarConsulta() {
    return (
        <Fundo>
            <View style={styles.content}>
                <Text style={styles.titulo}>Agendar Consulta</Text>
            </View>
        </Fundo>
    );
}
