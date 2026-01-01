import { ok, bad, now, normalizeUsername, validUsername, setCookie } from "../_util.js";

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

function randomSaltB64() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  let s = "";
  b.forEach(x => (s += String.fromCharCode(x)));
  return btoa(s);
}

function randomToken() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
}

export async function onRequest(context) {
  const body = await context.request.json().catch(() => null);
  if (!body) return bad("Bad JSON");

  const username = normalizeUsername(body.username || "").toLowerCase();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!validUsername(username)) return bad("Invalid username (1–20 chars: a-z 0-9 . _ -).");
  if (!email.includes("@") || email.length > 200) return bad("Invalid email.");
  if (password.length < 6 || password.length > 200) return bad("Password must be 6–200 chars.");

  const existsUser = await context.env.DB.prepare("SELECT id FROM users WHERE username=?").bind(username).first();
  if (existsUser) return bad("Username is taken.");

  const existsEmail = await context.env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
  if (existsEmail) return bad("Email already used.");

  const salt = randomSaltB64();
  const hash = await pbkdf2Hash(password, salt);
  const t = now();

  const ins = await context.env.DB
    .prepare("INSERT INTO users (username,email,pass_hash,pass_salt,created_at) VALUES (?,?,?,?,?)")
    .bind(username, email, hash, salt, t)
    .run();

  const userId = ins.meta.last_row_id;

  await context.env.DB
    .prepare("INSERT INTO profiles (user_id, updated_at) VALUES (?, ?)")
    .bind(userId, t)
    .run();

  const token = randomToken();
  const expires = t + 60 * 60 * 24 * 30; // 30 days
  await context.env.DB
    .prepare("INSERT INTO sessions (token,user_id,created_at,expires_at) VALUES (?,?,?,?)")
    .bind(token, userId, t, expires)
    .run();

  return new Response(JSON.stringify({ ok: true, userId }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "set-cookie": setCookie("session", token, { maxAge: 60 * 60 * 24 * 30 }),
      "cache-control": "no-store",
    },
  });
}
