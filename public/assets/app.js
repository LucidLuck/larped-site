import { $, $$, api, toast } from "./ui.js";

function page() {
  return location.pathname;
}

function setErr(msg) {
  const el = $("#err");
  if (el) el.textContent = msg || "";
}

function normalizeUsername(u) {
  return (u || "").trim().toLowerCase();
}

function validUsername(u) {
  return /^[a-z0-9_]{1,20}$/.test(u);
}

// Home claim
async function initHome() {
  const inp = $("#claimUser");
  const btn = $("#claimBtn");
  if (!inp || !btn) return;

  btn.addEventListener("click", () => {
    const u = normalizeUsername(inp.value);
    if (!validUsername(u)) {
      $("#claimHint").textContent = "Bad username. Use a-z, 0-9, underscore. 1–20 chars.";
      return;
    }
    location.href = `/register?u=${encodeURIComponent(u)}`;
  });

  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btn.click();
  });
}

// Register
async function initRegister() {
  const btn = $("#doRegister");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    setErr("");
    const username = normalizeUsername($("#username").value);
    const email = ($("#email").value || "").trim();
    const password = ($("#password").value || "").toString();

    if (!validUsername(username)) return setErr("Username must be 1–20 chars: a-z, 0-9, underscore.");
    if (!email.includes("@")) return setErr("Invalid email.");
    if (password.length < 8) return setErr("Password must be at least 8 characters.");

    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });

      // Auto login after register
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ login: username, password }),
      });

      toast("Account created.");
      location.href = "/dashboard";
    } catch (e) {
      setErr(e.message);
    }
  });
}

// Login
async function initLogin() {
  const btn = $("#doLogin");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    setErr("");
    const login = ($("#login").value || "").trim();
    const password = ($("#password").value || "").toString();
    if (!login || !password) return setErr("Missing login/password.");

    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
      });
      toast("Logged in.");
      location.href = "/dashboard";
    } catch (e) {
      setErr(e.message);
    }
  });
}

// Dashboard
function overviewCard(me, profile) {
  return `
    <div class="grid2">
      <div class="panel">
        <div class="panelTitle">Stats</div>
        <div class="statRow">
          <div class="stat"><div class="statNum">${profile.views ?? 0}</div><div class="muted">Profile Views</div></div>
          <div class="stat"><div class="statNum">${me.id}</div><div class="muted">User ID</div></div>
          <div class="stat"><div class="statNum">@${me.username}</div><div class="muted">Username</div></div>
        </div>
      </div>
      <div class="panel">
        <div class="panelTitle">Quick</div>
        <div class="row">
          <button class="btn" id="goLinks">Add Links</button>
          <button class="btn ghost" id="goProfile">Edit Profile</button>
        </div>
        <div class="muted" style="margin-top:10px;">Everything is saved to your account.</div>
      </div>
    </div>
  `;
}

function profileEditor(profile) {
  return `
    <div class="panel">
      <div class="panelTitle">Profile</div>

      <label class="lbl">Display Name</label>
      <input class="inp" id="display_name" value="${(profile.display_name||"").replaceAll('"',"&quot;")}"/>

      <label class="lbl">Bio</label>
      <textarea class="inp" id="bio" style="min-height:120px;">${profile.bio||""}</textarea>

      <div class="row" style="margin-top:12px;">
        <button class="btn" id="saveProfile">Save</button>
      </div>

      <div class="muted" style="margin-top:10px;">Theme: Yellow (locked right now, expandable later).</div>
    </div>
  `;
}

function linksEditor(links) {
  const items = links.map(l => `
    <div class="linkRow">
      <div>
        <div class="linkLabel">${l.label}</div>
        <div class="muted small">${l.url}</div>
      </div>
      <button class="btn danger" data-del="${l.id}">Remove</button>
    </div>
  `).join("");

  return `
    <div class="panel">
      <div class="panelTitle">Links</div>

      <div class="grid2">
        <div>
          <label class="lbl">Label</label>
          <input class="inp" id="link_label" placeholder="Twitter"/>
        </div>
        <div>
          <label class="lbl">URL</label>
          <input class="inp" id="link_url" placeholder="https://..."/>
        </div>
      </div>

      <div class="row" style="margin-top:12px;">
        <button class="btn" id="addLink">Add Link</button>
      </div>

      <div style="margin-top:14px;">
        ${items || `<div class="muted">No links yet.</div>`}
      </div>
    </div>
  `;
}

function comingSoon(title) {
  return `<div class="panel"><div class="panelTitle">${title}</div><div class="muted">Coming soon.</div></div>`;
}

async function initDashboard() {
  if (page() !== "/dashboard") return;

  let me, profile;

  try {
    const data = await api("/api/me");
    me = data.user;
    profile = data.profile || {};
  } catch {
    location.href = "/login";
    return;
  }

  $("#userChip").textContent = `@${me.username}`;
  $("#meMini").textContent = `UID ${me.id}`;

  const pageEl = $("#page");

  async function render(which) {
    // sidebar active
    $$(".sideItem").forEach(b => b.classList.toggle("active", b.dataset.page === which));

    if (which === "overview") {
      pageEl.innerHTML = overviewCard(me, profile);
      $("#goLinks").onclick = () => render("links");
      $("#goProfile").onclick = () => render("profile");
      return;
    }

    if (which === "profile") {
      pageEl.innerHTML = profileEditor(profile);
      $("#saveProfile").onclick = async () => {
        await api("/api/profile/update", {
          method: "POST",
          body: JSON.stringify({
            display_name: $("#display_name").value,
            bio: $("#bio").value,
          }),
        });
        toast("Saved.");
        const fresh = await api("/api/me");
        profile = fresh.profile || profile;
        render("profile");
      };
      return;
    }

    if (which === "links") {
      const list = await api("/api/links/list");
      pageEl.innerHTML = linksEditor(list.links || []);

      $("#addLink").onclick = async () => {
        const label = ($("#link_label").value || "").trim() || "Link";
        const url = ($("#link_url").value || "").trim();
        await api("/api/links/add", { method: "POST", body: JSON.stringify({ platform: "custom", label, url }) });
        toast("Added.");
        render("links");
      };

      $$("[data-del]").forEach(btn => {
        btn.onclick = async () => {
          const id = Number(btn.dataset.del);
          await api("/api/links/remove", { method: "POST", body: JSON.stringify({ id }) });
          toast("Removed.");
          render("links");
        };
      });

      return;
    }

    if (which === "appearance") {
      pageEl.innerHTML = comingSoon("Appearance");
      return;
    }
    if (which === "badges") {
      pageEl.innerHTML = comingSoon("Badges");
      return;
    }
    if (which === "widgets") {
      pageEl.innerHTML = comingSoon("Widgets");
      return;
    }
    if (which === "tracks") {
      pageEl.innerHTML = comingSoon("Tracks");
      return;
    }
    if (which === "settings") {
      pageEl.innerHTML = `
        <div class="panel">
          <div class="panelTitle">Settings</div>
          <div class="muted">More settings later.</div>
          <div class="row" style="margin-top:12px;">
            <button class="btn danger" id="logout2">Logout</button>
          </div>
        </div>
      `;
      $("#logout2").onclick = doLogout;
      return;
    }
  }

  $$(".sideItem").forEach(b => {
    b.addEventListener("click", () => render(b.dataset.page));
  });

  async function doLogout() {
    await api("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
    location.href = "/";
  }

  $("#logout").onclick = doLogout;
  $("#viewProfile").onclick = () => (location.href = `/${me.username}`);

  render("overview");
}

// init all
initHome();
initRegister();
initLogin();
initDashboard();
