import { LayoutGrid, Wallet, Activity, CalendarDays, Settings } from "lucide-react";

const itens = [
  { nome: "Visão geral", icone: LayoutGrid, ativo: true },
  { nome: "Finanças", icone: Wallet },
  { nome: "Desempenho", icone: Activity },
  { nome: "Plano", icone: CalendarDays },
];

export function Lateral({ modo }: { modo: string }) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-borda bg-superficie px-3 py-5 lg:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="grid size-7 place-items-center rounded-lg bg-primaria text-sm font-bold text-white">P</span>
        <span className="font-semibold">Painel</span>
      </div>
      <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-texto-2">Menu</p>
      <nav className="flex flex-col gap-0.5">
        {itens.map(({ nome, icone: Icone, ativo }) => (
          <span
            key={nome}
            className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm ${
              ativo ? "bg-primaria-suave font-medium text-primaria" : "text-texto-2"
            }`}
          >
            <Icone size={16} />
            {nome}
            {!ativo && <span className="ml-auto text-[10px] text-texto-2/70">em breve</span>}
          </span>
        ))}
      </nav>
      <div className="mt-auto flex items-center gap-2.5 px-2 text-sm text-texto-2">
        <Settings size={16} />
        {modo === "demo" ? "Modo demonstração" : "Modo privado"}
      </div>
    </aside>
  );
}
