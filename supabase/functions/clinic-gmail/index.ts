const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
const TOKEN_KEY = Deno.env.get('GMAIL_TOKEN_KEY') || '';
const REDIRECT_URI = Deno.env.get('GMAIL_REDIRECT_URI') || `${SUPABASE_URL}/functions/v1/clinic-gmail/callback`;
const APP_URL = 'https://clinical-admin.kimgrishuk.workers.dev/';
const ALLOWED_ORIGINS = new Set([
  'https://clinical-admin.kimgrishuk.workers.dev',
  'https://clinic-inventory-admin.vercel.app',
  'https://gerassiclinicapp.netlify.app'
]);
const DB_HEADERS = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const encoder = new TextEncoder();

function cors(req: Request) {
  const origin = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : APP_URL.slice(0, -1),
    'Access-Control-Allow-Headers': 'content-type,authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function json(req: Request, value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { ...cors(req), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

function redirect(result: 'connected' | 'error') {
  const url = new URL(APP_URL);
  url.searchParams.set('gmail', result);
  return Response.redirect(url.toString(), 302);
}

function b64url(bytes: Uint8Array) {
  let raw = '';
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function fromB64url(value: string) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

async function sha(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('');
}

async function aesKey() {
  const raw = fromB64url(TOKEN_KEY);
  if (raw.byteLength !== 32) throw new Error('token key is not configured');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function seal(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(), encoder.encode(value));
  return `v1.${b64url(iv)}.${b64url(new Uint8Array(encrypted))}`;
}

async function openSealed(value: string) {
  const [version, iv, payload] = value.split('.');
  if (version !== 'v1' || !iv || !payload) throw new Error('invalid encrypted token');
  const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64url(iv) }, await aesKey(), fromB64url(payload));
  return new TextDecoder().decode(clear);
}

async function authenticated(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const hash = await sha(token);
  const query = `${SUPABASE_URL}/rest/v1/clinic_sessions?select=id&token_hash=eq.${hash}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&limit=1`;
  const response = await fetch(query, { headers: DB_HEADERS });
  return response.ok && (await response.json()).length > 0;
}

async function getConnection() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/clinic_connections?select=*&provider=eq.gmail&limit=1`, { headers: DB_HEADERS });
  if (!response.ok) throw new Error('connection lookup failed');
  return (await response.json())[0] || null;
}

async function saveConnection(payload: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/clinic_connections?on_conflict=provider`, {
    method: 'POST',
    headers: { ...DB_HEADERS, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ provider: 'gmail', ...payload, updated_at: new Date().toISOString() })
  });
  if (!response.ok) throw new Error('connection save failed');
}

async function exchangeCode(code: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, redirect_uri: REDIRECT_URI, grant_type: 'authorization_code' })
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) throw new Error('OAuth code exchange failed');
  return body;
}

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ refresh_token: refreshToken, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, grant_type: 'refresh_token' })
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) throw new Error('Gmail authorization expired');
  return body.access_token as string;
}

function decodeBody(value = '') {
  if (!value) return '';
  try { return new TextDecoder().decode(fromB64url(value)); } catch { return ''; }
}

function htmlToText(value: string) {
  return value.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
}

function messageText(payload: any): string {
  if (!payload) return '';
  if (payload.mimeType === 'text/plain' && payload.body?.data) return decodeBody(payload.body.data);
  for (const part of payload.parts || []) {
    const text = messageText(part);
    if (text) return text;
  }
  if (payload.mimeType === 'text/html' && payload.body?.data) return htmlToText(decodeBody(payload.body.data));
  return '';
}

function header(message: any, name: string) {
  return String((message.payload?.headers || []).find((x: any) => String(x.name).toLowerCase() === name.toLowerCase())?.value || '');
}

function sender(value: string) {
  const match = value.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>/);
  return match ? { name: match[1].trim(), address: match[2].trim() } : { name: value.split('@')[0].trim(), address: value.trim() };
}

function classify(subject: string, body: string) {
  const value = `${subject} ${body}`.toLowerCase();
  if (/דחוף|urgent|emergency|קושי בנשימה|לא מגיב/.test(value)) return { category: 'דורש בדיקה', priority: 'urgent' };
  if (/תוצאות|results|laboratory|מעבדה|בדיק/.test(value)) return { category: 'תוצאות מעבדה', priority: 'high' };
  if (/חשבונית|invoice|קבלה|receipt|payment/.test(value)) return { category: 'כספים ומסמכים', priority: 'normal' };
  if (/תור|appointment|schedule/.test(value)) return { category: 'קביעת תור', priority: 'normal' };
  return { category: 'מייל חדש', priority: 'normal' };
}

async function gmailJson(url: string, accessToken: string) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`Gmail API ${response.status}`);
  return response.json();
}

async function syncMessages() {
  const connection = await getConnection();
  if (!connection?.refresh_token_ciphertext) throw new Error('Gmail is not connected');
  const accessToken = await refreshAccessToken(await openSealed(connection.refresh_token_ciphertext));
  const listUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  listUrl.searchParams.set('maxResults', '25');
  listUrl.searchParams.set('q', 'in:inbox newer_than:14d');
  const list = await gmailJson(listUrl.toString(), accessToken);
  const messages = await Promise.all((list.messages || []).map((item: any) => gmailJson(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(item.id)}?format=full`, accessToken)));
  const rows = messages.map((message: any) => {
    const subject = header(message, 'Subject').slice(0, 500);
    const from = sender(header(message, 'From'));
    const body = messageText(message.payload).slice(0, 30000);
    const preview = String(message.snippet || body).slice(0, 1000);
    const result = classify(subject, body);
    return {
      channel: 'gmail', external_id: String(message.id), thread_id: String(message.threadId || message.id),
      sender_name: from.name.slice(0, 200) || null, sender_address: from.address.slice(0, 320) || null,
      subject, preview, body_text: body || preview, category: result.category, priority: result.priority,
      status: 'new', received_at: new Date(Number(message.internalDate || Date.now())).toISOString(),
      metadata: { gmail_label_ids: message.labelIds || [], ai_summary: `מייל מאת ${from.name || from.address || 'שולח לא מזוהה'} בנושא “${subject || 'ללא נושא'}”. ${preview}`.slice(0, 1200), draft_reply: '', assigned_to: result.priority === 'urgent' ? 'רופא/ה' : 'קבלה' },
      updated_at: new Date().toISOString()
    };
  });
  if (rows.length) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/clinic_inbox_events?on_conflict=channel,external_id`, { method: 'POST', headers: { ...DB_HEADERS, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows) });
    if (!response.ok) throw new Error('inbox import failed');
  }
  const now = new Date().toISOString();
  await saveConnection({ status: 'connected', last_synced_at: now, last_error: null });
  return { imported: rows.length, last_synced_at: now };
}

async function oauthCallback(req: Request) {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !TOKEN_KEY) return redirect('error');
    const url = new URL(req.url);
    const code = url.searchParams.get('code') || '';
    const state = url.searchParams.get('state') || '';
    if (!code || !state || url.searchParams.get('error')) return redirect('error');
    const stateHash = await sha(state);
    const check = await fetch(`${SUPABASE_URL}/rest/v1/clinic_oauth_states?state_hash=eq.${stateHash}&provider=eq.gmail&used_at=is.null&expires_at=gt.${encodeURIComponent(new Date().toISOString())}`, {
      method: 'PATCH', headers: { ...DB_HEADERS, Prefer: 'return=representation' }, body: JSON.stringify({ used_at: new Date().toISOString() })
    });
    if (!check.ok || !(await check.json())[0]) return redirect('error');
    const tokens = await exchangeCode(code);
    const existing = await getConnection();
    const refreshCiphertext = tokens.refresh_token ? await seal(tokens.refresh_token) : existing?.refresh_token_ciphertext;
    if (!refreshCiphertext) return redirect('error');
    const profile = await gmailJson('https://gmail.googleapis.com/gmail/v1/users/me/profile', tokens.access_token);
    await saveConnection({ account_address: String(profile.emailAddress || '').slice(0, 320), status: 'connected', refresh_token_ciphertext: refreshCiphertext, granted_scope: String(tokens.scope || ''), token_expires_at: new Date(Date.now() + Number(tokens.expires_in || 3600) * 1000).toISOString(), last_error: null });
    return redirect('connected');
  } catch (error) {
    console.error('Gmail callback failed', error);
    return redirect('error');
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method === 'GET' && new URL(req.url).pathname.endsWith('/callback')) return oauthCallback(req);
  if (req.method !== 'POST') return json(req, { error: 'method' }, 405);
  const origin = req.headers.get('origin') || '';
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(req, { error: 'origin' }, 403);
  if (!(await authenticated(req))) return json(req, { error: 'unauthorized' }, 401);
  let body: any = {};
  try { body = await req.json(); } catch { return json(req, { error: 'bad json' }, 400); }
  try {
    if (body.action === 'status') {
      const connection = await getConnection();
      return json(req, { connected: connection?.status === 'connected' && !!connection.refresh_token_ciphertext, configured: !!GOOGLE_CLIENT_ID && !!GOOGLE_CLIENT_SECRET && !!TOKEN_KEY, account_address: connection?.account_address || null, last_synced_at: connection?.last_synced_at || null });
    }
    if (body.action === 'connect_url') {
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !TOKEN_KEY) return json(req, { error: 'חיבור Google עדיין לא הוגדר בשרת' }, 503);
      const rawState = b64url(crypto.getRandomValues(new Uint8Array(32)));
      const stateHash = await sha(rawState);
      const stateResponse = await fetch(`${SUPABASE_URL}/rest/v1/clinic_oauth_states`, { method: 'POST', headers: DB_HEADERS, body: JSON.stringify({ state_hash: stateHash, provider: 'gmail', expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() }) });
      if (!stateResponse.ok) throw new Error('state save failed');
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      url.searchParams.set('redirect_uri', REDIRECT_URI);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'openid email https://www.googleapis.com/auth/gmail.readonly');
      url.searchParams.set('access_type', 'offline');
      url.searchParams.set('prompt', 'consent');
      url.searchParams.set('state', rawState);
      return json(req, { url: url.toString() });
    }
    if (body.action === 'sync') return json(req, await syncMessages());
    return json(req, { error: 'unknown action' }, 400);
  } catch (error) {
    console.error('Gmail action failed', error);
    return json(req, { error: error instanceof Error ? error.message : 'server error' }, 500);
  }
});
