const RESERVED = new Set([
  "", "index.html", "login", "login.html", "register", "register.html",
  "dashboard", "dashboard.html", "profile.html",
  "styles.css", "assets", "api", "favicon.ico", "robots.txt", "404.html"
]);

function isReservedPath(pathname) {
  if (!pathname) return true;
  const p = pathname.replace(/^\/+/, "");
  if (RESERVED.has(p)) return true;
  if (p.startsWith("assets/")) return true;
  if (p.startsWith("api/")) return true;
  return false;
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Security headers
  const res = await context.next();
  const headers = new Headers(res.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");

  // If function returns HTML, prevent caching
  const ct = headers.get("content-type") || "";
  if (ct.includes("text/html")) {
    headers.set("Cache-Control", "no-store");
  }

  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
