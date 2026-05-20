import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Documento } from "@/api/entities";

export default function ListaDocumentos() {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [docAberto, setDocAberto] = useState(null);

  useEffect(() => {
    carregarDocumentos();
  }, []);

  const carregarDocumentos = async () => {
    setCarregando(true);
    try {
      const docs = await Documento.list("-created_date");
      setDocumentos(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const excluirDocumento = async (id) => {
    if (!confirm("Deseja excluir este documento?")) return;
    await Documento.delete(id);
    setDocAberto(null);
    carregarDocumentos();
  };

  const copiar = (texto) => {
    navigator.clipboard.writeText(texto);
    alert("Copiado!");
  };

  const ICONES = {
    "Contrato de Locação": "📑",
    "Notificação Extrajudicial": "📮",
    "Rescisão de Contrato": "🚫",
    "Proposta de Compra e Venda": "🏠",
    "Vistoria de Imóvel": "🔍",
    "Outro": "📄",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-800 text-white px-4 py-3 flex items-center gap-3 shadow">
        <button onClick={() => navigate("/")} className="text-purple-200 hover:text-white text-xl">←</button>
        <span className="text-xl">📁</span>
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight">Meus Documentos</h1>
          <p className="text-purple-300 text-xs">ImobiAI · {documentos.length} documento{documentos.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => navigate("/documentos/novo")}
          className="bg-purple-600 hover:bg-purple-500 text-sm px-3 py-1 rounded-lg"
        >
          + Novo
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {carregando ? (
          <div className="text-center text-gray-400 py-16">Carregando...</div>
        ) : documentos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500">Nenhum documento gerado ainda.</p>
            <button
              onClick={() => navigate("/documentos/novo")}
              className="mt-4 bg-purple-700 text-white px-6 py-2 rounded-xl text-sm hover:bg-purple-800"
            >
              Gerar primeiro documento
            </button>
          </div>
        ) : docAberto ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-2xl">{ICONES[docAberto.tipo] || "📄"}</span>
                  <h2 className="font-bold text-gray-800 mt-1">{docAberto.titulo}</h2>
                  <p className="text-sm text-gray-400">
                    {new Date(docAberto.created_date).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
                <button onClick={() => setDocAberto(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 max-h-[450px] overflow-y-auto font-sans">
                {docAberto.conteudo}
              </pre>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => copiar(docAberto.conteudo)}
                className="flex-1 bg-purple-700 text-white font-semibold py-3 rounded-xl hover:bg-purple-800"
              >
                📋 Copiar
              </button>
              <button
                onClick={() => excluirDocumento(docAberto.id)}
                className="bg-red-50 text-red-600 border border-red-200 font-semibold py-3 px-5 rounded-xl hover:bg-red-100"
              >
                🗑️
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {documentos.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setDocAberto(doc)}
                className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md transition flex items-center gap-4"
              >
                <span className="text-2xl flex-shrink-0">{ICONES[doc.tipo] || "📄"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{doc.titulo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {doc.tipo} · {new Date(doc.created_date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className="text-gray-300 text-lg">›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
