import { ok, bad, requireUser } from "../_util.js";

export async function onRequestPost(context) {
  const user = await requireUser(context);
  if (!user) return bad("Not logged in.", 401);

  const body = await context.request.json().catch(() => null);
  if (!body) return bad("Bad JSON.");

  const display_name = (body.display_name || "").slice(0, 40);
  const bio = (body.bio || "").slice(0, 500);

  // Theme locked to yellow (your request). You can expand later.
  const theme = "yellow";

  const now = Date.now();
  await context.env.DB.prepare(
    `UPDATE profiles
     SET display_name = ?, bio = ?, theme = ?, updated_at = ?
     WHERE user_id = ?`
  ).bind(display_name, bio, theme, now, user.id).run();

  return ok();
}
