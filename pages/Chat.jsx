import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Conversa } from "@/api/entities";

const TIPO_USUARIO_OPTIONS = [
  "Imobiliária",
  "Corretor",
  "Proprietário",
  "Advogado",
  "Outro",
];

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState("Imobiliária");
  const [conversaId, setConversaId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const perguntaInicial = location.state?.perguntaInicial;
    if (perguntaInicial) {
      enviarMensagem(perguntaInicial);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

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

      // Salvar conversa
      if (!conversaId) {
        const conv = await Conversa.create({
          titulo: msg.slice(0, 60),
          tipo_usuario: tipoUsuario,
          mensagens: mensagensAtualizadas,
          status: "ativa",
        });
        setConversaId(conv.id);
      } else {
        await Conversa.update(conversaId, { mensagens: mensagensAtualizadas });
      }
    } catch (err) {
      setMensagens((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Erro ao processar sua consulta. Tente novamente.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setCarregando(false);
    }
  };

  const novaConversa = () => {
    setMensagens([]);
    setConversaId(null);
    setInput("");
  };

  const formatarTexto = (texto) => {
    return texto
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/### (.*?)(\n|$)/g, "<h3 class='font-bold text-base mt-3 mb-1'>$1</h3>")
      .replace(/## (.*?)(\n|$)/g, "<h2 class='font-bold text-lg mt-3 mb-1'>$1</h2>")
      .replace(/\n- (.*?)(\n|$)/g, "<li class='ml-4 list-disc'>$1</li>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-800 text-white px-4 py-3 flex items-center gap-3 shadow">
        <button onClick={() => navigate("/")} className="text-blue-200 hover:text-white text-xl">←</button>
        <span className="text-xl">💬</span>
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight">Consulta Jurídica</h1>
          <p className="text-blue-300 text-xs">ImobiAI · Direito Imobiliário</p>
        </div>
        <select
          value={tipoUsuario}
          onChange={(e) => setTipoUsuario(e.target.value)}
          className="bg-blue-700 text-white text-xs rounded-lg px-2 py-1 border border-blue-500"
        >
          {TIPO_USUARIO_OPTIONS.map((op) => (
            <option key={op}>{op}</option>
          ))}
        </select>
        <button onClick={novaConversa} className="bg-blue-600 hover:bg-blue-500 text-xs px-3 py-1 rounded-lg">
          Nova
        </button>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
        {mensagens.length === 0 && (
          <div className="text-center text-gray-400 mt-16">
            <div className="text-6xl mb-4">⚖️</div>
            <p className="text-lg font-medium text-gray-500">Como posso te ajudar?</p>
            <p className="text-sm mt-1">Faça sua pergunta sobre direito imobiliário</p>
          </div>
        )}

        {mensagens.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">
                🏢
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
              }`}
            >
              {msg.role === "assistant" ? (
                <div dangerouslySetInnerHTML={{ __html: formatarTexto(msg.content) }} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {carregando && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm mr-2">
              🏢
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-3 max-w-3xl mx-auto w-full">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && enviarMensagem()}
            placeholder="Digite sua dúvida jurídica..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={() => enviarMensagem()}
            disabled={carregando || !input.trim()}
            className="bg-blue-700 text-white px-5 py-3 rounded-xl font-medium text-sm hover:bg-blue-800 disabled:opacity-40 transition"
          >
            Enviar
          </button>
        </div>
        <p className="text-gray-400 text-xs text-center mt-2">
          ⚠️ Respostas orientativas — não substituem consultoria jurídica formal
        </p>
      </div>
    </div>
  );
}
