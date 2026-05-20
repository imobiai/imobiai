import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      icon: "💬",
      title: "Consulta Jurídica",
      desc: "Tire dúvidas sobre locação, compra e venda, contratos e muito mais.",
      color: "from-blue-500 to-blue-700",
      path: "/chat",
    },
    {
      icon: "📄",
      title: "Gerar Documentos",
      desc: "Crie contratos, notificações, rescisões e propostas automaticamente.",
      color: "from-green-500 to-green-700",
      path: "/documentos/novo",
    },
    {
      icon: "📁",
      title: "Meus Documentos",
      desc: "Acesse e gerencie todos os documentos gerados.",
      color: "from-purple-500 to-purple-700",
      path: "/documentos",
    },
    {
      icon: "💼",
      title: "Histórico de Consultas",
      desc: "Reveja suas conversas e consultas anteriores.",
      color: "from-orange-500 to-orange-700",
      path: "/historico",
    },
  ];

  const exemplos = [
    "Qual o prazo mínimo de contrato de locação residencial?",
    "O locatário pode sublocar o imóvel sem autorização?",
    "Como funciona a garantia por fiança?",
    "Quais são os direitos do locatário em caso de venda do imóvel?",
    "O que é caução e qual o valor máximo permitido?",
    "Como notificar o inquilino por inadimplência?",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏢</span>
            <h1 className="text-3xl font-bold">ImobiAI</h1>
          </div>
          <p className="text-blue-200 text-lg">
            Sua IA especializada em Direito Imobiliário Brasileiro
          </p>
          <p className="text-blue-300 text-sm mt-1">
            Lei do Inquilinato · Compra e Venda · Contratos · Documentos
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Cards principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {cards.map((card) => (
            <button
              key={card.path}
              onClick={() => navigate(card.path)}
              className={`bg-gradient-to-br ${card.color} text-white rounded-2xl p-6 text-left shadow-lg hover:scale-105 transition-transform`}
            >
              <div className="text-3xl mb-3">{card.icon}</div>
              <h2 className="text-xl font-bold mb-1">{card.title}</h2>
              <p className="text-white/80 text-sm">{card.desc}</p>
            </button>
          ))}
        </div>

        {/* Perguntas rápidas */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-gray-700 font-semibold mb-4 flex items-center gap-2">
            <span>⚡</span> Perguntas frequentes — clique para consultar
          </h3>
          <div className="flex flex-wrap gap-2">
            {exemplos.map((ex) => (
              <button
                key={ex}
                onClick={() => navigate("/chat", { state: { perguntaInicial: ex } })}
                className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-4 py-2 text-sm hover:bg-blue-100 transition"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Rodapé informativo */}
        <p className="text-center text-gray-400 text-xs mt-8">
          ⚠️ As respostas do ImobiAI são orientativas e não substituem consultoria jurídica formal.
        </p>
      </div>
    </div>
  );
}
