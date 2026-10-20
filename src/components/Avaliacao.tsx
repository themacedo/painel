"use client";

import { useState } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { Contador } from "@/components/Contador";
import { useMovimento } from "@/lib/movimento";
import type { KpiMensal, LenteItem, NotaMensal, NotaSemanal } from "@/lib/tipos";

const diaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const corNota = (n: number) => (n >= 8 ? "bg-ok" : n >= 6 ? "bg-primaria" : n >= 4 ? "bg-alerta" : "bg-perigo");
const num = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

// Barras de 0 a 10 por dimensão, com a seta contra o período anterior.
function Areas({ atual, antes }: { atual: Record<string, number>; antes?: Record<string, number> }) {
  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
      {Object.entries(atual).map(([area, nota]) => {
        const a = antes?.[area];
        return (
          <li key={area}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{area}</span>
              <span className="font-medium">{nota}
                {a != null && a !== nota && (
                  <span className={`ml-1.5 text-xs ${nota > a ? "text-ok" : "text-perigo"}`}>{nota > a ? "▲" : "▼"}{Math.abs(nota - a)}</span>
                )}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-primaria-suave">
              <div className={`encher h-full rounded-full ${corNota(nota)}`} style={{ width: `${nota * 10}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function RadarAreas({ atual, antes }: { atual: Record<string, number>; antes?: Record<string, number> }) {
  const mov = useMovimento();
  const dados = Object.entries(atual).map(([area, nota]) => ({ area, nota, antes: antes?.[area] ?? null }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <RadarChart data={dados} outerRadius="72%">
          <PolarGrid stroke="var(--borda)" />
          <PolarAngleAxis dataKey="area" tick={{ fill: "var(--texto-2)", fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 10]} tickCount={6} tick={false} axisLine={false} />
          {antes && <Radar name="Mês anterior" dataKey="antes" stroke="var(--texto-2)" strokeDasharray="4 4" fill="none" isAnimationActive={mov} />}
          <Radar name="Este mês" dataKey="nota" stroke="var(--primaria)" fill="var(--primaria)" fillOpacity={0.25} isAnimationActive={mov}
            animationDuration={900} />
          <Tooltip contentStyle={{ background: "var(--superficie)", border: "1px solid var(--borda)", borderRadius: 8, fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Kpi({ k }: { k: KpiMensal }) {
  const u = k.unidade ?? "";
  const melhorou = k.antes == null || k.antes === k.depois ? null : (k.depois > k.antes) === (k.melhorSobe ?? true);
  const pct = k.antes ? Math.round(((k.depois - k.antes) / k.antes) * 100) : null;
  return (
    <div className="rounded-lg bg-fundo p-3">
      <p className="text-xs text-texto-2">{k.nome}</p>
      <p className="mt-1 text-lg font-semibold">{num(k.depois)}{u}</p>
      <p className="mt-0.5 text-xs text-texto-2">
        {k.antes == null ? "sem base anterior" : <>antes {num(k.antes)}{u}
          {pct != null && <span className={`ml-1.5 font-medium ${melhorou ? "text-ok" : "text-perigo"}`}>{pct > 0 ? "▲" : "▼"} {Math.abs(pct)}%</span>}
        </>}
      </p>
    </div>
  );
}

const STATUS: Record<LenteItem["status"], string> = { ok: "bg-ok", atencao: "bg-alerta", ruim: "bg-perigo" };

function Lente({ titulo, itens }: { titulo: string; itens: LenteItem[] }) {
  return (
    <div className="rounded-xl border border-borda p-4">
      <h3 className="mb-3 text-sm font-semibold">{titulo}</h3>
      <ul className="flex flex-col gap-3">
        {itens.map((i) => (
          <li key={i.nome}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex items-center gap-2"><i className={`size-2 shrink-0 rounded-full ${STATUS[i.status]}`} />{i.nome}</span>
              <b className="text-right">{i.valor}</b>
            </div>
            <p className="mt-0.5 pl-4 text-xs text-texto-2">{i.leitura}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Mes({ m, anterior, nomes }: { m: NotaMensal; anterior?: NotaMensal; nomes: Record<string, string> }) {
  const grupos = [...new Set((m.kpis ?? []).map((k) => k.grupo))];
  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RadarAreas atual={m.areas} antes={anterior?.areas} />
        <div>
          <p className="mb-3 text-sm">{m.destaque}</p>
          {!!m.acoes?.length && (
            <>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-texto-2">Ações do próximo ciclo</p>
              <ol className="list-decimal space-y-1 pl-5 text-sm">{m.acoes.map((a) => <li key={a}>{a}</li>)}</ol>
            </>
          )}
          <div className="mt-4"><Areas atual={m.areas} antes={anterior?.areas} /></div>
        </div>
      </div>
      {grupos.map((g) => (
        <div key={g} className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-texto-2">{nomes[g] ?? g} · antes de 15/09 × ciclo</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {(m.kpis ?? []).filter((k) => k.grupo === g).map((k) => <Kpi key={k.nome} k={k} />)}
          </div>
        </div>
      ))}
      {!!m.lentes?.length && (
        <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-2">
          {m.lentes.map((l) => <Lente key={l.titulo} titulo={l.titulo} itens={l.itens} />)}
        </div>
      )}
    </>
  );
}

// Avaliação de coach: aba Semana (revisão de sexta) e aba Mês (ciclo do dia 16 ao 15).
export function Avaliacao({ semanais, mensais, nomes }: { semanais: NotaSemanal[]; mensais: NotaMensal[]; nomes: Record<string, string> }) {
  const [aba, setAba] = useState<"semana" | "mes">(mensais.length ? "mes" : "semana");
  const sem = semanais.at(-1), semAnt = semanais.at(-2);
  const mes = mensais.at(-1), mesAnt = mensais.at(-2);
  const atual = aba === "mes" ? mes : sem;
  const titulo = aba === "mes"
    ? (mes ? `Avaliação do mês · ${diaMes(mes.inicio)} a ${diaMes(mes.fim)}` : "Avaliação do mês")
    : (sem ? `Avaliação da semana de ${diaMes(sem.inicio)}` : "Avaliação da semana");
  return (
    <section className="entrar rounded-xl border border-borda bg-superficie p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        <div className="flex items-center gap-3">
          {atual && <p className="text-sm"><b className="text-lg"><Contador valor={atual.geral} casas={1} /></b><span className="text-texto-2"> / 10 geral</span></p>}
          <div className="flex rounded-lg border border-borda p-0.5 text-xs" role="tablist">
            {(["semana", "mes"] as const).map((a) => (
              <button key={a} type="button" role="tab" aria-selected={aba === a} onClick={() => setAba(a)}
                className={`rounded-md px-2.5 py-1 ${aba === a ? "bg-primaria-suave font-medium text-primaria" : "text-texto-2"}`}>
                {a === "semana" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>
        </div>
      </div>
      {aba === "semana" && (sem ? (
        <>
          <p className="mb-4 text-sm">{sem.destaque}</p>
          <Areas atual={sem.areas} antes={semAnt?.areas} />
          {semanais.length < 2 && <p className="mt-4 text-xs text-texto-2">A comparação com a semana anterior aparece a partir da próxima revisão.</p>}
        </>
      ) : <p className="text-sm text-texto-2">Ainda sem avaliação registrada.</p>)}
      {aba === "mes" && (mes ? <Mes m={mes} anterior={mesAnt} nomes={nomes} /> : <p className="text-sm text-texto-2">Ainda sem avaliação mensal registrada.</p>)}
    </section>
  );
}
