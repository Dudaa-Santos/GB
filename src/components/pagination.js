import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

export default function Pagination({ 
    currentPage = 0, 
    totalPages = 1, 
    onPageChange,
    loading = false 
}) {
    // Não mostra paginação se só tiver 1 página
    if (totalPages <= 1) return null;

    const renderPageButton = (pageNum, isActive = false) => (
        <Pressable
            key={pageNum}
            onPress={() => !isActive && onPageChange(pageNum)}
            disabled={loading || isActive}
            style={({ pressed }) => [
                styles.pageButton,
                isActive && styles.pageButtonActive,
                pressed && !isActive && styles.pageButtonPressed,
            ]}
        >
            <Text style={[
                styles.pageText,
                isActive && styles.pageTextActive
            ]}>
                {pageNum + 1}
            </Text>
        </Pressable>
    );

    const renderEllipsis = (key) => (
        <View key={key} style={styles.ellipsis}>
            <Text style={styles.ellipsisText}>...</Text>
        </View>
    );

    const renderButtons = () => {
        const buttons = [];

        // Sempre mostra primeira página
        buttons.push(renderPageButton(0, currentPage === 0));

        // Se a página atual está longe do início, mostra "..."
        if (currentPage > 2) {
            buttons.push(renderEllipsis("start-ellipsis"));
        }

        // Páginas do meio (ao redor da página atual)
        const startPage = Math.max(1, currentPage - 1);
        const endPage = Math.min(totalPages - 2, currentPage + 1);

        for (let i = startPage; i <= endPage; i++) {
            if (i > 0 && i < totalPages - 1) {
                buttons.push(renderPageButton(i, currentPage === i));
            }
        }

        // Se a página atual está longe do fim, mostra "..."
        if (currentPage < totalPages - 3) {
            buttons.push(renderEllipsis("end-ellipsis"));
        }

        // Sempre mostra última página (se tiver mais de 1 página)
        if (totalPages > 1) {
            buttons.push(renderPageButton(totalPages - 1, currentPage === totalPages - 1));
        }

        return buttons;
    };

    return (
        <View style={styles.container}>
            {/* Botão Anterior */}
            <Pressable
                onPress={() => onPageChange(currentPage - 1)}
                disabled={loading || currentPage === 0}
                style={({ pressed }) => [
                    styles.navButton,
                    (loading || currentPage === 0) && styles.navButtonDisabled,
                    pressed && !(loading || currentPage === 0) && styles.navButtonPressed,
                ]}
            >
                <Text style={[
                    styles.navText,
                    (loading || currentPage === 0) && styles.navTextDisabled
                ]}>
                    ‹
                </Text>
            </Pressable>

            {/* Números de página */}
            <View style={styles.pagesContainer}>
                {renderButtons()}
            </View>

            {/* Botão Próximo */}
            <Pressable
                onPress={() => onPageChange(currentPage + 1)}
                disabled={loading || currentPage === totalPages - 1}
                style={({ pressed }) => [
                    styles.navButton,
                    (loading || currentPage === totalPages - 1) && styles.navButtonDisabled,
                    pressed && !(loading || currentPage === totalPages - 1) && styles.navButtonPressed,
                ]}
            >
                <Text style={[
                    styles.navText,
                    (loading || currentPage === totalPages - 1) && styles.navTextDisabled
                ]}>
                    ›
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
        gap: 8,
    },
    pagesContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    pageButton: {
        width: 40,
        height: 40,
        borderRadius: 20, // Totalmente redondo
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: "#D1D5DB",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    pageButtonActive: {
        backgroundColor: "#065F46", // Verde escuro
        borderColor: "#065F46",
        shadowColor: "#065F46",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    pageButtonPressed: {
        backgroundColor: "#F0FDF4", // Verde claro
        borderColor: "#065F46",
    },
    pageText: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "600",
    },
    pageTextActive: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    navButton: {
        width: 40,
        height: 40,
        borderRadius: 20, // Totalmente redondo
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: "#D1D5DB",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    navButtonDisabled: {
        backgroundColor: "#F9FAFB",
        borderColor: "#E5E7EB",
        opacity: 0.5,
    },
    navButtonPressed: {
        backgroundColor: "#F0FDF4", // Verde claro
        borderColor: "#065F46",
    },
    navText: {
        fontSize: 24,
        color: "#6B7280",
        fontWeight: "700",
        lineHeight: 24,
    },
    navTextDisabled: {
        color: "#D1D5DB",
    },
    ellipsis: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    ellipsisText: {
        fontSize: 16,
        color: "#9CA3AF",
        fontWeight: "600",
    },
});