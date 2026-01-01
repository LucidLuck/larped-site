export async function onRequestGet(context) {
  const url = new URL(context.request.url);

  // If path looks like "/username" (single segment) treat as profile
  const p = url.pathname;
  const isSingle = /^\/[a-z0-9_]{1,20}$/.test(p);

  // avoid collisions with real routes
  const reserved = new Set(["/login", "/register", "/dashboard", "/assets", "/api", "/favicon.ico"]);
  if (isSingle && !reserved.has(p)) {
    const username = p.slice(1);
    // rewrite internally
    return context.env.ASSETS.fetch(new Request(url.origin + "/u/" + username, context.request));
  }

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>larped.lol</title>
  <link rel="stylesheet" href="/assets/style.css"/>
</head>
<body class="bg">
  <header class="topbar">
    <div class="brand">
      <span class="dot"></span>
      <span>larped.lol</span>
    </div>
    <nav class="nav">
      <a href="#features">Features</a>
      <a href="#premium">Premium</a>
      <a href="#discord">Discord</a>
    </nav>
    <div class="actions">
      <a class="btn ghost" href="/login">Login</a>
      <a class="btn" href="/register">Register</a>
    </div>
  </header>

  <main class="hero">
    <h1>Your digital identity,<br/><span class="accent">simplified.</span></h1>
    <p class="sub">Claim your @, customize your page, and drop your links — fast, clean, and premium.</p>

    <div class="claim">
      <div class="pill">larped.lol/</div>
      <input id="claimUser" placeholder="username" autocomplete="off" spellcheck="false"/>
      <button class="btn" id="claimBtn">Claim</button>
    </div>
    <div class="hint" id="claimHint">Usernames: a-z, 0-9, underscore. 1–20 chars.</div>

    <section class="grid" id="features">
      <div class="card">
        <div class="cardTitle">Links</div>
        <div class="muted">Add, remove, and organize your socials.</div>
      </div>
      <div class="card">
        <div class="cardTitle">Appearance</div>
        <div class="muted">Yellow-accent glass UI + clean gradients.</div>
      </div>
      <div class="card">
        <div class="cardTitle">Dashboard</div>
        <div class="muted">Edit everything in one place.</div>
      </div>
      <div class="card" id="premium">
        <div class="cardTitle">Premium (later)</div>
        <div class="muted">Optional add-ons. Core stays free.</div>
      </div>
    </section>
  </main>

  <script src="/assets/app.js"></script>
</body>
</html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
