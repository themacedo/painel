import Link from "next/link";
import { LayoutGrid, Wallet, Activity, CalendarDays, ListChecks, Settings } from "lucide-react";
import { BotaoSair } from "./BotaoSair";

// com o login do Google ligado, há sessão para encerrar
export const comLogin = () => process.env.PAINEL_MODO === "privado" && Boolean(process.env.AUTH_GOOGLE_ID);

export type Tela = "visao" | "financas" | "desempenho" | "plano" | "revisar";

export const telas: { id: Tela; nome: string; href: string; icone: typeof LayoutGrid; pronta: boolean }[] = [
  { id: "visao", nome: "Visão geral", href: "/", icone: LayoutGrid, pronta: true },
  { id: "desempenho", nome: "Desempenho", href: "/desempenho", icone: Activity, pronta: true },
  { id: "financas", nome: "Finanças", href: "/financas", icone: Wallet, pronta: true },
  { id: "plano", nome: "Plano", href: "/plano", icone: CalendarDays, pronta: true },
  { id: "revisar", nome: "Revisar", href: "/revisar", icone: ListChecks, pronta: true },
];
// Revisar mostra lançamentos de verdade: só no modo privado
const visiveis = () => telas.filter((t) => t.id !== "revisar" || process.env.PAINEL_MODO === "privado");

export function Lateral({ modo, ativa }: { modo: string; ativa: Tela }) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-borda bg-superficie px-3 py-5 lg:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="grid size-7 place-items-center rounded-lg bg-primaria text-sm font-bold text-white">P</span>
        <span className="font-semibold">Painel</span>
      </div>
      <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-texto-2">Menu</p>
      <nav className="flex flex-col gap-0.5">
        {visiveis().map(({ id, nome, href, icone: Icone, pronta }) => {
          const classe = `flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm ${
            id === ativa ? "bg-primaria-suave font-medium text-primaria" : "text-texto-2"
          }`;
          return pronta ? (
            <Link key={id} href={href} className={`${classe} hover:text-texto`}>
              <Icone size={16} />
              {nome}
            </Link>
          ) : (
            <span key={id} className={classe}>
              <Icone size={16} />
              {nome}
              <span className="ml-auto text-[10px] text-texto-2/70">em breve</span>
            </span>
          );
        })}
      </nav>
      {comLogin() && <div className="mt-auto"><BotaoSair /></div>}
      <div className={`${comLogin() ? "mt-1" : "mt-auto"} flex items-center gap-2.5 px-2 text-sm text-texto-2`}>
        <Settings size={16} />
        {modo === "demo" ? "Modo demonstração" : "Modo privado"}
      </div>
    </aside>
  );
}

// No celular a lateral some: em cima a marca (e o Sair), embaixo as telas como abas de largura igual.
export function NavMovel({ ativa }: { ativa: Tela }) {
  return (
    <div className="mb-5 lg:hidden">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-primaria text-sm font-bold text-white">P</span>
          <span className="font-semibold">Painel</span>
        </div>
        {comLogin() && <BotaoSair compacto />}
      </div>
      <nav className="flex gap-0.5 rounded-xl border border-borda bg-superficie p-1">
        {visiveis().filter((t) => t.pronta).map(({ id, nome, href }) => (
          <Link key={id} href={href}
            className={`flex-auto whitespace-nowrap rounded-lg px-1.5 py-1.5 text-center text-[13px] ${
              id === ativa ? "bg-primaria-suave font-medium text-primaria" : "text-texto-2"
            }`}>
            {id === "visao" ? "Início" : nome}
          </Link>
        ))}
      </nav>
    </div>
  );
}
