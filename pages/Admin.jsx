import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Conversa, Documento } from "@/api/entities";

export default function Admin() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [aba, setAba] = useState("conversas");
  const [conversas, setConversas] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    User.me()
      .then((u) => {
        if (u?.role !== "admin") {
          navigate("/");
          return;
        }
        setUsuario(u);
        carregarDados();
      })
      .catch(() => navigate("/"));
  }, []);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const [convs, docs] = await Promise.all([
        Conversa.list("-created_date"),
        Documento.list("-created_date"),
      ]);
      setConversas(convs);
      setDocumentos(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const PERFIL_COR = {
    "Imobiliária": "bg-blue-100 text-blue-700",
    "Corretor": "bg-green-100 text-green-700",
    "Proprietário": "bg-orange-100 text-orange-700",
    "Advogado": "bg-purple-100 text-purple-700",
    "Outro": "bg-gray-100 text-gray-600",
  };

  const ICONES_DOC = {
    "Contrato de Locação": "📑",
    "Notificação Extrajudicial": "📮",
    "Rescisão de Contrato": "🚫",
    "Proposta de Compra e Venda": "🏠",
    "Vistoria de Imóvel": "🔍",
  };

  const stats = [
    { label: "Consultas", valor: conversas.length, icon: "💬", cor: "bg-orange-50 text-orange-700" },
    { label: "Documentos", valor: documentos.length, icon: "📄", cor: "bg-green-50 text-green-700" },
    {
      label: "Hoje",
      valor: conversas.filter((c) => {
        const hoje = new Date().toDateString();
        return new Date(c.created_date).toDateString() === hoje;
      }).length,
      icon: "⚡",
      cor: "bg-purple-50 text-purple-700",
    },
  ];

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center gap-3 shadow">
        <button onClick={() => navigate("/")} className="text-gray-400 hover:text-white text-xl">←</button>
        <span className="text-xl">🛡️</span>
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight">Painel Administrativo</h1>
          <p className="text-gray-400 text-xs">ImobiAI · Visão geral da plataforma</p>
        </div>
        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-medium">ADMIN</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((s) => (
            <div key={s.label} className={`${s.cor} rounded-2xl p-4 text-center`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold">{s.valor}</div>
              <div className="text-xs font-medium opacity-80">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          {[
            { key: "conversas", label: "💬 Consultas" },
            { key: "documentos", label: "📄 Documentos" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setAba(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                aba === tab.key
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {carregando ? (
          <div className="text-center text-gray-400 py-16">Carregando...</div>
        ) : (
          <>
            {aba === "conversas" && (
              <div className="space-y-3">
                {conversas.length === 0 && (
                  <p className="text-center text-gray-400 py-8">Nenhuma consulta registrada.</p>
                )}
                {conversas.map((c) => (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <span className="text-xl">💬</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{c.titulo}</p>
                      <p className="text-xs text-gray-400">
                        {(c.mensagens || []).length} msgs · {new Date(c.created_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {c.tipo_usuario && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PERFIL_COR[c.tipo_usuario] || "bg-gray-100 text-gray-600"}`}>
                        {c.tipo_usuario}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {aba === "documentos" && (
              <div className="space-y-3">
                {documentos.length === 0 && (
                  <p className="text-center text-gray-400 py-8">Nenhum documento gerado.</p>
                )}
                {documentos.map((d) => (
                  <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <span className="text-xl">{ICONES_DOC[d.tipo] || "📄"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{d.titulo}</p>
                      <p className="text-xs text-gray-400">
                        {d.tipo} · {new Date(d.created_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      d.status === "finalizado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
