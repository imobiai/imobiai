import * as base44Module from 'npm:@base44/sdk@0.8.30';

const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};

Deno.serve(async (_req) => {
  try {
    const appId = Deno.env.get('BASE44_APP_ID') || '6a0cc4f6b295247520aec671';
    
    // Tentar diferentes formas de acessar o SDK
    const exports = Object.keys(base44Module);
    const base44 = (base44Module as any).default || (base44Module as any).createClient || (base44Module as any);
    
    let client: any = null;
    let clientType = '';
    
    if (typeof base44 === 'function') {
      client = base44({ appId });
      clientType = 'function';
    } else if (typeof base44 === 'object') {
      client = base44;
      clientType = 'object';
    }
    
    // tentar listar
    const result = await client?.asServiceRole?.entities?.UsuarioImobiai?.list?.();
    
    return Response.json({ ok: true, exports, clientType, count: result?.length }, { headers: CORS });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { headers: CORS });
  }
});
