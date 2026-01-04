const username = location.pathname.replace("/", "").trim().toLowerCase();

const $ = (s) => document.querySelector(s);

async function api(path, opts) {
  const res = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...opts,
  });
  return res.json();
}

function iconSvg(key) {
  // clean minimal icons (extend later)
  const map = {
    discord: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 6.5c-1.2-.9-2.6-1.5-4-1.8-.2.4-.5 1-.6 1.4-1.5-.2-3-.2-4.5 0-.2-.4-.4-1-.6-1.4-1.4.3-2.8.9-4 1.8C.8 9.3.2 12 .4 14.6c1.7 1.3 3.3 2.1 4.9 2.6.4-.5.7-1 .9-1.6-.5-.2-1-.4-1.5-.7l.3-.3c2.9 1.4 6 1.4 8.9 0l.3.3c-.5.3-1 .5-1.5.7.2.6.6 1.1.9 1.6 1.6-.5 3.2-1.3 4.9-2.6.3-2.6-.3-5.3-1.7-8.1ZM8.4 13.6c-.7 0-1.2-.6-1.2-1.3s.5-1.3 1.2-1.3 1.2.6 1.2 1.3-.5 1.3-1.2 1.3Zm7.2 0c-.7 0-1.2-.6-1.2-1.3s.5-1.3 1.2-1.3 1.2.6 1.2 1.3-.5 1.3-1.2 1.3Z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 2A1.8 1.8 0 1 0 13.8 12 1.8 1.8 0 0 0 12 10.2ZM17.8 6.6a.8.8 0 1 1-.8-.8.8.8 0 0 1 .8.8Z"/></svg>`,
    link: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.6 13.4a1 1 0 0 1 0-1.4l2.4-2.4a1 1 0 1 1 1.4 1.4l-2.4 2.4a1 1 0 0 1-1.4 0ZM8.5 15.5l-1 1a3 3 0 0 1-4.2-4.2l2-2a3 3 0 0 1 4.2 0 1 1 0 1 1-1.4 1.4 1 1 0 0 0-1.4 0l-2 2a1 1 0 0 0 1.4 1.4l1-1a1 1 0 1 1 1.4 1.4Zm7-7 1-1a3 3 0 0 1 4.2 4.2l-2 2a3 3 0 0 1-4.2 0 1 1 0 0 1 1.4-1.4 1 1 0 0 0 1.4 0l2-2a1 1 0 0 0-1.4-1.4l-1 1a1 1 0 1 1-1.4-1.4Z"/></svg>`
  };
  return map[key] || map.link;
}

async function load() {
  const data = await api(`/api/profile/${encodeURIComponent(username)}`, { method: "GET" });

  if (!data?.ok) {
    document.title = "Not found • larped.lol";
    $("#card").innerHTML = `<div class="pfDisplay">User not found</div><div class="muted">This page doesn’t exist.</div>`;
    return;
  }

  const { profile, links } = data;

  document.title = `${data.username} • larped.lol`;

  const display = profile?.display_name || data.username;
  $("#display").textContent = display;
  $("#handle").textContent = `@${data.username}`;
  $("#bio").textContent = profile?.bio || "";

  // apply styles
  const card = $("#card");
  const accent = profile?.accent_color || "#0b5cff";
  const text = profile?.text_color || "#eaf0ff";
  card.style.setProperty("--accent", accent);
  card.style.setProperty("--text", text);
  card.style.background = `rgba(10, 16, 32, ${profile?.card_opacity ?? 0.78})`;
  card.style.backdropFilter = `blur(${profile?.card_blur_px ?? 18}px)`;

  const av = profile?.avatar_url || "";
  $("#avatar").src = av || "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" fill="#0b1b3a"/><text x="50%" y="54%" text-anchor="middle" font-size="56" fill="#eaf0ff" font-family="Arial">${data.username.slice(0,2).toUpperCase()}</text></svg>`);

  // render links
  const el = $("#links");
  el.innerHTML = "";
  (links || []).forEach((l) => {
    const a = document.createElement("a");
    a.className = "linkBtn";
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.innerHTML = `
      <span class="linkIcon">${iconSvg(l.icon || "link")}</span>
      <span class="linkText">${l.label}</span>
      <span class="linkArrow">›</span>
    `;
    el.appendChild(a);
  });

  // view tracking (non-blocking)
  fetch(`/api/profile/${encodeURIComponent(username)}/view`, { method: "POST" }).catch(()=>{});
}

load();
