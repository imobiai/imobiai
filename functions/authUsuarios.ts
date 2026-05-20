// authUsuarios.ts — registro, login e verificação JWT para o ImobiAI

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const J = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: CORS });

const SECRET = 'imobiai-jwt-secret-2026';
const APP_ID = '6a0cc4f6b295247520aec671';

// ── Base44 REST helpers ──
async function b44Get(entity: string, query: Record<string,string> = {}) {
  const apiKey = Deno.env.get('BASE44_API_KEY') || '';
  const qs = new URLSearchParams(query).toString();
  const url = `https://api.base44.com/api/apps/${APP_ID}/entities/${entity}${qs ? '?' + qs : ''}`;
  const r = await fetch(url, { headers: { 'x-api-key': apiKey } });
  return r.json();
}
async function b44Post(entity: string, data: object) {
  const apiKey = Deno.env.get('BASE44_API_KEY') || '';
  const url = `https://api.base44.com/api/apps/${APP_ID}/entities/${entity}`;
  const r = await fetch(url, {
    method: 'POST', headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}

// ── JWT (HMAC-SHA256) ──
async function sign(payload: object): Promise<string> {
  const h = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const b = btoa(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 7*86400*1000 }));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${h}.${b}`));
  return `${h}.${b}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;
}
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

// ── Hash senha ──
async function hashPwd(pwd: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd + SECRET));
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const { acao, email, senha, nome, tipo_usuario, token } = body;

    // ── VERIFY ──
    if (acao === 'verify') {
      const p = token ? await verify(token) : null;
      return p ? J({ ok: true, usuario: p }) : J({ ok: false, erro: 'Token inválido' });
    }

    if (!email || !senha) return J({ ok: false, erro: 'Email e senha são obrigatórios' }, 400);
    const emailNorm = email.toLowerCase().trim();
    const senhaHash = await hashPwd(senha);

    // ── REGISTRO ──
    if (acao === 'registro') {
      if (!nome) return J({ ok: false, erro: 'Nome é obrigatório' }, 400);

      // buscar usuário existente
      const lista = await b44Get('User', { email: emailNorm });
      if (Array.isArray(lista) && lista.length > 0)
        return J({ ok: false, erro: 'E-mail já cadastrado' });

      const user = await b44Post('User', {
        email: emailNorm, full_name: nome,
        tipo_usuario: tipo_usuario || 'Outro',
        plano: 'free', senha_hash: senhaHash,
      });

      const jwt = await sign({ id: user.id, email: emailNorm, nome, plano: 'free', tipo_usuario: tipo_usuario || 'Outro' });
      return J({ ok: true, token: jwt, usuario: { id: user.id, email: emailNorm, nome, plano: 'free', tipo_usuario: tipo_usuario || 'Outro' } });
    }

    // ── LOGIN ──
    if (acao === 'login') {
      const lista = await b44Get('User', { email: emailNorm });
      if (!Array.isArray(lista) || lista.length === 0)
        return J({ ok: false, erro: 'E-mail não encontrado' });

      const user = lista[0];
      if (user.senha_hash !== senhaHash)
        return J({ ok: false, erro: 'Senha incorreta' });

      const jwt = await sign({ id: user.id, email: emailNorm, nome: user.full_name, plano: user.plano || 'free', tipo_usuario: user.tipo_usuario || 'Outro' });
      return J({ ok: true, token: jwt, usuario: { id: user.id, email: emailNorm, nome: user.full_name, plano: user.plano || 'free', tipo_usuario: user.tipo_usuario || 'Outro' } });
    }

    return J({ ok: false, erro: 'Ação inválida' }, 400);

  } catch (e: any) {
    return J({ ok: false, erro: e.message }, 500);
  }
});
