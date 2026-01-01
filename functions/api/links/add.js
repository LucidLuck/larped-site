import { ok, bad, requireUser } from "../_util.js";

function isValidUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function onRequestPost(context) {
  const user = await requireUser(context);
  if (!user) return bad("Not logged in.", 401);

  const body = await context.request.json().catch(() => null);
  if (!body) return bad("Bad JSON.");

  const platform = (body.platform || "custom").toLowerCase().slice(0, 20);
  const label = (body.label || "Link").slice(0, 40);
  const url = (body.url || "").trim();

  if (!isValidUrl(url)) return bad("Invalid URL. Must start with https://");

  const now = Date.now();
  await context.env.DB.prepare(
    "INSERT INTO links (user_id, platform, label, url, sort, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(user.id, platform, label, url, 0, now).run();

  return ok();
}
