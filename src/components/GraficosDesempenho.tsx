"use client";

import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { Semana } from "@/lib/tipos";

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
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={hist} margin={{ top: 16, right: 4, left: -20, bottom: 0 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke="var(--borda)" strokeDasharray="3 3" />
          <XAxis dataKey="rotulo" {...eixo} interval="preserveStartEnd" minTickGap={16} />
          <YAxis {...eixo} allowDecimals={false} />
          <Tooltip content={<Dica />} cursor={{ fill: "var(--primaria-suave)", opacity: 0.6 }} />
          {series.map((s, i) => (
            <Bar key={s.chave} dataKey={s.chave} name={s.nome} stackId="c" fill={s.cor} isAnimationActive={false}
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
              connectNulls isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
