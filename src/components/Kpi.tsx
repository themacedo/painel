import type { LucideIcon } from "lucide-react";

type Props = {
  titulo: string;
  valor: React.ReactNode;
  detalhe: React.ReactNode;
  icone: LucideIcon;
  cor: string; // classe de fundo do ícone
  children?: React.ReactNode;
};

export function Kpi({ titulo, valor, detalhe, icone: Icone, cor, children }: Props) {
  return (
    <div className="entrar rounded-xl border border-borda bg-superficie p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-texto-2">{titulo}</p>
        <span className={`grid size-7 place-items-center rounded-lg text-white ${cor}`}>
          <Icone size={15} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{valor}</p>
      {children}
      <p className="mt-2 text-xs text-texto-2">{detalhe}</p>
    </div>
  );
}

export function Barra({ pct, cor = "bg-primaria" }: { pct: number; cor?: string }) {
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primaria-suave">
      <div className={`encher h-full rounded-full ${cor}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}
