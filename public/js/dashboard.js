import { $, $$, api, clamp, formatHost, safeText } from "./common.js";

let ME = null;

function tab(name){
  for (const el of $$(".tabPanel")) el.style.display = (el.dataset.tab === name) ? "block" : "none";
  for (const b of $$(".tabBtn")){
    b.classList.toggle("primary", b.dataset.tab === name);
  }
}

async function loadMe(){
  const r = await api("/api/me");
  if (!r.ok){
    location.href="/login";
    return;
  }
  ME = r;

  safeText($("#whoUser"), ME.user.username);
  safeText($("#statUser"), ME.user.username);

  // fill profile
  const p = ME.profile || {};
  $("#display_name").value = p.display_name || "";
  $("#bio").value = p.bio || "";
  $("#avatar_url").value = p.avatar_url || "";
  $("#background_url").value = p.background_url || "";
  $("#accent_color").value = p.accent_color || "#0b5cff";
  $("#primary_color").value = p.primary_color || "#0b1b3a";
  $("#secondary_color").value = p.secondary_color || "#071126";
  $("#text_color").value = p.text_color || "#eaf0ff";
  $("#card_opacity").value = (p.card_opacity ?? 0.78);
  $("#card_blur_px").value = (p.card_blur_px ?? 18);

  $("#myPage").href = `/${ME.user.username}`;
}

async function loadLinks(){
  const r = await api("/api/me/links");
  if (!r.ok) return;
  const list = $("#linksList");
  list.innerHTML = "";

  const links = r.links || [];
  for (const L of links){
    const row = document.createElement("div");
    row.className = "linkItem";
    row.dataset.id = L.id;

    row.innerHTML = `
      <input class="lab" placeholder="Label" value="${escapeHtml(L.label)}">
      <input class="url" placeholder="https://..." value="${escapeHtml(L.url)}">
      <div class="actions">
        <span class="toggle">
          <input class="en" type="checkbox" ${L.enabled ? "checked":""} />
          <span class="small">On</span>
        </span>
        <button class="btn up" title="Up">↑</button>
        <button class="btn down" title="Down">↓</button>
        <button class="btn save">Save</button>
        <button class="btn" data-danger="1">Delete</button>
      </div>
    `;
    list.appendChild(row);
  }

  wireLinks();
}

function escapeHtml(s){
  return (s ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function linkRows(){
  return $$(".linkItem");
}

async function wireLinks(){
  for (const row of linkRows()){
    const id = row.dataset.id;
    const lab = $(".lab", row);
    const url = $(".url", row);
    const en = $(".en", row);

    $(".save", row).onclick = async ()=>{
      const payload = {
        label: lab.value.trim(),
        url: url.value.trim(),
        enabled: en.checked,
        sort_order: linkRows().findIndex(x => x.dataset.id === id)
      };
      const r = await api(`/api/me/links/${id}`, { method:"PUT", body: JSON.stringify(payload) });
      if (!r.ok) alert(r.error || "Save failed");
    };

    $(".up", row).onclick = async ()=>{
      const rows = linkRows();
      const i = rows.indexOf(row);
      if (i <= 0) return;
      row.parentElement.insertBefore(row, rows[i-1]);
      await pushSort();
    };

    $(".down", row).onclick = async ()=>{
      const rows = linkRows();
      const i = rows.indexOf(row);
      if (i < 0 || i >= rows.length-1) return;
      row.parentElement.insertBefore(rows[i+1], row);
      await pushSort();
    };

    row.querySelector('[data-danger="1"]').onclick = async ()=>{
      if (!confirm("Delete this link?")) return;
      const r = await api(`/api/me/links/${id}`, { method:"DELETE" });
      if (!r.ok) return alert(r.error || "Delete failed");
      row.remove();
      await pushSort();
    };
  }
}

async function pushSort(){
  const rows = linkRows();
  await Promise.all(rows.map((row, i)=> api(`/api/me/links/${row.dataset.id}`, {
    method:"PUT",
    body: JSON.stringify({
      label: $(".lab", row).value.trim(),
      url: $(".url", row).value.trim(),
      enabled: $(".en", row).checked,
      sort_order: i
    })
  })));
}

async function addLink(){
  const label = $("#new_label").value.trim();
  const url = $("#new_url").value.trim();
  if (!label || !url) return alert("Label + URL required");
  const r = await api("/api/me/links", { method:"POST", body: JSON.stringify({ label, url, icon:"" })});
  if (!r.ok) return alert(r.error || "Failed to add link");
  $("#new_label").value = "";
  $("#new_url").value = "";
  await loadLinks();
}

async function saveProfile(){
  const payload = {
    display_name: $("#display_name").value,
    bio: $("#bio").value,
    avatar_url: $("#avatar_url").value,
    background_url: $("#background_url").value,
    accent_color: $("#accent_color").value,
    primary_color: $("#primary_color").value,
    secondary_color: $("#secondary_color").value,
    text_color: $("#text_color").value,
    card_opacity: clamp(parseFloat($("#card_opacity").value || "0.78"), 0.15, 0.95),
    card_blur_px: clamp(parseInt($("#card_blur_px").value || "18", 10), 0, 60),
    effects: {
      snow: $("#fx_snow").checked,
      parallax: $("#fx_parallax").checked
    }
  };
  const r = await api("/api/me/profile", { method:"PUT", body: JSON.stringify(payload) });
  if (!r.ok) return alert(r.error || "Save failed");
  alert("Saved.");
}

async function loadAnalytics(){
  const r = await api("/api/me/analytics");
  if (!r.ok) return;
  safeText($("#statViews"), r.last7.views);
  const dev = r.last7.devices || [];
  const d = Object.fromEntries(dev.map(x => [x.device, x.c]));
  safeText($("#statDesktop"), d.desktop || 0);
  safeText($("#statMobile"), d.mobile || 0);
  safeText($("#statTablet"), d.tablet || 0);
}

async function logout(){
  await api("/api/auth/logout", { method:"POST" });
  location.href="/";
}

$("#btnAddLink")?.addEventListener("click", addLink);
$("#btnSaveProfile")?.addEventListener("click", saveProfile);
$("#btnLogout")?.addEventListener("click", logout);

for (const b of $$(".tabBtn")){
  b.addEventListener("click", ()=> tab(b.dataset.tab));
}

await loadMe();
await loadLinks();
await loadAnalytics();
tab("Overview");
