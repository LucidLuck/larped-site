import { ok, bad, requireUser } from "../_util.js";

export async function onRequestGet(context) {
  const user = await requireUser(context);
  if (!user) return bad("Not logged in.", 401);

  const rows = await context.env.DB.prepare(
    "SELECT id, platform, label, url, sort FROM links WHERE user_id = ? ORDER BY sort ASC, id ASC"
  ).bind(user.id).all();

  return ok({ links: rows.results || [] });
}
