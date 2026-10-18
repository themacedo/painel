"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMovimento } from "@/lib/movimento";

type Item = { nome: string; parcela: string; valor: number; categoria: string };
type Ponto = { rotulo: string; valor: number; itens: Item[] };

const brl = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: casas, maximumFractionDigits: casas });

// Card do mês: o que compõe as parcelas daquele mês.
function Dica({ active, payload }: { active?: boolean; payload?: { payload: Ponto }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="w-64 rounded-lg border border-borda bg-superficie p-3 text-xs shadow-lg">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-semibold">{p.rotulo}</span>
        <span className="font-semibold">{brl(p.valor, 2)}</span>
      </div>
      {p.itens.length ? (
        <ul className="flex flex-col gap-1.5">
          {p.itens.map((i, k) => (
            <li key={k} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate">{i.nome}</span>
                <span className="text-texto-2">parcela {i.parcela} · {i.categoria}</span>
              </span>
              <span className="shrink-0">{brl(i.valor, 2)}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-texto-2">Nenhuma parcela neste mês.</p>}
    </div>
  );
}

export function GraficoParcelas({ dados }: { dados: Ponto[] }) {
  const mov = useMovimento();
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={dados} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--borda)" strokeDasharray="3 3" />
          <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={{ fill: "var(--texto-2)", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--texto-2)", fontSize: 12 }} tickFormatter={(v: number) => brl(v)} width={70} />
          <Tooltip content={<Dica />} cursor={{ fill: "var(--primaria-suave)", opacity: 0.6 }} wrapperStyle={{ zIndex: 20 }} />
          <Bar dataKey="valor" fill="var(--primaria)" radius={[4, 4, 0, 0]} isAnimationActive={mov} animationDuration={900} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
