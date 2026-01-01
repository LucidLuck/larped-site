import { ok, getCookie, setCookie } from "../_util.js";

export async function onRequest(context) {
  const token = getCookie(context.request, "session");
  if (token) {
    await context.env.DB.prepare("DELETE FROM sessions WHERE token=?").bind(token).run();
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "set-cookie": setCookie("session", "", { maxAge: 0 }),
      "cache-control": "no-store",
    },
  });
}
