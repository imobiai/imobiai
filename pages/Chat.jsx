import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Conversa, User } from "@/api/entities";

const SUGESTOES = [
  { icon: "📋", texto: "Como fazer um contrato de locação válido?" },
  { icon: "⚠️", texto: "Inquilino não paga há 2 meses. O que fazer?" },
  { icon: "🔑", texto: "Quais são as regras para rescisão antecipada?" },
  { icon: "🏠", texto: "Quais garantias posso exigir na locação?" },
];

function formatarTexto(texto) {
  return texto
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/### (.*?)(\n|$)/g, "<h3 style='font-weight:700;font-size:1rem;margin:14px 0 6px'>$1</h3>")
    .replace(/## (.*?)(\n|$)/g, "<h2 style='font-weight:700;font-size:1.1rem;margin:16px 0 8px'>$1</h2>")
    .replace(/^- (.*?)(\n|$)/gm, "<li style='margin-left:20px;list-style:disc;margin-bottom:4px'>$1</li>")
    .replace(/^\d+\. (.*?)(\n|$)/gm, "<li style='margin-left:20px;list-style:decimal;margin-bottom:4px'>$1</li>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

export default function Chat() {
  const navigate = useNavigate();
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState("Imobiliária");
  const [conversaId, setConversaId] = useState(null);
  const [conversas, setConversas] = useState([]);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [conversaAtual, setConversaAtual] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    carregarConversas();
    User.me().then(setUsuario).catch(() => setUsuario(null));
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, carregando]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const carregarConversas = async () => {
    try {
      const lista = await Conversa.list("-created_date");
      setConversas(lista);
    } catch (e) {}
  };

  const abrirConversa = (conv) => {
    setConversaAtual(conv.id);
    setConversaId(conv.id);
    setMensagens(conv.mensagens || []);
    setTipoUsuario(conv.tipo_usuario || "Imobiliária");
    if (isMobile) setSidebarAberta(false);
  };

  const novaConversa = () => {
    setMensagens([]);
    setConversaId(null);
    setConversaAtual(null);
    setInput("");
    if (isMobile) setSidebarAberta(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const excluirConversa = async (e, id) => {
    e.stopPropagation();
    await Conversa.delete(id);
    if (conversaAtual === id) novaConversa();
    carregarConversas();
  };

  const enviarMensagem = async (texto) => {
    const msg = texto || input.trim();
    if (!msg || carregando) return;

    setInput("");
    const novasMensagens = [
      ...mensagens,
      { role: "user", content: msg, timestamp: new Date().toISOString() },
    ];
    setMensagens(novasMensagens);
    setCarregando(true);

    try {
      const historico = novasMensagens.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/functions/consultaJuridica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagem: msg,
          historico: historico.slice(0, -1),
          tipo_usuario: tipoUsuario,
        }),
      });

      const data = await res.json();
      const resposta = data.resposta || "Erro ao obter resposta.";

      const mensagensAtualizadas = [
        ...novasMensagens,
        { role: "assistant", content: resposta, timestamp: new Date().toISOString() },
      ];
      setMensagens(mensagensAtualizadas);

      if (!conversaId) {
        const conv = await Conversa.create({
          titulo: msg.slice(0, 60),
          tipo_usuario: tipoUsuario,
          mensagens: mensagensAtualizadas,
          status: "ativa",
        });
        setConversaId(conv.id);
        setConversaAtual(conv.id);
        carregarConversas();
      } else {
        await Conversa.update(conversaId, { mensagens: mensagensAtualizadas });
        carregarConversas();
      }
    } catch (err) {
      setMensagens((prev) => [
        ...prev,
        { role: "assistant", content: "Erro ao processar sua consulta. Tente novamente.", timestamp: new Date().toISOString() },
      ]);
    } finally {
      setCarregando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  const handleLogout = async () => {
    try { await User.logout(); } catch (e) {}
    setUsuario(null);
    window.location.reload();
  };

  const agruparConversas = () => {
    const hoje = new Date().toDateString();
    const ontem = new Date(Date.now() - 86400000).toDateString();
    const grupos = { "Hoje": [], "Ontem": [], "Anteriores": [] };
    conversas.forEach((c) => {
      const d = new Date(c.created_date).toDateString();
      if (d === hoje) grupos["Hoje"].push(c);
      else if (d === ontem) grupos["Ontem"].push(c);
      else grupos["Anteriores"].push(c);
    });
    return grupos;
  };

  const grupos = agruparConversas();
  const sidebarVisivel = !isMobile || sidebarAberta;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#212121", color: "white", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>

      {/* ── SIDEBAR ── */}
      {sidebarVisivel && (
        <aside style={{
          width: 260, flexShrink: 0,
          background: "#171717",
          display: "flex", flexDirection: "column",
          position: isMobile ? "fixed" : "relative",
          inset: isMobile ? "0 auto 0 0" : "auto",
          zIndex: 50,
          height: "100vh",
        }}>

          {/* Topo */}
          <div style={{ padding: "12px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, background: "white", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🏢</div>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "white" }}>ImobiAI</span>
            </div>

            <button onClick={novaConversa} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "9px 10px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent", color: "rgba(255,255,255,0.75)", cursor: "pointer",
              fontSize: "0.83rem", fontWeight: 500,
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span>✏️</span> Nova consulta
            </button>
          </div>

          {/* Histórico */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
            {conversas.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem", textAlign: "center", marginTop: 20, padding: "0 12px" }}>
                Suas consultas aparecerão aqui
              </p>
            ) : (
              Object.entries(grupos).map(([grupo, lista]) => lista.length > 0 && (
                <div key={grupo}>
                  <p style={{ color: "rgba(255,255,255,0.28)", fontSize: "0.68rem", fontWeight: 600, padding: "10px 10px 4px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{grupo}</p>
                  {lista.map((conv) => (
                    <div key={conv.id} onClick={() => abrirConversa(conv)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 1,
                        background: conversaAtual === conv.id ? "rgba(255,255,255,0.1)" : "transparent",
                      }}
                      onMouseEnter={e => { if (conversaAtual !== conv.id) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                      onMouseLeave={e => { if (conversaAtual !== conv.id) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ flex: 1, fontSize: "0.81rem", color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {conv.titulo || "Consulta"}
                      </span>
                      <button onClick={(e) => excluirConversa(e, conv.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.15)", fontSize: 13, padding: "2px 3px", borderRadius: 4, flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.15)"}
                      >🗑</button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Links inferiores */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "8px 6px" }}>
            <SidebarBtn icon="📄" label="Gerar documento" onClick={() => navigate("/documentos/novo")} />
            <SidebarBtn icon="📁" label="Meus documentos" onClick={() => navigate("/documentos")} />
            {usuario?.role === "admin" && (
              <SidebarBtn icon="🛡️" label="Painel Admin" onClick={() => navigate("/admin")} color="#f87171" />
            )}
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "6px 4px" }} />
            {usuario ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {(usuario.full_name || usuario.email || "U")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {usuario.full_name || usuario.email}
                  </p>
                </div>
                <button onClick={handleLogout}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", fontSize: "0.7rem", padding: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}
                  title="Sair"
                >⏻</button>
              </div>
            ) : (
              <SidebarBtn icon="🔐" label="Entrar / Criar conta" onClick={() => navigate("/login")} color="#60a5fa" />
            )}
          </div>
        </aside>
      )}

      {/* Overlay mobile */}
      {isMobile && sidebarAberta && (
        <div onClick={() => setSidebarAberta(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40 }} />
      )}

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          {isMobile && (
            <button onClick={() => setSidebarAberta(true)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 20, marginRight: 12, padding: 4 }}>
              ☰
            </button>
          )}
          <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
            {mensagens.length > 0
              ? conversas.find(c => c.id === conversaAtual)?.titulo || "Nova consulta"
              : "ImobiAI — Direito Imobiliário"}
          </span>
          <div style={{ marginLeft: "auto" }}>
            <select value={tipoUsuario} onChange={(e) => setTipoUsuario(e.target.value)}
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", borderRadius: 8, padding: "5px 10px", fontSize: "0.78rem", cursor: "pointer", outline: "none" }}>
              {["Imobiliária", "Corretor", "Proprietário", "Advogado", "Outro"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Mensagens */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
          {mensagens.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", paddingBottom: 60 }}>
              <div style={{ width: 52, height: 52, background: "white", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 18, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>🏢</div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "white", marginBottom: 8, textAlign: "center" }}>Como posso ajudar?</h1>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.88rem", marginBottom: 28, textAlign: "center" }}>
                Especialista em Direito Imobiliário Brasileiro
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 540 }}>
                {SUGESTOES.map((s, i) => (
                  <button key={i} onClick={() => enviarMensagem(s.texto)}
                    style={{
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12, padding: "14px 14px", textAlign: "left", cursor: "pointer",
                      color: "rgba(255,255,255,0.72)", fontSize: "0.82rem", lineHeight: 1.45,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  >
                    <span style={{ display: "block", fontSize: 17, marginBottom: 5 }}>{s.icon}</span>
                    {s.texto}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: 24, paddingBottom: 20 }}>
              {mensagens.map((msg, i) => (
                <div key={i} style={{ marginBottom: 28, display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: msg.role === "user" ? "#2563eb" : "#19c37d",
                    fontSize: msg.role === "user" ? 13 : 14, fontWeight: 700, color: "white",
                  }}>
                    {msg.role === "user" ? "U" : "🏢"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginBottom: 6, fontWeight: 600 }}>
                      {msg.role === "user" ? "Você" : "ImobiAI"}
                    </p>
                    <div style={{ fontSize: "0.91rem", lineHeight: 1.75, color: "rgba(255,255,255,0.87)" }}>
                      {msg.role === "assistant"
                        ? <div dangerouslySetInnerHTML={{ __html: formatarTexto(msg.content) }} />
                        : <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                      }
                    </div>
                  </div>
                </div>
              ))}

              {carregando && (
                <div style={{ marginBottom: 28, display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#19c37d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🏢</div>
                  <div style={{ paddingTop: 6 }}>
                    <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginBottom: 8, fontWeight: 600 }}>ImobiAI</p>
                    <div style={{ display: "flex", gap: 5 }}>
                      {[0, 1, 2].map(n => (
                        <div key={n} style={{
                          width: 7, height: 7, borderRadius: "50%", background: "#19c37d",
                          animation: `blink 1.2s ease-in-out ${n * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: "10px 16px 18px", background: "#212121", flexShrink: 0 }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{
              display: "flex", alignItems: "flex-end", gap: 10,
              background: "#2f2f2f", borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "10px 12px 10px 16px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
            }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Faça sua pergunta jurídica... (Enter para enviar)"
                rows={1}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "white", fontSize: "0.9rem", lineHeight: 1.6, resize: "none",
                  fontFamily: "inherit", maxHeight: 160, overflowY: "auto",
                  paddingTop: 2,
                }}
              />
              <button
                onClick={() => enviarMensagem()}
                disabled={carregando || !input.trim()}
                style={{
                  width: 34, height: 34, borderRadius: 9, border: "none", flexShrink: 0,
                  background: input.trim() && !carregando ? "#19c37d" : "rgba(255,255,255,0.08)",
                  color: input.trim() && !carregando ? "white" : "rgba(255,255,255,0.25)",
                  cursor: input.trim() && !carregando ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 17, transition: "all 0.15s",
                }}
              >↑</button>
            </div>
            <p style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.7rem", textAlign: "center", marginTop: 8 }}>
              ImobiAI pode cometer erros. Consulte um advogado para decisões importantes.
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0.25; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        textarea::placeholder { color: rgba(255,255,255,0.22); }
        select option { background: #2f2f2f; color: white; }
      `}</style>
    </div>
  );
}

function SidebarBtn({ icon, label, onClick, color }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: "8px 10px", borderRadius: 8, border: "none",
        background: hover ? "rgba(255,255,255,0.07)" : "transparent",
        color: color || "rgba(255,255,255,0.5)",
        cursor: "pointer", fontSize: "0.82rem", textAlign: "left",
        transition: "background 0.15s",
      }}>
      <span>{icon}</span> {label}
    </button>
  );
}
