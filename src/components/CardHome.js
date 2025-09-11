import react from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function CardHome({ title, icon, onPress }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.iconContainer}>{icon}</View>
            <Text style={styles.title}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 8,
        paddingHorizontal: 16,
        justifyContent: "center",
        marginBottom: 12,
        width: 164,
        height: 83,
        elevation: 2,
        borderColor: "#065F46",
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
    },
    iconContainer: {
        marginBottom: 8,
    },
    title: {
        fontSize: 14,
    },
});
