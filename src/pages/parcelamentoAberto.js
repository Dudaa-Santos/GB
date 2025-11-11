import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import ListParcela from "../components/listParcela";
import { buscarParcelasAbertas } from "../service/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ParcelamentoAberto() {
    const [parcelas, setParcelas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function fetchParcelas() {
        try {
            setLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem("token");
            const id = await AsyncStorage.getItem("id");

            if (!token) {
                setError("Token não encontrado. Faça login novamente.");
                return;
            }

            if (!id) {
                setError("ID do colaborador não encontrado. Faça login novamente.");
                return;
            }

            const response = await buscarParcelasAbertas(id, token);

            // pode ser [ ... ] ou { data: [ ... ] }
            let parcelasArray = [];
            if (Array.isArray(response)) {
                parcelasArray = response;
            } else if (response && Array.isArray(response.data)) {
                parcelasArray = response.data;
            } else {
                parcelasArray = [];
            }

            setParcelas(parcelasArray);
        } catch (error) {
            setError(`Erro ao carregar parcelas: ${error.message}`);
            Alert.alert("Erro", `Não foi possível carregar as parcelas: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchParcelas();
    }, []);

    // Formatar valor R$
    const formatarValor = (valor) => {
        if (valor === null || valor === undefined) return "0,00";

        if (typeof valor === "number") {
            return valor.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        }

        const numero = parseFloat(valor);
        if (!isNaN(numero)) {
            return numero.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        }

        return String(valor);
    };

    // Soma total em aberto
    const calcularTotal = () => {
        if (!parcelas || parcelas.length === 0) return "0,00";

        const total = parcelas.reduce((acc, parcela) => {
            const numero = parseFloat(parcela.valorParcela);
            if (!isNaN(numero)) {
                return acc + numero;
            }
            return acc;
        }, 0);

        return formatarValor(total);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#065F46" />
                    <Text style={styles.loadingText}>Carregando parcelas...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Text style={styles.retryText} onPress={fetchParcelas}>
                        Tentar novamente
                    </Text>
                </View>
            );
        }

        if (!parcelas || parcelas.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nenhuma parcela em aberto encontrada.</Text>
                    <Text style={styles.emptySubText}>
                        Suas parcelas aparecerão aqui quando houver benefícios parcelados.
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.contentContainer}>
                {/* bloco totalizador */}
                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total em Aberto:</Text>
                    <Text style={styles.totalValue}>R$ {calcularTotal()}</Text>
                </View>

                {/* lista das parcelas */}
                <View style={styles.parcelasContainer}>
                    {parcelas.map((parcela, index) => (
                        <ListParcela
                            key={`${parcela.idSolicitacao}-${parcela.numeroParcela}`}
                            nomeParcela={parcela.nomeBeneficio}
                            quantidadeParcela={parcela.numeroParcela}
                            valorParcela={formatarValor(parcela.valorParcela)}
                        />
                    ))}
                </View>

                {/* ✅ Área de informações com SafeAreaView */}
                <SafeAreaView edges={['bottom']} style={styles.safeAreaBottom}>
                    <View style={styles.infoContainer}>
                        <Text style={styles.infoText}>
                            As parcelas serão descontadas automaticamente do seu salário
                            conforme o cronograma estabelecido.
                        </Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    };

    return (
        <Fundo>
            <View style={styles.container}>
                <TituloIcone
                    titulo="Parcelamento Aberto"
                    icone={require("../images/icones/Wallet_alt_g.png")}
                />
                {renderContent()}
            </View>
        </Fundo>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    contentContainer: {
        flex: 1,
    },
    totalContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#F0FDF4",
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: "#065F46",
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#065F46",
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#065F46",
    },
    parcelasContainer: {
        flex: 1,
        marginBottom: 8, // ✅ Adiciona margem antes da área de info
    },
    // ✅ Novo estilo para SafeAreaView
    safeAreaBottom: {
        backgroundColor: 'transparent',
        marginBottom: 16, // ✅ Margem inferior para evitar sobreposição
    },
    infoContainer: {
        backgroundColor: "#FEF3C7",
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: "#F59E0B",
        marginBottom: 8, // ✅ Espaçamento extra
    },
    infoText: {
        fontSize: 14,
        color: "#92400E",
        lineHeight: 20,
        textAlign: "center",
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#6B7280",
    },
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    errorText: {
        fontSize: 16,
        color: "#DC2626",
        textAlign: "center",
        marginBottom: 10,
    },
    retryText: {
        fontSize: 16,
        color: "#065F46",
        textDecorationLine: "underline",
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: "#9CA3AF",
        textAlign: "center",
        lineHeight: 20,
    },
});
