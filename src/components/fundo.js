import React from "react";
import { View, Image, StyleSheet, ScrollView, Pressable, Text, StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Fundo({ children, isHome = false, showBackButton = true }) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

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

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
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
  content: {
    backgroundColor: "#FFFEF6",
    paddingHorizontal: 20,
    flex: 1,
  },
});
