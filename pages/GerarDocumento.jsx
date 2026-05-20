import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Documento } from "@/api/entities";

const TIPOS_DOCUMENTO = [
  "Contrato de Locação",
  "Notificação Extrajudicial",
  "Rescisão de Contrato",
  "Proposta de Compra e Venda",
  "Vistoria de Imóvel",
];

const CAMPOS_POR_TIPO = {
  "Contrato de Locação": [
    { key: "locador", label: "Nome do Locador (proprietário)", placeholder: "Ex: João da Silva" },
    { key: "locatario", label: "Nome do Locatário (inquilino)", placeholder: "Ex: Maria Oliveira" },
    { key: "imovel", label: "Endereço do Imóvel", placeholder: "Ex: Rua das Flores, 123, Apto 45, São Paulo/SP" },
    { key: "valor_aluguel", label: "Valor do Aluguel (R$)", placeholder: "Ex: 2.500,00" },
    { key: "dia_vencimento", label: "Dia de Vencimento", placeholder: "Ex: 10" },
    { key: "prazo", label: "Prazo do Contrato", placeholder: "Ex: 30 meses" },
    { key: "garantia", label: "Tipo de Garantia", placeholder: "Ex: Fiança / Caução / Seguro-fiança" },
    { key: "dados_adicionais", label: "Informações adicionais (opcional)", placeholder: "Ex: permitido pets, vaga de garagem inclusa..." },
  ],
  "Notificação Extrajudicial": [
    { key: "remetente", label: "Nome do Remetente", placeholder: "Ex: João da Silva" },
    { key: "destinatario", label: "Nome do Destinatário", placeholder: "Ex: Maria Oliveira" },
    { key: "motivo", label: "Motivo da Notificação", placeholder: "Ex: Falta de pagamento de aluguel" },
    { key: "valor_debito", label: "Valor em Débito (se houver)", placeholder: "Ex: R$ 3.000,00" },
    { key: "prazo_regularizacao", label: "Prazo para Regularização", placeholder: "Ex: 15 dias a partir do recebimento" },
    { key: "dados_adicionais", label: "Informações adicionais (opcional)", placeholder: "..." },
  ],
  "Rescisão de Contrato": [
    { key: "locador", label: "Nome do Locador", placeholder: "Ex: João da Silva" },
    { key: "locatario", label: "Nome do Locatário", placeholder: "Ex: Maria Oliveira" },
    { key: "imovel", label: "Endereço do Imóvel", placeholder: "Ex: Rua das Flores, 123" },
    { key: "data_rescisao", label: "Data da Rescisão", placeholder: "Ex: 30/06/2025" },
    { key: "motivo", label: "Motivo da Rescisão", placeholder: "Ex: Acordo entre as partes / Inadimplência" },
    { key: "multa", label: "Multa Rescisória (se aplicável)", placeholder: "Ex: R$ 1.500,00 ou não aplicável" },
    { key: "caucao", label: "Devolução de Caução (se aplicável)", placeholder: "Ex: R$ 2.500,00 a ser devolvido" },
    { key: "dados_adicionais", label: "Informações adicionais (opcional)", placeholder: "..." },
  ],
  "Proposta de Compra e Venda": [
    { key: "vendedor", label: "Nome do Vendedor", placeholder: "Ex: João da Silva" },
    { key: "comprador", label: "Nome do Comprador", placeholder: "Ex: Maria Oliveira" },
    { key: "imovel", label: "Descrição do Imóvel", placeholder: "Ex: Apartamento, 80m², 2 quartos, Rua X, SP" },
    { key: "valor", label: "Valor Proposto (R$)", placeholder: "Ex: 450.000,00" },
    { key: "forma_pagamento", label: "Forma de Pagamento", placeholder: "Ex: À vista / Financiamento CAIXA / Parcelado" },
    { key: "prazo_escritura", label: "Prazo para Escritura", placeholder: "Ex: 60 dias após aceite" },
    { key: "condicoes", label: "Condições Especiais", placeholder: "Ex: sujeito à aprovação de financiamento" },
    { key: "dados_adicionais", label: "Informações adicionais (opcional)", placeholder: "..." },
  ],
  "Vistoria de Imóvel": [
    { key: "imovel", label: "Endereço do Imóvel", placeholder: "Ex: Rua das Flores, 123, Apto 45" },
    { key: "data_vistoria", label: "Data da Vistoria", placeholder: "Ex: 20/05/2025" },
    { key: "tipo_vistoria", label: "Tipo de Vistoria", placeholder: "Entrada ou Saída" },
    { key: "locatario", label: "Nome do Locatário", placeholder: "Ex: Maria Oliveira" },
    { key: "condicoes", label: "Condições Gerais do Imóvel", placeholder: "Ex: Bom estado, pintura nova, sem danos..." },
    { key: "comodos", label: "Observações por Cômodo", placeholder: "Ex: Sala - ok; Quarto 1 - mancha na parede; Banheiro - torneira com vazamento..." },
    { key: "dados_adicionais", label: "Informações adicionais (opcional)", placeholder: "..." },
  ],
};

export default function GerarDocumento() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState("");
  const [dados, setDados] = useState({});
  const [gerando, setGerando] = useState(false);
  const [documentoGerado, setDocumentoGerado] = useState(null);
  const [erro, setErro] = useState(null);

  const campos = CAMPOS_POR_TIPO[tipo] || [];

  const handleGerar = async () => {
    if (!tipo) return;
    setGerando(true);
    setErro(null);

    try {
      const res = await fetch("/functions/gerarDocumento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo_documento: tipo, dados }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setDocumentoGerado(data.documento);

      // Salvar no banco
      await Documento.create({
        tipo,
        titulo: `${tipo} — ${new Date().toLocaleDateString("pt-BR")}`,
        conteudo: data.documento,
        dados_preenchimento: dados,
        status: "finalizado",
      });
    } catch (err) {
      setErro("Erro ao gerar documento: " + err.message);
    } finally {
      setGerando(false);
    }
  };

  const copiarDocumento = () => {
    navigator.clipboard.writeText(documentoGerado);
    alert("Documento copiado para a área de transferência!");
  };

  const novoDocumento = () => {
    setTipo("");
    setDados({});
    setDocumentoGerado(null);
    setErro(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-800 text-white px-4 py-3 flex items-center gap-3 shadow">
        <button onClick={() => navigate("/")} className="text-green-200 hover:text-white text-xl">←</button>
        <span className="text-xl">📄</span>
        <div>
          <h1 className="font-bold text-lg leading-tight">Gerar Documento</h1>
          <p className="text-green-300 text-xs">ImobiAI · Documentos Jurídicos</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {!documentoGerado ? (
          <div className="bg-white rounded-2xl shadow p-6 space-y-5">
            {/* Tipo de documento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Documento *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TIPOS_DOCUMENTO.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTipo(t); setDados({}); }}
                    className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition ${
                      tipo === t
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-gray-200 text-gray-600 hover:border-green-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Campos dinâmicos */}
            {campos.length > 0 && (
              <div className="space-y-4">
                <hr />
                <p className="text-sm text-gray-500">Preencha os dados para gerar o documento:</p>
                {campos.map((campo) => (
                  <div key={campo.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {campo.label}
                    </label>
                    <input
                      type="text"
                      placeholder={campo.placeholder}
                      value={dados[campo.key] || ""}
                      onChange={(e) => setDados({ ...dados, [campo.key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                ))}
              </div>
            )}

            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {erro}
              </div>
            )}

            <button
              onClick={handleGerar}
              disabled={!tipo || gerando}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl disabled:opacity-40 transition"
            >
              {gerando ? "⏳ Gerando documento..." : "✨ Gerar Documento"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <span>✅</span> Documento gerado com sucesso!
                </h2>
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  {tipo}
                </span>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 max-h-[500px] overflow-y-auto font-sans">
                {documentoGerado}
              </pre>
            </div>
            <div className="flex gap-3">
              <button
                onClick={copiarDocumento}
                className="flex-1 bg-green-700 text-white font-semibold py-3 rounded-xl hover:bg-green-800 transition"
              >
                📋 Copiar Documento
              </button>
              <button
                onClick={novoDocumento}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-300 transition"
              >
                🔄 Novo Documento
              </button>
            </div>
            <button
              onClick={() => navigate("/documentos")}
              className="w-full border border-gray-300 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50 transition"
            >
              Ver todos os documentos →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
