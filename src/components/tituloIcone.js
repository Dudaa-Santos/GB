import react from "react";
import {View, Image, Text, StyleSheet} from "react-native";

export default function TituloIcone({titulo, icone}) {
    return (
        <View style={styles.container}>
            <Image source={icone} style={styles.icone} />
            <Text style={styles.titulo}>{titulo}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        flexDirection: "row",
        alignItems: "center",
    },
    icone: {
        width: 34,
        height: 34,
        resizeMode: "contain",
    },
    titulo: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#065F46",
        marginLeft: 8,
    },
});
