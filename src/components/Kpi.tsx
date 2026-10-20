import type { LucideIcon } from "lucide-react";

type Props = {
  titulo: string;
  valor: React.ReactNode;
  detalhe: React.ReactNode;
  icone?: LucideIcon; // não aparece mais no visual novo; fica para quem ainda passa
  cor?: string;
  children?: React.ReactNode;
  destaque?: "alerta"; // detalhe em laranja (prazo perto, passou do plano)
};

export function Kpi({ titulo, valor, detalhe, children, destaque }: Props) {
  return (
    <div className="entrar rounded-2xl border border-borda bg-superficie p-4 sm:p-5">
      <p className="text-[13px] text-texto-2">{titulo}</p>
      <p className="num mt-1.5 text-2xl font-medium">{valor}</p>
      {children}
      <p className={`mt-2 text-xs ${destaque === "alerta" ? "text-alerta" : "text-texto-2"}`}>{detalhe}</p>
    </div>
  );
}

export function Barra({ pct, cor = "bg-primaria" }: { pct: number; cor?: string }) {
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-barra">
      <div className={`encher h-full rounded-full ${cor}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}
