import { $, api, formatHost, reservedPaths, safeText } from "./common.js";

function getUsernameFromPath(){
  const path = location.pathname.replace(/^\/+|\/+$/g, "");
  const r = reservedPaths();
  if (r.has(path)) return null;

  // If there's slashes (like /a/b) treat as not found (keeps it clean)
  if (path.includes("/")) return null;

  return path.toLowerCase();
}

function setCSSVars(p){
  const root = document.documentElement.style;
  root.setProperty("--blue", p.accent_color || "#0b5cff");
  root.setProperty("--bg1", p.primary_color || "#0b1b3a");
  root.setProperty("--bg0", p.secondary_color || "#071126");
  root.setProperty("--text", p.text_color || "#eaf0ff");
}

function applyBackground(url){
  const el = $("#bg");
  if (!el) return;
  if (url && /^https?:\/\//i.test(url)) el.style.backgroundImage = `url("${url}")`;
  else el.style.backgroundImage = "";
}

function renderLinks(links){
  const wrap = $("#links");
  wrap.innerHTML = "";
  for (const L of links){
    const a = document.createElement("a");
    a.className = "pLink";
    a.href = L.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.innerHTML = `
      <div class="l">
        <div class="t"></div>
        <div class="u"></div>
      </div>
      <div class="kbd">↗</div>
    `;
    a.querySelector(".t").textContent = L.label;
    a.querySelector(".u").textContent = formatHost(L.url);
    wrap.appendChild(a);
  }
}

async function run(){
  const username = getUsernameFromPath();
  if (!username){
    // If someone hits /profile.html directly or reserved route, send home
    location.href = "/";
    return;
  }

  const r = await api(`/api/profile/${encodeURIComponent(username)}`);
  if (!r.ok){
    $("#bad").style.display = "block";
    safeText($("#bad"), "User not found.");
    return;
  }

  const p = r.profile || {};
  setCSSVars(p);
  applyBackground(p.background_url);

  // card styling from db
  const card = $("#card");
  const op = p.card_opacity ?? 0.78;
  const blur = p.card_blur_px ?? 18;
  card.style.background = `rgba(10,14,24,${op})`;
  card.style.backdropFilter = `blur(${blur}px)`;

  safeText($("#name"), p.display_name || r.username);
  safeText($("#user"), `@${r.username}`);
  safeText($("#bio"), p.bio || "");

  const av = $("#av");
  if (p.avatar_url && /^https?:\/\//i.test(p.avatar_url)){
    av.innerHTML = `<img src="${p.avatar_url}" alt="">`;
  } else {
    av.innerHTML = "";
  }

  renderLinks(r.links || []);

  // track view
  api(`/api/profile/${encodeURIComponent(username)}/view`, { method:"POST" });

  // FX
  const fx = JSON.parse(p.effects_json || "{}");
  if (fx.parallax){
    window.addEventListener("mousemove", (e)=>{
      const x = (e.clientX / window.innerWidth - 0.5) * 8;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      card.style.transform = `translate(${x}px, ${y}px)`;
    });
  }
}
run();
