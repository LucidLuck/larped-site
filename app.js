/* larped.lol — static prototype (Pages) with routing + local auth
   - /            landing + claim bar
   - /register    create account (username + password)
   - /login       login
   - /dashboard   private area (overview + links manager mock)
   - /profile     alias to dashboard profile section
   - /:username   public profile
*/

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

const APP = $("#app");

/* ---------- tiny storage layer ---------- */
const DB_KEY = "larped_db_v1";
const SESS_KEY = "larped_sess_v1";

function loadDB(){
  try{
    return JSON.parse(localStorage.getItem(DB_KEY)) || { users: {} };
  }catch{ return { users: {} }; }
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function getSession(){
  try{ return JSON.parse(localStorage.getItem(SESS_KEY)); }catch{ return null; }
}
function setSession(sess){ localStorage.setItem(SESS_KEY, JSON.stringify(sess)); }
function clearSession(){ localStorage.removeItem(SESS_KEY); }

function normalizeUsername(u){
  return (u||"").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}
function nowISO(){ return new Date().toISOString(); }

function getMe(){
  const sess = getSession();
  if(!sess?.u) return null;
  const db = loadDB();
  return db.users[sess.u] || null;
}

/* ---------- router ---------- */
function nav(path){
  history.pushState({}, "", path);
  render();
}
window.addEventListener("popstate", render);

document.addEventListener("click", (e)=>{
  const a = e.target.closest("a[data-link]");
  if(!a) return;
  e.preventDefault();
  nav(a.getAttribute("href"));
});

function route(){
  const path = location.pathname.replace(/\/+$/,"") || "/";
  const parts = path.split("/").filter(Boolean);

  if(path === "/") return { page:"home" };
  if(path === "/register") return { page:"register" };
  if(path === "/login") return { page:"login" };
  if(path === "/dashboard") return { page:"dashboard", tab:"overview" };
  if(path === "/dashboard/links") return { page:"dashboard", tab:"links" };
  if(path === "/dashboard/profile") return { page:"dashboard", tab:"profile" };
  if(path === "/profile") return { page:"dashboard", tab:"profile" }; // alias
  // public profile: /:username
  if(parts.length === 1) return { page:"user", username: parts[0] };

  return { page:"notfound" };
}

/* ---------- UI shells ---------- */
function Topbar(){
  const me = getMe();
  return `
    <div class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="/" data-link>
          <span class="dot"></span>
          <span>larped.lol</span>
          <span class="pill">yellow</span>
        </a>

        <nav class="nav">
          <a href="/#features" onclick="return false">Features</a>
          <a href="/#premium" onclick="return false">Premium</a>
          <a href="/#discord" onclick="return false">Discord</a>
        </nav>

        <div class="actions">
          ${me ? `
            <a class="btn" href="/dashboard" data-link>Dashboard</a>
            <button class="btn primary" id="logoutBtn">Logout</button>
          ` : `
            <a class="btn" href="/login" data-link>Login</a>
            <a class="btn primary" href="/register" data-link>Register</a>
          `}
        </div>
      </div>
    </div>
  `;
}

function layout(inner){
  APP.innerHTML = Topbar() + `<div class="wrap">${inner}</div>`;
  const logoutBtn = $("#logoutBtn");
  if(logoutBtn){
    logoutBtn.addEventListener("click", ()=>{
      clearSession();
      nav("/");
    });
  }
}

/* ---------- Pages ---------- */
function HomePage(){
  layout(`
    <section class="hero">
      <div class="h1">
        <span class="thin">Your digital identity,</span><br>
        <span class="bold">simplified.</span>
      </div>
      <div class="sub">
        Create a premium profile, add your links, and flex a luxury look —
        <b style="color:rgba(255,242,190,.95)">no ads, no trackers</b>, just speed.
      </div>

      <div class="claim">
        <div class="prefix">larped.lol/</div>
        <input id="claimInput" placeholder="username" autocomplete="off" />
        <button class="btn primary" id="claimBtn">Claim</button>
      </div>

      <div style="margin-top:12px" class="hint">
        Tip: usernames are a-z, 0-9, dot, dash, underscore.
      </div>
    </section>

    <section class="grid" id="features">
      ${featCard("Links", "Connect all your important links in one place. Drag, sort, and style.", "🔗")}
      ${featCard("Templates", "Start with luxury layouts, then customize everything.", "🧩")}
      ${featCard("Analytics", "Privacy-first stats (Phase 2 backend).", "📊")}
      ${featCard("Layouts", "Flexible sections, widgets, and modular blocks (Phase 2).", "🧱")}
      ${featCard("Comments", "Optional interactions with safety controls (Phase 2).", "💬")}
      ${featCard("Appearance", "Glass UI, theme color, gradients, and motion.", "🎨")}
      ${featCard("Rich Text", "Beautiful bio formatting and embeds (Phase 2).", "📝")}
      ${featCard("Live Preview", "Instant preview while editing (Phase 2 dashboard).", "⚡")}
    </section>

    <div style="margin-top:26px;text-align:center;color:rgba(233,238,246,.65);font-size:13px" id="premium">
      <b style="color:rgba(255,242,190,.95)">Premium feel, free core.</b><br>
      You’ll build the “feds-style” dashboard next. This is the clean working base that actually deploys.
    </div>
  `);

  const input = $("#claimInput");
  const btn = $("#claimBtn");

  function doClaim(){
    const desired = normalizeUsername(input.value);
    if(!desired){
      input.focus();
      return;
    }
    const db = loadDB();
    if(db.users[desired]){
      nav("/" + desired);
      return;
    }
    nav("/register?username=" + encodeURIComponent(desired));
  }
  btn.addEventListener("click", doClaim);
  input.addEventListener("keydown", (e)=>{ if(e.key === "Enter") doClaim(); });
}

function featCard(title, desc, emoji){
  return `
    <div class="card">
      <div class="icon">${emoji}</div>
      <div class="title">${title}</div>
      <div class="desc">${desc}</div>
    </div>
  `;
}

function RegisterPage(){
  const params = new URLSearchParams(location.search);
  const pre = normalizeUsername(params.get("username") || "");
  layout(`
    <div class="center">
      <div class="panel">
        <div class="brand" style="gap:8px;margin-bottom:10px">
          <span class="dot"></span><span>larped.lol</span>
        </div>
        <h2>Register</h2>
        <p>Create your account to claim your page.</p>

        <div class="field">
          <div class="label">Username</div>
          <input class="input" id="u" placeholder="yourname" value="${escapeHTML(pre)}" autocomplete="off" />
          <div class="hint" id="uHint">Your page will be: <b>larped.lol/<span id="uLive">${escapeHTML(pre || "username")}</span></b></div>
          <div class="err" id="uErr" style="display:none"></div>
        </div>

        <div class="row">
          <div class="field">
            <div class="label">Email (optional)</div>
            <input class="input" id="e" placeholder="you@email.com" autocomplete="off" />
          </div>
          <div class="field">
            <div class="label">Password</div>
            <input class="input" id="p" type="password" placeholder="••••••••" />
            <div class="hint">Min 6 chars (prototype)</div>
          </div>
        </div>

        <div class="field">
          <div class="label">Human check</div>
          <div class="hint">Type <b>LARPED</b> to continue (placeholder for CAPTCHA)</div>
          <input class="input" id="cap" placeholder="LARPED" autocomplete="off" />
        </div>

        <button class="btn primary" id="regBtn" style="width:100%;padding:12px 14px">Claim Now</button>
        <div class="hr"></div>
        <div class="hint">Already have an account? <a href="/login" data-link style="color:rgba(255,242,190,.95);font-weight:900">Login</a></div>
      </div>
    </div>
  `);

  const u = $("#u");
  const uLive = $("#uLive");
  const uErr = $("#uErr");
  u.addEventListener("input", ()=>{
    const n = normalizeUsername(u.value);
    uLive.textContent = n || "username";
    uErr.style.display="none";
  });

  $("#regBtn").addEventListener("click", ()=>{
    const db = loadDB();
    const username = normalizeUsername(u.value);
    const email = ($("#e").value || "").trim();
    const pass = $("#p").value || "";
    const cap = ($("#cap").value || "").trim().toUpperCase();

    if(!username || username.length < 2){
      showErr("Username too short.");
      return;
    }
    if(username.length > 20){
      showErr("Username too long (max 20).");
      return;
    }
    if(db.users[username]){
      showErr("That username is already taken.");
      return;
    }
    if(pass.length < 6){
      showErr("Password must be at least 6 characters.");
      return;
    }
    if(cap !== "LARPED"){
      showErr("Human check failed. Type LARPED.");
      return;
    }

    db.users[username] = {
      username,
      email,
      // NOTE: prototype only. Do NOT store plaintext passwords in real apps.
      pass,
      createdAt: nowISO(),
      profile: {
        displayName: username,
        bio: "Edit your bio in the dashboard.",
        theme: { accent: "#f7c400" },
        links: [
          { label: "My Discord", url: "https://discord.com", platform: "Discord" },
        ]
      },
      analytics: { views: 0 }
    };
    saveDB(db);

    setSession({ u: username, at: nowISO() });
    nav("/dashboard");
  });

  function showErr(msg){
    uErr.textContent = msg;
    uErr.style.display = "block";
  }
}

function LoginPage(){
  layout(`
    <div class="center">
      <div class="panel">
        <div class="brand" style="gap:8px;margin-bottom:10px">
          <span class="dot"></span><span>larped.lol</span>
        </div>
        <h2>Sign in</h2>
        <p>Welcome back. Enter your details.</p>

        <div class="field">
          <div class="label">Username or Email</div>
          <input class="input" id="id" placeholder="username or email" autocomplete="off" />
        </div>

        <div class="field">
          <div class="label">Password</div>
          <input class="input" id="pw" type="password" placeholder="••••••••" />
        </div>

        <div class="row">
          <button class="btn primary" id="loginBtn" style="padding:12px 14px">Login</button>
          <button class="btn" id="demoBtn" style="padding:12px 14px">Create demo user</button>
        </div>

        <div class="err" id="err" style="display:none;margin-top:10px"></div>

        <div class="hr"></div>
        <div class="hint">No account? <a href="/register" data-link style="color:rgba(255,242,190,.95);font-weight:900">Register</a></div>
      </div>
    </div>
  `);

  $("#loginBtn").addEventListener("click", ()=>{
    const db = loadDB();
    const id = ($("#id").value || "").trim().toLowerCase();
    const pw = $("#pw").value || "";
    const err = $("#err");

    let user = null;
    if(db.users[id]) user = db.users[id];
    else{
      user = Object.values(db.users).find(u => (u.email||"").toLowerCase() === id) || null;
    }

    if(!user || user.pass !== pw){
      err.textContent = "Invalid login.";
      err.style.display = "block";
      return;
    }

    setSession({ u: user.username, at: nowISO() });
    nav("/dashboard");
  });

  $("#demoBtn").addEventListener("click", ()=>{
    const db = loadDB();
    const base = "larp";
    let u = base;
    let i = 1;
    while(db.users[u]){ u = base + i; i++; }
    db.users[u] = {
      username: u,
      email: "",
      pass: "larped123",
      createdAt: nowISO(),
      profile: {
        displayName: u,
        bio: "Demo profile — edit in dashboard.",
        theme: { accent: "#f7c400" },
        links: []
      },
      analytics: { views: 0 }
    };
    saveDB(db);
    setSession({ u, at: nowISO() });
    nav("/dashboard");
  });
}

function DashboardPage(tab="overview"){
  const me = getMe();
  if(!me){ nav("/login"); return; }

  const active = (t)=> (tab===t ? "side-link active" : "side-link");
  layout(`
    <div class="dash">
      <aside class="sidebar">
        <div class="side-title">Dashboard</div>

        <div class="side-group">
          <div class="gname">Overview</div>
          <a class="${active("overview")}" href="/dashboard" data-link>Overview</a>
        </div>

        <div class="side-group">
          <div class="gname">Customize</div>
          <a class="${active("profile")}" href="/dashboard/profile" data-link>Profile</a>
          <a class="${active("links")}" href="/dashboard/links" data-link>Links</a>
        </div>

        <div class="side-group">
          <div class="gname">Manage</div>
          <a class="side-link" href="/${me.username}" data-link>View Profile</a>
        </div>

        <div style="margin-top:10px" class="hint">
          Prototype dashboard. Next step: we’ll match the exact “feds-style” look you want.
        </div>
      </aside>

      <main class="main" id="dashMain"></main>
    </div>
  `);

  const main = $("#dashMain");
  if(tab === "overview") renderOverview(main, me);
  if(tab === "links") renderLinks(main, me);
  if(tab === "profile") renderProfileSettings(main, me);
}

function renderOverview(main, me){
  main.innerHTML = `
    <div class="toolbar">
      <h3>Overview</h3>
      <div class="right">
        <span class="pill">@${me.username}</span>
      </div>
    </div>

    <div class="kpis" style="margin-top:12px">
      <div class="kpi"><div class="k">Profile Views</div><div class="v">${me.analytics?.views ?? 0}</div></div>
      <div class="kpi"><div class="k">User ID</div><div class="v">${hashID(me.username)}</div></div>
      <div class="kpi"><div class="k">Username</div><div class="v">@${me.username}</div></div>
    </div>

    <div style="margin-top:14px" class="card">
      <div class="title">What’s next</div>
      <div class="desc">
        This is the clean working base. Next we’ll build the real “feds-style” dashboard UI (tabs, preview panel, modals, widgets)
        and hook it to real storage (Cloudflare D1/Workers) if you want.
      </div>
      <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
        <a class="btn primary" href="/dashboard/links" data-link>Add links</a>
        <a class="btn" href="/dashboard/profile" data-link>Edit profile</a>
        <a class="btn" href="/${me.username}" data-link>View public profile</a>
      </div>
    </div>
  `;
}

const PLATFORM_LIST = [
  { name:"Twitter", hint:"https://x.com/yourname" },
  { name:"X", hint:"https://x.com/yourname" },
  { name:"Instagram", hint:"https://instagram.com/yourname" },
  { name:"TikTok", hint:"https://tiktok.com/@yourname" },
  { name:"YouTube", hint:"https://youtube.com/@yourname" },
  { name:"Twitch", hint:"https://twitch.tv/yourname" },
  { name:"Discord", hint:"https://discord.com/users/…" },
  { name:"Discord Server", hint:"https://discord.gg/…" },
  { name:"GitHub", hint:"https://github.com/yourname" },
  { name:"Website", hint:"https://your-site.com" },
  { name:"Email", hint:"mailto:you@email.com" },
  { name:"CashApp", hint:"https://cash.app/$yourtag" },
  { name:"Roblox", hint:"https://www.roblox.com/users/…" },
  { name:"Riot Games", hint:"https://…" },
  { name:"SoundCloud", hint:"https://soundcloud.com/…" },
  { name:"Spotify", hint:"https://open.spotify.com/user/…" },
];

function renderLinks(main, me){
  const links = me.profile?.links || [];
  main.innerHTML = `
    <div class="toolbar">
      <h3>Links</h3>
      <div class="right">
        <button class="btn" id="customizeBtn">Customize</button>
        <button class="btn primary" id="addLinkBtn">Add Link</button>
      </div>
    </div>

    <div class="card" style="margin-top:12px">
      <div class="title">${links.length ? "Your links" : "No links found"}</div>
      <div class="desc">${links.length ? "Click a link to remove it (prototype)." : "Create your first link to get started."}</div>

      <div style="margin-top:14px;display:grid;gap:10px">
        ${links.map((l, idx)=>`
          <div class="linkbtn" data-idx="${idx}">
            <div>
              ${escapeHTML(l.label)} <span class="small">• ${escapeHTML(l.platform || "Link")}</span>
              <div class="small">${escapeHTML(l.url)}</div>
            </div>
            <div class="pill">remove</div>
          </div>
        `).join("")}
      </div>

      ${!links.length ? `<div style="margin-top:14px"><button class="btn primary" id="addLinkBtn2">Add Link</button></div>` : ""}
    </div>
  `;

  // remove on click (prototype)
  $$(".linkbtn", main).forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const idx = Number(btn.getAttribute("data-idx"));
      const db = loadDB();
      const u = getMe()?.username;
      if(!u) return;
      db.users[u].profile.links.splice(idx,1);
      saveDB(db);
      render();
    });
  });

  const open = ()=> openAddLinkModal();
  $("#addLinkBtn")?.addEventListener("click", open);
  $("#addLinkBtn2")?.addEventListener("click", open);

  $("#customizeBtn")?.addEventListener("click", ()=>{
    alert("Customize UI comes next (we’ll match your screenshots).");
  });
}

function openAddLinkModal(){
  const me = getMe();
  if(!me) return;
  const wrap = document.createElement("div");
  wrap.className = "modal-backdrop";
  wrap.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="mhead">
        <div class="mtitle">Add Link</div>
        <button class="mclose" id="xBtn" aria-label="Close">✕</button>
      </div>
      <div class="mbody">
        <div class="search">
          <span style="opacity:.75">🔎</span>
          <input id="q" placeholder="Search for a platform..." autocomplete="off" />
        </div>
        <div class="list" id="list"></div>
      </div>
      <div class="mfoot">
        <button class="btn primary" id="customBtn">+ Or Create Custom Link</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  const q = $("#q", wrap);
  const list = $("#list", wrap);

  function renderList(){
    const term = (q.value||"").toLowerCase();
    const items = PLATFORM_LIST.filter(p => p.name.toLowerCase().includes(term));
    list.innerHTML = items.map(p=>`
      <div class="item" data-name="${escapeHTML(p.name)}" data-hint="${escapeHTML(p.hint)}">
        <div class="icon">🔗</div>
        <div>
          <div class="name">${escapeHTML(p.name)}</div>
          <div class="sub">${escapeHTML(p.hint)}</div>
        </div>
      </div>
    `).join("");
    $$(".item", list).forEach(it=>{
      it.addEventListener("click", ()=>{
        const platform = it.getAttribute("data-name");
        const hint = it.getAttribute("data-hint");
        const url = prompt(`Paste your ${platform} link:`, hint || "https://");
        if(!url) return;
        addLink(platform, url);
        close();
      });
    });
  }
  renderList();
  q.addEventListener("input", renderList);

  $("#customBtn", wrap).addEventListener("click", ()=>{
    const label = prompt("Link label (ex: My Store):", "My Link");
    if(!label) return;
    const url = prompt("URL:", "https://");
    if(!url) return;
    addLink("Custom", url, label);
    close();
  });

  function close(){ wrap.remove(); }
  $("#xBtn", wrap).addEventListener("click", close);
  wrap.addEventListener("click", (e)=>{ if(e.target === wrap) close(); });

  function addLink(platform, url, label){
    const db = loadDB();
    const u = getMe()?.username;
    if(!u) return;
    db.users[u].profile.links.push({
      platform,
      url: String(url).trim(),
      label: (label || platform)
    });
    saveDB(db);
    render();
  }
}

function renderProfileSettings(main, me){
  const p = me.profile || {};
  main.innerHTML = `
    <div class="toolbar">
      <h3>Profile</h3>
      <div class="right">
        <button class="btn primary" id="saveBtn">Save</button>
      </div>
    </div>

    <div class="card" style="margin-top:12px">
      <div class="title">Basics</div>
      <div class="desc">Edit your display name and bio. (More later: banner, avatar, effects.)</div>

      <div class="row" style="margin-top:12px">
        <div class="field">
          <div class="label">Display name</div>
          <input class="input" id="dn" value="${escapeHTML(p.displayName || me.username)}" />
        </div>
        <div class="field">
          <div class="label">Accent (brand yellow)</div>
          <input class="input" id="ac" value="${escapeHTML((p.theme?.accent || "#f7c400"))}" />
          <div class="hint">Keep this as #f7c400 for larped.lol</div>
        </div>
      </div>

      <div class="field">
        <div class="label">Bio</div>
        <input class="input" id="bio" value="${escapeHTML(p.bio || "")}" />
      </div>

      <div class="hint" style="margin-top:6px">
        Next we’ll build the real editor UI like your screenshots (tabs + live preview).
      </div>
    </div>
  `;

  $("#saveBtn").addEventListener("click", ()=>{
    const db = loadDB();
    const u = getMe()?.username;
    if(!u) return;

    db.users[u].profile.displayName = ($("#dn").value || u).trim();
    db.users[u].profile.bio = ($("#bio").value || "").trim();
    db.users[u].profile.theme = db.users[u].profile.theme || {};
    db.users[u].profile.theme.accent = ($("#ac").value || "#f7c400").trim();

    saveDB(db);
    alert("Saved (prototype).");
    render();
  });
}

function UserPage(usernameRaw){
  const username = normalizeUsername(usernameRaw);
  const db = loadDB();
  const user = db.users[username];

  if(!user){
    layout(`
      <div class="center">
        <div class="panel">
          <h2>User not found</h2>
          <p>That profile doesn’t exist yet.</p>
          <a class="btn primary" href="/register?username=${encodeURIComponent(username)}" data-link>Claim @${escapeHTML(username || "username")}</a>
        </div>
      </div>
    `);
    return;
  }

  // count view (simple)
  user.analytics = user.analytics || { views: 0 };
  user.analytics.views++;
  db.users[username] = user;
  saveDB(db);

  const prof = user.profile || {};
  const links = prof.links || [];

  layout(`
    <div class="profile">
      <div class="pcard">
        <div class="avatar">${escapeHTML((prof.displayName||user.username).slice(0,1).toUpperCase())}</div>
        <div class="pmeta">
          <div class="u">${escapeHTML(prof.displayName || user.username)} <span class="pill">@${escapeHTML(user.username)}</span></div>
          <div class="b">${escapeHTML(prof.bio || "No bio yet.")}</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">
          <a class="btn" href="/" data-link>Home</a>
          ${getMe()?.username === user.username ? `<a class="btn primary" href="/dashboard" data-link>Edit</a>` : ""}
        </div>
      </div>

      <div class="plinks">
        ${links.map(l=>`
          <a class="linkbtn" href="${escapeAttr(l.url)}" target="_blank" rel="noopener">
            <div>${escapeHTML(l.label || l.platform || "Link")}</div>
            <div class="small">${escapeHTML(l.platform || "")}</div>
          </a>
        `).join("")}
      </div>
    </div>
  `);
}

function NotFound(){
  layout(`
    <div class="center">
      <div class="panel">
        <h2>Not found</h2>
        <p>This page doesn’t exist.</p>
        <a class="btn primary" href="/" data-link>Go home</a>
      </div>
    </div>
  `);
}

/* ---------- render ---------- */
function render(){
  const r = route();
  if(r.page === "home") return HomePage();
  if(r.page === "register") return RegisterPage();
  if(r.page === "login") return LoginPage();
  if(r.page === "dashboard") return DashboardPage(r.tab);
  if(r.page === "user") return UserPage(r.username);
  return NotFound();
}

render();

/* ---------- helpers ---------- */
function escapeHTML(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
function escapeAttr(s){
  return String(s ?? "").replace(/"/g, "&quot;");
}
function hashID(u){
  // stable-ish fake ID for UI
  let h = 2166136261;
  const s = String(u||"");
  for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h = (h >>> 0) % 999999;
  return String(h).padStart(6,"0");
}
