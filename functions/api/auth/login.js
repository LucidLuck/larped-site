import { ok, bad, now, setCookie } from "../_util.js";

async function pbkdf2Hash(password, saltB64) {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 150000 },
    keyMaterial,
    256
  );
  const out = new Uint8Array(bits);
  let s = "";
  out.forEach(b => (s += String.fromCharCode(b)));
  return btoa(s);
}

function randomToken() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
}

export async function onRequest(context) {
  const body = await context.request.json().catch(() => null);
  if (!body) return bad("Bad JSON");

  const usernameOrEmail = String(body.user || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!usernameOrEmail || !password) return bad("Missing credentials.");

  const userRow = await context.env.DB
    .prepare("SELECT id, pass_hash, pass_salt FROM users WHERE username=? OR email=?")
    .bind(usernameOrEmail, usernameOrEmail)
    .first();

  if (!userRow) return bad("Invalid login.", 401);

  const hash = await pbkdf2Hash(password, userRow.pass_salt);
  if (hash !== userRow.pass_hash) return bad("Invalid login.", 401);

  const t = now();
  const token = randomToken();
  const expires = t + 60 * 60 * 24 * 30;

  await context.env.DB
    .prepare("INSERT INTO sessions (token,user_id,created_at,expires_at) VALUES (?,?,?,?)")
    .bind(token, userRow.id, t, expires)
    .run();

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "set-cookie": setCookie("session", token, { maxAge: 60 * 60 * 24 * 30 }),
      "cache-control": "no-store",
    },
  });
}
