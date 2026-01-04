// === SETTINGS ===
const DISCORD_USER_ID = "1288251829892939798";

// Add your socials here (big icons). You can add unlimited.
const SOCIALS = [
  { name: "Discord", url: "https://discord.gg/gut", icon: "discord" },
  // Add yours:
  // { name: "Instagram", url: "https://instagram.com/yourname", icon: "instagram" },
  // { name: "YouTube", url: "https://youtube.com/@yourname", icon: "youtube" },
  // { name: "X", url: "https://x.com/yourname", icon: "x" },
  // { name: "TikTok", url: "https://tiktok.com/@yourname", icon: "tiktok" },
];

// === ICON SVGs ===
const ICONS = {
  discord: `<svg viewBox="0 0 24 24" fill="none"><path d="M19.5 5.4A16 16 0 0 0 15.8 4c-.2.4-.4.9-.6 1.4a15.2 15.2 0 0 0-4.4 0C10.6 4.9 10.4 4.4 10.2 4A16 16 0 0 0 6.5 5.4C4.1 9 3.4 12.5 3.7 16c1.6 1.2 3.1 1.9 4.6 2.4.4-.5.7-1 .9-1.6-.5-.2-1-.5-1.4-.8l.3-.3c2.7 1.3 5.6 1.3 8.3 0l.3.3c-.4.3-.9.6-1.4.8.2.6.5 1.1.9 1.6 1.5-.5 3-1.2 4.6-2.4.4-4-.6-7.5-2.9-10.6ZM9.2 14.1c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.8 0 1.4.7 1.4 1.6 0 .9-.6 1.6-1.4 1.6Zm5.6 0c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.8 0 1.4.7 1.4 1.6 0 .9-.6 1.6-1.4 1.6Z" fill="currentColor"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="none"><path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm9 2h-9A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9A3.5 3.5 0 0 0 20 16.5v-9A3.5 3.5 0 0 0 16.5 4Zm-4.5 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm5.2-.9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" fill="currentColor"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="none"><path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.2 31 31 0 0 0 2 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" fill="currentColor"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.9-6.4L6.2 22H2.9l7.3-8.4L1 2h6.4l4.4 5.8L18.9 2Zm-1.1 18h1.7L7.5 3.9H5.7L17.8 20Z" fill="currentColor"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="none"><path d="M14 3v10.1a3.6 3.6 0 1 1-3-3.5V6.3A7.2 7.2 0 1 0 16 13V8.4c1.3 1 2.8 1.6 4.5 1.6V6.8c-1.1 0-2.2-.4-3.1-1.1A4.6 4.6 0 0 1 14 3Z" fill="currentColor"/></svg>`,
};

// === RENDER ICONS ===
const iconsEl = document.getElementById("icons");
iconsEl.innerHTML = SOCIALS.map(s => {
  const svg = ICONS[s.icon] || ICONS.discord;
  return `<a class="iconBtn" href="${s.url}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(s.name)}">${svg}</a>`;
}).join("");

// === AUDIO (autoplay is blocked, so click-to-play) ===
const audio = document.getElementById("bgAudio");
const audioBtn = document.getElementById("audioBtn");
const audioText = document.getElementById("audioText");
const audioDot = document.querySelector(".audioDot");

let playing = false;
function setAudioUI(){
  audioText.textContent = playing ? "Pause" : "Play";
  audioDot.style.background = playing ? "rgba(90,140,255,.95)" : "rgba(255,255,255,.25)";
  audioDot.style.boxShadow = playing ? "0 0 0 6px rgba(90,140,255,.18)" : "0 0 0 6px rgba(90,140,255,.14)";
}

audioBtn.addEventListener("click", async () => {
  try{
    if (!playing){
      await audio.play();
      playing = true;
    } else {
      audio.pause();
      playing = false;
    }
  } catch (e){
    // If user hasn't interacted enough, keep it safe
    playing = false;
  }
  setAudioUI();
});
setAudioUI();

// === DISCORD PRESENCE via Lanyard (optional) ===
// For this to show activity, you usually need to connect your account to Lanyard.
// If it shows "offline" forever, you’re not on Lanyard yet.
const statusDot = document.getElementById("statusDot");
const dName = document.getElementById("dName");
const dId = document.getElementById("dId");
const dSub = document.getElementById("dSub");
const tagline = document.getElementById("tagline");
const activityEl = document.getElementById("activity");

dId.textContent = DISCORD_USER_ID;

function setStatus(s){
  // online | idle | dnd | offline
  const map = {
    online: ["rgba(70,255,170,.9)", "0 0 0 6px rgba(70,255,170,.12)"],
    idle: ["rgba(255,210,80,.9)", "0 0 0 6px rgba(255,210,80,.12)"],
    dnd: ["rgba(255,90,90,.9)", "0 0 0 6px rgba(255,90,90,.12)"],
    offline: ["rgba(255,255,255,.25)", "0 0 0 6px rgba(255,255,255,.06)"],
  };
  const [bg, shadow] = map[s] || map.offline;
  statusDot.style.background = bg;
  statusDot.style.boxShadow = shadow;
}

function renderActivity(p){
  activityEl.style.display = "none";
  activityEl.innerHTML = "";

  // Spotify
  if (p?.spotify){
    const sp = p.spotify;
    activityEl.style.display = "flex";
    activityEl.innerHTML = `
      <div class="actArt"><img alt="" src="${sp.album_art_url}"></div>
      <div class="actText">
        <div class="actTitle">${escapeHtml(sp.song)}</div>
        <div class="actMeta">${escapeHtml(sp.artist)} • ${escapeHtml(sp.album)}</div>
      </div>
    `;
    return;
  }

  // Any activity (game/app)
  const act = (p?.activities || []).find(a => a.type !== 4) || null; // not custom status
  if (act){
    activityEl.style.display = "flex";
    const details = [act.details, act.state].filter(Boolean).join(" • ");
    activityEl.innerHTML = `
      <div class="actArt"><img alt="" src="./avatar.png" onerror="this.style.display='none'"></div>
      <div class="actText">
        <div class="actTitle">${escapeHtml(act.name || "Activity")}</div>
        <div class="actMeta">${escapeHtml(details || "Active")}</div>
      </div>
    `;
  }
}

async function fetchPresence(){
  try{
    const r = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`, { cache: "no-store" });
    const j = await r.json();
    const p = j?.data;

    const status = p?.discord_status || "offline";
    setStatus(status);

    const user = p?.discord_user || {};
    const display = user.display_name || user.username || "tiko";
    dName.textContent = display;

    // Custom status
    const custom = (p?.activities || []).find(a => a.type === 4) || null;
    const customText = custom?.state ? custom.state : "";

    // Subtitle
    const statusText =
      status === "online" ? "Online" :
      status === "idle" ? "Idle" :
      status === "dnd" ? "Do Not Disturb" : "Offline";

    dSub.textContent = customText ? `${statusText} • ${customText}` : statusText;
    tagline.textContent = customText ? customText : `Discord: ${statusText}`;

    renderActivity(p);
  } catch (e){
    setStatus("offline");
    dSub.textContent = "Presence unavailable";
    tagline.textContent = "tiko";
  }
}

fetchPresence();
setInterval(fetchPresence, 15000);

document.getElementById("year").textContent = new Date().getFullYear();

// --- helpers ---
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
