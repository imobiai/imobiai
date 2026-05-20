import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
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
6. Quando solicitado a gerar documentos, pergunte os dados necessários para preenchimento

Formato das respostas:
- Use linguagem clara e acessível
- Organize em tópicos quando necessário
- Destaque pontos críticos ou alertas importantes`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { mensagem, historico = [], tipo_usuario = 'Outro' } = body;

    if (!mensagem) {
      return Response.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Chave da API não configurada' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    const systemPromptComPerfil = `${SYSTEM_PROMPT}\n\nPerfil do usuário atual: ${tipo_usuario}`;

    const messages = [
      { role: 'system', content: systemPromptComPerfil },
      ...historico.slice(-10), // últimas 10 mensagens para contexto
      { role: 'user', content: mensagem }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
      max_tokens: 1500,
    });

    const resposta = completion.choices[0].message.content;

    return Response.json({ 
      resposta,
      tokens_usados: completion.usage?.total_tokens || 0
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
