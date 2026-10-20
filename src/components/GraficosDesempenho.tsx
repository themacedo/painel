"use client";

import { useMovimento } from "@/lib/movimento";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { HorasSemana, Semana } from "@/lib/tipos";

const eixo = { tickLine: false, axisLine: false, tick: { fill: "var(--texto-2)", fontSize: 12 } } as const;

function Dica({ active, payload, label, unidade = "" }: {
  active?: boolean; payload?: { name: string; value: number | null; color: string }[]; label?: string; unidade?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-borda bg-superficie px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium">Semana de {label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-texto-2">
          <i className="mr-1.5 inline-block size-2 rounded-sm" style={{ background: p.color }} />
          {p.name}: <b className="text-texto">{p.value == null ? "—" : `${Math.round(p.value)}${unidade}`}</b>
        </p>
      ))}
    </div>
  );
}

type Serie = { chave: string; nome: string; cor: string };
type Linha = { rotulo: string } & Record<string, string | number | null>;

export function HistoricoCommits({ hist, series, marco }: { hist: Semana[]; series: Serie[]; marco?: { rotulo: string; texto: string } }) {
  const mov = useMovimento();
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={hist} margin={{ top: 16, right: 4, left: -20, bottom: 0 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke="var(--borda)" strokeDasharray="3 3" />
          <XAxis dataKey="rotulo" {...eixo} interval="preserveStartEnd" minTickGap={16} />
          <YAxis {...eixo} allowDecimals={false} />
          <Tooltip content={<Dica />} cursor={{ fill: "var(--primaria-suave)", opacity: 0.6 }} />
          {series.map((s, i) => (
            <Bar key={s.chave} dataKey={s.chave} name={s.nome} stackId="c" fill={s.cor} isAnimationActive={mov} animationDuration={900} animationEasing="ease-out"
              radius={i === series.length - 1 ? [4, 4, 0, 0] : undefined} />
          ))}
          {marco && (
            <ReferenceLine x={marco.rotulo} stroke="var(--texto-2)" strokeDasharray="4 4"
              label={{ value: marco.texto, position: "insideTopLeft", fill: "var(--texto-2)", fontSize: 11 }} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Linhas({ hist, series, unidade = "", dominio }: {
  hist: Semana[] | Linha[]; series: Serie[]; unidade?: string; dominio?: [number, number];
}) {
  const mov = useMovimento();
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={hist} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--borda)" strokeDasharray="3 3" />
          <XAxis dataKey="rotulo" {...eixo} interval="preserveStartEnd" minTickGap={16} />
          <YAxis {...eixo} domain={dominio} unit={unidade} />
          <Tooltip content={<Dica unidade={unidade} />} />
          {series.map((s) => (
            <Line key={s.chave} dataKey={s.chave} name={s.nome} stroke={s.cor} strokeWidth={2} dot={false}
              connectNulls isAnimationActive={mov} animationDuration={900} animationEasing="ease-out" />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const horasFmt = (v: number) => `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`;

function DicaHoras({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string; payload: HorasSemana }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload[0]!.payload.total;
  return (
    <div className="rounded-lg border border-borda bg-superficie px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium">Semana de {label}</p>
      {payload.filter((p) => p.value).map((p) => (
        <p key={p.name} className="text-texto-2">
          <i className="mr-1.5 inline-block size-2 rounded-sm" style={{ background: p.color }} />
          {p.name}: <b className="text-texto">{horasFmt(p.value)}</b>
        </p>
      ))}
      <p className="mt-1 text-texto-2">Total, sem contar duas vezes o que foi em paralelo: {horasFmt(total)}</p>
    </div>
  );
}

// Barras empilhadas de horas por semana (CLT, PJ, pessoal, sem classificação).
export function HorasPorSemana({ horas, series }: { horas: HorasSemana[]; series: Serie[] }) {
  const mov = useMovimento();
  const dados = horas.map((h) => ({ ...h, rotulo: `${h.inicio.slice(8, 10)}/${h.inicio.slice(5, 7)}` }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={dados} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke="var(--borda)" strokeDasharray="3 3" />
          <XAxis dataKey="rotulo" {...eixo} interval="preserveStartEnd" minTickGap={16} />
          <YAxis {...eixo} allowDecimals={false} unit="h" />
          <Tooltip content={<DicaHoras />} cursor={{ fill: "var(--primaria-suave)", opacity: 0.6 }} />
          {series.map((s, i) => (
            <Bar key={s.chave} dataKey={s.chave} name={s.nome} stackId="h" fill={s.cor} isAnimationActive={mov} animationDuration={900}
              animationEasing="ease-out" radius={i === series.length - 1 ? [4, 4, 0, 0] : undefined} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
