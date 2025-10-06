import react from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import Fundo from "../components/fundo";
import CardStatus from "../components/cardStatus";
import TituloIcone from "../components/tituloIcone";

export default function DocumentosEnviados() {
    return (
        <Fundo>
            <View style={styles.content}>
                <ScrollView>
                    <View style={{ marginBottom: 16 }}>
                        <TituloIcone
                            titulo="Documentos Enviados"
                            icone={require("../images/icones/Folder_check_g.png")}
                        />
                    </View>

                    <CardStatus
                        tipo="documento"
                        titulo="Documento 1"
                        status="Pendente"
                        dataEnvio="01/01/2023"
                    />
                    <CardStatus
                        tipo="documento"
                        titulo="Documento 2"
                        status="Aprovado"
                        dataEnvio="02/01/2023"
                    />
                    <CardStatus
                        tipo="documento"
                        titulo="Documento 3"
                        status="Negado"
                        dataEnvio="03/01/2023"
                    />
                </ScrollView>
            </View>
        </Fundo>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    titulo: {
        fontSize: 24,
        fontWeight: "bold",
    },
    subtitulo: {
        fontSize: 16,
        color: "#666",
    },
    statusBox: {
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        backgroundColor: "#f0f0f0",
    },
});