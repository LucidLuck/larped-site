import { ok, bad, requireUser } from "../_util.js";

export async function onRequestGet(context) {
  const user = await requireUser(context);
  if (!user) return bad("Not logged in.", 401);

  const profile = await context.env.DB.prepare(
    "SELECT display_name, bio, theme, bg_mode, bg_value, avatar_url, banner_url, views FROM profiles WHERE user_id = ?"
  ).bind(user.id).first();

  return ok({ profile });
}
