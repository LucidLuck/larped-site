export const $ = (q, el = document) => el.querySelector(q);
export const $$ = (q, el = document) => [...el.querySelectorAll(q)];

export function toast(msg) {
  let t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 200);
  }, 1800);
}

export async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
    credentials: "include",
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const err = data.error || `Request failed (${res.status})`;
    throw new Error(err);
  }
  return data;
}
