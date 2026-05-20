// authUsuarios.ts — registro, login e verificação JWT para o ImobiAI
// Usa entidade "UsuarioImobiai" para armazenar usuários (não a entidade User da plataforma)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const J = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: CORS });

const SECRET = 'imobiai-jwt-secret-2026';
const APP_ID = '6a0cc4f6b295247520aec671';
const BASE   = `https://base44.app/api/apps/${APP_ID}/entities`;
const ENTITY = 'UsuarioImobiai';

// ── Base44 REST helpers ──
function headers() {
  const token = Deno.env.get('BASE44_SERVICE_TOKEN') || '';
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function findByEmail(email: string): Promise<any[]> {
  // Listar todos e filtrar (a entidade pode não suportar query params de filtro)
  const r   = await fetch(`${BASE}/${ENTITY}?limit=500`, { headers: headers() });
  const txt = await r.text();
  try {
    const list = JSON.parse(txt);
    if (!Array.isArray(list)) return [];
    return list.filter((u: any) => u.email === email);
  } catch { return []; }
}

async function createUser(data: object): Promise<any> {
  const r   = await fetch(`${BASE}/${ENTITY}`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  const txt = await r.text();
  try { return JSON.parse(txt); } catch { return null; }
}

async function updateUser(id: string, data: object): Promise<any> {
  const r = await fetch(`${BASE}/${ENTITY}/${id}`, {
    method: 'PUT', headers: headers(), body: JSON.stringify(data),
  });
  const txt = await r.text();
  try { return JSON.parse(txt); } catch { return null; }
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

async function hashPwd(pwd: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd + SECRET));
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const { acao, email, senha, nome, tipo_usuario, token } = body;

    // ── VERIFY TOKEN ──
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

      const existentes = await findByEmail(emailNorm);
      if (existentes.length > 0)
        return J({ ok: false, erro: 'E-mail já cadastrado' });

      const user = await createUser({
        email: emailNorm,
        full_name: nome,
        tipo_usuario: tipo_usuario || 'Outro',
        plano: 'free',
        ativo: true,
        senha_hash: senhaHash,
      });

      if (!user || !user.id) {
        const detalhe = user?.detail || user?.message || 'Erro ao criar conta';
        return J({ ok: false, erro: detalhe });
      }

      const jwt = await sign({
        id: user.id, email: emailNorm, nome,
        plano: 'free', tipo_usuario: tipo_usuario || 'Outro'
      });
      return J({ ok: true, token: jwt, usuario: {
        id: user.id, email: emailNorm, nome,
        plano: 'free', tipo_usuario: tipo_usuario || 'Outro'
      }});
    }

    // ── LOGIN ──
    if (acao === 'login') {
      const lista = await findByEmail(emailNorm);
      if (lista.length === 0)
        return J({ ok: false, erro: 'E-mail não encontrado' });

      const user = lista[0];
      if (user.senha_hash !== senhaHash)
        return J({ ok: false, erro: 'Senha incorreta' });

      const jwt = await sign({
        id: user.id, email: emailNorm,
        nome: user.full_name,
        plano: user.plano || 'free',
        tipo_usuario: user.tipo_usuario || 'Outro'
      });
      return J({ ok: true, token: jwt, usuario: {
        id: user.id, email: emailNorm,
        nome: user.full_name,
        plano: user.plano || 'free',
        tipo_usuario: user.tipo_usuario || 'Outro'
      }});
    }

    // ── ATUALIZAR PLANO (admin) ──
    if (acao === 'alterar_plano') {
      const { user_id, novo_plano, token: adminToken } = body;
      const p = adminToken ? await verify(adminToken) : null;
      if (!p || p.plano !== 'admin') return J({ ok: false, erro: 'Acesso negado' }, 403);
      await updateUser(user_id, { plano: novo_plano });
      return J({ ok: true });
    }

    return J({ ok: false, erro: 'Ação inválida' }, 400);

  } catch (e: any) {
    return J({ ok: false, erro: e.message }, 500);
  }
});
