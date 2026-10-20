import { Lateral, NavMovel, type Tela } from "./Lateral";
import { dataHora } from "@/lib/formato";

type Props = {
  ativa: Tela; titulo: string; modo: string; dono: string; atualizadoEm: string; pendentes?: number; children: React.ReactNode;
};

export function Moldura({ ativa, titulo, modo, dono, atualizadoEm, pendentes, children }: Props) {
  return (
    <div className="flex min-h-screen">
      <Lateral modo={modo} ativa={ativa} pendentes={pendentes} />
      {/* no app instalado a página vai até as bordas da tela: o "seguro" reserva a barra de status e os cantos */}
      <main className="seguro com-abas min-w-0 flex-1">
        <div className="mx-auto max-w-6xl">
          <NavMovel ativa={ativa} pendentes={pendentes} />
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-texto-2">Olá, {dono.split(" ")[0]} · atualizado em {dataHora(atualizadoEm)}</p>
              <h1 className="mt-0.5 text-[28px] font-semibold tracking-tight">{titulo}</h1>
            </div>
            {modo === "demo" && (
              <span className="shrink-0 rounded-full bg-alerta-suave px-3 py-1 text-xs font-medium text-alerta">Dados fictícios</span>
            )}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}

export { Cartao } from "./Cartao";
