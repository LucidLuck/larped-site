import { ok, getCookie, setCookie } from "../_util.js";

export async function onRequestPost(context) {
  const token = getCookie(context.request, "larped_session");
  if (token) {
    await context.env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }
  const headers = new Headers();
  headers.append("Set-Cookie", setCookie("larped_session", "", { maxAge: 0 }));
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "Set-Cookie": headers.get("Set-Cookie") } });
}
