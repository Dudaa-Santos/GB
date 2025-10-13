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

export const buscarEspecialidade = async (token) => {
  try {
    const response = await httpClient.get(`/especialidade`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar especialidade");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

export const buscarMedicos = async (token) => {
  try {
    const response = await httpClient.get(`/medico`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar médicos");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

// Busca uma solicitação específica pelo ID
export const buscarSolicitacoesporId = async (ColaboradorId, token) => {
  try {
    const response = await httpClient.get(`/solicitacao/${ColaboradorId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Resposta da API (buscarSolicitacoesporId):", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Erro na busca de solicitações por ID:", error);
    console.error("❌ Status:", error.response?.status);
    console.error("❌ Data:", error.response?.data);

    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar solicitação");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

export const buscarDocumentoporId = async (SolicitacaoId, ColaboradorId, token) => {
  try {
    console.log("🔍 Buscando documentos para solicitação ID:", SolicitacaoId, "e colaborador ID:", ColaboradorId);

    const response = await httpClient.get(`/documentos/${SolicitacaoId}/${ColaboradorId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Resposta da API (buscarDocumentoporId):", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Erro na busca de documentos por ID:", error);
    console.error("❌ Status:", error.response?.status);
    console.error("❌ Data:", error.response?.data);

    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar documentos");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

export const documentoUrl = async(nomeArquivoUnico, token) => {
  try{
        const response = await httpClient.get(`/documentos/${nomeArquivoUnico}/url-acesso`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
  } catch (error) {
    console.error("❌ Erro ao buscar URL do documento:", error);
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar URL do documento");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};  

export const disponibilidadeMedico = async (MedicoId, token, date) => {
  try {
    const response = await httpClient.get(`/medico/${MedicoId}/disponibilidade?dia=${date}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao buscar disponibilidade do médico:", error);
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar disponibilidade do médico");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

export const agendarConsulta = async (data, token) => {
  try {
    const response = await httpClient.post(`/agendamento`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao agendar consulta:", error);
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao agendar consulta");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};
