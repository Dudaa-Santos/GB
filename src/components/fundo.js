import React from "react";
import { View, Image, StyleSheet, ScrollView, Pressable, Text, StatusBar, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height: screenHeight } = Dimensions.get('window');

export default function Fundo({ children, isHome = false, showBackButton = true, scrollable = true }) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const ContentWrapper = scrollable ? ScrollView : View;
  
  // Calcular altura disponível para o conteúdo
  const headerHeight = 70;
  const statusBarHeight = StatusBar.currentHeight || 44;
  const availableHeight = screenHeight - headerHeight - statusBarHeight;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#065F46" />
      <View style={styles.statusBarSpacer} />
      
      <View style={styles.header}>
        {/* Botão de voltar (apenas se não for home e showBackButton for true) */}
        {!isHome && showBackButton && (
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
        )}

        {/* Logo centralizada */}
        <View style={styles.logoContainer}>
          <Image source={require("../images/logo_gb.png")} style={styles.logo} />
        </View>
      </View>

      <ContentWrapper
        style={[
          scrollable ? styles.scrollContent : styles.content,
          scrollable && { height: availableHeight }  // Força altura específica para ScrollView na web
        ]}
        showsVerticalScrollIndicator={scrollable}
        keyboardShouldPersistTaps={scrollable ? "handled" : undefined}
        contentContainerStyle={scrollable ? { 
          flexGrow: 1,
          minHeight: availableHeight  // Garante que o conteúdo ocupe pelo menos a altura disponível
        } : undefined}
        nestedScrollEnabled={true}  // Permite scroll aninhado
      >
        <View style={styles.contentInner}>
          {children}
        </View>
      </ContentWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFEF6",
  },
  statusBarSpacer: {
    height: StatusBar.currentHeight || 44, 
    backgroundColor: "#065F46",
  },
  header: {
    backgroundColor: "#065F46",
    alignItems: "center",
    justifyContent: "center",
    height: 70,
    flexDirection: "row",
    position: "relative",
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  backButton: {
    position: "absolute",
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    zIndex: 1,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  scrollContent: {
    backgroundColor: "#FFFEF6",
    paddingHorizontal: 20,
  },
  content: {
    backgroundColor: "#FFFEF6",
    paddingHorizontal: 20,
    flex: 1,
  },
  contentInner: {
    flex: 1,
    minHeight: '100%',  // Garante altura mínima
  },
});