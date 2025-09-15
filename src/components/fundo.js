import React from "react";
import { View, Image, StyleSheet, ScrollView } from "react-native";

export default function Fundo({ children }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require("../images/logo_gb.png")} style={styles.logo} />
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
  header: {
    backgroundColor: "#065F46",
    alignItems: "center",
    justifyContent: "center",
    height: 70,
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: "contain", // ✅ em vez de objectFit
  },
  content: {
    backgroundColor: "#FFFEF6",
    paddingHorizontal: 20,
    height: "100px",
  },
});
