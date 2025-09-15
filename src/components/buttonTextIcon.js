import react from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function CardHome({ title, icon, onPress }) {
    return (
        <TouchableOpacity style={styles.Button} onPress={onPress}>
            <View style={styles.iconContainer}>{icon}</View>
            <Text style={styles.title}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    Button: {
        backgroundColor: "#059669",
        borderRadius: 8,
        borderColor: "#065F46",
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        flex: 1,
        height: 55,
        gap:10,
    },
    title: {
        fontSize: 16,
        fontWeight: "400",
        color: "#fff",
    },
});
