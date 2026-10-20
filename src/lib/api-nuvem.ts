import "server-only";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { emailPermitido } from "./auth";

// Ponte do site para a API da nuvem (fin-api): o site não guarda nem lê os pendentes; repassa o pedido com o
// id_token do Google de quem está logado. Venceu (1 h)? renova com o refresh token do login.
const API = process.env.FIN_API_URL ?? "";

async function idToken(req: NextRequest): Promise<string | null> {
  const t = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!t || !emailPermitido(t.email)) return null;
  const exp = Number(t.idTokenExp ?? 0);
  if (typeof t.idToken === "string" && exp * 1000 > Date.now() + 60_000) return t.idToken;
  if (typeof t.refreshToken !== "string") return null;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: t.refreshToken,
      client_id: process.env.AUTH_GOOGLE_ID ?? "", client_secret: process.env.AUTH_GOOGLE_SECRET ?? "" }),
    cache: "no-store",
  });
  if (!r.ok) return null;
  return ((await r.json()) as { id_token?: string }).id_token ?? null;
}

export async function repassar(req: NextRequest, caminho: string, init: RequestInit = {}): Promise<Response> {
  if (process.env.PAINEL_MODO !== "privado" || !API) return Response.json({ erro: "indisponível" }, { status: 404 });
  const token = await idToken(req);
  if (!token) return Response.json({ erro: "entre de novo com o Google para revisar" }, { status: 401 });
  const r = await fetch(`${API}${caminho}`, { ...init, cache: "no-store",
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` } });
  return new Response(await r.text(), { status: r.status,
    headers: { "Content-Type": r.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store, private" } });
}
