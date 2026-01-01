const app = document.getElementById("app");

const STORE_KEY = "larped_users_v9";
const SESSION_KEY = "larped_session_v9";

// ---- Platforms shown in your Add Link modal style ----
const PLATFORMS = [
  { key:"twitch", name:"Twitch", icon:"🟣", type:"handle", prefix:"https://twitch.tv/" },
  { key:"twitter", name:"Twitter", icon:"🐦", type:"handle", prefix:"https://twitter.com/" },
  { key:"website", name:"Website", icon:"🌐", type:"url", prefix:"" },
  { key:"x", name:"X", icon:"✖️", type:"handle", prefix:"https://x.com/" },
  { key:"youtube", name:"YouTube", icon:"▶️", type:"url", prefix:"" },

  { key:"cashapp", name:"CashApp", icon:"💵", type:"handle", prefix:"https://cash.app/$" },
  { key:"deezer", name:"Deezer", icon:"🎶", type:"url", prefix:"" },
  { key:"discord", name:"Discord", icon:"💬", type:"handle", prefix:"https://discord.com/users/" },
  { key:"discord_server", name:"Discord Server", icon:"🧩", type:"url", prefix:"" },
  { key:"email", name:"Email", icon:"✉️", type:"email", prefix:"mailto:" },

  { key:"riot", name:"Riot Games", icon:"🟥", type:"handle", prefix:"" },
  { key:"roblox", name:"Roblox", icon:"🧱", type:"handle", prefix:"https://www.roblox.com/users/" },
  { key:"slat", name:"slat.cc", icon:"🟩", type:"url", prefix:"" },
  { key:"snapchat", name:"Snapchat", icon:"👻", type:"handle", prefix:"https://snapchat.com/add/" },
];

function safeUsername(raw){
  const u = (raw||"").trim().toLowerCase();
  if (!/^[a-z0-9._-]{2,20}$/.test(u)) return "";
  return u;
}
function loadUsers(){ try { return JSON.parse(localStorage.getItem(STORE_KEY)||"{}"); } catch { return {}; } }
function saveUsers(users){ localStorage.setItem(STORE_KEY, JSON.stringify(users)); }
function getSession(){ try { return JSON.parse(localStorage.getItem(SESSION_KEY)||"null"); } catch { return null; } }
function setSession(s){ localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
function clearSession(){ localStorage.removeItem(SESSION_KEY); }

function esc(s){ return String(s??"").replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
function escAttr(s){ return String(s??"").replace(/"/g,"&quot;"); }

function navTo(path){
  history.pushState({}, "", path);
  render();
}
window.addEventListener("popstate", render);

// ---- Data model defaults ----
function ensureUser(users, username){
  if (!users[username]){
    users[username] = {
      username,
      userId: String(Math.floor(100000 + Math.random()*900000)),
      email: "",
      password: "",
      profile: {
        displayName: username,
        bio: "",
        occupation: "",
        location: "",
        tags: [],
        avatarDataUrl: "",
        bgDataUrl: "",
        bgColor: "#ffc7df"
      },
      appearance: {
        accent: "#4f46e5",
        radius: 18
      },
      links: []
    };
  }
  // backfill new fields if old
  const u = users[username];
  u.profile ||= {};
  u.appearance ||= {};
  u.links ||= [];
  if (!u.profile.bgColor) u.profile.bgColor = "#ffc7df";
  if (!u.appearance.accent) u.appearance.accent = "#4f46e5";
  if (!u.appearance.radius) u.appearance.radius = 18;
  if (!u.userId) u.userId = String(Math.floor(100000 + Math.random()*900000));
  return u;
}

function topbar(){
  const s = getSession();
  return `
    <header class="topbar">
      <a class="brand" href="/" data-link>
        <span class="brandDot"></span>
        <span class="brandText">larped.lol</span>
      </a>
      <nav class="nav">
        <a href="/#features" data-link>Features</a>
        <a href="/#premium" data-link>Premium</a>
        <a href="/#discord" data-link>Discord</a>
      </nav>
      <div class="navBtns">
        ${s ? `<a class="btn ghost" href="/dashboard/overview" data-link>Dashboard</a>` : `<a class="btn ghost" href="/login" data-link>Login</a>`}
        ${s ? `<button class="btn danger" id="logoutTop">Logout</button>` : `<a class="btn primary" href="/register" data-link>Register</a>`}
      </div>
    </header>
  `;
}

function landing(){
  return `
    ${topbar()}
    <div class="wrap center">
      <div class="h1">
        <span class="light">Your digital identity,</span><br/>
        <span class="strong">simplified.</span>
      </div>
      <p class="sub">
        Create stunning bio links, showcase your content, and connect with your audience.
        <b>larped.lol</b> gives you the tools to build your online presence — beautifully.
      </p>

      <div class="claimWrap">
        <div class="claim">
          <div class="claimPrefix">larped.lol/</div>
          <input id="claimInput" placeholder="username" autocomplete="off" spellcheck="false" />
          <button class="btn primary" id="claimBtn">Claim</button>
        </div>
      </div>

      <div class="hr"></div>

      <section id="features">
        <div class="grid">
          ${feature("🔗","Links","Add unlimited links with icons and sorting.")}
          ${feature("🎨","Appearance","Accent colors, radius, backgrounds, effects.")}
          ${feature("🧩","Widgets","Modular blocks (Phase 2).")}
          ${feature("⚡","Live Preview","Real-time preview in dashboard.")}
          ${feature("🛡️","Privacy","No ads or tracking.")}
          ${feature("📦","Fast","Cloudflare Pages + CDN delivery.")}
          ${feature("🧠","Secure Next","Phase 2 adds real auth + DB + rate limits.")}
          ${feature("🌙","Aesthetic","Premium glass UI like your screenshots.")}
        </div>
      </section>

      <div class="hr"></div>

      <div class="footer">
        <div class="footerInner">
          <div>© ${new Date().getFullYear()} larped.lol</div>
          <div>No ads • No trackers • Fast by design</div>
        </div>
      </div>
    </div>
  `;
}
function feature(icon, title, desc){
  return `<div class="card"><div class="icon">${icon}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`;
}

function registerPage(prefill){
  const u = safeUsername(prefill||"");
  return `
    ${topbar()}
    <section class="auth">
      <div class="panel">
        <div class="panelTop"><div class="miniDot"></div><div style="font-weight:900">larped.lol</div></div>
        <h2>Register</h2>
        <div class="muted">Create your account to claim your username.</div>

        <form class="form" id="regForm">
          <div class="field">
            <div class="label">Username</div>
            <input class="input" name="username" placeholder="yourusername" value="${escAttr(u)}" />
            <div class="note">Your page will be available at <b>larped.lol/username</b></div>
          </div>

          <div class="field">
            <div class="label">Email address</div>
            <input class="input" name="email" placeholder="example@email.com" />
          </div>

          <div class="field">
            <div class="label">Password</div>
            <input class="input" name="password" type="password" placeholder="Your password" />
          </div>

          <div class="note">Phase 1 prototype saves in your browser. Phase 2 adds real secure auth, CAPTCHA, database.</div>

          <button class="btn primary full" type="submit">Register</button>
          <div class="muted" style="margin-top:6px;">
            Already have an account? <a class="smallLink" href="/login" data-link>Login</a>
          </div>
        </form>
      </div>
    </section>
  `;
}

function loginPage(){
  return `
    ${topbar()}
    <section class="auth">
      <div class="panel">
        <div class="panelTop"><div class="miniDot"></div><div style="font-weight:900">larped.lol</div></div>
        <h2>Sign in</h2>
        <div class="muted">Welcome back. Enter your details.</div>

        <form class="form" id="loginForm">
          <div class="field">
            <div class="label">Username or Email</div>
            <input class="input" name="id" placeholder="your username or email" />
          </div>

          <div class="field">
            <div class="label">Password</div>
            <input class="input" name="password" type="password" placeholder="Your password" />
          </div>

          <button class="btn primary full" type="submit">Login</button>
          <div class="muted" style="margin-top:6px;">
            Don’t have an account? <a class="smallLink" href="/register" data-link>Sign up</a>
          </div>
        </form>
      </div>
    </section>
  `;
}

/* ---------- DASHBOARD ---------- */
function dashShell(activeRoute, activeTopTab, mainTitle, mainIcon, bodyHtml){
  const s = getSession();
  if (!s?.username){
    navTo("/login");
    return "";
  }

  const users = loadUsers();
  const me = ensureUser(users, s.username);
  saveUsers(users);

  // apply appearance variables
  const accent = me.appearance.accent || "#4f46e5";
  const radius = me.appearance.radius || 18;

  const sb = (href, icon, label) => `
    <a class="sbItem ${activeRoute===href ? "active":""}" href="${href}" data-link>
      <span class="sbIcon">${icon}</span><span>${label}</span>
    </a>
  `;

  const tab = (href, label) => `
    <a class="tab ${activeTopTab===href ? "active":""}" href="${href}" data-link>${label}</a>
  `;

  return `
    <div style="--accent:${escAttr(accent)}; --r:${radius}px;">
      <div class="dash">
        <aside class="sidebar">
          <div class="sbBrand">
            <div class="dot"></div><div class="t">larped.lol</div>
          </div>

          <div class="sbGroup">
            <div class="sbTitle">Dashboard</div>
            ${sb("/dashboard/overview","📊","Overview")}
          </div>

          <div class="sbGroup">
            <div class="sbTitle">Customize</div>
            ${sb("/dashboard/profile","👤","Profile")}
            ${sb("/dashboard/appearance","🎨","Appearance")}
            ${sb("/dashboard/links","🔗","Links")}
            ${sb("/dashboard/badges","🏷️","Badges")}
            ${sb("/dashboard/widgets","🧩","Widgets")}
            ${sb("/dashboard/tracks","🎵","Tracks")}
          </div>

          <div class="sbGroup">
            <div class="sbTitle">Manage</div>
            ${sb("/dashboard/settings","⚙️","Settings")}
            ${sb("/dashboard/templates","🧱","Templates")}
          </div>

          <div class="sbBottom">
            <a class="btn ghost full" href="/${encodeURIComponent(me.username)}" data-link>View Profile</a>
            <div style="height:10px"></div>
            <div class="userCard">
              <div class="uAva">${esc((me.profile.displayName||me.username).slice(0,1).toUpperCase())}</div>
              <div class="uMeta">
                <div class="name">${esc(me.username)}</div>
                <div class="id">UID ${esc(me.userId)}</div>
              </div>
              <div style="margin-left:auto">
                <button class="btn danger small" id="logoutDash">Logout</button>
              </div>
            </div>
          </div>
        </aside>

        <section class="main">
          <div class="mainHead">
            <div class="mainTitle"><span class="bubble">${mainIcon}</span><span>${esc(mainTitle)}</span></div>
            <div class="row">
              ${activeRoute==="/dashboard/links" ? `<button class="btn primary small" id="openAddLink">Add Link</button>` : ""}
              ${activeRoute.startsWith("/dashboard/") ? `<a class="btn ghost small" href="/" data-link>Home</a>` : ""}
            </div>
          </div>

          <div class="tabs">
            ${tab("/dashboard/profile","Profile")}
            ${tab("/dashboard/appearance","Appearance")}
            ${tab("/dashboard/links","Links")}
            ${tab("/dashboard/badges","Badges")}
            ${tab("/dashboard/widgets","Widgets")}
            ${tab("/dashboard/tracks","Tracks")}
          </div>

          <div class="mainBody">
            ${bodyHtml}
          </div>
        </section>

        ${previewPanel(me)}
      </div>

      ${modalHtml()}
    </div>
  `;
}

function previewPanel(me){
  const p = me.profile;
  const bgStyle = p.bgDataUrl
    ? `background-image:url('${escAttr(p.bgDataUrl)}'); background-size:cover; background-position:center;`
    : `background: linear-gradient(180deg, ${escAttr(p.bgColor||"#ffc7df")}, rgba(255,255,255,.45));`;

  const accent = me.appearance.accent || "#4f46e5";
  const radius = me.appearance.radius || 18;

  const links = me.links.slice(0,5);
  return `
    <aside class="preview" style="--accent:${escAttr(accent)};">
      <div class="previewHead">
        <div class="pill">Minimal Profile Preview</div>
        <div class="pill">Radius ${radius}px</div>
      </div>
      <div class="previewBody">
        <div class="previewStage" style="border-radius:${Math.max(18, radius)}px;">
          <div class="previewBg" style="${bgStyle}"></div>
          <div class="previewCard" style="border-radius:${Math.max(16, radius)}px;">
            <div class="previewAva" style="border-radius:${Math.max(16, radius)}px;">
              ${p.avatarDataUrl ? `<img src="${escAttr(p.avatarDataUrl)}" alt="avatar">` : esc((p.displayName||me.username).slice(0,1).toUpperCase())}
            </div>
            <div class="previewName">${esc(p.displayName || me.username)}</div>
            <div class="previewBio">${esc(p.bio || "")}</div>

            <div class="previewLinks">
              ${links.length ? links.map(l=>`
                <a class="pLink" href="#" style="border-radius:${Math.max(14, radius)}px;">
                  <span>${esc(l.icon||"🔗")} ${esc(l.title||"Link")}</span>
                  <span style="color: rgba(0,0,0,.55); font-weight:900;">→</span>
                </a>
              `).join("") : `<div class="muted" style="font-size:12px;">No links yet</div>`}
            </div>
          </div>
        </div>
      </div>
    </aside>
  `;
}

function overviewPage(){
  const s = getSession();
  const users = loadUsers();
  const me = ensureUser(users, s.username);

  return dashShell(
    "/dashboard/overview",
    "/dashboard/profile",
    "Overview",
    "📊",
    `
      <div class="kpiRow">
        <div class="kpi"><div class="ic">👁️</div><div><div class="val">0</div><div class="lbl">Profile Views</div></div></div>
        <div class="kpi"><div class="ic">#</div><div><div class="val">${esc(me.userId)}</div><div class="lbl">User ID</div></div></div>
        <div class="kpi"><div class="ic">👤</div><div><div class="val">${esc(me.username)}</div><div class="lbl">Username</div></div></div>
      </div>

      <div class="grid2">
        <div class="bigCard">
          <h3>Limited Badges</h3>
          <div class="subt">You’ve claimed all available limited badges. Check back later!</div>
          <div class="emptyBox" style="height:120px;">Badges Placeholder</div>
        </div>

        <div class="bigCard">
          <h3>Quick Actions</h3>
          <div class="subt">Connect / links / profile tools</div>
          <div class="row">
            <button class="btn primary full" id="goLinks">Add your first link</button>
            <a class="btn ghost full" href="/dashboard/profile" data-link>Edit profile</a>
          </div>
        </div>
      </div>

      <div class="split3">
        <div class="bigCard">
          <h3>Profile Visitors</h3>
          <div class="subt">Last 30 days</div>
          <div class="emptyBox">Analytics Placeholder</div>
        </div>

        <div class="bigCard">
          <h3>Top 5 Links</h3>
          <div class="subt">Clicks placeholder</div>
          <div class="emptyBox">Top Links Placeholder</div>
        </div>
      </div>
    `
  );
}

function profilePage(){
  return dashShell(
    "/dashboard/profile",
    "/dashboard/profile",
    "Profile",
    "👤",
    `
      <div class="block">
        <h3>Avatar</h3>
        <div class="row">
          <input type="file" id="avatarFile" accept="image/*" style="display:none">
          <button class="btn primary small" id="changeAvatar">Change Avatar</button>
          <button class="btn ghost small" id="removeAvatar">Remove Avatar</button>
        </div>
      </div>

      <div class="block">
        <h3>Background</h3>
        <div class="row">
          <input type="file" id="bgFile" accept="image/*" style="display:none">
          <button class="btn ghost small" id="bgColorBtn">Color</button>
          <button class="btn ghost small" id="bgMediaBtn">Media</button>
          <button class="btn primary small" id="changeBg">Change Image</button>
          <button class="btn ghost small" id="removeBg">Remove Image</button>
          <input class="input" type="color" id="bgColor" title="Background Color" style="width:48px; height:44px; padding:6px; border-radius:14px;">
        </div>
        <div class="muted" style="font-size:12px; margin-top:10px;">Pick an image or use a color background.</div>
      </div>

      <div class="block">
        <h3>Profile Info</h3>
        <div class="field">
          <div class="label">Display Name</div>
          <input class="input" id="displayName" placeholder="Display name">
        </div>
        <div class="field">
          <div class="label">Bio</div>
          <textarea class="textarea" id="bio" placeholder="Write your bio..."></textarea>
        </div>
        <div class="row" style="margin-top:10px;">
          <div style="flex:1">
            <div class="label">Occupation</div>
            <input class="input" id="occupation" placeholder="">
          </div>
          <div style="flex:1">
            <div class="label">Location</div>
            <input class="input" id="location" placeholder="">
          </div>
        </div>

        <div class="sep"></div>

        <div class="row">
          <button class="btn primary small" id="addTag">+ New Tag</button>
          <div class="pills" id="tagPills"></div>
        </div>

        <div class="row" style="margin-top:12px;">
          <button class="btn primary full" id="saveProfile">Save</button>
        </div>
      </div>
    `
  );
}

function appearancePage(){
  return dashShell(
    "/dashboard/appearance",
    "/dashboard/appearance",
    "Appearance",
    "🎨",
    `
      <div class="block">
        <h3>Colors</h3>
        <div class="row">
          <div style="flex:1">
            <div class="label">Accent</div>
            <input class="input" type="color" id="accentColor" style="height:44px; padding:6px;">
          </div>
          <div style="flex:1">
            <div class="label">Radius</div>
            <input class="input" type="range" id="radius" min="12" max="26">
          </div>
        </div>
        <div class="row" style="margin-top:12px;">
          <button class="btn primary full" id="saveAppearance">Save</button>
        </div>
      </div>
    `
  );
}

function linksPage(){
  const s = getSession();
  const users = loadUsers();
  const me = ensureUser(users, s.username);

  const list = me.links || [];

  const body = list.length ? `
    <div class="linksTop">
      <div class="muted">Manage your links</div>
      <div class="row">
        <button class="btn ghost small" id="customizeLinks">Customize</button>
        <button class="btn primary small" id="openAddLink">Add Link</button>
      </div>
    </div>
    <div class="linkList">
      ${list.map((l, idx)=>`
        <div class="linkItem">
          <div class="linkLeft">
            <div class="linkIc">${esc(l.icon||"🔗")}</div>
            <div class="linkMeta">
              <div class="t">${esc(l.title||"Link")}</div>
              <div class="u">${esc(l.url||"")}</div>
            </div>
          </div>
          <div class="linkActions">
            <button class="btn ghost small" data-moveup="${idx}">Up</button>
            <button class="btn ghost small" data-movedown="${idx}">Down</button>
            <button class="btn danger small" data-del="${idx}">Delete</button>
          </div>
        </div>
      `).join("")}
    </div>
  ` : `
    <div class="emptyBox" style="height:420px;">
      <div style="text-align:center">
        <div style="font-weight:950; color: rgba(255,255,255,.70);">No Links Found</div>
        <div class="muted" style="margin-top:6px;">Create your first link to get started.</div>
        <div style="margin-top:14px;">
          <button class="btn primary" id="openAddLink">Add Link</button>
        </div>
      </div>
    </div>
  `;

  return dashShell(
    "/dashboard/links",
    "/dashboard/links",
    "Links",
    "🔗",
    body
  );
}

function placeholderPage(routeName){
  return dashShell(
    routeName,
    "/dashboard/profile",
    "Coming Soon",
    "🧱",
    `<div class="emptyBox" style="height:520px;">This section is next.</div>`
  );
}

/* ---------- PUBLIC PROFILE PAGE ---------- */
function publicProfile(username){
  const u = safeUsername(username);
  if (!u) {
    return `${topbar()}<div class="wrap"><div class="card"><h3>Invalid username</h3><p>Use 2–20 chars: a-z 0-9 . _ -</p></div></div>`;
  }

  const users = loadUsers();
  const me = users[u];

  if (!me) {
    return `
      ${topbar()}
      <div class="wrap">
        <div class="card">
          <h3>${esc(u)}</h3>
          <p class="muted">This profile isn’t claimed yet.</p>
          <a class="btn primary" href="/register?u=${encodeURIComponent(u)}" data-link>Claim username</a>
        </div>
      </div>
    `;
  }

  const p = me.profile || {};
  const accent = me.appearance?.accent || "#4f46e5";
  const radius = me.appearance?.radius || 18;

  const bgStyle = p.bgDataUrl
    ? `background-image:url('${escAttr(p.bgDataUrl)}'); background-size:cover; background-position:center;`
    : `background: linear-gradient(180deg, ${escAttr(p.bgColor||"#ffc7df")}, rgba(255,255,255,.45));`;

  return `
    ${topbar()}
    <div class="wrap" style="max-width:820px;">
      <div class="card" style="overflow:hidden; padding:0; border-radius:${Math.max(18, radius)}px; border-color: rgba(255,255,255,.10);">
        <div style="height:220px; ${bgStyle}"></div>
        <div style="padding:16px;">
          <div style="display:flex; gap:12px; align-items:center; margin-top:-48px;">
            <div style="width:86px; height:86px; border-radius:${Math.max(18, radius)}px; background: rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.18); overflow:hidden; box-shadow: var(--shadow2); display:grid; place-items:center; font-weight:950;">
              ${p.avatarDataUrl ? `<img src="${escAttr(p.avatarDataUrl)}" style="width:100%;height:100%;object-fit:cover;display:block;">` : esc((p.displayName||u).slice(0,1).toUpperCase())}
            </div>
            <div>
              <div style="font-weight:950; font-size:22px;">${esc(p.displayName||u)}</div>
              <div class="muted" style="font-size:13px;">${esc(p.occupation||"")} ${p.location ? "• "+esc(p.location) : ""}</div>
            </div>
          </div>

          <div class="muted" style="margin-top:10px; white-space:pre-wrap;">${esc(p.bio||"")}</div>

          <div style="margin-top:14px; display:grid; gap:10px;">
            ${(me.links||[]).map(l=>`
              <a class="btn ghost" href="${escAttr(l.url)}" target="_blank" rel="noopener noreferrer"
                 style="justify-content:space-between; border-radius:${Math.max(14,radius)}px; border-color: rgba(255,255,255,.14);">
                <span style="display:flex; gap:10px; align-items:center;">
                  <span>${esc(l.icon||"🔗")}</span> <span>${esc(l.title||"Link")}</span>
                </span>
                <span style="color: rgba(255,255,255,.55); font-weight:950;">→</span>
              </a>
            `).join("") || `<div class="muted">No links yet.</div>`}
          </div>

          <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
            ${(p.tags||[]).map(t=>`<span class="chip" style="cursor:default; background: rgba(79,70,229,.12); border-color: rgba(79,70,229,.22); color: rgba(255,255,255,.9);">${esc(t)}</span>`).join("")}
          </div>

          <div style="margin-top:16px; height:1px; background: rgba(255,255,255,.08);"></div>
          <div class="muted" style="font-size:12px; margin-top:12px;">larped.lol</div>
        </div>
      </div>
    </div>
  `;
}

/* ---------- MODALS ---------- */
function modalHtml(){
  return `
    <div class="overlay" id="overlay">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modalHead">
          <div class="ttl"><span>🔗</span> <span id="modalTitle">Add Link</span></div>
          <button class="x" id="closeModal">✕</button>
        </div>
        <div class="modalBody" id="modalBody"></div>
      </div>
    </div>
  `;
}

function openModal(title, bodyHtml){
  const ov = document.getElementById("overlay");
  const mt = document.getElementById("modalTitle");
  const mb = document.getElementById("modalBody");
  if (!ov || !mt || !mb) return;
  mt.textContent = title;
  mb.innerHTML = bodyHtml;
  ov.classList.add("show");

  const x = document.getElementById("closeModal");
  x?.addEventListener("click", closeModal);

  ov.addEventListener("click", (e)=>{
    if (e.target === ov) closeModal();
  }, { once:true });
}
function closeModal(){
  const ov = document.getElementById("overlay");
  ov?.classList.remove("show");
}

function addLinkModal(){
  return `
    <div class="search">
      <span style="opacity:.7;">🔍</span>
      <input id="platSearch" placeholder="Search for a platform..." autocomplete="off">
    </div>

    <div class="platList" id="platList">
      ${PLATFORMS.map(p=>platRow(p)).join("")}
    </div>

    <div style="margin-top:12px;">
      <button class="btn primary full" id="customLinkBtn">➕ Or Create Custom Link</button>
    </div>
  `;
}
function platRow(p){
  return `
    <div class="plat" data-plat="${escAttr(p.key)}">
      <div class="platL">
        <div class="platIc">${esc(p.icon)}</div>
        <div class="platName">${esc(p.name)}</div>
      </div>
      <div style="color: rgba(255,255,255,.45); font-weight:900;">›</div>
    </div>
  `;
}

function createLinkForm(platform){
  const isCustom = !platform;
  const p = platform || { key:"custom", name:"Custom Link", icon:"🔗", type:"url", prefix:"" };

  const hint =
    p.type === "handle" ? "Enter your username/handle"
    : p.type === "email" ? "Enter your email"
    : "Enter full URL";

  return `
    <div class="muted" style="margin-bottom:10px;">${esc(p.name)}</div>

    <div class="field">
      <div class="label">Title</div>
      <input class="input" id="linkTitle" value="${escAttr(p.name)}">
    </div>

    <div class="field">
      <div class="label">${esc(hint)}</div>
      <input class="input" id="linkValue" placeholder="${p.type==="url" ? "https://example.com" : ""}">
      <div class="note" style="margin-top:8px;">
        ${p.type==="handle" ? `Will become: <b>${esc(p.prefix)}yourhandle</b>` : ""}
        ${p.type==="email" ? `Will become: <b>mailto:you@email.com</b>` : ""}
      </div>
    </div>

    <div class="row" style="margin-top:12px;">
      <button class="btn primary full" id="saveLinkBtn">Save Link</button>
    </div>
  `;
}

/* ---------- WIRING ---------- */
function wireGlobalLinks(){
  document.querySelectorAll("[data-link]").forEach(a=>{
    a.addEventListener("click", (e)=>{
      const href = a.getAttribute("href");
      if (!href) return;
      if (href.startsWith("/#")) return; // allow hash
      e.preventDefault();
      navTo(href);
    });
  });
}

function wireLanding(){
  const claimBtn = document.getElementById("claimBtn");
  const claimInput = document.getElementById("claimInput");
  if (claimBtn && claimInput){
    const go = ()=>{
      const u = safeUsername(claimInput.value);
      if (!u){
        claimInput.value = "";
        claimInput.placeholder = "use 2-20 chars: a-z 0-9 . _ -";
        claimInput.focus();
        return;
      }
      navTo(`/register?u=${encodeURIComponent(u)}`);
    };
    claimBtn.addEventListener("click", go);
    claimInput.addEventListener("keydown", (e)=>{ if (e.key==="Enter") go(); });
  }

  const logoutTop = document.getElementById("logoutTop");
  logoutTop?.addEventListener("click", ()=>{
    clearSession();
    navTo("/");
  });
}

function wireAuth(){
  const regForm = document.getElementById("regForm");
  if (regForm){
    regForm.addEventListener("submit",(e)=>{
      e.preventDefault();
      const fd = new FormData(regForm);
      const username = safeUsername(fd.get("username"));
      const email = String(fd.get("email")||"").trim().toLowerCase();
      const password = String(fd.get("password")||"");

      if (!username) return alert("Invalid username. Use 2–20 chars: a-z 0-9 . _ -");
      if (!email.includes("@")) return alert("Enter a valid email.");
      if (password.length < 6) return alert("Password must be at least 6 chars.");

      const users = loadUsers();
      if (users[username]) return alert("That username is already claimed.");

      const u = ensureUser(users, username);
      u.email = email;
      u.password = password;
      u.profile.displayName = username;

      saveUsers(users);
      setSession({ username });
      navTo("/dashboard/overview");
    });
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm){
    loginForm.addEventListener("submit",(e)=>{
      e.preventDefault();
      const fd = new FormData(loginForm);
      const id = String(fd.get("id")||"").trim().toLowerCase();
      const pw = String(fd.get("password")||"");

      const users = loadUsers();
      let found = null;
      for (const k of Object.keys(users)){
        const u = users[k];
        if (u.username === id || u.email === id){ found = u; break; }
      }
      if (!found) return alert("Account not found.");
      if (found.password !== pw) return alert("Wrong password.");

      setSession({ username: found.username });
      navTo("/dashboard/overview");
    });
  }
}

function wireDashCommon(){
  const logoutDash = document.getElementById("logoutDash");
  logoutDash?.addEventListener("click", ()=>{
    clearSession();
    navTo("/");
  });

  const goLinks = document.getElementById("goLinks");
  goLinks?.addEventListener("click", ()=> navTo("/dashboard/links"));

  const openAdd = document.getElementById("openAddLink");
  openAdd?.addEventListener("click", ()=>{
    openModal("Add Link", addLinkModal());
    wireAddLinkModal();
  });

  // reorder / delete in links page
  document.querySelectorAll("[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const idx = Number(btn.getAttribute("data-del"));
      const s = getSession(); if (!s) return;
      const users = loadUsers();
      const me = ensureUser(users, s.username);
      me.links.splice(idx, 1);
      saveUsers(users);
      render();
    });
  });
  document.querySelectorAll("[data-moveup]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const idx = Number(btn.getAttribute("data-moveup"));
      const s = getSession(); if (!s) return;
      const users = loadUsers();
      const me = ensureUser(users, s.username);
      if (idx <= 0) return;
      const t = me.links[idx-1];
      me.links[idx-1] = me.links[idx];
      me.links[idx] = t;
      saveUsers(users);
      render();
    });
  });
  document.querySelectorAll("[data-movedown]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const idx = Number(btn.getAttribute("data-movedown"));
      const s = getSession(); if (!s) return;
      const users = loadUsers();
      const me = ensureUser(users, s.username);
      if (idx >= me.links.length-1) return;
      const t = me.links[idx+1];
      me.links[idx+1] = me.links[idx];
      me.links[idx] = t;
      saveUsers(users);
      render();
    });
  });
}

function wireAddLinkModal(){
  const search = document.getElementById("platSearch");
  const list = document.getElementById("platList");
  const customBtn = document.getElementById("customLinkBtn");

  const renderList = (q)=>{
    const qq = (q||"").trim().toLowerCase();
    const filtered = !qq ? PLATFORMS : PLATFORMS.filter(p=>p.name.toLowerCase().includes(qq));
    list.innerHTML = filtered.map(p=>platRow(p)).join("");
    list.querySelectorAll("[data-plat]").forEach(row=>{
      row.addEventListener("click", ()=>{
        const key = row.getAttribute("data-plat");
        const p = PLATFORMS.find(x=>x.key===key);
        openModal("Add Link", createLinkForm(p));
        wireCreateLink(p);
      });
    });
  };

  search?.addEventListener("input", ()=> renderList(search.value));
  customBtn?.addEventListener("click", ()=>{
    openModal("Add Link", createLinkForm(null));
    wireCreateLink(null);
  });

  renderList("");
}

function wireCreateLink(platform){
  const saveBtn = document.getElementById("saveLinkBtn");
  saveBtn?.addEventListener("click", ()=>{
    const title = String(document.getElementById("linkTitle")?.value || "").trim() || "Link";
    const val = String(document.getElementById("linkValue")?.value || "").trim();

    if (!val) return alert("Enter a value.");

    let url = val;

    if (platform){
      if (platform.type === "handle"){
        const h = val.replace(/^@/,"").trim();
        url = platform.prefix + encodeURIComponent(h);
      } else if (platform.type === "email"){
        url = "mailto:" + val;
      } else if (platform.type === "url"){
        url = val.startsWith("http") ? val : "https://" + val;
      }
    } else {
      // custom
      url = val.startsWith("http") ? val : "https://" + val;
    }

    const s = getSession(); if (!s) return;
    const users = loadUsers();
    const me = ensureUser(users, s.username);

    me.links.push({
      title,
      url,
      icon: platform?.icon || "🔗",
      key: platform?.key || "custom"
    });

    saveUsers(users);
    closeModal();
    render();
  });
}

function wireProfile(){
  const s = getSession(); if (!s) return;
  const users = loadUsers();
  const me = ensureUser(users, s.username);

  // fill values
  const dn = document.getElementById("displayName");
  const bio = document.getElementById("bio");
  const occ = document.getElementById("occupation");
  const loc = document.getElementById("location");
  const bgColor = document.getElementById("bgColor");

  if (dn) dn.value = me.profile.displayName || "";
  if (bio) bio.value = me.profile.bio || "";
  if (occ) occ.value = me.profile.occupation || "";
  if (loc) loc.value = me.profile.location || "";
  if (bgColor) bgColor.value = me.profile.bgColor || "#ffc7df";

  // tags
  function renderTags(){
    const wrap = document.getElementById("tagPills");
    if (!wrap) return;
    wrap.innerHTML = (me.profile.tags||[]).map((t,i)=>`
      <span class="chip" data-tag="${i}">#${esc(t)} ✕</span>
    `).join("");

    wrap.querySelectorAll("[data-tag]").forEach(ch=>{
      ch.addEventListener("click", ()=>{
        const idx = Number(ch.getAttribute("data-tag"));
        me.profile.tags.splice(idx,1);
        saveUsers(users);
        render();
      });
    });
  }
  renderTags();

  document.getElementById("addTag")?.addEventListener("click", ()=>{
    const t = prompt("New tag (no # needed):");
    if (!t) return;
    me.profile.tags.push(t.trim().slice(0,24));
    saveUsers(users);
    render();
  });

  // avatar
  const avatarFile = document.getElementById("avatarFile");
  document.getElementById("changeAvatar")?.addEventListener("click", ()=> avatarFile?.click());
  avatarFile?.addEventListener("change", ()=>{
    const f = avatarFile.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ()=>{
      me.profile.avatarDataUrl = String(r.result||"");
      saveUsers(users);
      render();
    };
    r.readAsDataURL(f);
  });
  document.getElementById("removeAvatar")?.addEventListener("click", ()=>{
    me.profile.avatarDataUrl = "";
    saveUsers(users);
    render();
  });

  // background image
  const bgFile = document.getElementById("bgFile");
  document.getElementById("changeBg")?.addEventListener("click", ()=> bgFile?.click());
  bgFile?.addEventListener("change", ()=>{
    const f = bgFile.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ()=>{
      me.profile.bgDataUrl = String(r.result||"");
      saveUsers(users);
      render();
    };
    r.readAsDataURL(f);
  });
  document.getElementById("removeBg")?.addEventListener("click", ()=>{
    me.profile.bgDataUrl = "";
    saveUsers(users);
    render();
  });

  bgColor?.addEventListener("input", ()=>{
    me.profile.bgColor = bgColor.value;
    saveUsers(users);
    // don’t full render on every tick—just update preview by re-rendering
    render();
  });

  document.getElementById("saveProfile")?.addEventListener("click", ()=>{
    me.profile.displayName = dn?.value?.trim() || me.username;
    me.profile.bio = bio?.value || "";
    me.profile.occupation = occ?.value || "";
    me.profile.location = loc?.value || "";
    if (bgColor?.value) me.profile.bgColor = bgColor.value;

    saveUsers(users);
    render();
  });
}

function wireAppearance(){
  const s = getSession(); if (!s) return;
  const users = loadUsers();
  const me = ensureUser(users, s.username);

  const accent = document.getElementById("accentColor");
  const radius = document.getElementById("radius");

  if (accent) accent.value = me.appearance.accent || "#4f46e5";
  if (radius) radius.value = String(me.appearance.radius || 18);

  document.getElementById("saveAppearance")?.addEventListener("click", ()=>{
    me.appearance.accent = accent?.value || "#4f46e5";
    me.appearance.radius = Number(radius?.value || 18);
    saveUsers(users);
    render();
  });
}

/* ---------- ROUTER ---------- */
function render(){
  const url = new URL(location.href);
  const path = decodeURIComponent(url.pathname);

  // Fix your old issue: if someone hits /profile, go dashboard profile if logged in
  if (path === "/profile"){
    const s = getSession();
    if (s?.username) return navTo("/dashboard/profile");
    return navTo("/login");
  }

  // Dashboard routes
  if (path.startsWith("/dashboard")){
    const seg = path.split("/").filter(Boolean)[1] || "overview";
    let html = "";
    if (seg === "overview") html = overviewPage();
    else if (seg === "profile") html = profilePage();
    else if (seg === "appearance") html = appearancePage();
    else if (seg === "links") html = linksPage();
    else html = placeholderPage(`/dashboard/${seg}`);

    app.innerHTML = html;
    wireGlobalLinks();
    wireDashCommon();
    if (seg === "profile") wireProfile();
    if (seg === "appearance") wireAppearance();
    return;
  }

  if (path === "/" || path === ""){
    app.innerHTML = landing();
    wireGlobalLinks();
    wireLanding();
    return;
  }

  if (path === "/register"){
    app.innerHTML = registerPage(url.searchParams.get("u"));
    wireGlobalLinks();
    wireAuth();
    return;
  }

  if (path === "/login"){
    app.innerHTML = loginPage();
    wireGlobalLinks();
    wireAuth();
    return;
  }

  // public username page
  const maybeUser = path.replace(/^\/+/, "");
  app.innerHTML = publicProfile(maybeUser);
  wireGlobalLinks();
  wireLanding();
}

render();
