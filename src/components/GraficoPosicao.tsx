"use client";

import { Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMovimento } from "@/lib/movimento";
import type { PontoPosicao as Ponto } from "@/lib/tipos";

const brl = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: casas, maximumFractionDigits: casas });

function Dica({ active, payload }: { active?: boolean; payload?: { payload: Ponto }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const dia = p.data.split("-").reverse().join("/");
  return (
    <div className="w-56 rounded-lg border border-borda bg-superficie p-3 text-xs shadow-lg">
      <div className="mb-2 font-semibold">{p.rotulo === "hoje" ? `Hoje (${dia})` : `Em ${dia}`}</div>
      <dl className="flex flex-col gap-1">
        <div className="flex justify-between"><dt className="text-texto-2">Nas contas</dt><dd>{brl(p.contas, 2)}</dd></div>
        {(p.investimentos ?? 0) >= 0.5 && <div className="flex justify-between"><dt className="text-texto-2">Investido</dt><dd>{brl(p.investimentos!, 2)}</dd></div>}
        <div className="flex justify-between"><dt className="text-texto-2">Devia no cartão</dt><dd>− {brl(p.cartao, 2)}</dd></div>
        {(p.emprestimos ?? 0) >= 0.5 && <div className="flex justify-between"><dt className="text-texto-2">Empréstimo</dt><dd>− {brl(p.emprestimos!, 2)}</dd></div>}
        <div className="flex justify-between border-t border-borda pt-1 font-semibold">
          <dt>Posição real</dt><dd className={p.posicao < 0 ? "text-perigo" : "text-ok"}>{brl(p.posicao, 2)}</dd>
        </div>
      </dl>
    </div>
  );
}

// `destaque`: a data do fim do período escolhido no seletor
export function GraficoPosicao({ dados, destaque }: { dados: Ponto[]; destaque?: string }) {
  const mov = useMovimento();
  const cor = (dados.at(-1)?.posicao ?? 0) < 0 ? "var(--perigo)" : "var(--ok)";
  const marcado = dados.find((d) => d.data === destaque);
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <AreaChart data={dados} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="posicao-area" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={cor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={cor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--borda)" strokeDasharray="3 3" />
          <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={{ fill: "var(--texto-2)", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--texto-2)", fontSize: 12 }} tickFormatter={(v: number) => brl(v)} width={76} />
          <ReferenceLine y={0} stroke="var(--texto-2)" strokeOpacity={0.5} />
          <Tooltip content={<Dica />} cursor={{ stroke: "var(--borda)" }} wrapperStyle={{ zIndex: 20 }} />
          <Area type="monotone" dataKey="posicao" stroke={cor} strokeWidth={2} fill="url(#posicao-area)"
                dot={{ r: 3, fill: cor }} isAnimationActive={mov} animationDuration={900} animationEasing="ease-out" />
          {marcado && <ReferenceDot x={marcado.rotulo} y={marcado.posicao} r={6} fill={cor} stroke="var(--fundo)" strokeWidth={2} />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
