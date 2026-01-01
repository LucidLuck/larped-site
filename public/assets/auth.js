const $ = (s) => document.querySelector(s);

const msg = $("#msg");
const ok = $("#ok");

function showErr(t){
  if (!msg) return;
  msg.style.display = "block";
  msg.textContent = t;
  if (ok) ok.style.display = "none";
}
function showOk(t){
  if (!ok) return;
  ok.style.display = "block";
  ok.textContent = t;
  if (msg) msg.style.display = "none";
}

const u = $("#username");
const url = new URL(location.href);
if (u && url.searchParams.get("username")) u.value = url.searchParams.get("username");

const loginBtn = $("#go");
if (loginBtn && $("#user")) {
  loginBtn.addEventListener("click", async () => {
    try{
      const res = await fetch("/api/auth/login", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ user: $("#user").value.trim(), password: $("#pass").value })
      });
      const data = await res.json();
      if (!data.ok) return showErr(data.error || "Login failed");
      location.href = "/dashboard.html";
    }catch(e){ showErr("Network error"); }
  });
}

if (loginBtn && u) {
  loginBtn.addEventListener("click", async () => {
    const username = $("#username").value.trim().toLowerCase();
    const email = $("#email").value.trim().toLowerCase();
    const password = $("#pass").value;

    try{
      const check = await fetch(`/api/auth/check?username=${encodeURIComponent(username)}`, { cache:"no-store" });
      const c = await check.json();
      if (!c.ok) return showErr(c.error || "Invalid username");
      if (!c.available) return showErr("Username is taken.");

      const res = await fetch("/api/auth/register", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (!data.ok) return showErr(data.error || "Register failed");
      showOk("Account created. Redirecting…");
      setTimeout(() => location.href = "/dashboard.html", 700);
    }catch(e){ showErr("Network error"); }
  });
}
