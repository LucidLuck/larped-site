export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const u = url.searchParams.get("u") || "";

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Register • larped.lol</title>
  <link rel="stylesheet" href="/assets/style.css"/>
</head>
<body class="bg">
  <div class="auth">
    <div class="authCard">
      <div class="authTitle">Register</div>
      <div class="muted">Claim your username and lock it to your account.</div>

      <label class="lbl">Username</label>
      <input class="inp" id="username" value="${u.replaceAll('"', "")}" autocomplete="username"/>

      <label class="lbl">Email</label>
      <input class="inp" id="email" autocomplete="email"/>

      <label class="lbl">Password</label>
      <input class="inp" id="password" type="password" autocomplete="new-password"/>

      <button class="btn full" id="doRegister">Create account</button>
      <div class="err" id="err"></div>

      <div class="muted" style="margin-top:14px;">
        Have an account? <a href="/login">Login</a>
      </div>
    </div>
  </div>

  <script src="/assets/app.js"></script>
</body>
</html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
