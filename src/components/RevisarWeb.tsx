"use client";
import { Revisar } from "@/telas/Revisar";
import type { FonteRevisar, Pendentes } from "@/lib/tipos";

// No site e no celular a tela Revisar fala com as rotas /api/* do próprio site, que repassam para a API da nuvem.
async function json<T>(r: Response): Promise<T> {
  const corpo = (await r.json().catch(() => ({}))) as T & { erro?: string };
  if (!r.ok) throw new Error(corpo.erro ?? `HTTP ${r.status}`);
  return corpo;
}
const fonte: FonteRevisar = {
  carregar: async () => json<Pendentes>(await fetch("/api/pendentes", { cache: "no-store" })),
  enviar: async (revisoes) => (await json<{ enviadas: number }>(await fetch("/api/revisoes", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revisoes }) }))).enviadas,
};

export function RevisarWeb() {
  return <Revisar fonte={fonte} />;
}
