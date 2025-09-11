import React from "react";
import { View, Image, StyleSheet } from "react-native";

export default function Fundo({ children }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../images/logo_gb.png")}
          style={styles.logo}
        />
      </View>

      <View style={styles.content}>{children}</View>
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
    height: 70
  },
  logo: {
    width: 50,
    height: 50,
    objectFit: "contain",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFEF6",
    paddingHorizontal: 20,
  },
});
