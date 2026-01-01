import { bad, ok, normalizeUsername, validateUsername, validateEmail, hashPassword, ensureProfile } from "../_util.js";

export async function onRequestPost(context) {
  const body = await context.request.json().catch(() => null);
  if (!body) return bad("Bad JSON.");

  const username = normalizeUsername(body.username);
  const email = (body.email || "").trim().toLowerCase();
  const password = (body.password || "").toString();

  const uErr = validateUsername(username);
  if (uErr) return bad(uErr);

  const eErr = validateEmail(email);
  if (eErr) return bad(eErr);

  if (password.length < 8) return bad("Password must be at least 8 characters.");

  // username taken?
  const existingU = await context.env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
  if (existingU) return bad("Username is taken.", 409);

  const existingE = await context.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existingE) return bad("Email is already used.", 409);

  const { hashB64, saltB64, iters } = await hashPassword(password);

  const now = Date.now();
  const ins = await context.env.DB.prepare(
    "INSERT INTO users (username, email, pass_hash, pass_salt, pass_iters, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(username, email, hashB64, saltB64, iters, now).run();

  const userId = ins.meta.last_row_id;
  await ensureProfile(context, userId);

  return ok({ userId, username });
}
