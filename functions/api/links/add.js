import { ok, bad, now, requireUser } from "../_util.js";

export async function onRequest(context) {
  const userId = await requireUser(context);
  if (!userId) return bad("Unauthorized", 401);

  const body = await context.request.json().catch(() => null);
  if (!body) return bad("Bad JSON");

  const platform = String(body.platform || "custom").slice(0, 30);
  const label = String(body.label || "").trim().slice(0, 40);
  const url = String(body.url || "").trim().slice(0, 300);

  if (!label) return bad("Missing label");
  if (!/^https?:\/\//i.test(url)) return bad("URL must start with http:// or https://");

  const maxSortRow = await context.env.DB
    .prepare("SELECT COALESCE(MAX(sort), 0) AS m FROM links WHERE user_id=?")
    .bind(userId)
    .first();

  const sort = (maxSortRow?.m || 0) + 1;
  await context.env.DB
    .prepare("INSERT INTO links (user_id,platform,label,url,sort,created_at) VALUES (?,?,?,?,?,?)")
    .bind(userId, platform, label, url, sort, now())
    .run();

  return ok();
}
