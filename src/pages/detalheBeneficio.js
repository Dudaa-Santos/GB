import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import Fundo from "../components/fundo";
import TituloIcone from "../components/tituloIcone";
import ListParcela from "../components/listParcela";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buscarDocumentoporId, documentoUrl } from "../service/authService";
import { File, Directory, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

// ✅ Função EXATAMENTE IGUAL ao cardStatus.js - ORDEM CORRETA
function getStatusColor(status) {
    if (!status) return "#6B7280";

    const statusLower = status.toLowerCase();

    // ✅ PEND. ASSINAR TEM QUE VIR ANTES DE PENDENTE
    if (statusLower.includes("pend. assinar") || statusLower.includes("pendente_assinatura")) return "#315fd3ff"; // Azul
    if (statusLower.includes("pendente")) return "#F59E0B"; // Laranja
    if (statusLower.includes("aprovado") || statusLower.includes("aprovada")) return "#065F46"; // Verde escuro
    if (statusLower.includes("recusada") || statusLower.includes("negado")) return "#DC2626"; // Vermelho

    // Consultas
    if (statusLower.includes("agendado") || statusLower.includes("agendada")) return "#315fd3ff"; // Azul
    if (statusLower.includes("concluído") || statusLower.includes("concluida")) return "#065F46"; // Verde
    if (statusLower.includes("cancelado") || statusLower.includes("cancelada")) return "#DC2626"; // Vermelho
    if (statusLower.includes("faltou")) return "#F59E0B"; // Laranja

    return "#065F46"; // Verde padrão
}

export default function DetalheBeneficio({ route }) {
  const { solicitacao } = route?.params || {};
  const [documentos, setDocumentos] = useState([]);
  const [documentosUrls, setDocumentosUrls] = useState({});
  const [loadingDocumentos, setLoadingDocumentos] = useState(true);
  const [loadingUrlMap, setLoadingUrlMap] = useState({});

  // ✅ Agora a função já está declarada
  const statusColor = getStatusColor(solicitacao?.status);

  // Função para normalizar o status
  const normalizeStatus = (status) => {
    if (!status) return "PENDENTE";
    
    const statusUpper = status.toUpperCase();
    
    if (statusUpper === "PENDENTE_ASSINATURA") {
      return "Pend. Assinar";
    }
    
    return status;
  };

  useEffect(() => {
    const fetchDocumentos = async () => {
      setLoadingDocumentos(true);
      const token = await AsyncStorage.getItem("token");
      const ColaboradorId = await AsyncStorage.getItem("id");
      if (!token || !solicitacao) {
        setLoadingDocumentos(false);
        return;
      }

      try {
        const data = await buscarDocumentoporId(solicitacao.id, ColaboradorId, token);

        let documentosArray = [];
        if (Array.isArray(data)) {
          documentosArray = data;
        } else if (data?.data && Array.isArray(data.data)) {
          documentosArray = data.data;
        } else if (data?.documentos && Array.isArray(data.documentos)) {
          documentosArray = data.documentos;
        }

        setDocumentos(documentosArray);
      } catch (error) {
        console.error("Erro ao buscar documentos:", error);
        setDocumentos([]);
      } finally {
        setLoadingDocumentos(false);
      }
    };

    fetchDocumentos();
  }, [solicitacao]);

  useEffect(() => {
    const fetchDocumentosUrls = async () => {
      if (documentos.length === 0) return;
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const urls = {};
      const loadingMap = {};

      for (const documento of documentos) {
        const key = documento.id || documento.nomeArquivoUnico || documento.nomeArquivoOriginal;
        loadingMap[key] = true;
      }
      setLoadingUrlMap(loadingMap);

      for (const documento of documentos) {
        const nomeArquivoParaBusca = documento?.nomeArquivoUnico;
        const key = documento.id || documento.nomeArquivoUnico || documento.nomeArquivoOriginal;

        console.log('🔍 Processando documento:', {
          key,
          nomeArquivoParaBusca,
          documento: documento
        });

        if (!nomeArquivoParaBusca) {
          console.log('❌ Nome arquivo para busca vazio');
          urls[key] = "";
          loadingMap[key] = false;
          setLoadingUrlMap({ ...loadingMap });
          continue;
        }

        try {
          const urlData = await documentoUrl(nomeArquivoParaBusca, token);
          console.log('📡 Resposta documentoUrl:', urlData);
          
          const raw = urlData?.data || "";
          const full = raw.startsWith("http")
            ? raw
            : `${process.env.EXPO_PUBLIC_API_URL || ""}${raw}`;

          console.log('🌐 URL final gerada:', full);
          urls[key] = full;
        } catch (error) {
          console.error(`❌ Erro ao buscar URL do documento ${documento.nomeArquivoOriginal || key}:`, error);
          urls[key] = "";
        } finally {
          loadingMap[key] = false;
          setLoadingUrlMap({ ...loadingMap });
        }
      }

      console.log('📋 URLs finais:', urls);
      setDocumentosUrls(urls);
    };

    fetchDocumentosUrls();
  }, [documentos]);

  const getDocumentoUrl = (documento) => {
    const key = documento.id || documento.nomeArquivoUnico || documento.nomeArquivoOriginal;
    return documentosUrls[key] || "";
  };

  const handleVisualizar = async (documento) => {
    try {
      const url = getDocumentoUrl(documento);
      if (!url) {
        Alert.alert("Erro", "URL do documento não disponível");
        return;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else Alert.alert("Erro", "Não foi possível abrir este tipo de arquivo");
    } catch (error) {
      console.error("Erro ao visualizar documento:", error);
      Alert.alert("Erro", "Não foi possível abrir o documento");
    }
  };

  const getUniqueDestFile = (dir, filename) => {
    const dot = filename.lastIndexOf(".");
    const base = dot > 0 ? filename.slice(0, dot) : filename;
    const ext = dot > 0 ? filename.slice(dot) : "";
    let n = 0;
    let candidate = new File(dir, filename);
    while (candidate.exists) {
      n += 1;
      candidate = new File(dir, `${base} (${n})${ext}`);
    }
    return candidate;
  };

  const handleBaixarNative = async (documento) => {
    const url = getDocumentoUrl(documento);
    if (!url) return;

    const filename = getNomeArquivo(documento) || "arquivo";

    try {
      const targetDir = new Directory(Paths.document, "downloads");
      if (!targetDir.exists) targetDir.create();

      const destFile = getUniqueDestFile(targetDir, filename);

      await File.downloadFileAsync(url, destFile);

      if (Platform.OS === "ios") {
        try {
          const ext = getExtensaoArquivo(documento).toLowerCase();
          const mime = getMimeByExt(ext);
          await Sharing.shareAsync(destFile.uri, {
            mimeType: mime,
            dialogTitle: destFile.name || filename,
          });
        } catch (shareError) {
          console.warn("Compartilhamento falhou:", shareError);
        }
      }
      console.log("Salvo como:", destFile.uri);
    } catch (error) {
      console.error("Download silencioso falhou:", error);
      try {
        await Linking.openURL(url);
      } catch (linkError) {
        console.error("Fallback também falhou:", linkError);
      }
    }
  };

  const getNomeArquivo = (documento) => {
    return (
      documento.nomeArquivoOriginal ||
      documento.nomeArquivo ||
      documento.nome ||
      documento.filename ||
      `Documento_${documento.id || "sem_id"}`
    );
  };

  const getExtensaoArquivo = (documento) => {
    const nomeArquivo = getNomeArquivo(documento);
    if (nomeArquivo.includes(".")) return nomeArquivo.split(".").pop().toUpperCase();
    return "DOC";
  };

  const getMimeByExt = (ext) => {
    const map = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      txt: "text/plain",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      mp4: "video/mp4",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      mp3: "audio/mpeg",
      wav: "audio/wav",
    };
    return map[(ext || "").toLowerCase()] || "application/octet-stream";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Data não informada";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const getBeneficioNome = () => {
    if (solicitacao?.beneficio?.nome) return solicitacao.beneficio.nome;
    if (solicitacao?.descricao) return solicitacao.descricao;
    return "Benefício";
  };

  const getValorParcela = () => {
    if (solicitacao?.valorTotal && solicitacao?.qtdeParcelas) {
      return solicitacao.valorTotal / solicitacao.qtdeParcelas;
    }
    return 0;
  };

  if (!solicitacao) {
    return (
      <Fundo>
        <View style={styles.container}>
          <TituloIcone
            titulo="Detalhes do Benefício"
            icone={require("../images/icones/history_g.png")}
          />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Não foi possível carregar os detalhes do benefício.</Text>
          </View>
        </View>
      </Fundo>
    );
  }

  return (
    <Fundo>
      <ScrollView>
        <View style={styles.container}>
          <TituloIcone
            titulo="Detalhes do Benefício"
            icone={require("../images/icones/history_g.png")}
          />

          {/* Card Principal */}
          <View style={[styles.mainCard, { borderLeftWidth: 4, borderLeftColor: statusColor }]}>
            <View style={styles.headerCard}>
              <Text style={styles.beneficioTitulo}>{getBeneficioNome()}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>
                  {normalizeStatus(solicitacao.status) || "PENDENTE"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data da Solicitação:</Text>
              <Text style={styles.infoValue}>{formatDate(solicitacao.dataSolicitacao)}</Text>
            </View>

            {solicitacao.valorTotal !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Valor Total:</Text>
                <Text style={styles.infoValue}>{formatCurrency(solicitacao.valorTotal)}</Text>
              </View>
            )}

            {solicitacao.tipoPagamento && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tipo de Pagamento:</Text>
                <Text style={styles.infoValue}>
                  {solicitacao.tipoPagamento === "DESCONTADO_FOLHA" ? "Desconto em Folha" : solicitacao.tipoPagamento}
                </Text>
              </View>
            )}

            {solicitacao.desconto !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Desconto:</Text>
                <Text style={styles.infoValue}>{formatCurrency(solicitacao.desconto)}</Text>
              </View>
            )}
          </View>

          {/* Descrição */}
          {solicitacao.descricao && (
            <View style={styles.descricaoSection}>
              <Text style={styles.sectionTitle}>Descrição</Text>
              <View style={[styles.descricaoCard, { borderLeftColor: statusColor }]}>
                <Text style={styles.descricaoText}>{solicitacao.descricao}</Text>
              </View>
            </View>
          )}

          {/* Documentos */}
          <View style={styles.documentosSection}>
            <Text style={styles.sectionTitle}>Documentos</Text>

            {loadingDocumentos ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#065F46" />
                <Text style={styles.loadingText}>Carregando documentos...</Text>
              </View>
            ) : (
              <>
                {documentos && documentos.length > 0 ? (
                  <>
                    <Text style={styles.documentosStatus}>
                      {documentos.length} documento(s) encontrado(s)
                    </Text>

                    {documentos.map((documento, index) => {
                      const key = documento.id || documento.nomeArquivoUnico || index;
                      const urlPronta = !!getDocumentoUrl(documento);
                      const miniLoading = !!loadingUrlMap[key];

                      return (
                        <View key={key} style={styles.docRow}>
                          <View style={styles.tile}>
                            <View style={styles.tileInner} />
                            <Text style={styles.tileText}>
                              {getIconeExtensaoLabel(getExtensaoArquivo(documento))}
                            </Text>
                          </View>

                          <View style={styles.docNameWrap}>
                            <Text numberOfLines={1} style={styles.docName}>
                              {getNomeArquivo(documento)}
                            </Text>
                          </View>

                          <View style={styles.actions}>
                            {miniLoading ? (
                              <ActivityIndicator size="small" color="#111827" />
                            ) : (
                              <>
                                <Pressable
                                  onPress={() => handleVisualizar(documento)}
                                  disabled={!urlPronta}
                                  style={({ pressed }) => [
                                    styles.iconBtn,
                                    !urlPronta && styles.iconBtnDisabled,
                                    pressed && styles.iconBtnPressed,
                                  ]}
                                >
                                  <View style={styles.iconOnly}>
                                    <View style={styles.eyeOuter} />
                                    <View style={styles.eyePupil} />
                                  </View>
                                </Pressable>

                                <Pressable
                                  onPress={() => handleBaixarNative(documento)}
                                  disabled={!urlPronta}
                                  style={({ pressed }) => [
                                    styles.iconBtn,
                                    !urlPronta && styles.iconBtnDisabled,
                                    pressed && styles.iconBtnPressed,
                                  ]}
                                >
                                  <View style={styles.downloadWrap}>
                                    <View style={styles.downloadArrowHead} />
                                    <View style={styles.downloadArrowStem} />
                                    <View style={styles.downloadUnderline} />
                                  </View>
                                </Pressable>
                              </>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </>
                ) : (
                  <View style={styles.noDocumentosCard}>
                    <Text style={styles.noDocumentosText}>
                      Nenhum documento encontrado para esta solicitação
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Parcelamento */}
          {solicitacao.qtdeParcelas && solicitacao.qtdeParcelas > 1 && (
            <View style={styles.parcelamentoSection}>
              <Text style={styles.sectionTitle}>Parcelamento</Text>
              <ListParcela
                nomeParcela={`${solicitacao.qtdeParcelas}x de ${formatCurrency(getValorParcela())}`}
                quantidadeParcela={solicitacao.qtdeParcelas}
                valorParcela={formatCurrency(getValorParcela())}
              />
            </View>
          )}

          {/* Colaborador */}
          {solicitacao.colaborador && (
            <View style={styles.colaboradorSection}>
              <Text style={styles.sectionTitle}>Solicitante</Text>
              <View style={[styles.colaboradorCard, { borderLeftColor: statusColor }]}>
                <Text style={styles.colaboradorNome}>{solicitacao.colaborador.nome || "Nome não informado"}</Text>
                {solicitacao.colaborador.matricula && (
                  <Text style={styles.colaboradorInfo}>Matrícula: {solicitacao.colaborador.matricula}</Text>
                )}
                {solicitacao.colaborador.email && (
                  <Text style={styles.colaboradorInfo}>Email: {solicitacao.colaborador.email}</Text>
                )}
              </View>
            </View>
          )}

          {/* Dependente */}
          {solicitacao.dependente && (
            <View style={styles.dependenteSection}>
              <Text style={styles.sectionTitle}>Dependente</Text>
              <View style={[styles.dependenteCard, { borderLeftColor: statusColor }]}>
                <Text style={styles.dependenteNome}>{solicitacao.dependente.nome || "Nome não informado"}</Text>
                <Text style={styles.dependenteInfo}>
                  Grau de Parentesco: {solicitacao.dependente.grauParentesco || "Não informado"}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </Fundo>
  );
}

// ===== helpers visuais específicos =====
const getIconeExtensaoLabel = (ext) => {
  const e = (ext || "").toLowerCase();
  if (["doc", "docx"].includes(e)) return "DOC";
  if (["xls", "xlsx"].includes(e)) return "XLS";
  if (["ppt", "pptx"].includes(e)) return "PPT";
  if (["jpg", "jpeg"].includes(e)) return "JPG";
  return e.toUpperCase(); // PDF, PNG, etc.
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  errorContainer: { alignItems: "center", justifyContent: "center", padding: 40 },
  errorText: { fontSize: 16, color: "#DC2626", textAlign: "center" },

  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  headerCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  beneficioTitulo: { fontSize: 18, fontWeight: "bold", color: "#1F2937", flex: 1 },
  statusBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#00000030",
  },
  statusText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 14, color: "#6B7280", fontWeight: "500", flex: 1 },
  infoValue: { fontSize: 14, color: "#1F2937", fontWeight: "600", flex: 1, textAlign: "right" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1F2937", marginBottom: 12 },
  descricaoSection: { marginBottom: 16 },
  descricaoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  descricaoText: { fontSize: 15, color: "#1F2937", lineHeight: 22, textAlign: "left", fontWeight: "400" },
  documentosSection: { marginBottom: 16 },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  loadingText: { marginTop: 12, fontSize: 14, color: "#6B7280", textAlign: "center" },
  documentosStatus: { fontSize: 15, color: "#1F2937", fontWeight: "600", marginBottom: 12 },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#41AE8C",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    position: "relative",
  },
  tileInner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#1F6F58",
    opacity: 0.9,
  },
  tileText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  docNameWrap: { flex: 1, paddingRight: 8 },
  docName: { fontSize: 14, color: "#111827" },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnPressed: { opacity: 0.8 },
  iconBtnDisabled: { opacity: 0.45 },
  iconOnly: { 
    width: 22, 
    height: 16, 
    alignItems: "center", 
    justifyContent: "center",
    position: 'relative'
  },
  eyeOuter: {
    width: 20,
    height: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#111827",
    backgroundColor: 'transparent',
    position: 'absolute',
  },
  eyePupil: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#111827",
    top: 3,
  },
  downloadWrap: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadArrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#111827",
    marginTop: 5,
  },
  downloadArrowStem: {
    position: "absolute",
    top: 2,
    width: 2,
    height: 10,
    backgroundColor: "#111827",
  },
  downloadUnderline: {
    position: "absolute",
    bottom: 1,
    width: 18,
    height: 2,
    backgroundColor: "#111827",
  },
  parcelamentoSection: { marginBottom: 16 },
  colaboradorSection: { marginBottom: 16 },
  colaboradorCard: { 
    backgroundColor: "#F8F7F7",
    borderRadius: 8, 
    padding: 16, 
    borderLeftWidth: 4,
  },
  colaboradorNome: { fontSize: 16, fontWeight: "bold", color: "#1F2937", marginBottom: 4 },
  colaboradorInfo: { fontSize: 14, color: "#6B7280", marginBottom: 2 },
  dependenteSection: { marginBottom: 16 },
  dependenteCard: { 
    backgroundColor: "#F8F7F7",
    borderRadius: 8, 
    padding: 16, 
    borderLeftWidth: 4,
  },
  dependenteNome: { fontSize: 16, fontWeight: "bold", color: "#1F2937", marginBottom: 4 },
  dependenteInfo: { fontSize: 14, color: "#6B7280" },
  noDocumentosCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  noDocumentosText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});