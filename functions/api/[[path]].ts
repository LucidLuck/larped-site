export interface Env {
  ASSETS: Fetcher;
}

function isUsernamePath(pathname: string) {
  // /larp
  return /^\/[a-zA-Z0-9_]{3,20}$/.test(pathname);
}

function isReserved(pathname: string) {
  // keep these routes as normal site pages
  return (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/help") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/api/")
  );
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);

  // Let the real /api/* function handle API routes
  if (url.pathname.startsWith("/api/")) {
    return ctx.env.ASSETS.fetch(ctx.request);
  }

  // Serve the public profile shell at /:username
  if (ctx.request.method === "GET" && isUsernamePath(url.pathname) && !isReserved(url.pathname)) {
    // Serve /public/profile.html
    const profileUrl = new URL(ctx.request.url);
    profileUrl.pathname = "/profile.html";
    return ctx.env.ASSETS.fetch(new Request(profileUrl.toString(), ctx.request));
  }

  // Everything else is normal static assets/pages
  return ctx.env.ASSETS.fetch(ctx.request);
};
