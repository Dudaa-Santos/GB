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

export const buscarSolicitacoesporId = async (ColaboradorId, token, filters = {}) => {
  try {
    console.log("=== buscarSolicitacoesporId ===");
    console.log("ColaboradorId:", ColaboradorId);
    console.log("Filters recebidos:", JSON.stringify(filters, null, 2));
    
    // Monta os query params
    const params = new URLSearchParams();
    params.append('colaboradorId', ColaboradorId);
    
    // Adiciona filtros opcionais
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach(s => params.append('status', s));
      } else {
        params.append('status', filters.status);
      }
    }
    
    if (filters.mes) {
      params.append('mes', filters.mes);
    }
    
    if (filters.dia) {
      params.append('dia', filters.dia);
    }
    
    if (filters.page !== undefined) {
      params.append('page', filters.page);
    }
    
    if (filters.size !== undefined) {
      params.append('size', filters.size);
    }
    
    const url = `/solicitacao?${params.toString()}`;
    console.log("URL da requisição:", url);
    
    const response = await httpClient.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar solicitações por ID:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw error;
  }
};

export const buscarDocumentoporId = async (SolicitacaoId, ColaboradorId, token) => {
  try {
    const response = await httpClient.get(`/documentos/${SolicitacaoId}/${ColaboradorId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
      headers: { Authorization: `Bearer ${token}` }
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
      headers: { Authorization: `Bearer ${token}` }
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
    console.log("=== buscarAgendamentoPorId ===");
    console.log("ColaboradorId:", colaboradorId);
    console.log("Filters recebidos:", JSON.stringify(filters, null, 2));
    
    const params = new URLSearchParams();
    params.append('colaboradorId', colaboradorId);
    
    // Adiciona filtros opcionais
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach(s => params.append('status', s));
      } else {
        params.append('status', filters.status);
      }
    }
    
    if (filters.mes) {
      params.append('mes', filters.mes);
    }
    
    if (filters.dia) {
      params.append('dia', filters.dia);
    }
    
    if (filters.page !== undefined) {
      params.append('page', filters.page);
    }
    
    if (filters.size !== undefined) {
      params.append('size', filters.size);
    }
    
    const url = `/agendamento?${params.toString()}`;
    console.log("URL da requisição:", url);
    
    const response = await httpClient.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar agendamentos por ID:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw error;
  }
};

/** ====== CRIAR SOLICITAÇÃO ====== */
export const criarSolicitacao = async (
  {
    idColaborador,
    idBeneficio,
    valorTotal,
    idDependente,   // opcional
    descricao,
    qtdeParcelas,
    tipoPagamento,  // 'DESCONTADO_FOLHA' | 'PAGAMENTO_PROPRIO' | 'DOACAO'
  },
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

    const response = await httpClient.post('/solicitacao', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    if (error?.response) {
      throw new Error(error.response.data?.message || 'Erro ao criar solicitação');
    }
    throw new Error('Falha de conexão com o servidor');
  }
};

/** ====== UPLOAD DE DOCUMENTO (exatamente como você pediu) ====== */
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
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar benefícios");
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

/** ====== FUNÇÃO QUE VEIO DO OUTRO LADO DO MERGE ====== */
export const buscarParcelasAbertas = async (ColaboradorId, token) => {
  try {
    const response = await httpClient.get(`/solicitacao/parcelas/${ColaboradorId}`, {
      headers: { Authorization: `Bearer ${token}` }
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
    const body = {
      mensagem,
    };

    // se já existe conversa anterior, manda pro back
    if (conversationId) {
      body.conversationId = conversationId;
    }

    const response = await httpClient.post(
      "/chat",
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // aqui o back te devolve aquele objeto grandão (success, data, etc)
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(
        error.response.data.message || "Erro ao buscar resposta do chatbot"
      );
    }
    throw new Error("Falha de conexão com o servidor");
  }
};

export const uploadChatDocument = async ({ file, conversationId, pendingData }, token) => {
  try {
    console.log("=== uploadChatDocument: INÍCIO ===");
    console.log("Arquivo recebido:", {
      uri: file.uri,
      name: file.name,
      mimeType: file.mimeType,
      type: file.type,
      size: file.size,
    });
    console.log("ConversationId:", conversationId);
    console.log("PendingData:", pendingData);
    console.log("Token COMPLETO recebido:", token); // Mostra o token completo para debug
    
    if (!token) {
      throw new Error("Token não foi fornecido para uploadChatDocument");
    }

    const formData = new FormData();

    const fileToUpload = {
      uri: file.uri,
      name: file.name || "documento",
      type: file.mimeType || file.type || "application/octet-stream",
    };

    console.log("Objeto do arquivo no FormData:", fileToUpload);
    formData.append("file", fileToUpload);

    if (conversationId) {
      console.log("Adicionando conversationId ao FormData:", conversationId);
      formData.append("conversationId", String(conversationId));
    }

    if (pendingData) {
      console.log("Adicionando pendingData ao FormData:", pendingData);
      formData.append("pendingData", JSON.stringify(pendingData)); // Mudei para JSON.stringify caso seja objeto
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    };

    console.log("Headers que serão enviados:", JSON.stringify(headers, null, 2));
    console.log("Fazendo requisição POST para /chat/upload...");

    const response = await httpClient.post("/chat/upload", formData, {
      headers: headers,
      timeout: 60000, // 60 segundos para upload
    });

    console.log("Resposta recebida:");
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));
    console.log("=== uploadChatDocument: FIM (SUCESSO) ===");

    return response.data;
  } catch (error) {
    console.error("=== uploadChatDocument: ERRO ===");
    console.error("Tipo:", error.constructor.name);
    console.error("Mensagem:", error.message);

    if (error?.response) {
      console.error("Response Status:", error.response.status);
      console.error("Response StatusText:", error.response.statusText);
      console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
      console.error("Response Headers:", JSON.stringify(error.response.headers, null, 2));
      
      // Verifica se é erro de autenticação
      if (error.response.status === 401) {
        console.error("ERRO 401: Token inválido, ausente ou expirado");
        console.error("Verifique se o token está sendo enviado corretamente no header");
      }
      
      throw new Error(
        error.response.data?.message ||
        error.response.data?.error ||
        `Erro HTTP ${error.response.status}: ${error.response.statusText || 'Erro desconhecido'}`
      );
    }

    if (error?.request) {
      console.error("Request feito mas sem resposta do servidor");
      console.error("Request:", error.request);
      throw new Error("Sem resposta do servidor. Verifique sua conexão.");
    }

    console.error("Stack:", error.stack);
    console.error("=== uploadChatDocument: FIM (ERRO) ===");

    throw new Error(error.message || "Falha de conexão com o servidor");
  }
};