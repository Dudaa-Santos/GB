import React from "react";
import { View, Text, StyleSheet } from "react-native";


function getStatusColor(status) {
    if (!status) return "#6B7280"; 
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes("pendente")) return "#E5C233"; 
    if (statusLower.includes("aprovado")) return "#5C8F0E"; 
    if (statusLower.includes("negado")) return "#DC2626";   
    
    return "#6B7280"; 
}


function getBorderColor(status) {
    return getStatusColor(status);
}

export default function DocumentoCard({ titulo, status, dataEnvio }) {
    const statusColor = getStatusColor(status);
    const borderColor = getBorderColor(status);
    
    return (
        <View style={[styles.card, { borderLeftColor: borderColor }]}>
            <Text style={styles.titulo}>{titulo}</Text>
            <View style={styles.containerInfo}>
                <Text style={[styles.status, { backgroundColor: statusColor }]}>{status}</Text>
                <Text style={styles.dataEnvio}>{dataEnvio}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderLeftWidth: 4,
        borderRadius: 8,
        marginBottom: 12,
        width: "100%",
        alignItems:"stretch",
        backgroundColor: "#F8F7F7",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    titulo: {
        fontSize: 16,
        fontWeight: "bold",
    },
    containerInfo: {
        alignItems: "center",
        justifyContent: "center",
    },
    status: {
        fontSize: 14,
        color: "#F8F7F7",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 100,
        textAlign: "center",
        borderColor: "#0000005f",
        borderWidth: 1.5,
        fontWeight: "500",
        marginBottom: 4,
    },
    dataEnvio: {
        fontSize: 12,
        color: "#2d2d2d",
    },
});