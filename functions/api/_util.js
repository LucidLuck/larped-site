export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

export function bad(message, status = 400) {
  return json({ ok: false, error: message }, { status });
}

export function ok(data = {}) {
  return json({ ok: true, ...data });
}

export function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const parts = cookie.split(";").map(s => s.trim());
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const k = p.slice(0, idx);
    const v = p.slice(idx + 1);
    if (k === name) return decodeURIComponent(v);
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

  let c = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
  if (httpOnly) c += "; HttpOnly";
  if (secure) c += "; Secure";
  if (maxAge != null) c += `; Max-Age=${maxAge}`;
  return c;
}

export function now() {
  return Math.floor(Date.now() / 1000);
}

export function normalizeUsername(u) {
  return String(u || "").trim();
}

// Allow 1+ chars, a-z 0-9 _ . - (no spaces)
export function validUsername(u) {
  return /^[a-zA-Z0-9._-]{1,20}$/.test(u);
}

export async function requireUser(context) {
  const token = getCookie(context.request, "session");
  if (!token) return null;

  const row = await context.env.DB
    .prepare("SELECT user_id, expires_at FROM sessions WHERE token = ?")
    .bind(token)
    .first();

  if (!row) return null;
  if (row.expires_at <= now()) return null;
  return row.user_id;
}
