import { ok, bad, normalizeUsername, validUsername } from "../_util.js";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const username = normalizeUsername(url.searchParams.get("username") || "").toLowerCase();

  if (!validUsername(username)) return bad("Invalid username. Use a-z 0-9 . _ - (1–20 chars).");

  const existing = await context.env.DB
    .prepare("SELECT id FROM users WHERE username = ?")
    .bind(username)
    .first();

  return ok({ available: !existing });
}
