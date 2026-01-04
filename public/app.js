// ====== CHANGE THESE ======
const DISCORD_USER_ID = "1288251829892939798";

// Add socials here (big glowing icons)
const SOCIALS = [
  { name: "Discord", url: "https://discord.gg/gut", icon: "discord" },
  // { name: "Instagram", url: "https://instagram.com/your", icon: "instagram" },
  // { name: "YouTube", url: "https://youtube.com/@your", icon: "youtube" },
  // { name: "X", url: "https://x.com/your", icon: "x" },
];

// ====== ICONS ======
const ICONS = {
  discord: `<svg viewBox="0 0 24 24" fill="none"><path d="M19.5 5.4A16 16 0 0 0 15.8 4c-.2.4-.4.9-.6 1.4a15.2 15.2 0 0 0-4.4 0C10.6 4.9 10.4 4.4 10.2 4A16 16 0 0 0 6.5 5.4C4.1 9 3.4 12.5 3.7 16c1.6 1.2 3.1 1.9 4.6 2.4.4-.5.7-1 .9-1.6-.5-.2-1-.5-1.4-.8l.3-.3c2.7 1.3 5.6 1.3 8.3 0l.3.3c-.4.3-.9.6-1.4.8.2.6.5 1.1.9 1.6 1.5-.5 3-1.2 4.6-2.4.4-4-.6-7.5-2.9-10.6ZM9.2 14.1c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.8 0 1.4.7 1.4 1.6 0 .9-.6 1.6-1.4 1.6Zm5.6 0c-.8 0-1.4-.7-1.4-1.6 0-.9.6-1.6 1.4-1.6.8 0 1.4.7 1.4 1.6 0 .9-.6 1.6-1.4 1.6Z" fill="currentColor"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="none"><path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm9 2h-9A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9A3.5 3.5 0 0 0 20 16.5v-9A3.5 3.5 0 0 0 16.5 4Zm-4.5 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm5.2-.9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" fill="currentColor"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="none"><path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.2 31 31 0 0 0 2 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" fill="currentColor"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.9-6.4L6.2 22H2.9l7.3-8.4L1 2h6.4l4.4 5.8L18.9 2Zm-1.1 18h1.7L7.5 3.9H5.7L17.8 20Z" fill="currentColor"/></svg>`,
};

// Render icons
const iconRow = document.getElementById("iconRow");
iconRow.innerHTML = SOCIALS.map(s => {
  const svg = ICONS[s.icon] || ICONS.discord;
  return `<a class="iconBtn" href="${s.url}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(s.name)}">${svg}</a>`;
}).join("");

// ====== Music player (your song.mp3) ======
const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const barFill = document.getElementById("barFill");
const tNow = document.getElementById("tNow");
const tDur = document.getElementById("tDur");

let playing = false;

function fmt(sec){
  sec = Math.max(0, sec|0);
  const m = Math.floor(sec/60);
  const s = sec%60;
  return `${m}:${String(s).padStart(2,"0")}`;
}

audio.addEventListener("loadedmetadata", () => {
  tDur.textContent = fmt(audio.duration);
});
audio.addEventListener("timeupdate", () => {
  tNow.textContent = fmt(audio.currentTime);
  const p = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  barFill.style.width = `${p}%`;
});

playBtn.addEventListener("click", async () => {
  try{
    if (!playing){
      await audio.play(); // browsers require user click -> this is fine
      playing = true;
      playBtn.textContent = "⏸";
    } else {
      audio.pause();
      playing = false;
      playBtn.textContent = "⏵";
    }
  } catch {
    // ignored
  }
});

// ====== Discord presence (Lanyard) ======
// NOTE: Discord does NOT allow random sites to read user presence directly.
// Lanyard shows presence if the account is connected to Lanyard.
const statusLine = document.getElementById("statusLine");
const dcPill = document.getElementById("dcPill");
const dcLine = document.getElementById("dcLine");
const dcHandle = document.getElementById("dcHandle");
const dcTag = document.getElementById("dcTag");
const dcNow = document.getElementById("dcNow");
const dcArt = document.getElementById("dcArt");
const dcNowTitle = document.getElementById("dcNowTitle");
const dcNowMeta = document.getElementById("dcNowMeta");
const dcAvatar = document.getElementById("dcAvatar");

function setPill(s){
  const up = (s||"offline").toUpperCase();
  dcPill.textContent = up;
  dcPill.style.borderColor = "rgba(255,255,255,.10)";
  dcPill.style.background = "rgba(255,255,255,.04)";

  if (s === "online") dcPill.style.boxShadow = "0 0 16px rgba(120,170,255,.18)";
  if (s === "dnd") dcPill.style.boxShadow = "0 0 16px rgba(255,90,90,.15)";
  if (s === "idle") dcPill.style.boxShadow = "0 0 16px rgba(255,210,80,.14)";
}

function showNowPlaying(title, meta, artUrl){
  dcNow.style.display = "flex";
  dcNowTitle.textContent = title || "";
  dcNowMeta.textContent = meta || "";
  if (artUrl){
    dcArt.src = artUrl;
    dcArt.style.display = "block";
  } else {
    dcArt.style.display = "none";
  }
}

function hideNowPlaying(){
  dcNow.style.display = "none";
}

async function fetchPresence(){
  try{
    const r = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`, { cache: "no-store" });
    const j = await r.json();
    const p = j?.data;

    const status = p?.discord_status || "offline";
    setPill(status);

    const u = p?.discord_user || {};
    const name = u.display_name || u.username || "tiko";
    dcHandle.textContent = name;
    dcTag.textContent = u.username ? `@${u.username}` : "@tiko";

    // avatar
    if (u.id && u.avatar){
      dcAvatar.src = `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`;
    } else {
      dcAvatar.src = "./avatar.png";
    }

    // custom status
    const custom = (p?.activities || []).find(a => a.type === 4) || null;
    const customText = custom?.state || "";

    // line + top subtitle
    const nice =
      status === "online" ? "online" :
      status === "idle" ? "idle" :
      status === "dnd" ? "dnd" : "offline";

    statusLine.textContent = customText ? customText : `discord: ${nice}`;
    dcLine.textContent = customText ? `${nice} • ${customText}` : nice;

    // Spotify preferred
    if (p?.spotify){
      const sp = p.spotify;
      showNowPlaying(sp.song, `${sp.artist} • ${sp.album}`, sp.album_art_url);
      return;
    }

    // otherwise any normal activity (game/app)
    const act = (p?.activities || []).find(a => a.type !== 4) || null;
    if (act){
      const meta = [act.details, act.state].filter(Boolean).join(" • ");
      showNowPlaying(act.name || "Activity", meta || "active", null);
      return;
    }

    hideNowPlaying();
  } catch (e){
    setPill("offline");
    statusLine.textContent = "tiko";
    dcLine.textContent = "presence unavailable";
    hideNowPlaying();
  }
}

fetchPresence();
setInterval(fetchPresence, 15000);

// ====== helpers ======
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
