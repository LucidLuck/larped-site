import { ok, bad, now, requireUser } from "../_util.js";

export async function onRequest(context) {
  const userId = await requireUser(context);
  if (!userId) return bad("Unauthorized", 401);

  const body = await context.request.json().catch(() => null);
  if (!body) return bad("Bad JSON");

  const display_name = String(body.display_name || "").slice(0, 50);
  const bio = String(body.bio || "").slice(0, 500);
  const occupation = String(body.occupation || "").slice(0, 80);
  const location = String(body.location || "").slice(0, 80);
  const avatar_url = String(body.avatar_url || "").slice(0, 400);
  const banner_url = String(body.banner_url || "").slice(0, 400);
  const accent = String(body.accent || "yellow").slice(0, 20);

  const t = now();
  await context.env.DB
    .prepare(`
      UPDATE profiles
      SET display_name=?, bio=?, occupation=?, location=?, avatar_url=?, banner_url=?, accent=?, updated_at=?
      WHERE user_id=?
    `)
    .bind(display_name, bio, occupation, location, avatar_url, banner_url, accent, t, userId)
    .run();

  return ok();
}
