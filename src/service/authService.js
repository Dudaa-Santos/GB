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

export const buscarSolicitacoesporId = async (ColaboradorId, token) => {
  try {
    const response = await httpClient.get(`/solicitacao/colaborador/${ColaboradorId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar solicitação");
    }
    throw new Error("Falha de conexão com o servidor");
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

export const buscarAgendamentoPorId = async (ColaboradorId, token) => {
  try {
    const response = await httpClient.get(`/agendamento/${ColaboradorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar agendamento");
    }
    throw new Error("Falha de conexão com o servidor");
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

export const chatBotMessage = async (mensagem, token) => {
  try {
    const response = await httpClient.post(`/chat`, 
      { mensagem }, // Envia a mensagem do usuário no body
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Erro ao buscar mensagens do chatbot");
    }
    throw new Error("Falha de conexão com o servidor");
  }
}