import { ok, bad, requireUser } from "../_util.js";

export async function onRequest(context) {
  const userId = await requireUser(context);
  if (!userId) return bad("Unauthorized", 401);

  const { results } = await context.env.DB
    .prepare("SELECT id, platform, label, url, sort FROM links WHERE user_id=? ORDER BY sort ASC, id ASC")
    .bind(userId)
    .all();

  return ok({ links: results || [] });
}
