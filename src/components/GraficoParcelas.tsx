"use client";

import { useMovimento } from "@/lib/movimento";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function GraficoParcelas({ dados }: { dados: { rotulo: string; valor: number }[] }) {
  const mov = useMovimento();
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={dados} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--borda)" strokeDasharray="3 3" />
          <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={{ fill: "var(--texto-2)", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--texto-2)", fontSize: 12 }} tickFormatter={brl} width={70} />
          <Tooltip formatter={(v: number) => [brl(v), "Parcelas"]} cursor={{ fill: "var(--primaria-suave)", opacity: 0.6 }}
            contentStyle={{ background: "var(--superficie)", border: "1px solid var(--borda)", borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="valor" fill="var(--primaria)" radius={[4, 4, 0, 0]} isAnimationActive={mov} animationDuration={900} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
