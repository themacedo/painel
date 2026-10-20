import Link from "next/link";
import { Activity, CalendarDays, House, ListChecks, Wallet } from "lucide-react";
import { BotaoSair } from "./BotaoSair";

// com o login do Google ligado, há sessão para encerrar
export const comLogin = () => process.env.PAINEL_MODO === "privado" && Boolean(process.env.AUTH_GOOGLE_ID);

export type Tela = "visao" | "financas" | "desempenho" | "plano" | "revisar";

export const telas: { id: Tela; nome: string; href: string; icone: typeof House; pronta: boolean }[] = [
  { id: "visao", nome: "Hoje", href: "/", icone: House, pronta: true },
  { id: "plano", nome: "Plano", href: "/plano", icone: CalendarDays, pronta: true },
  { id: "financas", nome: "Finanças", href: "/financas", icone: Wallet, pronta: true },
  { id: "desempenho", nome: "Desempenho", href: "/desempenho", icone: Activity, pronta: true },
  { id: "revisar", nome: "Revisar", href: "/revisar", icone: ListChecks, pronta: true },
];
// Revisar mostra lançamentos de verdade: só no modo privado
const visiveis = () => telas.filter((t) => t.id !== "revisar" || process.env.PAINEL_MODO === "privado");

function Selo({ n, flutuante = false }: { n?: number; flutuante?: boolean }) {
  if (!n) return null;
  return flutuante
    ? <span className="num absolute top-0.5 left-1/2 ml-1.5 min-w-4 rounded-full bg-alerta px-1 text-center text-[10px] leading-4 text-fundo">{n}</span>
    : <span className="num ml-auto rounded-full bg-alerta-suave px-2 text-xs font-medium text-alerta">{n}</span>;
}

export function Marcador() {
  return <span className="grid size-7 place-items-center rounded-lg bg-texto text-sm font-bold text-fundo">P</span>;
}

// pendentes: o número no selo da aba Revisar
export function Lateral({ modo, ativa, pendentes }: { modo: string; ativa: Tela; pendentes?: number }) {
  return (
    <aside className="hidden w-58 shrink-0 flex-col gap-1 border-r border-borda bg-superficie px-3.5 py-6 lg:flex">
      <div className="mb-6 flex items-center gap-2.5 px-2.5">
        <Marcador />
        <span className="text-[15px] font-semibold">Painel</span>
      </div>
      <nav className="flex flex-col gap-1">
        {visiveis().map(({ id, nome, href, icone: Icone }) => (
          <Link key={id} href={href} aria-current={id === ativa ? "page" : undefined}
            className={`flex min-h-10 items-center gap-2.5 rounded-xl px-2.5 text-sm ${
              id === ativa ? "bg-primaria-suave font-semibold text-primaria" : "text-texto-2 hover:text-texto"}`}>
            <Icone size={18} strokeWidth={1.8} />
            {nome}
            {id === "revisar" && <Selo n={pendentes} />}
          </Link>
        ))}
      </nav>
      {comLogin() && <div className="mt-auto"><BotaoSair /></div>}
      <p className={`${comLogin() ? "mt-1" : "mt-auto"} px-2.5 text-xs text-texto-2`}>
        {modo === "demo" ? "Modo demonstração" : "Modo privado"}
      </p>
    </aside>
  );
}

// No celular a lateral some: em cima a marca (e o Sair), embaixo uma barra fixa com as telas e ícones.
export function NavMovel({ ativa, pendentes }: { ativa: Tela; pendentes?: number }) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2.5">
          <Marcador />
          <span className="text-[15px] font-semibold">Painel</span>
        </div>
        {comLogin() && <BotaoSair compacto />}
      </div>
      <nav aria-label="Telas"
        className="fixed inset-x-0 bottom-0 z-50 grid border-t border-borda bg-superficie/95 px-1.5 pt-2 backdrop-blur lg:hidden"
        style={{ gridTemplateColumns: `repeat(${visiveis().length}, minmax(0, 1fr))`, paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        {visiveis().map(({ id, nome, href, icone: Icone }) => (
          <Link key={id} href={href} aria-current={id === ativa ? "page" : undefined}
            className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] ${
              id === ativa ? "font-semibold text-primaria" : "text-texto-2"}`}>
            <Icone size={22} strokeWidth={1.8} />
            {nome}
            {id === "revisar" && <Selo n={pendentes} flutuante />}
          </Link>
        ))}
      </nav>
    </>
  );
}
