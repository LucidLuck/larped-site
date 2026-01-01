import { ok, bad, requireUser } from "../_util.js";

export async function onRequestPost(context) {
  const user = await requireUser(context);
  if (!user) return bad("Not logged in.", 401);

  const body = await context.request.json().catch(() => null);
  if (!body) return bad("Bad JSON.");

  const id = Number(body.id);
  if (!Number.isFinite(id)) return bad("Bad id.");

  await context.env.DB.prepare(
    "DELETE FROM links WHERE id = ? AND user_id = ?"
  ).bind(id, user.id).run();

  return ok();
}
