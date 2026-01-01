import { bad, ok, normalizeUsername, hashPassword, setCookie } from "../_util.js";

export async function onRequestPost(context) {
  const body = await context.request.json().catch(() => null);
  if (!body) return bad("Bad JSON.");

  const login = (body.login || "").trim().toLowerCase();
  const password = (body.password || "").toString();

  if (!login || !password) return bad("Missing login or password.");

  const byUser = await context.env.DB.prepare(
    "SELECT id, username, pass_hash, pass_salt, pass_iters FROM users WHERE username = ?"
  ).bind(normalizeUsername(login)).first();

  const byEmail = await context.env.DB.prepare(
    "SELECT id, username, pass_hash, pass_salt, pass_iters FROM users WHERE email = ?"
  ).bind(login).first();

  const user = byUser || byEmail;
  if (!user) return bad("Invalid credentials.", 401);

  const check = await hashPassword(password, user.pass_salt, user.pass_iters);
  if (check.hashB64 !== user.pass_hash) return bad("Invalid credentials.", 401);

  // create session
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = btoa(String.fromCharCode(...tokenBytes)).replaceAll("=", "");
  const now = Date.now();
  const expires = now + 1000 * 60 * 60 * 24 * 14; // 14 days

  await context.env.DB.prepare(
    "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).bind(token, user.id, now, expires).run();

  const headers = new Headers();
  headers.append("Set-Cookie", setCookie("larped_session", token, { maxAge: 60 * 60 * 24 * 14 }));

  return ok({ username: user.username, userId: user.id, headers: Object.fromEntries(headers) });
}
