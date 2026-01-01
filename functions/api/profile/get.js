import { ok, bad, requireUser } from "../_util.js";

export async function onRequest(context) {
  const userId = await requireUser(context);
  if (!userId) return bad("Unauthorized", 401);

  const profile = await context.env.DB
    .prepare("SELECT display_name,bio,occupation,location,avatar_url,banner_url,accent,bg_mode,bg_value,views FROM profiles WHERE user_id=?")
    .bind(userId)
    .first();

  return ok({ profile: profile || {} });
}
