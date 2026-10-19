import { BotaoSair } from "./BotaoSair";
import { comLogin, Lateral, NavMovel, type Tela } from "./Lateral";
import { dataHora } from "@/lib/formato";

type Props = { ativa: Tela; titulo: string; modo: string; dono: string; atualizadoEm: string; children: React.ReactNode };

export function Moldura({ ativa, titulo, modo, dono, atualizadoEm, children }: Props) {
  return (
    <div className="flex min-h-screen">
      <Lateral modo={modo} ativa={ativa} />
      {/* no app instalado a página vai até as bordas da tela: o "seguro" reserva a barra de status e os cantos */}
      <main className="seguro min-w-0 flex-1">
        <NavMovel ativa={ativa} />
        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold">{titulo}</h1>
            <p className="text-xs text-texto-2">Olá, {dono.split(" ")[0]}. Última atualização: {dataHora(atualizadoEm)}</p>
          </div>
          {modo === "demo" && (
            <span className="shrink-0 rounded-lg bg-alerta-suave px-2.5 py-1 text-xs font-medium text-alerta">Dados fictícios</span>
          )}
          {comLogin() && <span className="shrink-0 lg:hidden"><BotaoSair compacto /></span>}
        </header>
        {children}
      </main>
    </div>
  );
}

export function Cartao({ titulo, extra, children }: { titulo: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="entrar rounded-xl border border-borda bg-superficie p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}
