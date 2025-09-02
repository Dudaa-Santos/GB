import httpClient from "./httpClient";

export const login = async (matricula, senha) => {
  try {
    const response = await httpClient.post("/auth/login", {
      matricula,
      senha,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Erro no login");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

export const buscarColabPorId = async (id, token) => {
  try {
    const response = await httpClient.get(`/colaborador/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar colaborador");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};
