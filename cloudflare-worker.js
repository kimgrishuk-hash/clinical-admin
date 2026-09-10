const BASE = 'https://bhvkhxmexyhsjhwjsytp.supabase.co/functions/v1/';
const COOKIE = '__Host-clinic_session';

const API_ROUTES = {
  '/api/clinic': {
    slug: 'clinic-api',
    maxBytes: 768 * 1024,
    actions: new Set(['list','create','update','qty_adjust','delete','price_list','price_create','price_update','price_delete','quote_list','quote_save','quote_delete'])
  },
  '/api/tasks': {
    slug: 'clinic-tasks',
    maxBytes: 512 * 1024,
    actions: new Set(['list','get','create','update','comment','comment_update','comment_delete','close','reopen','delete'])
  },
  '/api/ops': {
    slug: 'clinic-ops',
    maxBytes: 1024 * 1024,
    actions: new Set(['list','save'])
  },
  '/api/assistant': {
    slug: 'clinic-assistant',
    maxBytes: 512 * 1024,
    actions: new Set(['bootstrap','reminders_list','reminder_save','reminder_done','reminder_snooze','reminder_delete','inbox_list','inbox_update','connection_status'])
  },
  '/api/files': {
    slug: 'clinic-files',
    maxBytes: 128 * 1024,
    actions: new Set(['prepare_upload','product_image','download_url','delete'])
  },
  '/api/sync': {
    slug: 'clinic-sync',
    maxBytes: 512 * 1024,
    actions: new Set(['bootstrap','changes_since'])
  }
};

function response(status, payload, extra = {}) {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, max-age=0',
    'x-content-type-options': 'nosniff',
    ...extra
  });
  return new Response(JSON.stringify(payload ?? {}), { status, headers });
}

function cookies(request) {
  const raw = request.headers.get('cookie') || '';
  const out = {};
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    try { out[key] = decodeURIComponent(part.slice(i + 1).trim()); }
    catch { out[key] = part.slice(i + 1).trim(); }
  }
  return out;
}

function sessionCookie(token, expiresAt) {
  const exp = Math.max(60, Math.min(43200, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000) || 43200));
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${exp}; HttpOnly; Secure; SameSite=Strict; Priority=High`;
}

function clearCookie() {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict; Priority=High`;
}

async function readJson(request, maxBytes) {
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return { error: response(413, { error: 'request too large' }) };
  }
  try { return { body: text ? JSON.parse(text) : {}, raw: text || '{}' }; }
  catch { return { error: response(400, { error: 'bad json' }) }; }
}

async function proxyApi(request, cfg) {
  if (request.method !== 'POST') return response(405, { error: 'method' });
  const parsed = await readJson(request, cfg.maxBytes);
  if (parsed.error) return parsed.error;
  const action = String(parsed.body.action || '');
  if (!cfg.actions.has(action)) return response(400, { error: 'unknown action' });

  const token = cookies(request)[COOKIE];
  if (!token) return response(401, { error: 'unauthorized' });

  try {
    const upstream = await fetch(BASE + cfg.slug, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${token}`
      },
      body: parsed.raw
    });
    const text = await upstream.text();
    return new Response(text || '{}', {
      status: upstream.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store, max-age=0',
        'x-content-type-options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('Cloudflare API proxy failed', cfg.slug, error);
    return response(502, { error: 'upstream unavailable' });
  }
}

async function authUpstream(request, action, password = '', token = '') {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '';
  if (ip) headers['x-forwarded-for'] = ip.split(',')[0].trim();
  const payload = action === 'login' ? { action, password } : { action };
  const upstream = await fetch(BASE + 'clinic-auth', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  let data = {};
  try { data = await upstream.json(); } catch {}
  return { upstream, data };
}

async function session(request) {
  if (request.method !== 'POST') return response(405, { error: 'method' });
  const parsed = await readJson(request, 32 * 1024);
  if (parsed.error) return parsed.error;
  const action = String(parsed.body.action || '');
  if (!['login','validate','logout'].includes(action)) return response(400, { error: 'unknown action' });

  try {
    if (action === 'login') {
      const password = String(parsed.body.password || '');
      if (password.length < 8 || password.length > 128) return response(401, { error: 'invalid credentials' });
      const { upstream, data } = await authUpstream(request, 'login', password);
      if (!upstream.ok || !data.token) {
        return response(upstream.status || 401, data?.error ? data : { error: 'invalid credentials' });
      }
      return response(200, {
        ok: true,
        token: 'http-only-cookie',
        expires_at: data.expires_at,
        user: data.user || { display_name: 'צוות המרפאה' }
      }, { 'set-cookie': sessionCookie(String(data.token), data.expires_at) });
    }

    const token = cookies(request)[COOKIE];
    if (!token) {
      if (action === 'logout') return response(200, { ok: true }, { 'set-cookie': clearCookie() });
      return response(401, { error: 'unauthorized' });
    }

    const { upstream, data } = await authUpstream(request, action, '', token);
    const extra = action === 'logout' || upstream.status === 401 ? { 'set-cookie': clearCookie() } : {};
    if (!upstream.ok) return response(upstream.status, data || { error: 'unauthorized' }, extra);
    return response(200, data || { ok: true }, extra);
  } catch (error) {
    console.error('Cloudflare auth proxy failed', error);
    return response(502, { error: 'auth unavailable' });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/session') return session(request);
    const cfg = API_ROUTES[url.pathname];
    if (cfg) return proxyApi(request, cfg);
    return env.ASSETS.fetch(request);
  }
};
