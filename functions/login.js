export async function onRequestGet() {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Login • larped.lol</title>
  <link rel="stylesheet" href="/assets/style.css"/>
</head>
<body class="bg">
  <div class="auth">
    <div class="authCard">
      <div class="authTitle">Login</div>
      <div class="muted">Use your username or email.</div>

      <label class="lbl">Username or Email</label>
      <input class="inp" id="login" autocomplete="username"/>

      <label class="lbl">Password</label>
      <input class="inp" id="password" type="password" autocomplete="current-password"/>

      <button class="btn full" id="doLogin">Login</button>
      <div class="err" id="err"></div>

      <div class="muted" style="margin-top:14px;">
        No account? <a href="/register">Register</a>
      </div>
    </div>
  </div>

  <script src="/assets/app.js"></script>
</body>
</html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
