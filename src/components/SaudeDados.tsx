"use client";

import { useEffect, useState } from "react";
import type { Saude } from "@/lib/tipos";

type Nivel = 0 | 1 | 2; // ok, atenção, problema
const COR = ["bg-ok", "bg-alerta", "bg-perigo"] as const;
const TEXTO = ["text-ok", "text-alerta", "text-perigo"] as const;

const horasDesde = (iso: string | null, agora: number) => (iso ? (agora - new Date(iso).getTime()) / 3_600_000 : Infinity);
const quando = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};
// mais de um dia (com folga) sem atualizar já é atenção; mais de dois, problema
const pelaIdade = (h: number): Nivel => (h <= 26 ? 0 : h <= 50 ? 1 : 2);

// Faixa de saúde dos dados: o painel está atualizado? cada banco está em dia no Pluggy? há lançamentos para revisar?
// a nuvem bate com o Mac? `referencia` fixa o "agora" (o demo usa a data dos dados fictícios).
export function SaudeDados({ saude, referencia }: { saude: Saude; referencia?: string }) {
  const [agora, setAgora] = useState(() => (referencia ? new Date(referencia).getTime() : Date.now()));
  const [aberto, setAberto] = useState(false);
  useEffect(() => { if (!referencia) setAgora(Date.now()); }, [referencia]);

  const sync: Nivel = !saude.sync ? 2 : saude.sync.status === "error" ? 2 : pelaIdade(horasDesde(saude.sync.ultimoSucesso, agora));
  const bancos = saude.conexoes.map((c) => ({ ...c, nivel: (c.status !== "UPDATED" ? 2 : pelaIdade(horasDesde(c.ultima, agora))) as Nivel }));
  const piorBanco = Math.max(0, ...bancos.map((b) => b.nivel)) as Nivel;
  const atrasados = bancos.filter((b) => b.nivel > 0);
  const pend: Nivel = saude.pendentes > 20 ? 1 : 0;
  const nuvem: Nivel = !saude.sombra ? 1 : (saude.sombra.diferencas ?? 1) > 0 || saude.sombra.sync === "error" ? 2 : 0;
  const geral = Math.max(sync, piorBanco, pend, nuvem) as Nivel;

  const itens: [Nivel, string][] = [
    [sync, saude.sync ? `sync ${quando(saude.sync.em)}` : "nenhum sync registrado"],
    [piorBanco, !bancos.length ? "bancos: aparece no próximo sync"
      : atrasados.length ? `${atrasados.map((b) => b.banco).join(", ")} atrasado${atrasados.length > 1 ? "s" : ""}` : `${bancos.length} bancos em dia`],
    [pend, `${saude.pendentes} para revisar`],
    [nuvem, !saude.sombra ? "nuvem: sem comparação" : saude.sombra.diferencas === 0 ? "nuvem bate (0 diferenças)" : `nuvem: ${saude.sombra.diferencas} diferenças`],
  ];

  return (
    <section className="entrar mb-3 rounded-xl border border-borda bg-superficie px-4 py-2.5 text-xs">
      <button type="button" onClick={() => setAberto((a) => !a)} aria-expanded={aberto}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left">
        <span className={`flex items-center gap-1.5 font-medium ${TEXTO[geral]}`}>
          <i className={`size-2 rounded-full ${COR[geral]}`} />{["Dados em dia", "Dados: atenção", "Dados com problema"][geral]}
        </span>
        {itens.map(([n, t]) => (
          <span key={t} className={`flex items-center gap-1 ${n ? TEXTO[n] : "text-texto-2"}`}>· {t}</span>
        ))}
        <span className="ml-auto text-texto-2">{aberto ? "fechar" : "detalhes"}</span>
      </button>
      {aberto && (
        <div className="mt-2.5 border-t border-borda pt-2.5">
          {saude.sync && (
            <p className="mb-2 text-texto-2">Último sync: {quando(saude.sync.em)} ({saude.sync.status}, {saude.sync.novos} novos) ·
              último com sucesso: {quando(saude.sync.ultimoSucesso)}</p>
          )}
          {!!bancos.length && (
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {bancos.map((b) => (
                <li key={b.banco} className="flex items-center gap-2">
                  <i className={`size-1.5 shrink-0 rounded-full ${COR[b.nivel]}`} />
                  <span className="font-medium">{b.banco}</span>
                  <span className="text-texto-2">atualizado {quando(b.ultima)} · próxima {quando(b.proxima)}{b.status !== "UPDATED" ? ` · ${b.status}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
          {saude.sombra && (
            <p className="mt-2 text-texto-2">Comparação Mac × nuvem de {saude.sombra.hoje?.split("-").reverse().slice(0, 2).join("/")}:
              {" "}{saude.sombra.campos?.toLocaleString("pt-BR")} campos, {saude.sombra.diferencas} diferença(s).</p>
          )}
          {atrasados.length > 0 && <p className="mt-2 text-alerta">Banco atrasado: atualize a conexão em meu.pluggy.ai e rode o sync de novo.</p>}
        </div>
      )}
    </section>
  );
}
