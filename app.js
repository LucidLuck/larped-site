// larped.lol — Phase 1 static prototype (no backend)
// Routes work on Cloudflare Pages via _redirects -> /index.html 200

const $app = document.getElementById("app");
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

const STORE_KEY = "larped_users_v1";
const SESSION_KEY = "larped_session_v1";

function safeUsername(raw) {
  const u = (raw || "").trim().toLowerCase();
  // allow a-z 0-9 _ . - (like many platforms)
  if (!u) return "";
  if (!/^[a-z0-9._-]{2,20}$/.test(u)) return "";
  return u;
}

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); }
  catch { return {}; }
}
function saveUsers(users) {
  localStorage.setItem(STORE_KEY, JSON.stringify(users));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}
function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function navTo(path) {
  history.pushState({}, "", path);
  render();
}

function linkify() {
  document.querySelectorAll("[data-link]").forEach(a => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href) return;
      // allow normal hash jumps
      if (href.startsWith("/#")) return;
      e.preventDefault();
      navTo(href);
    });
  });
}

window.addEventListener("popstate", render);

function pageShell(inner) {
  $app.innerHTML = inner;
  linkify();
  wireActions();
}

function Landing() {
  return `
    <section class="section center">
      <div class="h1">
        <span class="light">Your digital identity,</span><br/>
        <span class="strong">simplified.</span>
      </div>

      <p class="sub">
        Create stunning bio links, showcase your content, and connect with your audience.
        <b>larped.lol</b> gives you the tools to build your online presence — beautifully.
      </p>

      <div class="claimWrap">
        <div class="claim" role="group" aria-label="Claim your username">
          <div class="claimPrefix">larped.lol/</div>
          <input id="claimInput" placeholder="username" autocomplete="off" spellcheck="false" />
          <button class="btn primary" id="claimBtn">Claim</button>
        </div>
      </div>

      <div class="hr"></div>

      <section id="features" class="section">
        <div class="grid">
          ${FeatureCard("🔗", "Links", "Connect all your important links in one place.")}
          ${FeatureCard("🧩", "Templates", "Start fast with premium templates, then customize everything.")}
          ${FeatureCard("📊", "Analytics", "Built-in privacy-first analytics (Phase 2 backend).")}
          ${FeatureCard("🧱", "Layouts", "Flexible sections, widgets, and modular blocks (Phase 2).")}
          ${FeatureCard("💬", "Comments", "Optional interactions with safety controls (Phase 2).")}
          ${FeatureCard("🎨", "Appearance", "Glass UI, theme color, gradients, and motion.")}
          ${FeatureCard("📝", "Rich Text", "Beautiful bio formatting and embeds (Phase 2).")}
          ${FeatureCard("⚡", "Live Preview", "Instant preview while editing (Phase 2 dashboard).")}
        </div>
      </section>

      <section id="premium" class="section">
        <div class="card">
          <div class="icon">💎</div>
          <h3>Premium feel, free core</h3>
          <p>
            We’ll keep core customization free. Premium can be optional extras later (like advanced analytics),
            but the main experience stays high-end for everyone.
          </p>
        </div>
      </section>

      <section id="discord" class="section">
        <div class="card">
          <div class="icon">🧠</div>
          <h3>Next: Dashboard + Real Accounts</h3>
          <p>
            This Phase 1 build is a working front-end prototype on Pages.
            Next we’ll add real login, username claiming, and saved profiles using Cloudflare D1 + Pages Functions.
          </p>
        </div>
      </section>
    </section>
  `;
}

function FeatureCard(emoji, title, desc) {
  return `
    <div class="card">
      <div class="icon">${emoji}</div>
      <h3>${title}</h3>
      <p>${desc}</p>
    </div>
  `;
}

function Register(queryU) {
  const prefill = safeUsername(queryU || "");
  return `
    <section class="auth">
      <div class="panel">
        <div class="panelTop"><div class="miniDot"></div><div style="font-weight:700">larped.lol</div></div>
        <h2>Register</h2>
        <div class="muted">Create your account to claim your username.</div>

        <button class="btn primary full" id="discordStub">Sign up with Discord</button>
        <div class="hr"></div>

        <form class="form" id="regForm">
          <div class="field">
            <div class="label">Username</div>
            <input class="input" name="username" placeholder="yourusername" value="${prefill}" />
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

          <div class="note">
            CAPTCHA will be added in Phase 2 (backend). For now, this is a prototype.
          </div>

          <button class="btn primary full" type="submit">Register</button>
          <div class="muted" style="margin-top:4px;">
            Already have an account? <a class="smallLink" href="/login" data-link>Login</a>
          </div>
        </form>
      </div>
    </section>
  `;
}

function Login() {
  return `
    <section class="auth">
      <div class="panel">
        <div class="panelTop"><div class="miniDot"></div><div style="font-weight:700">larped.lol</div></div>
        <h2>Sign in</h2>
        <div class="muted">Welcome back. Enter your details.</div>

        <button class="btn primary full" id="discordStub2">Sign in with Discord</button>
        <div class="hr"></div>

        <form class="form" id="loginForm">
          <div class="field">
            <div class="label">Username or Email</div>
            <input class="input" name="id" placeholder="your username or email" />
          </div>

          <div class="field">
            <div class="label">Password</div>
            <input class="input" name="password" type="password" placeholder="Your password" />
          </div>

          <div class="row2">
            <label class="muted" style="display:flex; gap:8px; align-items:center; font-size:13px;">
              <input type="checkbox" /> Remember
            </label>
            <div style="text-align:right;">
              <a class="smallLink" href="/" data-link>Forgot password</a>
            </div>
          </div>

          <button class="btn primary full" type="submit">Login</button>
          <div class="muted" style="margin-top:4px;">
            Don’t have an account? <a class="smallLink" href="/register" data-link>Sign up</a>
          </div>
        </form>
      </div>
    </section>
  `;
}

function Dashboard() {
  const s = getSession();
  if (!s) {
    return `
      <section class="auth">
        <div class="panel">
          <h2>Dashboard</h2>
          <div class="muted">You must be logged in.</div>
          <a class="btn primary" href="/login" data-link>Go to Login</a>
        </div>
      </section>
    `;
  }

  return `
    <section class="section">
      <div class="card">
        <h3>Overview</h3>
        <p class="muted">Logged in as <b>${escapeHtml(s.username)}</b>. Phase 2 will add the real dashboard UI + customization.</p>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
          <a class="btn ghost" href="/${encodeURIComponent(s.username)}" data-link>View Profile</a>
          <button class="btn danger" id="logoutBtn">Logout</button>
        </div>
      </div>
    </section>
  `;
}

function PublicProfile(username) {
  const u = safeUsername(username);
  if (!u) {
    return `
      <section class="auth">
        <div class="panel">
          <h2>Invalid username</h2>
          <div class="muted">Usernames must be 2–20 chars and use a-z, 0-9, . _ -</div>
          <a class="btn primary" href="/" data-link>Back home</a>
        </div>
      </section>
    `;
  }

  const users = loadUsers();
  const data = users[u];

  // Default profile if not registered yet (still looks premium)
  const display = data?.displayName || u;
  const bio = data?.bio || "This profile is not set up yet. Claim your username to customize everything.";
  const links = data?.links || [
    { title: "Claim this username", url: `/register?u=${encodeURIComponent(u)}`, badge: "New" },
    { title: "Go back home", url: "/", badge: "" },
  ];

  const initials = (display[0] || "L").toUpperCase();

  return `
    <section class="profile">
      <div class="avatar">${escapeHtml(initials)}</div>
      <div class="pTitle">${escapeHtml(display)}</div>
      <p class="pBio">${escapeHtml(bio)}</p>

      <div class="links">
        ${links.map(l => `
          <a class="linkBtn" href="${escapeAttr(l.url)}" ${l.url.startsWith("/") ? "data-link" : 'target="_blank" rel="noopener noreferrer"'}>
            <span>${escapeHtml(l.title)}</span>
            ${l.badge ? `<span class="badge">${escapeHtml(l.badge)}</span>` : `<span class="muted">→</span>`}
          </a>
        `).join("")}
      </div>

      <div class="hr"></div>
      <div class="muted">Phase 2 will add full themes, media, widgets, analytics, and verified badges.</div>
    </section>
  `;
}

function render() {
  const url = new URL(location.href);
  const path = decodeURIComponent(url.pathname);

  // simple router
  if (path === "/" || path === "") {
    pageShell(Landing());
    return;
  }
  if (path === "/register") {
    pageShell(Register(url.searchParams.get("u")));
    return;
  }
  if (path === "/login") {
    pageShell(Login());
    return;
  }
  if (path === "/dashboard") {
    pageShell(Dashboard());
    return;
  }

  // /:username
  const maybeUser = path.replace(/^\/+/, "");
  pageShell(PublicProfile(maybeUser));
}

function wireActions() {
  const claimBtn = document.getElementById("claimBtn");
  const claimInput = document.getElementById("claimInput");

  if (claimBtn && claimInput) {
    const go = () => {
      const u = safeUsername(claimInput.value);
      if (!u) {
        claimInput.focus();
        claimInput.value = "";
        claimInput.placeholder = "use 2-20 chars: a-z 0-9 . _ -";
        return;
      }
      navTo(`/register?u=${encodeURIComponent(u)}`);
    };
    claimBtn.addEventListener("click", go);
    claimInput.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  }

  const regForm = document.getElementById("regForm");
  if (regForm) {
    regForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(regForm);
      const username = safeUsername(fd.get("username"));
      const email = (fd.get("email") || "").toString().trim().toLowerCase();
      const password = (fd.get("password") || "").toString();

      if (!username) return alert("Invalid username. Use 2–20 chars: a-z 0-9 . _ -");
      if (!email.includes("@")) return alert("Enter a valid email.");
      if (password.length < 6) return alert("Password must be at least 6 characters.");

      const users = loadUsers();
      if (users[username]) return alert("That username is already claimed (in this prototype).");

      users[username] = {
        username,
        email,
        // NOTE: In Phase 1 we DO NOT hash because there’s no backend.
        // In Phase 2 we will hash on the server with proper auth.
        password,
        displayName: username,
        bio: "Edit your bio in the dashboard (Phase 2).",
        links: [
          { title: "My profile", url: `/${username}`, badge: "Owner" },
          { title: "Home", url: "/", badge: "" },
        ],
      };
      saveUsers(users);
      setSession({ username });

      navTo("/dashboard");
    });
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      const id = (fd.get("id") || "").toString().trim().toLowerCase();
      const password = (fd.get("password") || "").toString();

      const users = loadUsers();
      let found = null;

      for (const u of Object.keys(users)) {
        const row = users[u];
        if (row.username === id || row.email === id) {
          found = row;
          break;
        }
      }

      if (!found) return alert("Account not found (prototype). Try registering first.");
      if (found.password !== password) return alert("Wrong password (prototype).");

      setSession({ username: found.username });
      navTo("/dashboard");
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSession();
      navTo("/");
    });
  }

  // Stub buttons
  const discordStub = document.getElementById("discordStub");
  if (discordStub) discordStub.addEventListener("click", () => alert("Discord OAuth comes in Phase 2 (backend)."));

  const discordStub2 = document.getElementById("discordStub2");
  if (discordStub2) discordStub2.addEventListener("click", () => alert("Discord OAuth comes in Phase 2 (backend)."));

  // enable internal links inside rendered profile links
  document.querySelectorAll('a[data-link]').forEach(a => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href) return;
      if (href.startsWith("/#")) return;
      e.preventDefault();
      navTo(href);
    });
  });
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
function escapeAttr(s) {
  return String(s ?? "").replace(/"/g, "&quot;");
}

render();
