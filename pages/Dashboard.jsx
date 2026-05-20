import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Conversa, Documento } from "@/api/entities";

export default function Dashboard() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [conversasRecentes, setConversasRecentes] = useState([]);
  const [docRecentes, setDocRecentes] = useState([]);
  const [sidebarAberta, setSidebarAberta] = useState(false);

  useEffect(() => {
    User.me().then(setUsuario).catch(() => setUsuario(null));
    Conversa.list("-created_date").then((c) => setConversasRecentes(c.slice(0, 8))).catch(() => {});
    Documento.list("-created_date").then((d) => setDocRecentes(d.slice(0, 5))).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await User.logout();
    setUsuario(null);
    window.location.reload();
  };

  const sugestoes = [
    {
      icon: "📋",
      titulo: "Contrato de locação",
      desc: "Gerar contrato residencial completo",
      acao: () => navigate("/documentos/novo"),
    },
    {
      icon: "⚖️",
      titulo: "Direitos do inquilino",
      desc: "Quais são meus direitos como locatário?",
      acao: () => navigate("/chat", { state: { perguntaInicial: "Quais são os direitos do inquilino na Lei do Inquilinato?" } }),
    },
    {
      icon: "📮",
      titulo: "Notificação extrajudicial",
      desc: "Notificar inquilino inadimplente",
      acao: () => navigate("/documentos/novo"),
    },
    {
      icon: "🔑",
      titulo: "Rescisão antecipada",
      desc: "O que diz a lei sobre rescisão antes do prazo?",
      acao: () => navigate("/chat", { state: { perguntaInicial: "Quais as regras para rescisão antecipada de contrato de locação?" } }),
    },
  ];

  const primeiroNome = usuario?.full_name?.split(" ")[0] || null;

  return (
    <div className="flex h-screen bg-[#212121] text-white overflow-hidden">

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#171717] w-64 transform transition-transform duration-300 ${
          sidebarAberta ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 md:flex md:w-64`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-lg">🏢</div>
          <span className="font-semibold text-white text-base">ImobiAI</span>
        </div>

        {/* Ações rápidas */}
        <div className="px-3 pt-3">
          <button
            onClick={() => navigate("/chat")}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 transition"
          >
            <span className="text-lg">✏️</span>
            <span>Nova consulta</span>
          </button>
          <button
            onClick={() => navigate("/documentos/novo")}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 transition"
          >
            <span className="text-lg">📄</span>
            <span>Novo documento</span>
          </button>
        </div>

        {/* Histórico recente */}
        <div className="flex-1 overflow-y-auto px-3 pt-5 pb-3">
          {conversasRecentes.length > 0 && (
            <>
              <p className="text-xs text-white/40 font-medium px-2 mb-2 uppercase tracking-wider">Recentes</p>
              {conversasRecentes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate("/historico")}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 truncate transition"
                >
                  {c.titulo}
                </button>
              ))}
            </>
          )}
          {docRecentes.length > 0 && (
            <>
              <p className="text-xs text-white/40 font-medium px-2 mt-4 mb-2 uppercase tracking-wider">Documentos</p>
              {docRecentes.map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate("/documentos")}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 truncate transition"
                >
                  📄 {d.titulo}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer do sidebar */}
        <div className="border-t border-white/10 p-3 space-y-1">
          {usuario?.role === "admin" && (
            <button
              onClick={() => navigate("/admin")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-white/10 transition"
            >
              <span>🛡️</span> Painel Admin
            </button>
          )}
          <button
            onClick={() => navigate("/historico")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 transition"
          >
            <span>💼</span> Histórico
          </button>
          <button
            onClick={() => navigate("/documentos")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 transition"
          >
            <span>📁</span> Meus documentos
          </button>

          {/* Usuário logado ou botão de login */}
          {usuario ? (
            <div
              className="flex items-center gap-2 px-3 py-2 mt-1 rounded-lg hover:bg-white/10 transition cursor-pointer group"
              onClick={handleLogout}
            >
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {(usuario.full_name || usuario.email || "U")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{usuario.full_name || usuario.email}</p>
                {usuario.tipo_usuario && (
                  <p className="text-xs text-white/40 truncate">{usuario.tipo_usuario}</p>
                )}
              </div>
              <span className="text-xs text-white/30 group-hover:text-white/60 transition">Sair</span>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-400 hover:bg-white/10 transition"
            >
              <span>🔐</span> Entrar / Criar conta
            </button>
          )}
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarAberta && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar mobile */}
        <div className="flex items-center px-4 py-3 md:hidden border-b border-white/10">
          <button onClick={() => setSidebarAberta(true)} className="text-white/60 hover:text-white text-xl mr-3">
            ☰
          </button>
          <div className="flex items-center gap-2">
            <span>🏢</span>
            <span className="font-semibold text-sm">ImobiAI</span>
          </div>
        </div>

        {/* Área central */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl">

            {/* Saudação */}
            <div className="text-center mb-10">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 shadow-lg">
                🏢
              </div>
              <h1 className="text-3xl font-semibold text-white mb-2">
                {primeiroNome ? `Olá, ${primeiroNome}!` : "Olá!"}
              </h1>
              <p className="text-white/50 text-lg">Como posso ajudar com direito imobiliário hoje?</p>
            </div>

            {/* Barra de pergunta rápida */}
            <div
              onClick={() => navigate("/chat")}
              className="w-full flex items-center gap-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-white/10 rounded-2xl px-5 py-4 cursor-pointer transition mb-8 group"
            >
              <span className="text-white/40 text-lg">🔍</span>
              <span className="text-white/40 text-sm flex-1">Faça uma pergunta jurídica...</span>
              <span className="text-white/20 group-hover:text-white/40 text-sm transition">↵</span>
            </div>

            {/* Sugestões */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sugestoes.map((s, i) => (
                <button
                  key={i}
                  onClick={s.acao}
                  className="flex items-start gap-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-white/10 rounded-xl px-4 py-4 text-left transition group"
                >
                  <span className="text-xl mt-0.5 flex-shrink-0">{s.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white/90 group-hover:text-white transition">{s.titulo}</p>
                    <p className="text-xs text-white/40 mt-0.5">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center text-white/20 text-xs mt-10">
              ImobiAI pode cometer erros. Consulte um advogado para decisões importantes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
