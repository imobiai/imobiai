import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Conversa } from "@/api/entities";

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
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    carregarConversas();
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
    setSidebarAberta(false);
  };

  const novaConversa = () => {
    setMensagens([]);
    setConversaId(null);
    setConversaAtual(null);
    setInput("");
    setSidebarAberta(false);
    inputRef.current?.focus();
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

  return (
    <div style={{ display: "flex", height: "100vh", background: "#212121", color: "white", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: "260px", flexShrink: 0,
        background: "#171717",
        display: "flex", flexDirection: "column",
        transition: "transform 0.25s",
        position: window.innerWidth < 768 ? "fixed" : "relative",
        inset: window.innerWidth < 768 ? "0 auto 0 0" : "auto",
        zIndex: 50,
        transform: window.innerWidth < 768 && !sidebarAberta ? "translateX(-100%)" : "translateX(0)",
      }}>
        {/* Logo + botão nova conversa */}
        <div style={{ padding: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, background: "white", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏢</div>
            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>ImobiAI</span>
          </div>
          <button onClick={novaConversa} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent", color: "rgba(255,255,255,0.8)", cursor: "pointer",
            fontSize: "0.85rem", fontWeight: 500, transition: "background 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <span style={{ fontSize: 16 }}>✏️</span> Nova consulta
          </button>
        </div>

        {/* Lista de conversas */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
          {conversas.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", textAlign: "center", marginTop: 24 }}>Nenhuma consulta ainda</p>
          )}
          {Object.entries(grupos).map(([grupo, lista]) => lista.length > 0 && (
            <div key={grupo}>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", fontWeight: 600, padding: "8px 10px 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{grupo}</p>
              {lista.map((conv) => (
                <div key={conv.id} onClick={() => abrirConversa(conv)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 2,
                    background: conversaAtual === conv.id ? "rgba(255,255,255,0.1)" : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (conversaAtual !== conv.id) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={e => { if (conversaAtual !== conv.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ flex: 1, fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {conv.titulo || "Consulta sem título"}
                  </span>
                  <button onClick={(e) => excluirConversa(e, conv.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", fontSize: 14, padding: "2px 4px", borderRadius: 4, flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}
                  >🗑</button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer sidebar */}
        <div style={{ padding: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => navigate("/")}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.82rem" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            ← Voltar ao início
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarAberta && (
        <div onClick={() => setSidebarAberta(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />
      )}

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

        {/* Header mobile */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => setSidebarAberta(true)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 20, marginRight: 12, padding: 4 }}>
            ☰
          </button>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>ImobiAI</span>

          {/* Seletor de perfil */}
          <div style={{ marginLeft: "auto" }}>
            <select value={tipoUsuario} onChange={(e) => setTipoUsuario(e.target.value)}
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "6px 10px", fontSize: "0.8rem", cursor: "pointer" }}>
              {["Imobiliária", "Corretor", "Proprietário", "Advogado", "Outro"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Área de mensagens */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
          {mensagens.length === 0 ? (
            /* Tela inicial */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", paddingBottom: 80 }}>
              <div style={{ width: 56, height: 56, background: "white", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>🏢</div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "white", marginBottom: 8, textAlign: "center" }}>Como posso ajudar?</h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", marginBottom: 32, textAlign: "center" }}>Especialista em Direito Imobiliário Brasileiro</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 560 }}>
                {SUGESTOES.map((s, i) => (
                  <button key={i} onClick={() => enviarMensagem(s.texto)}
                    style={{
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12, padding: "14px 16px", textAlign: "left", cursor: "pointer",
                      color: "rgba(255,255,255,0.75)", fontSize: "0.83rem", lineHeight: 1.4,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  >
                    <span style={{ display: "block", fontSize: 18, marginBottom: 6 }}>{s.icon}</span>
                    {s.texto}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Mensagens */
            <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: 24, paddingBottom: 24 }}>
              {mensagens.map((msg, i) => (
                <div key={i} style={{ marginBottom: 24, display: "flex", gap: 14, alignItems: "flex-start" }}>
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                    background: msg.role === "user" ? "#2563eb" : "#19c37d",
                    color: "white", fontWeight: 700,
                  }}>
                    {msg.role === "user" ? "U" : "🏢"}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginBottom: 6, fontWeight: 500 }}>
                      {msg.role === "user" ? "Você" : "ImobiAI"}
                    </p>
                    <div style={{
                      fontSize: "0.92rem", lineHeight: 1.7,
                      color: msg.role === "user" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.85)",
                    }}>
                      {msg.role === "assistant"
                        ? <div dangerouslySetInnerHTML={{ __html: formatarTexto(msg.content) }} />
                        : <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                      }
                    </div>
                  </div>
                </div>
              ))}

              {/* Indicador de digitação */}
              {carregando && (
                <div style={{ marginBottom: 24, display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#19c37d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🏢</div>
                  <div style={{ paddingTop: 8 }}>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginBottom: 6, fontWeight: 500 }}>ImobiAI</p>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      {[0, 1, 2].map(n => (
                        <div key={n} style={{
                          width: 7, height: 7, borderRadius: "50%", background: "#19c37d",
                          animation: "pulse 1.2s ease-in-out infinite",
                          animationDelay: `${n * 0.2}s`,
                          opacity: 0.6,
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

        {/* ── INPUT ── */}
        <div style={{ padding: "12px 16px 20px", background: "#212121" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{
              display: "flex", alignItems: "flex-end", gap: 10,
              background: "#2f2f2f", borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "10px 14px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
            }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Faça sua pergunta jurídica..."
                rows={1}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "white", fontSize: "0.9rem", lineHeight: 1.6, resize: "none",
                  fontFamily: "inherit", maxHeight: 160, overflowY: "auto",
                  caretColor: "white",
                }}
              />
              <button
                onClick={() => enviarMensagem()}
                disabled={carregando || !input.trim()}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: "none",
                  background: input.trim() && !carregando ? "#19c37d" : "rgba(255,255,255,0.1)",
                  color: input.trim() && !carregando ? "white" : "rgba(255,255,255,0.3)",
                  cursor: input.trim() && !carregando ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, transition: "all 0.15s", flexShrink: 0,
                }}
              >
                ↑
              </button>
            </div>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.72rem", textAlign: "center", marginTop: 8 }}>
              ImobiAI pode cometer erros. Consulte um advogado para decisões importantes.
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        select option { background: #2f2f2f; color: white; }
      `}</style>
    </div>
  );
}
