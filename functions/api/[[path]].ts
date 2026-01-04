export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

function json(data: any, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

function getCookie(req: Request, name: string) {
  const cookie = req.headers.get("cookie") || "";
  const parts = cookie.split(";").map(s => s.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}

function setCookie(name: string, value: string, opts: {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
  path?: string;
  maxAgeSeconds?: number;
} = {}) {
  const {
    httpOnly = true,
    secure = true,
    sameSite = "Lax",
    path = "/",
    maxAgeSeconds,
  } = opts;

  let c = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
  if (httpOnly) c += `; HttpOnly`;
  if (secure) c += `; Secure`;
  if (typeof maxAgeSeconds === "number") c += `; Max-Age=${maxAgeSeconds}`;
  return c;
}

function deleteCookie(name: string) {
  return `${name}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly; Secure`;
}

// ---------- crypto helpers ----------
function b64url(bytes: Uint8Array) {
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64url(s: string) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacSHA256(key: string, data: string) {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(data));
  return new Uint8Array(sig);
}

async function signJWT(secret: string, payload: any, expSeconds: number) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expSeconds };

  const enc = new TextEncoder();
  const h = b64url(enc.encode(JSON.stringify(header)));
  const p = b64url(enc.encode(JSON.stringify(body)));
  const msg = `${h}.${p}`;
  const sig = await hmacSHA256(secret, msg);
  return `${msg}.${b64url(sig)}`;
}

async function verifyJWT(secret: string, token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [h, p, s] = parts;
  const msg = `${h}.${p}`;
  const sig = fromB64url(s);
  const expected = await hmacSHA256(secret, msg);

  // constant-time compare
  if (sig.length !== expected.length) return null;
  let ok = 0;
  for (let i = 0; i < sig.length; i++) ok |= (sig[i] ^ expected[i]);
  if (ok !== 0) return null;

  const payload = JSON.parse(new TextDecoder().decode(fromB64url(p)));
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp < now) return null;
  return payload;
}

// password hashing (PBKDF2)
async function pbkdf2Hash(password: string, saltB64: string, iterations = 90_000) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const salt = fromB64url(saltB64);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256
  );
  return b64url(new Uint8Array(bits));
}

function randomSalt() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return b64url(b);
}

function uuid() {
  // crypto.randomUUID is available in Workers
  return crypto.randomUUID();
}

function nowISO() {
  return new Date().toISOString();
}

function isValidUsername(u: string) {
  // 3-20 chars, letters/numbers/underscore only
  return /^[a-zA-Z0-9_]{3,20}$/.test(u);
}

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function normalizeUsername(u: string) {
  return u.trim().toLowerCase();
}

// ---------- auth ----------
async function requireUser(req: Request, env: Env) {
  const token = getCookie(req, "larped_session");
  if (!token) return null;
  const payload = await verifyJWT(env.JWT_SECRET, token);
  if (!payload?.uid) return null;

  const row = await env.DB.prepare("SELECT id, email, username FROM users WHERE id=?")
    .bind(payload.uid)
    .first();
  return row || null;
}

// ---------- routes ----------
export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, "/").replace(/\/+$/, "") || "/";

  try {
    // Health
    if (path === "/" && request.method === "GET") {
      return json({ ok: true, service: "larped-api" });
    }

    // AUTH: register
    if (path === "/auth/register" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      const email = String(body?.email || "").trim().toLowerCase();
      const usernameRaw = String(body?.username || "");
      const username = normalizeUsername(usernameRaw);
      const password = String(body?.password || "");

      if (!isValidEmail(email)) return json({ ok: false, error: "Invalid email." }, 400);
      if (!isValidUsername(username)) return json({ ok: false, error: "Username must be 3-20 letters/numbers/_." }, 400);
      if (password.length < 8) return json({ ok: false, error: "Password must be at least 8 characters." }, 400);

      const exists = await env.DB.prepare("SELECT 1 FROM users WHERE email=? OR username=?")
        .bind(email, username)
        .first();
      if (exists) return json({ ok: false, error: "Email or username already in use." }, 409);

      const userId = uuid();
      const salt = randomSalt();
      const hash = await pbkdf2Hash(password, salt);

      const t = nowISO();
      await env.DB.batch([
        env.DB.prepare("INSERT INTO users (id,email,username,pass_hash,pass_salt,created_at) VALUES (?,?,?,?,?,?)")
          .bind(userId, email, username, hash, salt, t),
        env.DB.prepare("INSERT INTO profiles (user_id, display_name, bio, updated_at) VALUES (?,?,?,?)")
          .bind(userId, username, "", t),
      ]);

      const jwt = await signJWT(env.JWT_SECRET, { uid: userId }, 60 * 60 * 24 * 14); // 14 days
      return json(
        { ok: true, user: { id: userId, email, username } },
        200,
        { "set-cookie": setCookie("larped_session", jwt, { maxAgeSeconds: 60 * 60 * 24 * 14 }) }
      );
    }

    // AUTH: login
    if (path === "/auth/login" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      const login = String(body?.login || "").trim().toLowerCase();
      const password = String(body?.password || "");

      if (!login || !password) return json({ ok: false, error: "Missing credentials." }, 400);

      const row: any = await env.DB.prepare(
        "SELECT id, email, username, pass_hash, pass_salt FROM users WHERE email=? OR username=?"
      ).bind(login, login).first();

      if (!row) return json({ ok: false, error: "Invalid login." }, 401);

      const check = await pbkdf2Hash(password, row.pass_salt);
      if (check !== row.pass_hash) return json({ ok: false, error: "Invalid login." }, 401);

      const jwt = await signJWT(env.JWT_SECRET, { uid: row.id }, 60 * 60 * 24 * 14);
      return json(
        { ok: true, user: { id: row.id, email: row.email, username: row.username } },
        200,
        { "set-cookie": setCookie("larped_session", jwt, { maxAgeSeconds: 60 * 60 * 24 * 14 }) }
      );
    }

    // AUTH: logout
    if (path === "/auth/logout" && request.method === "POST") {
      return json({ ok: true }, 200, { "set-cookie": deleteCookie("larped_session") });
    }

    // ME
    if (path === "/me" && request.method === "GET") {
      const me = await requireUser(request, env);
      if (!me) return json({ ok: false, error: "Unauthorized" }, 401);

      const prof = await env.DB.prepare(
        "SELECT display_name,bio,avatar_url,background_url,accent_color,primary_color,secondary_color,text_color,card_opacity,card_blur_px,effects_json,updated_at FROM profiles WHERE user_id=?"
      ).bind(me.id).first();

      return json({ ok: true, user: me, profile: prof });
    }

    // Update profile (customization)
    if (path === "/me/profile" && request.method === "PUT") {
      const me = await requireUser(request, env);
      if (!me) return json({ ok: false, error: "Unauthorized" }, 401);

      const body = await request.json().catch(() => ({}));
      const display_name = String(body.display_name ?? "").slice(0, 40);
      const bio = String(body.bio ?? "").slice(0, 240);
      const avatar_url = String(body.avatar_url ?? "").slice(0, 500);
      const background_url = String(body.background_url ?? "").slice(0, 500);

      const accent_color = String(body.accent_color ?? "#0b5cff").slice(0, 16);
      const primary_color = String(body.primary_color ?? "#0b1b3a").slice(0, 16);
      const secondary_color = String(body.secondary_color ?? "#071126").slice(0, 16);
      const text_color = String(body.text_color ?? "#eaf0ff").slice(0, 16);

      let card_opacity = Number(body.card_opacity ?? 0.78);
      if (!Number.isFinite(card_opacity)) card_opacity = 0.78;
      card_opacity = Math.min(0.95, Math.max(0.15, card_opacity));

      let card_blur_px = Number(body.card_blur_px ?? 18);
      if (!Number.isFinite(card_blur_px)) card_blur_px = 18;
      card_blur_px = Math.min(60, Math.max(0, Math.floor(card_blur_px)));

      const effects = body.effects ?? {};
      const effects_json = JSON.stringify(effects);

      await env.DB.prepare(
        `UPDATE profiles
         SET display_name=?, bio=?, avatar_url=?, background_url=?,
             accent_color=?, primary_color=?, secondary_color=?, text_color=?,
             card_opacity=?, card_blur_px=?, effects_json=?, updated_at=?
         WHERE user_id=?`
      ).bind(
        display_name, bio, avatar_url, background_url,
        accent_color, primary_color, secondary_color, text_color,
        card_opacity, card_blur_px, effects_json, nowISO(),
        me.id
      ).run();

      return json({ ok: true });
    }

    // Links CRUD
    if (path === "/me/links" && request.method === "GET") {
      const me = await requireUser(request, env);
      if (!me) return json({ ok: false, error: "Unauthorized" }, 401);

      const rows = await env.DB.prepare(
        "SELECT id,label,url,icon,sort_order,enabled,updated_at FROM links WHERE user_id=? ORDER BY sort_order ASC"
      ).bind(me.id).all();

      return json({ ok: true, links: rows.results || [] });
    }

    if (path === "/me/links" && request.method === "POST") {
      const me = await requireUser(request, env);
      if (!me) return json({ ok: false, error: "Unauthorized" }, 401);

      const body = await request.json().catch(() => ({}));
      const label = String(body.label ?? "").trim().slice(0, 40);
      const linkUrl = String(body.url ?? "").trim().slice(0, 500);
      const icon = String(body.icon ?? "").trim().slice(0, 30);

      if (!label) return json({ ok: false, error: "Label required." }, 400);
      if (!/^https?:\/\/.+/i.test(linkUrl)) return json({ ok: false, error: "URL must start with http(s)://" }, 400);

      const maxSortRow: any = await env.DB.prepare(
        "SELECT COALESCE(MAX(sort_order), 0) AS m FROM links WHERE user_id=?"
      ).bind(me.id).first();

      const nextSort = Number(maxSortRow?.m ?? 0) + 1;
      const id = uuid();
      const t = nowISO();

      await env.DB.prepare(
        "INSERT INTO links (id,user_id,label,url,icon,sort_order,enabled,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)"
      ).bind(id, me.id, label, linkUrl, icon, nextSort, 1, t, t).run();

      return json({ ok: true, id });
    }

    // /me/links/:id
    const linkIdMatch = path.match(/^\/me\/links\/([a-zA-Z0-9-]+)$/);
    if (linkIdMatch) {
      const linkId = linkIdMatch[1];
      const me = await requireUser(request, env);
      if (!me) return json({ ok: false, error: "Unauthorized" }, 401);

      if (request.method === "PUT") {
        const body = await request.json().catch(() => ({}));

        const label = String(body.label ?? "").trim().slice(0, 40);
        const linkUrl = String(body.url ?? "").trim().slice(0, 500);
        const icon = String(body.icon ?? "").trim().slice(0, 30);
        const enabled = body.enabled === false ? 0 : 1;
        const sort_order = Number.isFinite(Number(body.sort_order)) ? Math.floor(Number(body.sort_order)) : null;

        if (!label) return json({ ok: false, error: "Label required." }, 400);
        if (!/^https?:\/\/.+/i.test(linkUrl)) return json({ ok: false, error: "URL must start with http(s)://" }, 400);

        const stmt = env.DB.prepare(
          "UPDATE links SET label=?, url=?, icon=?, enabled=?, sort_order=COALESCE(?, sort_order), updated_at=? WHERE id=? AND user_id=?"
        );

        await stmt.bind(label, linkUrl, icon, enabled, sort_order, nowISO(), linkId, me.id).run();
        return json({ ok: true });
      }

      if (request.method === "DELETE") {
        await env.DB.prepare("DELETE FROM links WHERE id=? AND user_id=?").bind(linkId, me.id).run();
        return json({ ok: true });
      }
    }

    // Public profile: /profile/:username
    const profMatch = path.match(/^\/profile\/([a-zA-Z0-9_]{3,20})$/);
    if (profMatch && request.method === "GET") {
      const username = normalizeUsername(profMatch[1]);

      const user: any = await env.DB.prepare(
        "SELECT id, username FROM users WHERE username=?"
      ).bind(username).first();

      if (!user) return json({ ok: false, error: "Not found" }, 404);

      const prof: any = await env.DB.prepare(
        "SELECT display_name,bio,avatar_url,background_url,accent_color,primary_color,secondary_color,text_color,card_opacity,card_blur_px,effects_json,updated_at FROM profiles WHERE user_id=?"
      ).bind(user.id).first();

      const links = await env.DB.prepare(
        "SELECT id,label,url,icon,sort_order,enabled FROM links WHERE user_id=? AND enabled=1 ORDER BY sort_order ASC"
      ).bind(user.id).all();

      return json({
        ok: true,
        username: user.username,
        profile: prof,
        links: links.results || []
      });
    }

    // Track view: /profile/:username/view
    const viewMatch = path.match(/^\/profile\/([a-zA-Z0-9_]{3,20})\/view$/);
    if (viewMatch && request.method === "POST") {
      const username = normalizeUsername(viewMatch[1]);
      const user: any = await env.DB.prepare("SELECT id FROM users WHERE username=?").bind(username).first();
      if (!user) return json({ ok: false }, 404);

      const ua = request.headers.get("user-agent") || "";
      const device =
        /mobile/i.test(ua) ? "mobile" :
        /tablet/i.test(ua) ? "tablet" : "desktop";

      await env.DB.prepare(
        "INSERT INTO page_views (id,user_id,ts,ua,device) VALUES (?,?,?,?,?)"
      ).bind(uuid(), user.id, nowISO(), ua.slice(0, 200), device).run();

      return json({ ok: true });
    }

    // Simple analytics for dashboard (last 7 days)
    if (path === "/me/analytics" && request.method === "GET") {
      const me = await requireUser(request, env);
      if (!me) return json({ ok: false, error: "Unauthorized" }, 401);

      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const total: any = await env.DB.prepare(
        "SELECT COUNT(*) AS c FROM page_views WHERE user_id=? AND ts>=?"
      ).bind(me.id, since).first();

      const byDevice = await env.DB.prepare(
        "SELECT device, COUNT(*) AS c FROM page_views WHERE user_id=? AND ts>=? GROUP BY device"
      ).bind(me.id, since).all();

      return json({ ok: true, last7: { views: Number(total?.c ?? 0), devices: byDevice.results || [] } });
    }

    return json({ ok: false, error: "Not found" }, 404);
  } catch (e: any) {
    return json({ ok: false, error: "Server error", detail: String(e?.message || e) }, 500);
  }
};

