// adminDashboard.ts — painel de métricas e gestão de usuários (admin only)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const J = (data: unknown, status = 200) => Response.json(data, { status, headers: CORS });

const SECRET  = 'imobiai-jwt-secret-2026';
const APP_ID  = '6a0cc4f6b295247520aec671';

// ── Base44 helpers ──
function apiKey() { return Deno.env.get('BASE44_API_KEY') || ''; }
const BASE = `https://api.base44.com/api/apps/${APP_ID}/entities`;

async function listAll(entity: string) {
  const r = await fetch(`${BASE}/${entity}?limit=500`, { headers: { 'x-api-key': apiKey() } });
  return r.json();
}
async function updateRecord(entity: string, id: string, data: object) {
  const r = await fetch(`${BASE}/${entity}/${id}`, {
    method: 'PUT', headers: { 'x-api-key': apiKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}

// ── JWT verify ──
async function verify(token: string): Promise<any | null> {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const { token, acao, user_id, novo_plano } = body;

    const p = token ? await verify(token) : null;
    if (!p) return J({ ok: false, erro: 'Não autorizado' }, 401);
    if (p.plano !== 'admin') return J({ ok: false, erro: 'Acesso restrito a administradores' }, 403);

    // ── ALTERAR PLANO ──
    if (acao === 'alterar_plano' && user_id && novo_plano) {
      await updateRecord('User', user_id, { plano: novo_plano });
      return J({ ok: true });
    }

    // ── DASHBOARD ──
    const [usuarios, registros] = await Promise.all([
      listAll('User'),
      listAll('RegistroUso'),
    ]);

    const users = Array.isArray(usuarios) ? usuarios : [];
    const regs  = Array.isArray(registros) ? registros : [];

    const totalUsers  = users.length;
    const totalChats  = regs.length;
    const totalTokens = regs.reduce((s: number, r: any) => s + (r.tokens_usados || 0), 0);

    const porTipo: Record<string, number> = {};
    users.forEach((u: any) => { const t = u.tipo_usuario || 'Outro'; porTipo[t] = (porTipo[t]||0)+1; });

    const porPlano: Record<string, number> = {};
    users.forEach((u: any) => { const p2 = u.plano || 'free'; porPlano[p2] = (porPlano[p2]||0)+1; });

    const usoPorDia: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i*86400000);
      usoPorDia[d.toISOString().slice(0,10)] = 0;
    }
    regs.forEach((r: any) => {
      const day = new Date(r.created_date).toISOString().slice(0,10);
      if (day in usoPorDia) usoPorDia[day]++;
    });

    const usuariosRecentes = users
      .sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
      .slice(0, 50)
      .map((u: any) => ({
        id: u.id, email: u.email, nome: u.full_name,
        tipo_usuario: u.tipo_usuario, plano: u.plano || 'free',
        criado_em: u.created_date,
        chats: regs.filter((r: any) => r.user_email === u.email).length,
      }));

    const ultimasAtividades = regs
      .sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
      .slice(0, 20)
      .map((r: any) => ({
        user_email: r.user_email, user_nome: r.user_nome,
        pergunta: (r.pergunta||'').slice(0, 90),
        tokens_usados: r.tokens_usados, criado_em: r.created_date,
        origem: r.origem,
      }));

    return J({ ok: true, metricas: { totalUsers, totalChats, totalTokens, porTipo, porPlano, usoPorDia }, usuariosRecentes, ultimasAtividades });

  } catch (e: any) {
    return J({ ok: false, erro: e.message }, 500);
  }
});
