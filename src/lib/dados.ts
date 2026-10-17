import "server-only";
import { readFile } from "node:fs/promises";
import demo from "@/data/demo.json";
import type { Painel } from "./tipos";

export const modo = process.env.PAINEL_MODO === "privado" ? "privado" : "demo";

// Modo demo: dados fictícios do repositório. Modo privado: o painel.json gerado no Mac,
// lido só no servidor (arquivo local em dev; em produção, a API de conteúdo de um repositório
// privado do GitHub com um token só de leitura).
export async function carregarPainel(): Promise<Painel> {
  if (modo === "demo") return demo as Painel;
  const arquivo = process.env.PAINEL_DADOS_ARQUIVO;
  if (arquivo) return JSON.parse(await readFile(arquivo, "utf8")) as Painel;
  const url = process.env.PAINEL_DADOS_URL;
  if (!url) throw new Error("PAINEL_DADOS_URL não configurada");
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.PAINEL_DADOS_TOKEN ?? ""}`,
      Accept: "application/vnd.github.raw+json",
    },
    cache: "no-store", // sempre o JSON mais novo (uso pessoal, bem abaixo do limite da API)
  });
  if (!resp.ok) throw new Error(`painel.json: HTTP ${resp.status}`);
  return (await resp.json()) as Painel;
}
