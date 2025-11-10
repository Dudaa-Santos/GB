import httpClient from "./httpClient";

export const login = async (matricula, senha) => {
  try {
    const response = await httpClient.post("/auth/login", { matricula, senha });
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
      headers: { Authorization: `Bearer ${token}` },
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
      headers: { Authorization: `Bearer ${token}` },
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
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar médicos");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

export const buscarSolicitacoesporId = async (ColaboradorId, token, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== "TODOS") params.append("status", filters.status);
    if (filters.mes) params.append("mes", filters.mes);
    if (filters.dia) params.append("dia", filters.dia);
    if (filters.page !== undefined) params.append("page", filters.page);
    if (filters.size !== undefined) params.append("size", filters.size);
    if (filters.sort) {
      const sortArray = Array.isArray(filters.sort) ? filters.sort : [filters.sort];
      sortArray.forEach((s) => params.append("sort", s));
    }

    const queryString = params.toString();
    const url = `/solicitacao/colaborador/${ColaboradorId}${queryString ? `?${queryString}` : ""}`;

    const response = await httpClient.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw error;
    }
    throw error;
  }
};

export const buscarDocumentoporId = async (SolicitacaoId, ColaboradorId, token) => {
  try {
    const response = await httpClient.get(`/documentos/${SolicitacaoId}/${ColaboradorId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar documentos");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

export const documentoUrl = async (nomeArquivoUnico, token) => {
  try {
    const response = await httpClient.get(`/documentos/${nomeArquivoUnico}/url-acesso`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar URL do documento");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

export const disponibilidadeMedico = async (MedicoId, token, date) => {
  try {
    const response = await httpClient.get(`/medico/${MedicoId}/disponibilidade?dia=${date}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar disponibilidade do médico");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

export const agendarConsulta = async (data, token) => {
  try {
    const response = await httpClient.post(`/agendamento`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    if (error?.response) {
      const msg =
        (typeof error.response.data === "string" && error.response.data) ||
        error.response.data?.message ||
        error.response.data?.error ||
        (Array.isArray(error.response.data?.errors) && error.response.data.errors.join(", ")) ||
        "Erro ao agendar consulta";
      throw new Error(msg);
    }
    if (error?.request) {
      throw new Error("Sem resposta do servidor. Verifique a conexão.");
    }
    throw new Error(error?.message || "Falha de conexão com o servidor");
  }
};

export const buscarAgendamentoPorId = async (colaboradorId, token, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== "TODOS") params.append("status", filters.status);
    if (filters.mes) params.append("mes", filters.mes);
    if (filters.dia) params.append("dia", filters.dia);
    if (filters.page !== undefined) params.append("page", filters.page);
    if (filters.size !== undefined) params.append("size", filters.size);
    if (filters.sort) {
      const sortArray = Array.isArray(filters.sort) ? filters.sort : [filters.sort];
      sortArray.forEach((s) => params.append("sort", s));
    }

    const queryString = params.toString();
    const url = `/agendamento/${colaboradorId}${queryString ? `?${queryString}` : ""}`;

    const response = await httpClient.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw error;
    }
    throw error;
  }
};

export const criarSolicitacao = async (
  { idColaborador, idBeneficio, valorTotal, idDependente, descricao, qtdeParcelas, tipoPagamento },
  token
) => {
  try {
    const payload = {
      idColaborador: String(idColaborador),
      idBeneficio: String(idBeneficio),
      valorTotal: Number(valorTotal),
      descricao: String(descricao),
      qtdeParcelas: Number(qtdeParcelas),
      tipoPagamento: String(tipoPagamento),
      ...(idDependente ? { idDependente: String(idDependente) } : {}),
    };

    const response = await httpClient.post("/solicitacao", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    if (error?.response) {
      throw new Error(error.response.data?.message || "Erro ao criar solicitação");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

export const uploadDoc = async ({ solicitacaoId, colaboradorId, file }, token) => {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.name || "documento.png",
      type: file.type || "application/octet-stream",
    });

    const response = await httpClient.post("/documentos/upload", formData, {
      params: { solicitacaoId, colaboradorId },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao enviar documento");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

export const buscarBeneficios = async (token) => {
  try {
    const response = await httpClient.get(`/beneficio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar benefícios");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

export const buscarParcelasAbertas = async (ColaboradorId, token) => {
  try {
    const response = await httpClient.get(`/solicitacao/parcelas/${ColaboradorId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar parcelas abertas");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

export const chatBotMessage = async (mensagem, token, conversationId = null) => {
  try {
    const body = { mensagem };
    if (conversationId) body.conversationId = conversationId;

    const response = await httpClient.post("/chat", body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || "Erro ao buscar resposta do chatbot");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

export const uploadChatDocument = async ({ file, conversationId, pendingData }, token) => {
  try {
    if (!token) throw new Error("Token não foi fornecido para uploadChatDocument");

    const formData = new FormData();
    const fileToUpload = {
      uri: file.uri,
      name: file.name || "documento",
      type: file.mimeType || file.type || "application/octet-stream",
    };

    formData.append("file", fileToUpload);
    if (conversationId) formData.append("conversationId", String(conversationId));
    if (pendingData) formData.append("pendingData", JSON.stringify(pendingData));

    const response = await httpClient.post("/chat/upload", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000,
    });

    return response.data;
  } catch (error) {
    if (error?.response) {
      if (error.response.status === 401) {
        throw new Error("Token inválido, ausente ou expirado");
      }
      throw new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          `Erro HTTP ${error.response.status}`
      );
    }
    if (error?.request) {
      throw new Error("Sem resposta do servidor. Verifique sua conexão.");
    }
    throw new Error(error.message || "Falha de conexão com o servidor");
  }
};

export const assinarDocumento = async (idSolicitacao, token) => {
  try {
    const response = await httpClient.post(
      `/solicitacao/${idSolicitacao}/assinar`,
      null, // sem body, só o POST mesmo
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // deve retornar o objeto da solicitação já atualizada (status, etc.)
    return response.data;
  } catch (error) {
    if (error?.response) {
      const msg =
        (typeof error.response.data === "string" && error.response.data) ||
        error.response.data?.message ||
        error.response.data?.error ||
        "Erro ao assinar solicitação";
      throw new Error(msg);
    }

    if (error?.request) {
      throw new Error("Sem resposta do servidor. Verifique a conexão.");
    }

    throw new Error(error?.message || "Falha de conexão com o servidor");
  }
};

export const alterarStatusAgendamento = async (idAgendamento, novoStatus, token) => {
  try {
    const response = await httpClient.patch(
      `/agendamento/${idAgendamento}/status`,
      { status: novoStatus },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error?.response) {
      const msg =
        (typeof error.response.data === "string" && error.response.data) ||
        error.response.data?.message ||
        error.response.data?.error ||
        "Erro ao alterar status do agendamento";
      throw new Error(msg);
    }

    if (error?.request) {
      throw new Error("Sem resposta do servidor. Verifique a conexão.");
    }

    throw new Error(error?.message || "Falha de conexão com o servidor");
  }
};
