export async function onRequestGet() {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Dashboard • larped.lol</title>
  <link rel="stylesheet" href="/assets/style.css"/>
</head>
<body class="bg">
  <div class="dash">
    <aside class="side">
      <div class="sideBrand">
        <span class="dot"></span><span>larped.lol</span>
      </div>

      <div class="sideGroup">Dashboard</div>
      <button class="sideItem active" data-page="overview">Overview</button>

      <div class="sideGroup">Customize</div>
      <button class="sideItem" data-page="profile">Profile</button>
      <button class="sideItem" data-page="appearance">Appearance</button>
      <button class="sideItem" data-page="links">Links</button>
      <button class="sideItem" data-page="badges">Badges</button>
      <button class="sideItem" data-page="widgets">Widgets</button>
      <button class="sideItem" data-page="tracks">Tracks</button>

      <div class="sideGroup">Manage</div>
      <button class="sideItem" data-page="settings">Settings</button>

      <div class="sideFooter">
        <button class="btn ghost full" id="viewProfile">View Profile</button>
        <button class="btn danger full" id="logout">Logout</button>
        <div class="mini" id="meMini"></div>
      </div>
    </aside>

    <main class="main">
      <div class="mainTop">
        <div class="tabs">
          <button class="tab active" data-tab="main">Main</button>
          <button class="tab" data-tab="advanced">Advanced</button>
        </div>
        <div class="right">
          <div class="chip" id="userChip">...</div>
        </div>
      </div>

      <div id="page"></div>
    </main>
  </div>

  <script src="/assets/app.js"></script>
</body>
</html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
