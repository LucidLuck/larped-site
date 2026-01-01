import { ok, requireUser } from "./_util.js";

export async function onRequest(context) {
  const userId = await requireUser(context);
  if (!userId) return ok({ authed: false });

  const user = await context.env.DB
    .prepare("SELECT id, username FROM users WHERE id=?")
    .bind(userId)
    .first();

  return ok({ authed: true, user });
}
