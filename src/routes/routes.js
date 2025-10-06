import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

import Login from "../pages/login";
import Home from "../pages/home";
import AgendarConsulta from "../pages/agendarConsulta";
import SolicitarBeneficio from "../pages/solicitarBeneficio.js";
import ParcelamentoAberto from "../pages/parcelamentoAberto.js";
import DocumentosEnviados from "../pages/documentosEnviados.js";
import Historico from "../pages/historico.js";
import ConsultasAgendadas from "../pages/consultasAgendadas.js";
import DetalheBeneficio from "../pages/detalheBeneficio.js";
import AssinaturasPendentes from "../pages/assinaturasPendentes.js";


const Stack = createStackNavigator();

export default function Routes() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        setIsLoggedIn(!!token);
      } catch (e) {
        console.log("Erro ao ler token:", e);
      } finally {
        setLoading(false);
      }
    };
    checkLogin();
  }, []);

  if (loading) {
    // enquanto carrega, mostra um spinner
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#047857" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isLoggedIn ? "Home" : "Login"}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="SolicitarBeneficio" component={SolicitarBeneficio} />
        <Stack.Screen name="AgendarConsulta" component={AgendarConsulta} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="ParcelamentoAberto" component={ParcelamentoAberto} />
        <Stack.Screen name="DocumentosEnviados" component={DocumentosEnviados} />
        <Stack.Screen name="Historico" component={Historico} />
        <Stack.Screen name="ConsultasAgendadas" component={ConsultasAgendadas} />
        <Stack.Screen name="DetalheBeneficio" component={DetalheBeneficio} />
        <Stack.Screen name="AssinaturasPendentes" component={AssinaturasPendentes} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
