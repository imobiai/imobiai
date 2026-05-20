import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Conversa, Documento } from "@/api/entities";

export default function Admin() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [aba, setAba] = useState("usuarios");
  const [usuarios, setUsuarios] = useState([]);
  const [conversas, setConversas] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    User.me()
      .then((u) => {
        if (u.role !== "admin") {
          navigate("/");
          return;
        }
        setUsuario(u);
        carregarDados();
      })
      .catch(() => navigate("/login"));
  }, []);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const [us, convs, docs] = await Promise.all([
        User.list(),
        Conversa.list("-created_date"),
        Documento.list("-created_date"),
      ]);
      setUsuarios(us);
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
    { label: "Usuários", valor: usuarios.length, icon: "👥", cor: "bg-blue-50 text-blue-700" },
    { label: "Consultas", valor: conversas.length, icon: "💬", cor: "bg-orange-50 text-orange-700" },
    { label: "Documentos", valor: documentos.length, icon: "📄", cor: "bg-green-50 text-green-700" },
    {
      label: "Msgs hoje",
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
      {/* Header */}
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
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {stats.map((s) => (
            <div key={s.label} className={`${s.cor} rounded-2xl p-4 text-center`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold">{s.valor}</div>
              <div className="text-xs font-medium opacity-80">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-2 mb-4">
          {[
            { key: "usuarios", label: "👥 Usuários" },
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
            {/* Usuários */}
            {aba === "usuarios" && (
              <div className="space-y-3">
                {usuarios.length === 0 && (
                  <p className="text-center text-gray-400 py-8">Nenhum usuário cadastrado.</p>
                )}
                {usuarios.map((u) => (
                  <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600">
                      {(u.full_name || u.email || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{u.full_name || "—"}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {u.tipo_usuario && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PERFIL_COR[u.tipo_usuario] || "bg-gray-100 text-gray-600"}`}>
                          {u.tipo_usuario}
                        </span>
                      )}
                      {u.role === "admin" && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">admin</span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(u.created_date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Consultas */}
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

            {/* Documentos */}
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
