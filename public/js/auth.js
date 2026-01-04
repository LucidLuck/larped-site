import { $, api } from "./common.js";

function show(el, on){ el.style.display = on ? "block" : "none"; }
function setErr(msg){
  const box = $("#err");
  if (!box) return;
  box.textContent = msg;
  show(box, !!msg);
}
function setOk(msg){
  const box = $("#ok");
  if (!box) return;
  box.textContent = msg;
  show(box, !!msg);
}

const form = $("#form");
if (form){
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    setErr(""); setOk("");

    const mode = form.dataset.mode; // login|register
    const email = $("#email")?.value?.trim() || "";
    const username = $("#username")?.value?.trim() || "";
    const login = $("#login")?.value?.trim() || "";
    const password = $("#password")?.value || "";

    let data;
    if (mode === "register"){
      data = await api("/api/auth/register", {
        method:"POST",
        body: JSON.stringify({ email, username, password })
      });
    } else {
      data = await api("/api/auth/login", {
        method:"POST",
        body: JSON.stringify({ login, password })
      });
    }

    if (!data.ok){
      setErr(data.error || "Failed.");
      return;
    }

    setOk("Success. Redirecting…");
    setTimeout(()=> location.href="/dashboard", 450);
  });
}
