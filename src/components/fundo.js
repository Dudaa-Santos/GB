import React from "react";
import { View, Image, StyleSheet, ScrollView, Pressable, Text, StatusBar, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { height: screenHeight, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Fundo({ children, isHome = false, showBackButton = true, scrollable = true, onLogout }) {
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

        {/* Botão de logout (apenas na home) */}
        {isHome && onLogout && (
          <Pressable 
            style={styles.logoutButton} 
            onPress={onLogout}
            hitSlop={10}
          >
            <Icon name="logout" size={SCREEN_WIDTH * 0.065} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      <ContentWrapper
        style={[
          scrollable ? styles.scrollContent : styles.content,
          scrollable && { height: availableHeight }
        ]}
        showsVerticalScrollIndicator={scrollable}
        keyboardShouldPersistTaps={scrollable ? "handled" : undefined}
        contentContainerStyle={scrollable ? { 
          flexGrow: 1,
          minHeight: availableHeight
        } : undefined}
        nestedScrollEnabled={true}
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
  logoutButton: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    zIndex: 1,
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
    minHeight: '100%',
  },
});