import react from "react";

import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function IconButton({ icon, onPress }) {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <View style={styles.iconContainer}>{icon}</View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: "#059669",
        borderRadius: 8,
        borderColor: "#065F46",
        borderWidth: 1,
        padding: 16,
        justifyContent: "center",
        marginBottom: 12,
        flexDirection: "row",
        width: 78,
        height: 55,
        gap: 10,
    },
});
