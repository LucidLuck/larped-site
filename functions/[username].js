import { now } from "../api/_util.js";

const RESERVED = new Set([
  "login","register","dashboard","api","assets","styles.css","favicon.ico","robots.txt","404.html"
]);

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const slug = url.pathname.replace(/^\/+/, "").split("/")[0];

  // Let normal pages/assets work
  if (!slug || RESERVED.has(slug) || slug.includes(".")) {
    return context.next();
  }

  const username = slug.toLowerCase();

  const user = await context.env.DB
    .prepare("SELECT id, username FROM users WHERE username=?")
    .bind(username)
    .first();

  if (!user) return context.next();

  const profile = await context.env.DB
    .prepare("SELECT display_name,bio,occupation,location,avatar_url,banner_url,accent,views FROM profiles WHERE user_id=?")
    .bind(user.id)
    .first();

  const { results: links } = await context.env.DB
    .prepare("SELECT platform,label,url FROM links WHERE user_id=? ORDER BY sort ASC, id ASC")
    .bind(user.id)
    .all();

  // increment views
  await context.env.DB
    .prepare("UPDATE profiles SET views = views + 1, updated_at=? WHERE user_id=?")
    .bind(now(), user.id)
    .run();

  const accent = "#ffd24a"; // main larped yellow

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${user.username} • larped.lol</title>
  <link rel="stylesheet" href="/styles.css"/>
  <meta name="theme-color" content="${accent}"/>
</head>
<body class="profilePage">
  <div class="bgGlow"></div>
  <main class="profileWrap">
    <section class="card profileCard">
      <div class="row">
        <div class="avatar">${
          profile?.avatar_url
            ? `<img src="${profile.avatar_url}" alt="avatar"/>`
            : `<div class="avatarFallback"></div>`
        }</div>
        <div class="who">
          <div class="dn">${escapeHtml(profile?.display_name || user.username)}</div>
          <div class="un">@${user.username}</div>
        </div>
      </div>

      ${profile?.bio ? `<div class="bio">${escapeHtml(profile.bio).replace(/\n/g,"<br>")}</div>` : ""}

      <div class="meta">
        ${profile?.occupation ? `<span>${escapeHtml(profile.occupation)}</span>` : ""}
        ${profile?.location ? `<span>• ${escapeHtml(profile.location)}</span>` : ""}
      </div>

      <div class="links">
        ${(links || []).map(l => `
          <a class="linkBtn" href="${l.url}" target="_blank" rel="noopener">
            <span class="linkLabel">${escapeHtml(l.label)}</span>
            <span class="linkArrow">↗</span>
          </a>
        `).join("")}
      </div>
    </section>
  </main>
</body>
</html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }
  });
}

function escapeHtml(s){
  return String(s || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
