import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const httpClient = axios.create({
  baseURL: "https://senai-tcc-backend-gb.onrender.com", 
  timeout: 30000, 
});

// Interceptor para adicionar token automaticamente em TODAS as requisições
httpClient.interceptors.request.use(
  async (config) => {

    // Tenta pegar o token do AsyncStorage
    const token = await AsyncStorage.getItem("token");

    // Se tem token e não tem Authorization no header, adiciona
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }


    return config;
  },
  (error) => {
    console.error("Erro no interceptor request:", error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de resposta
httpClient.interceptors.response.use(
  (response) => {

    return response;
  },
  async (error) => {
    console.error("=== INTERCEPTOR RESPONSE (ERRO) ===");
    console.error("URL:", error.config?.url);
    console.error("Status:", error.response?.status);
    console.error("Data:", JSON.stringify(error.response?.data, null, 2));

    // Se retornar 401 (não autorizado), pode fazer logout automático
    if (error.response?.status === 401) {
      console.error("Token inválido ou expirado - considerando logout");

    }

    return Promise.reject(error);
  }
);

export default httpClient;
