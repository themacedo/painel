"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Painel } from "@/lib/tipos";
import { corClt, corPj } from "@/lib/empresas";

type Semana = Painel["desempenho"]["semanas"][number];
type Empresas = Painel["empresas"];

function Dica({ active, payload, label, empresas }: {
  active?: boolean; payload?: { payload: Semana }[]; label?: string; empresas: Empresas;
}) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div className="rounded-lg border border-borda bg-superficie px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium">Semana de {label}</p>
      <p className="text-texto-2">{empresas.clt.nome}: <b className="text-texto">{s.commitsClt}</b> commits · <b className="text-texto">{s.prsClt}</b> PRs</p>
      <p className="text-texto-2">{empresas.pj.nome}: <b className="text-texto">{s.commitsPj}</b> commits · <b className="text-texto">{s.entregasPj}</b> entregas</p>
    </div>
  );
}

export function GraficoSemanas({ semanas, empresas }: { semanas: Semana[]; empresas: Empresas }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={semanas} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="var(--borda)" strokeDasharray="3 3" />
          <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={{ fill: "var(--texto-2)", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--texto-2)", fontSize: 12 }} allowDecimals={false} />
          <Tooltip content={<Dica empresas={empresas} />} cursor={{ fill: "var(--primaria-suave)", opacity: 0.6 }} />
          <Bar dataKey="commitsClt" stackId="c" fill={corClt(empresas)} isAnimationActive={false} />
          <Bar dataKey="commitsPj" stackId="c" fill={corPj(empresas)} radius={[6, 6, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
