export const $ = (q, el=document) => el.querySelector(q);
export const $$ = (q, el=document) => [...el.querySelectorAll(q)];

export async function api(path, opts={}){
  const res = await fetch(path, {
    credentials: "include",
    headers: { "content-type": "application/json" , ...(opts.headers||{})},
    ...opts,
  });
  const data = await res.json().catch(()=>({ ok:false, error:"Bad JSON" }));
  if (!res.ok && !data.error) data.error = `HTTP ${res.status}`;
  return data;
}

export function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

export function safeText(el, txt){
  el.textContent = (txt ?? "").toString();
}

export function formatHost(u){
  try{
    const x = new URL(u);
    return x.host.replace(/^www\./,"");
  }catch{ return u; }
}

export function reservedPaths(){
  return new Set(["", "index.html","login","login.html","register","register.html","dashboard","dashboard.html","assets","styles","js","api","profile.html"]);
}
