import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

function getStatusColor(status) {
    if (!status) return "#6B7280";

    const statusLower = status.toLowerCase();

    if (statusLower.includes("pendente")) return "#F59E0B";
    if (statusLower.includes("pend. assinar")) return "#315fd3ff";
    if (statusLower.includes("aprovado") || statusLower.includes("APROVADO")) return "#065F46";
    if (statusLower.includes("negado")) return "#DC2626";
    if (statusLower.includes("agendado")) return "#315fd3ff";
    if (statusLower.includes("agendada")) return "#315fd3ff";
    
    if (statusLower.includes("cancelada")) return "#DC2626";
    if (statusLower.includes("recusada")) return "#DC2626";
    if (statusLower.includes("faltou")) return "#F59E0B";
    return "#065F46";
}

function getBorderColor(status) {
    return getStatusColor(status);
}

export default function CardStatus({ 
    titulo, 
    status, 
    dataEnvio, 
    tipo = "documento", // "documento", "beneficio", "consulta"
    paciente = null, // Para consultas
    medico = null, // Para consultas - pode ser string ou objeto
    tipoPaciente = null, // Para consultas
    navigateTo = null, // Rota para navegação (benefícios)
    onPress = null // Callback personalizado
}) {
    const navigation = useNavigation();
    const statusColor = getStatusColor(status);
    const borderColor = getBorderColor(status);

    // Extrai o nome do médico se for objeto
    const getMedicoNome = () => {
        if (!medico) return null;
        if (typeof medico === 'string') return medico;
        if (medico.nome) return medico.nome;
        return null;
    };

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else if (navigateTo) {
            navigation.navigate(navigateTo);
        }
    };

    const renderContent = () => {
        const medicoNome = getMedicoNome();

        return (
            <View style={[styles.card, { borderLeftColor: borderColor }]}>
                <View style={styles.leftSection}>
                    <Text style={styles.titulo}>{titulo}</Text>
                    
                    {/* Informações específicas para consulta */}
                    {tipo === "consulta" && (
                        <View style={styles.consultaInfo}>
                            {tipoPaciente && (
                                <Text style={styles.pacienteText}>Tipo: {tipoPaciente}</Text>
                            )}
                            {medicoNome && (
                                <Text style={styles.medicoText}>Dr(a). {medicoNome}</Text>
                            )}
                        </View>
                    )}
                </View>
                
                <View style={styles.containerInfo}>
                    <Text style={[styles.status, { backgroundColor: statusColor }]}>{status}</Text>
                    <Text style={styles.dataEnvio}>{dataEnvio}</Text>
                </View>
            </View>
        );
    };

    // Se tiver onPress ou navigateTo, envolver em Pressable
    if (navigateTo || onPress) {
        return (
            <Pressable 
                onPress={handlePress}
                style={({ pressed }) => [
                    pressed && styles.pressedCard
                ]}
            >
                {renderContent()}
            </Pressable>
        );
    }

    // Caso contrário, apenas retornar o conteúdo
    return renderContent();
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderLeftWidth: 4,
        borderRadius: 8,
        marginBottom: 12,
        width: "100%",
        alignItems: "stretch",
        backgroundColor: "#F8F7F7",
        flexDirection: "row",
        justifyContent: "space-between",
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    pressedCard: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    leftSection: {
        flex: 1,
        justifyContent: "center",
    },
    titulo: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 4,
    },
    consultaInfo: {
        marginTop: 4,
    },
    pacienteText: {
        fontSize: 14,
        color: "#4B5563",
        marginBottom: 2,
    },
    medicoText: {
        fontSize: 14,
        color: "#6B7280",
        fontStyle: "italic",
    },
    containerInfo: {
        alignItems: "center",
        justifyContent: "center",
        minWidth: 80,
    },
    status: {
        fontSize: 14,
        color: "#F8F7F7",
        paddingHorizontal: 8,
        paddingVertical: 4,
        textTransform: "capitalize",
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
        textAlign: "center",
    },
});