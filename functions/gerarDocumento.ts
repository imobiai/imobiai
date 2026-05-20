import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import OpenAI from 'npm:openai@4.28.0';

const TEMPLATES = {
  'Contrato de Locação': `Gere um contrato de locação residencial completo conforme a Lei 8.245/91 com os seguintes dados:
Locador: {locador}
Locatário: {locatario}
Imóvel: {imovel}
Valor do aluguel: R$ {valor_aluguel}
Dia de vencimento: {dia_vencimento}
Prazo do contrato: {prazo}
Tipo de garantia: {garantia}
Dados adicionais: {dados_adicionais}

O contrato deve incluir: qualificação das partes, descrição do imóvel, valor e reajuste, garantia, obrigações do locador e locatário, cláusulas de rescisão, multa por inadimplência e foro.`,

  'Notificação Extrajudicial': `Gere uma notificação extrajudicial formal para o seguinte caso:
Remetente: {remetente}
Destinatário: {destinatario}
Motivo: {motivo}
Valor em débito (se aplicável): {valor_debito}
Prazo para regularização: {prazo_regularizacao}
Dados adicionais: {dados_adicionais}

A notificação deve ser formal, com linguagem jurídica adequada, citando a lei pertinente.`,

  'Rescisão de Contrato': `Gere um termo de rescisão de contrato de locação com os seguintes dados:
Locador: {locador}
Locatário: {locatario}
Imóvel: {imovel}
Data de rescisão: {data_rescisao}
Motivo da rescisão: {motivo}
Multa rescisória (se aplicável): {multa}
Devolução de caução (se aplicável): {caucao}
Dados adicionais: {dados_adicionais}`,

  'Proposta de Compra e Venda': `Gere uma proposta de compra e venda de imóvel com os seguintes dados:
Vendedor: {vendedor}
Comprador: {comprador}
Imóvel: {imovel}
Valor proposto: R$ {valor}
Forma de pagamento: {forma_pagamento}
Prazo para escritura: {prazo_escritura}
Condições especiais: {condicoes}
Dados adicionais: {dados_adicionais}`,

  'Vistoria de Imóvel': `Gere um laudo de vistoria de imóvel para locação com os seguintes dados:
Imóvel: {imovel}
Data da vistoria: {data_vistoria}
Tipo (entrada/saída): {tipo_vistoria}
Locatário: {locatario}
Condições gerais: {condicoes}
Observações por cômodo: {comodos}
Dados adicionais: {dados_adicionais}`,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { tipo_documento, dados } = body;

    if (!tipo_documento || !dados) {
      return Response.json({ error: 'tipo_documento e dados são obrigatórios' }, { status: 400 });
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Chave da API não configurada' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    let promptTemplate = TEMPLATES[tipo_documento as keyof typeof TEMPLATES];
    if (!promptTemplate) {
      promptTemplate = `Gere um documento jurídico do tipo "${tipo_documento}" com os seguintes dados: ${JSON.stringify(dados)}`;
    } else {
      // Substituir placeholders pelos dados fornecidos
      for (const [key, value] of Object.entries(dados)) {
        promptTemplate = promptTemplate.replace(`{${key}}`, String(value) || 'Não informado');
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em documentos jurídicos imobiliários brasileiros. 
Gere documentos completos, profissionais e tecnicamente corretos conforme a legislação brasileira vigente.
Use linguagem jurídica adequada, cite os dispositivos legais pertinentes.
Formate o documento de forma clara com seções bem definidas.
Responda APENAS com o documento gerado, sem explicações adicionais.`
        },
        { role: 'user', content: promptTemplate }
      ],
      temperature: 0.2,
      max_tokens: 3000,
    });

    const documento = completion.choices[0].message.content;

    return Response.json({ 
      documento,
      tipo: tipo_documento
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
