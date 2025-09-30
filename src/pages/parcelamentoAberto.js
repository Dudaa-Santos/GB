import react from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";


export default function AgendarConsulta() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parcelamento Aberto</Text>
      <Text style={styles.description}>
        Aqui você pode gerenciar seus parcelamentos abertos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
});
