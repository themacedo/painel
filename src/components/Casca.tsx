import { Fragment } from "react";
import { Activity, CalendarDays, House, ListChecks, Wallet } from "lucide-react";

// A moldura das telas, igual no site, no celular e no app do Mac: lateral (telas largas), barra de abas fixa embaixo
// (telas estreitas) e o cabeçalho. Sem nada de Next: quem usa diz como cada aba vira link (site) ou botão (app).

export type Tela = "visao" | "financas" | "desempenho" | "plano" | "revisar";

export const TELAS: { id: Tela; nome: string; href: string; icone: typeof House }[] = [
  { id: "visao", nome: "Hoje", href: "/", icone: House },
  { id: "plano", nome: "Plano", href: "/plano", icone: CalendarDays },
  { id: "financas", nome: "Finanças", href: "/financas", icone: Wallet },
  { id: "desempenho", nome: "Desempenho", href: "/desempenho", icone: Activity },
  { id: "revisar", nome: "Revisar", href: "/revisar", icone: ListChecks },
];

export type Aba = (typeof TELAS)[number];
// o site devolve um <Link>, o app um <button>; as classes e o aria-current vêm prontos
export type FazAba = (t: Aba, p: { className: string; "aria-current"?: "page"; children: React.ReactNode }) => React.ReactNode;

function Selo({ n, flutuante = false }: { n?: number; flutuante?: boolean }) {
  if (!n) return null;
  return flutuante
    ? <span className="num absolute top-0.5 left-1/2 ml-1.5 min-w-4 rounded-full bg-alerta px-1 text-center text-[10px] leading-4 text-fundo">{n}</span>
    : <span className="num ml-auto rounded-full bg-alerta-suave px-2 text-xs font-medium text-alerta">{n}</span>;
}

export function Marcador() {
  return <span className="grid size-7 place-items-center rounded-lg bg-texto text-sm font-bold text-fundo">P</span>;
}

type Props = {
  telas: Tela[]; // quais abas aparecem (o demo não tem Revisar)
  ativa: Tela;
  aba: FazAba;
  titulo: string;
  linha: React.ReactNode; // "Olá, … · atualizado em …"
  pendentes?: number;
  selo?: React.ReactNode; // "Dados fictícios"
  rodape?: React.ReactNode; // fim da lateral: Sair, modo
  topoMovel?: React.ReactNode; // canto direito do topo no celular (Sair, Atualizar)
  arrastar?: boolean; // app do Mac: a lateral e o topo arrastam a janela e abrem espaço para os botões do macOS
  children: React.ReactNode;
};

export function Casca({ telas, ativa, aba, titulo, linha, pendentes, selo, rodape, topoMovel, arrastar = false, children }: Props) {
  const abas = TELAS.filter((t) => telas.includes(t.id));
  return (
    <div className="flex min-h-screen">
      <aside className={`hidden w-58 shrink-0 flex-col gap-1 border-r border-borda bg-superficie px-3.5 pb-6 lg:flex ${arrastar ? "arrastar sticky top-0 h-screen pt-12" : "pt-6"}`}>
        <div className="mb-6 flex items-center gap-2.5 px-2.5">
          <Marcador />
          <span className="text-[15px] font-semibold">Painel</span>
        </div>
        <nav className="flex flex-col gap-1">
          {abas.map((t) => {
            const Icone = t.icone;
            return <Fragment key={t.id}>{aba(t, {
              "aria-current": t.id === ativa ? "page" : undefined,
              className: `flex min-h-10 items-center gap-2.5 rounded-xl px-2.5 text-left text-sm ${
                t.id === ativa ? "bg-primaria-suave font-semibold text-primaria" : "text-texto-2 hover:text-texto"}`,
              children: <><Icone size={18} strokeWidth={1.8} />{t.nome}{t.id === "revisar" && <Selo n={pendentes} />}</>,
            })}</Fragment>;
          })}
        </nav>
        {rodape && <div className="mt-auto">{rodape}</div>}
      </aside>

      {/* no app instalado a página vai até as bordas da tela: o "seguro" reserva a barra de status e os cantos */}
      <main className="seguro com-abas min-w-0 flex-1">
        <div className="mx-auto max-w-6xl">
          <div className={`mb-4 flex items-center justify-between lg:hidden ${arrastar ? "arrastar pl-16" : ""}`}>
            <div className="flex items-center gap-2.5">
              <Marcador />
              <span className="text-[15px] font-semibold">Painel</span>
            </div>
            {topoMovel}
          </div>
          <header className={`mb-5 flex flex-wrap items-end justify-between gap-3 ${arrastar ? "arrastar lg:pt-6" : ""}`}>
            <div className="min-w-0">
              <p className="text-[13px] text-texto-2">{linha}</p>
              <h1 className="mt-0.5 text-[28px] font-semibold tracking-tight">{titulo}</h1>
            </div>
            {selo}
          </header>
          {children}
        </div>
      </main>

      <nav aria-label="Telas"
        className="fixed inset-x-0 bottom-0 z-50 grid border-t border-borda bg-superficie/95 px-1.5 pt-2 backdrop-blur lg:hidden"
        style={{ gridTemplateColumns: `repeat(${abas.length}, minmax(0, 1fr))`, paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        {abas.map((t) => {
          const Icone = t.icone;
          return <Fragment key={t.id}>{aba(t, {
            "aria-current": t.id === ativa ? "page" : undefined,
            className: `relative flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] ${t.id === ativa ? "font-semibold text-primaria" : "text-texto-2"}`,
            children: <><Icone size={22} strokeWidth={1.8} />{t.nome}{t.id === "revisar" && <Selo n={pendentes} flutuante />}</>,
          })}</Fragment>;
        })}
      </nav>
    </div>
  );
}
