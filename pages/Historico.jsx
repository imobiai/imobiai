import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Conversa } from "@/api/entities";

export default function Historico() {
  const navigate = useNavigate();
  const [conversas, setConversas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [convAberta, setConvAberta] = useState(null);

  useEffect(() => {
    carregarConversas();
  }, []);

  const carregarConversas = async () => {
    setCarregando(true);
    try {
      const lista = await Conversa.list("-created_date");
      setConversas(lista);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const excluirConversa = async (id) => {
    if (!confirm("Deseja excluir esta conversa?")) return;
    await Conversa.delete(id);
    setConvAberta(null);
    carregarConversas();
  };

  const formatarTexto = (texto) => {
    return texto
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/### (.*?)(\n|$)/g, "<h3 class='font-bold text-base mt-2 mb-1'>$1</h3>")
      .replace(/\n- (.*?)(\n|$)/g, "<li class='ml-4 list-disc'>$1</li>")
      .replace(/\n/g, "<br/>");
  };

  const PERFIL_COR = {
    "Imobiliária": "bg-blue-100 text-blue-700",
    "Corretor": "bg-green-100 text-green-700",
    "Proprietário": "bg-orange-100 text-orange-700",
    "Advogado": "bg-purple-100 text-purple-700",
    "Outro": "bg-gray-100 text-gray-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-700 text-white px-4 py-3 flex items-center gap-3 shadow">
        <button onClick={() => navigate("/")} className="text-orange-200 hover:text-white text-xl">←</button>
        <span className="text-xl">💼</span>
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight">Histórico de Consultas</h1>
          <p className="text-orange-300 text-xs">{conversas.length} conversa{conversas.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => navigate("/chat")}
          className="bg-orange-600 hover:bg-orange-500 text-sm px-3 py-1 rounded-lg"
        >
          + Nova consulta
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {carregando ? (
          <div className="text-center text-gray-400 py-16">Carregando...</div>
        ) : conversas.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-gray-500">Nenhuma consulta realizada ainda.</p>
            <button
              onClick={() => navigate("/chat")}
              className="mt-4 bg-orange-600 text-white px-6 py-2 rounded-xl text-sm hover:bg-orange-700"
            >
              Fazer primeira consulta
            </button>
          </div>
        ) : convAberta ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-800">{convAberta.titulo}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PERFIL_COR[convAberta.tipo_usuario] || "bg-gray-100 text-gray-600"}`}>
                      {convAberta.tipo_usuario}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(convAberta.created_date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <button onClick={() => setConvAberta(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {(convAberta.mensagens || []).map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-1">
                        🏢
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                        msg.role === "user"
                          ? "bg-orange-600 text-white rounded-br-none"
                          : "bg-gray-50 text-gray-800 rounded-bl-none border border-gray-100"
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
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/chat")}
                className="flex-1 bg-orange-600 text-white font-semibold py-3 rounded-xl hover:bg-orange-700"
              >
                💬 Nova Consulta
              </button>
              <button
                onClick={() => excluirConversa(convAberta.id)}
                className="bg-red-50 text-red-600 border border-red-200 font-semibold py-3 px-5 rounded-xl hover:bg-red-100"
              >
                🗑️
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {conversas.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setConvAberta(conv)}
                className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">💬</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{conv.titulo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PERFIL_COR[conv.tipo_usuario] || "bg-gray-100 text-gray-600"}`}>
                        {conv.tipo_usuario}
                      </span>
                      <span className="text-xs text-gray-400">
                        {(conv.mensagens || []).length} mensagens · {new Date(conv.created_date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-300 text-lg">›</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
