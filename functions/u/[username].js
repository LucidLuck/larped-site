import { escapeHtml } from "../api/_util.js";

export async function onRequestGet(context) {
  const username = (context.params.username || "").toLowerCase();

  const user = await context.env.DB.prepare(
    "SELECT id, username FROM users WHERE username = ?"
  ).bind(username).first();

  if (!user) {
    return new Response("Profile not found.", { status: 404 });
  }

  // increment views
  await context.env.DB.prepare(
    "UPDATE profiles SET views = views + 1, updated_at = ? WHERE user_id = ?"
  ).bind(Date.now(), user.id).run();

  const profile = await context.env.DB.prepare(
    "SELECT display_name, bio, theme, views FROM profiles WHERE user_id = ?"
  ).bind(user.id).first();

  const links = await context.env.DB.prepare(
    "SELECT label, url FROM links WHERE user_id = ? ORDER BY sort ASC, id ASC"
  ).bind(user.id).all();

  const dn = escapeHtml(profile?.display_name || user.username);
  const bio = escapeHtml(profile?.bio || "");
  const views = profile?.views ?? 0;

  const linksHtml = (links.results || [])
    .map(l => `
      <a class="plink" href="${escapeHtml(l.url)}" target="_blank" rel="noopener">
        ${escapeHtml(l.label)}
      </a>
    `).join("");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${dn} • larped.lol</title>
  <link rel="stylesheet" href="/assets/style.css"/>
</head>
<body class="bg">
  <div class="profile-wrap">
    <div class="pcard">
      <div class="pname">${dn}</div>
      ${bio ? `<div class="pbio">${bio}</div>` : ""}
      <div class="pmeta">@${escapeHtml(user.username)} • ${views} views</div>
      <div class="plinks">${linksHtml || `<div class="muted">No links yet.</div>`}</div>
    </div>
    <div class="pfooter">
      <a class="muted" href="/">larped.lol</a>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
