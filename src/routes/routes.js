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
import DetalheBeneficio from "../pages/detalheBeneficio.js";
import DetalheConsulta from "../pages/detalheConsulta.js";
import AssinaturasPendentes from "../pages/assinaturasPendentes.js";
import Chat from "../pages/chat.js";

const Stack = createStackNavigator();

export default function Routes() {
  // ✅ REMOVIDO: não verifica mais token aqui
  // O app sempre começa no Login

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="SolicitarBeneficio" component={SolicitarBeneficio} />
        <Stack.Screen name="AgendarConsulta" component={AgendarConsulta} />
        <Stack.Screen name="ParcelamentoAberto" component={ParcelamentoAberto} />
        <Stack.Screen name="DocumentosEnviados" component={DocumentosEnviados} />
        <Stack.Screen name="Historico" component={Historico} />
        <Stack.Screen name="DetalheBeneficio" component={DetalheBeneficio} />
        <Stack.Screen name="DetalheConsulta" component={DetalheConsulta} />
        <Stack.Screen name="AssinaturasPendentes" component={AssinaturasPendentes} />
        <Stack.Screen name="Chat" component={Chat} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
