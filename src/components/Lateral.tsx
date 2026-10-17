import Link from "next/link";
import { LayoutGrid, Wallet, Activity, CalendarDays, Settings } from "lucide-react";

export type Tela = "visao" | "financas" | "desempenho" | "plano";

export const telas: { id: Tela; nome: string; href: string; icone: typeof LayoutGrid; pronta: boolean }[] = [
  { id: "visao", nome: "Visão geral", href: "/", icone: LayoutGrid, pronta: true },
  { id: "desempenho", nome: "Desempenho", href: "/desempenho", icone: Activity, pronta: true },
  { id: "financas", nome: "Finanças", href: "/financas", icone: Wallet, pronta: false },
  { id: "plano", nome: "Plano", href: "/plano", icone: CalendarDays, pronta: false },
];

export function Lateral({ modo, ativa }: { modo: string; ativa: Tela }) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-borda bg-superficie px-3 py-5 lg:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="grid size-7 place-items-center rounded-lg bg-primaria text-sm font-bold text-white">P</span>
        <span className="font-semibold">Painel</span>
      </div>
      <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-texto-2">Menu</p>
      <nav className="flex flex-col gap-0.5">
        {telas.map(({ id, nome, href, icone: Icone, pronta }) => {
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
      <div className="mt-auto flex items-center gap-2.5 px-2 text-sm text-texto-2">
        <Settings size={16} />
        {modo === "demo" ? "Modo demonstração" : "Modo privado"}
      </div>
    </aside>
  );
}

// No celular a lateral some: as telas viram abas no topo.
export function NavMovel({ ativa }: { ativa: Tela }) {
  return (
    <nav className="-mx-4 mb-4 flex gap-1 overflow-x-auto px-4 lg:hidden">
      {telas.filter((t) => t.pronta).map(({ id, nome, href }) => (
        <Link key={id} href={href}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm ${
            id === ativa ? "bg-primaria-suave font-medium text-primaria" : "text-texto-2"
          }`}>
          {nome}
        </Link>
      ))}
    </nav>
  );
}
