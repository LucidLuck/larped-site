const $ = (s) => document.querySelector(s);

const input = $("#claimUser");
const btn = $("#claimBtn");
const hint = $("#claimHint");

function show(msg, ok=false){
  hint.textContent = msg;
  hint.style.color = ok ? "rgba(191,255,208,.95)" : "rgba(255,180,180,.95)";
  setTimeout(() => { hint.style.color = ""; }, 1400);
}

async function check(name){
  const res = await fetch(`/api/auth/check?username=${encodeURIComponent(name)}`, { cache: "no-store" });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Check failed");
  return data.available;
}

btn.addEventListener("click", async () => {
  const u = (input.value || "").trim();
  if (!u) return show("Type a username.");
  try{
    const available = await check(u);
    if (!available) return show("That username is taken.");
    location.href = `/register.html?username=${encodeURIComponent(u)}`;
  }catch(e){
    show(e.message || "Error");
  }
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btn.click();
});
