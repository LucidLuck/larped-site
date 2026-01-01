const USERNAME_RE = /^[a-z0-9_]{1,20}$/; // 1-char allowed

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

export function bad(message, status = 400) {
  return json({ ok: false, error: message }, status);
}

export function ok(data = {}) {
  return json({ ok: true, ...data });
}

export function normalizeUsername(u) {
  return (u || "").trim().toLowerCase();
}

export function validateUsername(u) {
  if (!USERNAME_RE.test(u)) {
    return "Username must be 1-20 chars and only a-z, 0-9, underscore.";
  }
  return null;
}

export function validateEmail(e) {
  const s = (e || "").trim().toLowerCase();
  if (!s.includes("@") || s.length < 6) return "Invalid email.";
  return null;
}

function b64(bytes) {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}
function unb64(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function hashPassword(password, saltB64 = null, iters = 210000) {
  const enc = new TextEncoder();
  const salt = saltB64 ? unb64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: iters },
    keyMaterial,
    256
  );
  return {
    hashB64: b64(new Uint8Array(bits)),
    saltB64: b64(salt),
    iters,
  };
}

export function getCookie(req, name) {
  const c = req.headers.get("Cookie") || "";
  const parts = c.split(";").map((p) => p.trim());
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function setCookie(name, value, opts = {}) {
  const {
    httpOnly = true,
    secure = true,
    sameSite = "Lax",
    path = "/",
    maxAge = null,
  } = opts;

  let s = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
  if (secure) s += "; Secure";
  if (httpOnly) s += "; HttpOnly";
  if (maxAge != null) s += `; Max-Age=${maxAge}`;
  return s;
}

export async function requireUser(context) {
  const token = getCookie(context.request, "larped_session");
  if (!token) return null;

  const now = Date.now();
  const row = await context.env.DB
    .prepare("SELECT user_id, expires_at FROM sessions WHERE token = ?")
    .bind(token)
    .first();

  if (!row) return null;
  if (row.expires_at < now) {
    await context.env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    return null;
  }

  const user = await context.env.DB
    .prepare("SELECT id, username, email FROM users WHERE id = ?")
    .bind(row.user_id)
    .first();

  return user || null;
}

export async function ensureProfile(context, userId) {
  const now = Date.now();
  await context.env.DB.prepare(
    `INSERT OR IGNORE INTO profiles (user_id, updated_at) VALUES (?, ?)`
  ).bind(userId, now).run();
}

export function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
