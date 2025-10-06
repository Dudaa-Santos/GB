import react from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";

export default function ListParcela({ nomeParcela, quantidadeParcela, valorParcela }) {
    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                <Text style={styles.parcelaTitle}>{nomeParcela}</Text>
                <Text style={styles.parcelaSubtitle}>{quantidadeParcela}</Text>
            </View>
            <View style={styles.rightSection}>
                <Text style={styles.valorText}>R$ {valorParcela}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: "#F8F7F7",
        paddingHorizontal: 16,
        paddingVertical: 18,
        marginBottom: 8,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#065F46',
        marginTop: 10,
    },
    leftSection: {
        flex: 1,
    },
    rightSection: {
        alignItems: 'flex-end',
    },
    parcelaTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    parcelaSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '400',
    },
    valorText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#065F46',
    },
});
