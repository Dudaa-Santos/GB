import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import ListParcela from "../components/listParcela";
import { buscarParcelasAbertas } from "../service/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ParcelamentoAberto() {
    const [parcelas, setParcelas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Função para buscar parcelas abertas
    const fetchParcelas = async () => {
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
            
            // Extrai os dados da estrutura da API
            let parcelasArray = [];
            if (Array.isArray(response)) {
                parcelasArray = response;
            } else if (response && Array.isArray(response.data)) {
                parcelasArray = response.data;
            } else if (response && response.success && Array.isArray(response.data)) {
                parcelasArray = response.data;
            } else if (response && Array.isArray(response.parcelas)) {
                parcelasArray = response.parcelas;
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
    };

    // Carregar dados quando o componente montar
    useEffect(() => {
        fetchParcelas();
    }, []);

    // Função para formatar valor monetário
    const formatarValor = (valor) => {
        if (!valor) return "0,00";
        
        // Se já é uma string formatada, retorna
        if (typeof valor === 'string' && valor.includes(',')) {
            return valor;
        }
        
        // Se é um number, formata
        if (typeof valor === 'number') {
            return valor.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
        }
        
        // Tenta converter string para number
        const numeroValor = parseFloat(valor);
        if (!isNaN(numeroValor)) {
            return numeroValor.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
        }
        
        return String(valor);
    };

    // Função para extrair nome da parcela/benefício
    const getNomeParcela = (parcela) => {
        // Tenta diferentes estruturas possíveis
        if (parcela.beneficio && parcela.beneficio.nome) {
            return parcela.beneficio.nome;
        }
        if (parcela.nome) {
            return parcela.nome;
        }
        if (parcela.descricao) {
            return parcela.descricao;
        }
        if (parcela.titulo) {
            return parcela.titulo;
        }
        return `Parcela ${parcela.numeroParcela || parcela.id || ''}`;
    };

    // Função para extrair quantidade de parcelas
    const getQuantidadeParcela = (parcela) => {
        // Formato: "parcelaAtual/totalParcelas"
        if (parcela.parcelaAtual && parcela.totalParcelas) {
            return `${parcela.parcelaAtual}/${parcela.totalParcelas}`;
        }
        if (parcela.numeroParcela && parcela.qtdeParcelas) {
            return `${parcela.numeroParcela}/${parcela.qtdeParcelas}`;
        }
        if (parcela.numero && parcela.total) {
            return `${parcela.numero}/${parcela.total}`;
        }
        return "1/1";
    };

    // Função para extrair valor da parcela
    const getValorParcela = (parcela) => {
        if (parcela.valor) {
            return formatarValor(parcela.valor);
        }
        if (parcela.valorParcela) {
            return formatarValor(parcela.valorParcela);
        }
        if (parcela.preco) {
            return formatarValor(parcela.preco);
        }
        if (parcela.valorTotal && parcela.qtdeParcelas) {
            const valorPorParcela = parcela.valorTotal / parcela.qtdeParcelas;
            return formatarValor(valorPorParcela);
        }
        return "0,00";
    };

    // Função para calcular total das parcelas
    const calcularTotal = () => {
        if (!parcelas || parcelas.length === 0) return "0,00";
        
        const total = parcelas.reduce((acc, parcela) => {
            const valor = getValorParcela(parcela);
            const valorNumerico = parseFloat(valor.replace(',', '.')) || 0;
            return acc + valorNumerico;
        }, 0);
        
        return formatarValor(total);
    };

    // Renderizar conteúdo
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
                    <Text 
                        style={styles.retryText} 
                        onPress={fetchParcelas}
                    >
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
                {/* Header com total */}
                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total em Aberto:</Text>
                    <Text style={styles.totalValue}>R$ {calcularTotal()}</Text>
                </View>

                {/* Lista de parcelas */}
                <View style={styles.parcelasContainer}>
                    {parcelas.map((parcela, index) => (
                        <ListParcela
                            key={parcela.id || index}
                            nomeParcela={getNomeParcela(parcela)}
                            quantidadeParcela={getQuantidadeParcela(parcela)}
                            valorParcela={getValorParcela(parcela)}
                        />
                    ))}
                </View>

                {/* Footer informativo */}
                <View style={styles.infoContainer}>
                    <Text style={styles.infoText}>
                        💡 As parcelas serão descontadas automaticamente do seu salário conforme o cronograma estabelecido.
                    </Text>
                </View>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#065F46',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#065F46',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#065F46',
    },
    parcelasContainer: {
        flex: 1,
    },
    infoContainer: {
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    infoText: {
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
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
