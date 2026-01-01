const $ = (sel, root=document) => root.querySelector(sel);

const app = $("#app");
const modalHost = $("#modalHost");
const toastHost = $("#toastHost");

const PLATFORMS = [
  { key:"twitter", name:"Twitter / X", icon:"X", prefix:"https://x.com/" },
  { key:"discord", name:"Discord", icon:"💬", prefix:"https://discord.com/users/" },
  { key:"youtube", name:"YouTube", icon:"▶", prefix:"https://youtube.com/@" },
  { key:"tiktok", name:"TikTok", icon:"♪", prefix:"https://tiktok.com/@" },
  { key:"instagram", name:"Instagram", icon:"◎", prefix:"https://instagram.com/" },
  { key:"github", name:"GitHub", icon:"<>", prefix:"https://github.com/" },
  { key:"website", name:"Website", icon:"🌐", prefix:"https://" },
  { key:"email", name:"Email", icon:"✉", prefix:"mailto:" },
  { key:"cashapp", name:"CashApp", icon:"$", prefix:"https://cash.app/$" },
];

function toast(msg){
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  toastHost.appendChild(el);
  setTimeout(()=>{ el.style.opacity="0"; el.style.transform="translateY(6px)"; }, 2200);
  setTimeout(()=>{ el.remove(); }, 2800);
}

function normalizeUsername(u){
  return (u||"").trim().toLowerCase().replace(/[^a-z0-9_\.]/g,"");
}

function readUsers(){
  try { return JSON.parse(localStorage.getItem("larped_users") || "[]"); }
  catch { return []; }
}
function writeUsers(users){
  localStorage.setItem("larped_users", JSON.stringify(users));
}
function getSession(){
  try { return JSON.parse(localStorage.getItem("larped_session") || "null"); }
  catch { return null; }
}
function setSession(sess){
  localStorage.setItem("larped_session", JSON.stringify(sess));
}
function clearSession(){
  localStorage.removeItem("larped_session");
}

async function sha256(str){
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
}

function currentUser(){
  const sess = getSession();
  if(!sess?.username) return null;
  const users = readUsers();
  return users.find(u => u.username === sess.username) || null;
}

function updateTopbar(){
  const sess = getSession();
  const logged = !!sess?.username;
  $("#topLogin").style.display = logged ? "none":"inline-flex";
  $("#topRegister").style.display = logged ? "none":"inline-flex";
  $("#logoutBtn").style.display = logged ? "inline-flex":"none";
}

$("#logoutBtn").addEventListener("click", ()=>{
  clearSession();
  updateTopbar();
  toast("Logged out.");
  navigate("/");
});

function navigate(path){
  history.pushState({}, "", path);
  router();
}

window.addEventListener("popstate", router);
document.addEventListener("click", (e)=>{
  const a = e.target.closest("a[data-link]");
  if(!a) return;
  e.preventDefault();
  navigate(a.getAttribute("href"));
});

function routeMatch(path){
  // dynamic username: "/something" that isn't known routes
  const known = ["/", "/features", "/premium", "/discord", "/register", "/login", "/dashboard"];
  if(known.includes(path)) return { name: path };
  if(path.startsWith("/")) {
    const u = path.slice(1);
    if(u.length > 0) return { name: "/:username", username: u };
  }
  return { name: path };
}

function render(html){
  app.innerHTML = html;
}

function landing(){
  render(`
    <section class="hero">
      <h1 class="h1"><span class="muted">Your digital identity,</span><br/>simplified.</h1>
      <p class="sub">
        Build a premium link hub on <b>larped.lol</b>. Fast, clean, privacy-first, and designed like a luxury app.
      </p>

      <div class="claimRow">
        <div class="pillPrefix">larped.lol/</div>
        <input class="claimInput" id="claimName" placeholder="username" autocomplete="off" />
        <button class="btn solid" id="claimBtn">Claim</button>
      </div>

      <div class="grid">
        ${featureCard("Links","Connect all your important links in one place.","🔗")}
        ${featureCard("Templates","Start fast with premium templates, then customize everything.","🧩")}
        ${featureCard("Analytics","Privacy-first analytics (Phase 2 backend).","📊")}
        ${featureCard("Layouts","Flexible sections, widgets, and modular blocks (Phase 2).","▦")}
        ${featureCard("Comments","Optional interactions with safety controls (Phase 2).","💬")}
        ${featureCard("Appearance","Glass UI, theme color, gradients, and motion.","🎨")}
        ${featureCard("Rich Text","Beautiful bio formatting and embeds (Phase 2).","📝")}
        ${featureCard("Live Preview","Instant preview while editing (Phase 2 dashboard).","⚡")}
      </div>
    </section>
  `);

  const claimName = $("#claimName");
  const claimBtn = $("#claimBtn");

  const go = ()=>{
    const name = normalizeUsername(claimName.value);
    if(!name) return toast("Pick a username first.");
    const users = readUsers();
    const exists = users.some(u=>u.username===name);
    if(exists){
      toast("Username exists. Log in to edit it.");
      navigate("/login?u="+encodeURIComponent(name));
    } else {
      navigate("/register?u="+encodeURIComponent(name));
    }
  };

  claimBtn.addEventListener("click", go);
  claimName.addEventListener("keydown", (e)=>{ if(e.key==="Enter") go(); });
}

function featureCard(title, desc, icon){
  return `
    <div class="card">
      <div class="badgeIcon">${icon}</div>
      <h3>${title}</h3>
      <p>${desc}</p>
    </div>
  `;
}

function pageShell(title, body, rightBtnHtml=""){
  return `
    <div class="panel">
      <div class="panelHeader">
        <h2>${title}</h2>
        <div class="row">${rightBtnHtml}</div>
      </div>
      <div class="panelBody">${body}</div>
    </div>
  `;
}

function parseQuery(){
  const q = {};
  const s = new URLSearchParams(location.search);
  for(const [k,v] of s.entries()) q[k]=v;
  return q;
}

function registerPage(){
  const q = parseQuery();
  const preU = normalizeUsername(q.u || "");

  render(pageShell("Register", `
    <div class="formGrid">
      <div class="field">
        <div class="label">Username</div>
        <input class="input" id="rUser" placeholder="username" value="${preU}" />
        <div class="helper">Your page will be available at <b>larped.lol/username</b></div>
      </div>

      <div class="field">
        <div class="label">Email (optional)</div>
        <input class="input" id="rEmail" placeholder="you@example.com" />
        <div class="helper">Phase 2 can add verification / password reset.</div>
      </div>

      <div class="field">
        <div class="label">Password</div>
        <input class="input" id="rPass" type="password" placeholder="••••••••" />
      </div>

      <div class="field">
        <div class="label">Confirm Password</div>
        <input class="input" id="rPass2" type="password" placeholder="••••••••" />
      </div>
    </div>

    <div class="row" style="margin-top:14px">
      <button class="btn solid" id="doRegister">Claim Now</button>
      <a class="btn ghost" href="/login" data-link>Already have an account?</a>
    </div>

    <div class="helper" style="margin-top:10px">
      Prototype note: this stores accounts in your browser (localStorage). We’ll upgrade to real secure accounts in Phase 2.
    </div>
  `));

  $("#doRegister").addEventListener("click", async ()=>{
    const username = normalizeUsername($("#rUser").value);
    const email = ($("#rEmail").value||"").trim();
    const pass = $("#rPass").value;
    const pass2 = $("#rPass2").value;

    if(username.length < 2) return toast("Username is too short.");
    if(pass.length < 6) return toast("Password must be 6+ chars.");
    if(pass !== pass2) return toast("Passwords don't match.");

    const users = readUsers();
    if(users.some(u=>u.username===username)) return toast("Username is taken.");

    const passHash = await sha256(pass);

    users.push({
      id: Date.now(),
      username,
      email,
      passHash,
      createdAt: new Date().toISOString(),
      profile: {
        displayName: username,
        bio: "",
        accent: "#f7c400",
        links: []
      },
      stats: { views: 0, clicks: 0 }
    });

    writeUsers(users);
    setSession({ username });
    updateTopbar();
    toast("Account created.");
    navigate("/dashboard");
  });
}

function loginPage(){
  const q = parseQuery();
  const preU = normalizeUsername(q.u || "");

  render(pageShell("Login", `
    <div class="formGrid">
      <div class="field">
        <div class="label">Username</div>
        <input class="input" id="lUser" placeholder="username" value="${preU}" />
      </div>

      <div class="field">
        <div class="label">Password</div>
        <input class="input" id="lPass" type="password" placeholder="••••••••" />
      </div>
    </div>

    <div class="row" style="margin-top:14px">
      <button class="btn solid" id="doLogin">Login</button>
      <a class="btn ghost" href="/register" data-link>Create account</a>
    </div>

    <div class="helper" style="margin-top:10px">
      Phase 2: Google/Discord login + 2FA + real security on Workers/D1.
    </div>
  `));

  $("#doLogin").addEventListener("click", async ()=>{
    const username = normalizeUsername($("#lUser").value);
    const pass = $("#lPass").value;

    const users = readUsers();
    const u = users.find(x=>x.username===username);
    if(!u) return toast("No such user.");

    const passHash = await sha256(pass);
    if(passHash !== u.passHash) return toast("Wrong password.");

    setSession({ username });
    updateTopbar();
    toast("Welcome back.");
    navigate("/dashboard");
  });
}

function dashboardPage(){
  const me = currentUser();
  if(!me){
    toast("Please login first.");
    return navigate("/login");
  }

  const section = (new URLSearchParams(location.search).get("s") || "overview");
  const active = (k)=> section===k ? "sideLink active":"sideLink";

  render(`
    <div class="split">
      <aside class="sidebar">
        <div class="sideTitle">Dashboard</div>
        <a class="${active("overview")}" href="/dashboard?s=overview" data-link>📌 Overview</a>

        <div class="sideTitle">Customize</div>
        <a class="${active("profile")}" href="/dashboard?s=profile" data-link>👤 Profile</a>
        <a class="${active("links")}" href="/dashboard?s=links" data-link>🔗 Links</a>

        <div class="sideTitle">Manage</div>
        <a class="${active("settings")}" href="/dashboard?s=settings" data-link>⚙ Settings</a>

        <div class="sideTitle">Quick</div>
        <a class="sideLink" href="/${me.username}" data-link>↗ View Profile</a>
      </aside>

      <section>
        ${dashboardSection(section, me)}
      </section>
    </div>
  `);

  // wire up section events
  if(section==="profile") wireProfile(me);
  if(section==="links") wireLinks(me);
  if(section==="settings") wireSettings(me);
}

function dashboardSection(section, me){
  if(section==="overview"){
    const body = `
      <div class="kpiGrid">
        <div class="kpi"><div class="big">${me.stats?.views ?? 0}</div><div class="small">Profile Views</div></div>
        <div class="kpi"><div class="big">${me.id}</div><div class="small">User ID</div></div>
        <div class="kpi"><div class="big">${me.username}</div><div class="small">Username</div></div>
      </div>

      <div style="height:14px"></div>

      <div class="panel">
        <div class="panelHeader"><h2>Quick Actions</h2></div>
        <div class="panelBody">
          <div class="row">
            <a class="btn solid" href="/dashboard?s=links" data-link>+ Add Links</a>
            <a class="btn ghost" href="/dashboard?s=profile" data-link>Edit Profile</a>
            <a class="btn ghost" href="/${me.username}" data-link>View Public Page</a>
          </div>
          <div class="helper" style="margin-top:10px">
            This is Phase 1 (static prototype). Next we’ll add real database + uploads + analytics.
          </div>
        </div>
      </div>
    `;
    return pageShell("Overview", body);
  }

  if(section==="profile"){
    const body = `
      <div class="formGrid">
        <div class="field">
          <div class="label">Display name</div>
          <input class="input" id="pName" value="${escapeHtml(me.profile.displayName||me.username)}" />
        </div>

        <div class="field">
          <div class="label">Accent color</div>
          <input class="input" id="pAccent" value="${escapeHtml(me.profile.accent||"#f7c400")}" />
          <div class="helper">Default is yellow: <b>#f7c400</b></div>
        </div>

        <div class="field" style="grid-column:1/-1">
          <div class="label">Bio</div>
          <textarea class="textarea" id="pBio" placeholder="Write something...">${escapeHtml(me.profile.bio||"")}</textarea>
        </div>
      </div>

      <div class="row" style="margin-top:14px">
        <button class="btn solid" id="saveProfile">Save</button>
        <a class="btn ghost" href="/${me.username}" data-link>Preview Public</a>
      </div>

      <div class="helper" style="margin-top:10px">
        Phase 2: avatar, banner, decorations, rich text editor, live preview panel.
      </div>
    `;
    return pageShell("Profile", body);
  }

  if(section==="links"){
    const list = (me.profile.links||[]).map((l,i)=>`
      <div class="linkItem">
        <div class="linkLeft">
          <div class="linkIcon">${escapeHtml(l.icon||"🔗")}</div>
          <div>
            <div class="linkTitle">${escapeHtml(l.title||"Link")}</div>
            <div class="mini">${escapeHtml(l.url||"")}</div>
          </div>
        </div>
        <div class="row">
          <span class="pill">${l.enabled ? "Enabled":"Hidden"}</span>
          <button class="btn ghost" data-del="${i}">Delete</button>
        </div>
      </div>
    `).join("") || `<div class="helper">No links yet. Hit <b>Add Link</b> to create your first.</div>`;

    const body = `
      <div class="row" style="justify-content:space-between">
        <div class="helper">Manage your links (prototype).</div>
        <button class="btn solid" id="addLinkBtn">+ Add Link</button>
      </div>
      <div style="height:12px"></div>
      <div class="linkList" id="linkList">${list}</div>
    `;
    return pageShell("Links", body);
  }

  if(section==="settings"){
    const body = `
      <div class="helper">Prototype settings.</div>
      <div style="height:12px"></div>
      <div class="row">
        <button class="btn ghost" id="wipeLocal">Reset ALL local accounts (dev)</button>
        <button class="btn solid" id="logoutNow">Logout</button>
      </div>
    `;
    return pageShell("Settings", body);
  }

  return pageShell("Dashboard", `<div class="helper">Unknown section.</div>`);
}

function saveUser(updated){
  const users = readUsers();
  const idx = users.findIndex(u=>u.username===updated.username);
  if(idx>=0){
    users[idx] = updated;
    writeUsers(users);
  }
}

function wireProfile(me){
  $("#saveProfile").addEventListener("click", ()=>{
    me.profile.displayName = ($("#pName").value||"").trim().slice(0,40);
    me.profile.bio = ($("#pBio").value||"").trim().slice(0,500);
    const acc = ($("#pAccent").value||"").trim();
    me.profile.accent = acc || "#f7c400";
    saveUser(me);
    toast("Saved.");
  });
}

function openModal(innerHtml){
  modalHost.innerHTML = innerHtml;
  modalHost.style.display = "grid";
  modalHost.setAttribute("aria-hidden","false");

  const close = ()=>{
    modalHost.style.display = "none";
    modalHost.setAttribute("aria-hidden","true");
    modalHost.innerHTML = "";
  };

  modalHost.addEventListener("click", (e)=>{
    if(e.target === modalHost) close();
  }, { once:true });

  const x = modalHost.querySelector("[data-close]");
  if(x) x.addEventListener("click", close);

  return { close };
}

function wireLinks(me){
  const rerender = ()=> navigate("/dashboard?s=links");

  $("#addLinkBtn").addEventListener("click", ()=>{
    const { close } = openModal(`
      <div class="modal">
        <div class="modalHeader">
          <div class="title">Add Link</div>
          <button class="x" data-close>×</button>
        </div>
        <div class="modalBody">
          <input class="input" id="platSearch" placeholder="Search for a platform..." />
          <div class="platformList" id="platList"></div>
          <button class="btn solid footerBtn" id="customLink">+ Or Create Custom Link</button>
        </div>
      </div>
    `);

    const listEl = $("#platList");
    const searchEl = $("#platSearch");

    const draw = (q="")=>{
      const qq = q.trim().toLowerCase();
      const items = PLATFORMS.filter(p => p.name.toLowerCase().includes(qq));
      listEl.innerHTML = items.map(p=>`
        <button class="platformBtn" data-plat="${p.key}">
          <span class="linkIcon">${p.icon}</span>
          <span>${p.name}</span>
        </button>
      `).join("");
    };

    draw();

    searchEl.addEventListener("input", ()=> draw(searchEl.value));

    listEl.addEventListener("click", (e)=>{
      const btn = e.target.closest("[data-plat]");
      if(!btn) return;
      const plat = PLATFORMS.find(p=>p.key===btn.dataset.plat);
      if(!plat) return;

      close();

      const { close: close2 } = openModal(`
        <div class="modal">
          <div class="modalHeader">
            <div class="title">${plat.name}</div>
            <button class="x" data-close>×</button>
          </div>
          <div class="modalBody">
            <div class="field">
              <div class="label">Value</div>
              <input class="input" id="val" placeholder="${plat.prefix}" />
              <div class="helper">We’ll build the URL automatically.</div>
            </div>
            <div class="row" style="margin-top:12px">
              <button class="btn solid" id="save">Add</button>
              <button class="btn ghost" data-close>Cancel</button>
            </div>
          </div>
        </div>
      `);

      $("#save").addEventListener("click", ()=>{
        const v = ($("#val").value||"").trim();
        if(!v) return toast("Enter a value.");
        const url = plat.prefix + v.replace(/^https?:\/\//i,"");
        me.profile.links = me.profile.links || [];
        me.profile.links.push({
          title: plat.name,
          url,
          icon: plat.icon,
          enabled: true
        });
        saveUser(me);
        toast("Link added.");
        close2();
        rerender();
      });
    });

    $("#customLink").addEventListener("click", ()=>{
      close();
      const { close: close3 } = openModal(`
        <div class="modal">
          <div class="modalHeader">
            <div class="title">Custom Link</div>
            <button class="x" data-close>×</button>
          </div>
          <div class="modalBody">
            <div class="field">
              <div class="label">Title</div>
              <input class="input" id="ctitle" placeholder="My link" />
            </div>
            <div class="field" style="margin-top:10px">
              <div class="label">URL</div>
              <input class="input" id="curl" placeholder="https://example.com" />
            </div>
            <div class="row" style="margin-top:12px">
              <button class="btn solid" id="csave">Add</button>
              <button class="btn ghost" data-close>Cancel</button>
            </div>
          </div>
        </div>
      `);

      $("#csave").addEventListener("click", ()=>{
        const title = ($("#ctitle").value||"").trim() || "Custom";
        const url = ($("#curl").value||"").trim();
        if(!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) return toast("URL must start with http(s):// (or mailto:).");
        me.profile.links = me.profile.links || [];
        me.profile.links.push({ title, url, icon:"🔗", enabled:true });
        saveUser(me);
        toast("Link added.");
        close3();
        rerender();
      });
    });
  });

  $("#linkList").addEventListener("click", (e)=>{
    const del = e.target.closest("[data-del]");
    if(!del) return;
    const idx = Number(del.dataset.del);
    if(Number.isNaN(idx)) return;
    me.profile.links.splice(idx,1);
    saveUser(me);
    toast("Deleted.");
    rerender();
  });
}

function wireSettings(me){
  $("#wipeLocal").addEventListener("click", ()=>{
    localStorage.removeItem("larped_users");
    localStorage.removeItem("larped_session");
    updateTopbar();
    toast("Local accounts wiped.");
    navigate("/");
  });
  $("#logoutNow").addEventListener("click", ()=>{
    clearSession();
    updateTopbar();
    toast("Logged out.");
    navigate("/");
  });
}

function publicProfile(username){
  const u = normalizeUsername(username);
  const users = readUsers();
  const person = users.find(x=>x.username===u);

  if(!person){
    render(pageShell("Not found", `
      <div class="helper">No profile found for <b>${escapeHtml(u)}</b>.</div>
      <div class="row" style="margin-top:12px">
        <a class="btn solid" href="/register?u=${encodeURIComponent(u)}" data-link>Claim this username</a>
        <a class="btn ghost" href="/" data-link>Back home</a>
      </div>
    `));
    return;
  }

  // apply accent (public page)
  document.documentElement.style.setProperty("--accent", person.profile.accent || "#f7c400");

  const links = (person.profile.links||[]).filter(l=>l.enabled);
  const linkHtml = links.map(l=>`
    <a class="pubLink" href="${escapeAttr(l.url)}" target="_blank" rel="noopener">
      <div class="linkLeft">
        <div class="linkIcon">${escapeHtml(l.icon||"🔗")}</div>
        <div>
          <div class="linkTitle">${escapeHtml(l.title||"Link")}</div>
          <div class="mini">${escapeHtml(l.url||"")}</div>
        </div>
      </div>
      <span class="pill">Open</span>
    </a>
  `).join("") || `<div class="helper">No links added yet.</div>`;

  render(`
    <div class="profileShell">
      <div class="profileCard">
        <div class="profileTop">
          <div class="avatar"></div>
          <div>
            <p class="profileName">${escapeHtml(person.profile.displayName || person.username)}</p>
            <div class="mini">@${escapeHtml(person.username)}</div>
            <p class="profileBio">${escapeHtml(person.profile.bio || " ")}</p>
          </div>
        </div>
        <div class="profileBody">
          <div class="profileLinks">${linkHtml}</div>
          <div style="height:12px"></div>
          ${ownerLink(person.username)}
        </div>
      </div>
    </div>
  `);

  // count view (prototype)
  person.stats = person.stats || { views:0, clicks:0 };
  person.stats.views++;
  saveUser(person);
}

function ownerLink(username){
  const sess = getSession();
  if(sess?.username !== username) return "";
  return `
    <div class="row" style="justify-content:space-between">
      <div class="helper">Owner tools</div>
      <a class="btn solid" href="/dashboard?s=profile" data-link>Edit in Dashboard</a>
    </div>
  `;
}

function escapeHtml(s){
  return (s??"").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeAttr(s){ return escapeHtml(s).replaceAll('"',"&quot;"); }

function resetAccent(){
  document.documentElement.style.setProperty("--accent", "#f7c400");
}

function router(){
  updateTopbar();

  // reset accent on non-profile pages
  if(location.pathname === "/" || location.pathname.startsWith("/dashboard") || location.pathname==="/login" || location.pathname==="/register"){
    resetAccent();
  }

  const { name, username } = routeMatch(location.pathname);

  if(name==="/") return landing();
  if(name==="/register") return registerPage();
  if(name==="/login") return loginPage();
  if(name==="/dashboard") return dashboardPage();

  // simple placeholder pages
  if(name==="/features" || name==="/premium" || name==="/discord"){
    return render(pageShell(name.slice(1).toUpperCase(), `
      <div class="helper">Placeholder page. We’ll build this out next.</div>
      <div class="row" style="margin-top:12px">
        <a class="btn solid" href="/" data-link>Back home</a>
      </div>
    `));
  }

  // dynamic username route
  if(name==="/:username") return publicProfile(username);

  // fallback
  render(pageShell("Not found", `
    <div class="helper">That route doesn’t exist.</div>
    <div class="row" style="margin-top:12px">
      <a class="btn solid" href="/" data-link>Go home</a>
    </div>
  `));
}

router();
