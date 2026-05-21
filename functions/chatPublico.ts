import OpenAI from 'npm:openai@4.28.0';

const SYSTEM_PROMPT = `Você é o ImobiAI, um assistente jurídico especializado em direito imobiliário brasileiro.

Seu conhecimento abrange:
- Lei do Inquilinato (Lei 8.245/91) — locação urbana residencial e comercial
- Código Civil Brasileiro — contratos de compra e venda, direitos reais
- Lei de Registros Públicos (Lei 6.015/73) — registro de imóveis
- ITBI, escritura pública, financiamento imobiliário
- Ação de despejo, revisional de aluguel, consignação de aluguel
- Garantias locatícias: fiança, seguro-fiança, depósito caução, cessão fiduciária
- Compra e venda de imóveis: due diligence, cláusulas essenciais, evicção, vícios redibitórios

Seu público é formado por: imobiliárias, corretores de imóveis, proprietários e advogados.

Regras de comportamento:
1. Responda sempre em português brasileiro
2. Seja direto, claro e prático — sem juridiquês desnecessário
3. Cite a lei ou artigo relevante quando pertinente
4. Sempre informe que sua resposta é orientativa e não substitui consultoria jurídica formal quando a situação for complexa
5. Para situações simples e rotineiras, responda com confiança e objetividade
6. Quando solicitado a gerar documentos, oriente o usuário a acessar o app completo

Formato das respostas:
- Use linguagem clara e acessível
- Organize em tópicos quando necessário
- Destaque pontos críticos ou alertas importantes`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const SECRET = 'imobiai-jwt-secret-2026';
const APP_ID = '6a0cc4f6b295247520aec671';

async function verifyJWT(token: string): Promise<any | null> {
  try {
    const [h, b, s] = token.split('.');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('HMAC', key,
      Uint8Array.from(atob(s), c => c.charCodeAt(0)),
      new TextEncoder().encode(`${h}.${b}`));
    if (!ok) return null;
    const p = JSON.parse(atob(b));
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}

async function registrarUso(data: object) {
  try {
    const apiKey = Deno.env.get('BASE44_API_KEY') || '';
    await fetch(`https://api.base44.com/api/apps/${APP_ID}/entities/RegistroUso`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch { /* não bloqueia */ }
}

// Normaliza o role do histórico — converte 'bot' → 'assistant' e garante apenas roles válidos
function normalizarHistorico(historico: any[]): { role: string; content: string }[] {
  const ROLES_VALIDOS = new Set(['user', 'assistant', 'system']);
  return historico
    .filter((m: any) => m && m.content)
    .map((m: any) => ({
      role:    m.role === 'bot' ? 'assistant' : (ROLES_VALIDOS.has(m.role) ? m.role : 'user'),
      content: String(m.content),
    }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const { mensagem, historico = [], tipo_usuario = 'Visitante', token } = body;

    if (!mensagem)
      return Response.json({ error: 'Mensagem é obrigatória' }, { status: 400, headers: CORS });

    const usuario = token ? await verifyJWT(token) : null;

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey)
      return Response.json({ error: 'Chave da API não configurada' }, { status: 500, headers: CORS });

    const openai = new OpenAI({ apiKey });
    const tipoLabel = usuario?.tipo_usuario || tipo_usuario;

    const messages = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\nPerfil do usuário atual: ${tipoLabel}` },
      ...normalizarHistorico(historico).slice(-8),
      { role: 'user', content: mensagem },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', messages, temperature: 0.3, max_tokens: 1200,
    });

    const resposta = completion.choices[0].message.content;
    const tokens_usados = completion.usage?.total_tokens || 0;

    // Registrar uso sem bloquear
    registrarUso({
      user_email:   usuario?.email || 'anonimo',
      user_nome:    usuario?.nome  || 'Visitante',
      tipo_usuario: tipoLabel,
      plano:        usuario?.plano || 'free',
      pergunta:     mensagem.slice(0, 200),
      tokens_usados,
      origem:       token ? 'autenticado' : 'publico',
    });

    return Response.json({ resposta, tokens_usados }, { headers: CORS });

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }
});
