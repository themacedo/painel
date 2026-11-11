import "server-only";
import { readFile } from "node:fs/promises";
import demo from "@/data/demo.json";
import { painelDaApi } from "./api-nuvem";
import type { Painel } from "./tipos";

export const modo = process.env.PAINEL_MODO === "privado" ? "privado" : "demo";
// O demo é público e vai para o portfólio: métricas de horário (fora do expediente, madrugada, horário comercial,
// as duas frentes ao mesmo tempo) ficam só no modo privado.
export const mostraHorario = modo === "privado";

// Modo demo: dados fictícios do repositório. Modo privado: o painel.json lido só no servidor: arquivo local em dev;
// em produção, a API da nuvem (FIN_API_URL) com o login Google de quem está vendo, que serve o que o principal
// publicou (o Mac até a virada, depois a nuvem). Sem ela, o repositório privado do GitHub, que só o Mac atualiza
// (a API de conteúdo, com um token só de leitura).
export async function carregarPainel(): Promise<Painel> {
  if (modo === "demo") return demo as Painel;
  const arquivo = process.env.PAINEL_DADOS_ARQUIVO;
  if (arquivo) return JSON.parse(await readFile(arquivo, "utf8")) as Painel;
  const daApi = await painelDaApi();
  if (daApi) return daApi as Painel;
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
