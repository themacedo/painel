"use client";

import { useState } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { Contador } from "@/components/Contador";
import { useMovimento } from "@/lib/movimento";
import type { KpiMensal, LenteItem, NotaMensal, NotaSemanal, Patamar } from "@/lib/tipos";

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
              <span className="num font-medium">{nota}
                {a != null && a !== nota && (
                  <span className={`ml-1.5 text-xs ${nota > a ? "text-ok" : "text-alerta"}`}>{nota > a ? "▲" : "▼"}{Math.abs(nota - a)}</span>
                )}
              </span>
            </div>
            <div className="grid grid-cols-10 gap-[3px]" aria-hidden>
              {Array.from({ length: 10 }, (_, i) => <span key={i} className={`encher h-2.5 rounded-[2px] ${i < nota ? corNota(nota) : "bg-barra"}`} />)}
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
    <div className="rounded-xl bg-superficie-2 p-3">
      <p className="text-xs text-texto-2">{k.nome}</p>
      <p className="num mt-1 text-lg font-medium">{num(k.depois)}{u}</p>
      <p className="mt-0.5 text-xs text-texto-2">
        {k.antes == null ? "sem base anterior" : <>antes {num(k.antes)}{u}
          {pct != null && <span className={`ml-1.5 font-medium ${melhorou ? "text-ok" : "text-perigo"}`}>{pct > 0 ? "▲" : "▼"} {Math.abs(pct)}%</span>}
        </>}
      </p>
    </div>
  );
}

const NIVEIS = ["Júnior", "Pleno", "Pleno avançado", "Sênior"];

// Régua de Júnior a Sênior por critério; uma faixa (de–ate) quando o patamar fica entre dois níveis.
function Patamares({ itens, veredito }: { itens: Patamar[]; veredito?: string }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-texto-2">Patamar por critério</p>
      {veredito && <p className="mb-3 rounded-lg bg-primaria-suave px-3 py-2 text-sm">{veredito}</p>}
      <div className="mb-1 hidden grid-cols-[minmax(0,11rem)_1fr] gap-3 sm:grid">
        <span />
        <div className="grid grid-cols-4 text-center text-[11px] text-texto-2">{NIVEIS.map((n) => <span key={n}>{n}</span>)}</div>
      </div>
      <ul className="flex flex-col gap-3">
        {itens.map((p) => {
          const rotulo = p.critico ? "Crítica" : p.de === p.ate ? NIVEIS[p.de] : `${NIVEIS[p.de]} a ${NIVEIS[p.ate]}`;
          return (
            <li key={p.criterio} className="grid grid-cols-1 gap-1.5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-3">
              <div className="flex items-baseline justify-between gap-2 text-sm sm:block">
                <span className="font-medium">{p.criterio}</span>
                <span className={`text-xs sm:block ${p.critico ? "text-perigo" : "text-primaria"}`}>{rotulo}</span>
              </div>
              <div>
                <div className="grid grid-cols-4 gap-1">
                  {NIVEIS.map((n, i) => (
                    <span key={n} title={n} className={`encher h-2.5 rounded-full ${
                      p.critico ? (i === 0 ? "bg-perigo/40" : "bg-barra")
                        : i >= p.de && i <= p.ate ? "bg-primaria" : i < p.de ? "bg-primaria/30" : "bg-barra"}`} />
                  ))}
                </div>
                <p className="mt-1 text-xs text-texto-2">{p.leitura}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const STATUS: Record<LenteItem["status"], string> = { ok: "bg-ok", atencao: "bg-alerta", ruim: "bg-perigo" };

function Lente({ titulo, itens }: { titulo: string; itens: LenteItem[] }) {
  return (
    <div className="rounded-2xl border border-borda bg-superficie-2 p-4">
      <h3 className="mb-3 text-sm font-semibold">{titulo}</h3>
      <ul className="flex flex-col gap-3">
        {itens.map((i) => (
          <li key={i.nome}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex items-center gap-2"><i className={`size-2 shrink-0 rounded-full ${STATUS[i.status]}`} />{i.nome}</span>
              <b className="num text-right font-medium">{i.valor}</b>
            </div>
            <p className="mt-0.5 pl-4 text-xs text-texto-2">{i.leitura}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Mes({ m, anterior, nomes, semKpis }: { m: NotaMensal; anterior?: NotaMensal; nomes: Record<string, string>; semKpis?: boolean }) {
  // os KPIs antes × ciclo vão para o topo da tela Desempenho; aqui só quando ela não os mostra
  const grupos = semKpis ? [] : [...new Set((m.kpis ?? []).map((k) => k.grupo))];
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
      {!!m.patamares?.length && <Patamares itens={m.patamares} veredito={m.veredito} />}
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
      {m.revisores && <p className="mt-4 text-xs text-texto-2">Avaliação: {m.revisores}.</p>}
    </>
  );
}

// O ciclo seguinte ao último mês fechado (dia 16 ao 15): a média das semanas revisadas desde então, até o fechamento.
// Só as dimensões da semana mais recente entram; a avaliação completa do ciclo continua sendo a mensal.
export function parcialDoCiclo(semanais: NotaSemanal[], ultimoMes?: NotaMensal): (NotaMensal & { semanas: number }) | null {
  if (!ultimoMes) return null;
  const semanas = semanais.filter((s) => s.inicio > ultimoMes.fim);
  if (!semanas.length) return null;
  const [a, m] = ultimoMes.fim.split("-").map(Number);
  const inicio = new Date(Date.UTC(a, m - 1, 16)).toISOString().slice(0, 10);
  const fim = new Date(Date.UTC(a, m, 15)).toISOString().slice(0, 10);
  const media = (xs: number[]) => Math.round((xs.reduce((t, x) => t + x, 0) / xs.length) * 10) / 10;
  const areas = Object.fromEntries(Object.keys(semanas.at(-1)!.areas).map((k) =>
    [k, media(semanas.map((s) => s.areas[k]).filter((v): v is number => v != null))]));
  const n = semanas.length;
  return { inicio, fim, semanas: n, geral: media(semanas.map((s) => s.geral)), areas,
    destaque: `Parcial: média de ${n} semana${n > 1 ? "s" : ""} revisada${n > 1 ? "s" : ""} no ciclo. O fechamento completo, com KPIs e lentes, é em ${diaMes(fim)}.` };
}

type Aba = "semana" | "ciclo" | "mes";
const ROTULO: Record<Aba, string> = { semana: "Semana", ciclo: "Ciclo atual", mes: "Mês" };

// Avaliação de coach: aba Semana (revisão de sexta), Ciclo atual (parcial das semanas) e Mês (ciclo fechado, do dia 16 ao 15).
export function Avaliacao({ semanais, mensais, nomes, semKpis }: { semanais: NotaSemanal[]; mensais: NotaMensal[]; nomes: Record<string, string>; semKpis?: boolean }) {
  const [aba, setAba] = useState<Aba>(mensais.length ? "mes" : "semana");
  const sem = semanais.at(-1), semAnt = semanais.at(-2);
  const mes = mensais.at(-1), mesAnt = mensais.at(-2);
  const parcial = parcialDoCiclo(semanais, mes);
  const abas: Aba[] = parcial ? ["semana", "ciclo", "mes"] : ["semana", "mes"];
  const atual = aba === "mes" ? mes : aba === "ciclo" ? parcial : sem;
  const titulo = aba === "mes"
    ? (mes ? `Avaliação do mês · ${diaMes(mes.inicio)} a ${diaMes(mes.fim)}` : "Avaliação do mês")
    : aba === "ciclo" && parcial ? `Ciclo atual (parcial) · ${diaMes(parcial.inicio)} a ${diaMes(parcial.fim)}`
    : (sem ? `Avaliação da semana de ${diaMes(sem.inicio)}` : "Avaliação da semana");
  return (
    <section className="entrar rounded-2xl border border-borda bg-superficie p-4 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold">{titulo}</h2>
        <div className="flex items-center gap-3">
          {atual && <p className="text-sm"><b className="num text-xl font-medium"><Contador valor={atual.geral} casas={1} /></b><span className="text-texto-2"> / 10 geral</span></p>}
          <div className="flex rounded-xl border border-borda p-1 text-[13px]" role="tablist">
            {abas.map((a) => (
              <button key={a} type="button" role="tab" aria-selected={aba === a} onClick={() => setAba(a)}
                className={`min-h-8 rounded-lg px-3 ${aba === a ? "bg-texto font-semibold text-fundo" : "text-texto-2"}`}>
                {ROTULO[a]}
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
      {aba === "ciclo" && parcial && <Mes m={parcial} anterior={mes} nomes={nomes} semKpis />}
      {aba === "mes" && (mes ? <Mes m={mes} anterior={mesAnt} nomes={nomes} semKpis={semKpis} /> : <p className="text-sm text-texto-2">Ainda sem avaliação mensal registrada.</p>)}
    </section>
  );
}
