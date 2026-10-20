// O app: tela de login, carregando, erro, ou a Visão geral (a mesma tela do site) com os dados da API.
import { LogOut, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Painel } from "@/lib/tipos";
import { Desempenho } from "@/telas/Desempenho";
import { Financas } from "@/telas/Financas";
import { Plano } from "@/telas/Plano";
import { VisaoGeral } from "@/telas/VisaoGeral";

const ABAS = [
  { id: "visao", nome: "Visão geral", Tela: VisaoGeral },
  { id: "desempenho", nome: "Desempenho", Tela: Desempenho },
  { id: "financas", nome: "Finanças", Tela: Financas },
  { id: "plano", nome: "Plano", Tela: Plano },
] as const;
type Aba = (typeof ABAS)[number]["id"];
const abaSalva = (): Aba => {
  try { const a = new URLSearchParams(location.search).get("aba") ?? localStorage.getItem("aba"); return ABAS.some((x) => x.id === a) ? (a as Aba) : "visao"; } catch { return "visao"; }
};

type Resultado =
  | { estado: "ok"; painel: Painel; em: string }
  | { estado: "sem-login" } | { estado: "sem-segredo" } | { estado: "erro"; mensagem: string };

declare global {
  interface Window {
    fin: { carregar(): Promise<Resultado>; entrar(): Promise<Resultado>; sair(): Promise<Resultado>; aoAtualizar(cb: (r: Resultado) => void): () => void };
  }
}

const hora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function Centro({ children }: { children: React.ReactNode }) {
  return (
    <main className="arrastar grid min-h-dvh place-items-center bg-fundo px-4">
      <div className="w-full max-w-sm rounded-2xl border border-borda bg-superficie p-8">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primaria text-base font-bold text-white">P</span>
          <span className="text-lg font-semibold">Painel</span>
        </div>
        {children}
      </div>
    </main>
  );
}

export function App() {
  const [r, setR] = useState<Resultado | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aba, setAba] = useState<Aba>(abaSalva);
  const irPara = (a: Aba) => { setAba(a); try { localStorage.setItem("aba", a); } catch { /* sem armazenamento: só não lembra */ } window.scrollTo(0, 0); };
  const fazer = useCallback(async (f: () => Promise<Resultado>) => { setOcupado(true); try { setR(await f()); } finally { setOcupado(false); } }, []);

  useEffect(() => {
    fazer(() => window.fin.carregar());
    const parar = window.fin.aoAtualizar(setR);
    const aoFocar = () => window.fin.carregar().then(setR);
    window.addEventListener("focus", aoFocar);
    return () => { parar(); window.removeEventListener("focus", aoFocar); };
  }, [fazer]);

  if (!r) return <Centro><p className="text-sm text-texto-2">Carregando…</p></Centro>;
  if (r.estado === "sem-segredo") {
    return (
      <Centro>
        <h1 className="text-xl font-semibold">Falta configurar</h1>
        <p className="mt-2 text-sm text-texto-2">O client secret do app ainda não está no Keychain. Rode no Terminal o comando de configuração e abra o app de novo.</p>
      </Centro>
    );
  }
  if (r.estado === "sem-login") {
    return (
      <Centro>
        <h1 className="text-xl font-semibold">Entrar</h1>
        <p className="mt-1 text-sm text-texto-2">O login abre no seu navegador uma vez; depois o app entra sozinho.</p>
        <button type="button" disabled={ocupado} onClick={() => fazer(() => window.fin.entrar())}
          className="mt-6 w-full rounded-xl border border-borda px-4 py-3 text-sm font-medium hover:bg-primaria-suave disabled:opacity-60">
          {ocupado ? "Esperando o navegador…" : "Entrar com Google"}
        </button>
      </Centro>
    );
  }
  if (r.estado === "erro") {
    return (
      <Centro>
        <h1 className="text-xl font-semibold">Não consegui carregar</h1>
        <p className="mt-2 text-sm text-texto-2">{r.mensagem}</p>
        <button type="button" onClick={() => fazer(() => window.fin.carregar())} className="mt-6 w-full rounded-xl border border-borda px-4 py-3 text-sm">
          Tentar de novo
        </button>
      </Centro>
    );
  }

  const p = r.painel;
  return (
    <div className="min-h-dvh bg-fundo">
      <header className="arrastar sticky top-0 z-40 flex items-center gap-3 border-b border-borda bg-fundo/90 py-2.5 pl-20 pr-4 backdrop-blur">
        <span className="grid size-6 place-items-center rounded-md bg-primaria text-xs font-bold text-white">P</span>
        <nav className="flex gap-0.5 rounded-lg border border-borda bg-superficie p-0.5" role="tablist">
          {ABAS.map((x) => (
            <button key={x.id} type="button" role="tab" aria-selected={aba === x.id} onClick={() => irPara(x.id)}
              className={`rounded-md px-2.5 py-1 text-[13px] ${aba === x.id ? "bg-primaria-suave font-medium text-primaria" : "text-texto-2 hover:text-texto"}`}>
              {x.nome}
            </button>
          ))}
        </nav>
        <span className="hidden text-xs text-texto-2 md:inline">dados de {hora(p.atualizadoEm)} · lido às {hora(r.em).slice(-5)}</span>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" title="Atualizar" aria-label="Atualizar" disabled={ocupado} onClick={() => fazer(() => window.fin.carregar())}
            className="grid size-8 place-items-center rounded-lg text-texto-2 hover:bg-primaria-suave hover:text-texto">
            <RefreshCw size={15} className={ocupado ? "animate-spin" : ""} />
          </button>
          <button type="button" title="Sair" aria-label="Sair" onClick={() => fazer(() => window.fin.sair())}
            className="grid size-8 place-items-center rounded-lg text-texto-2 hover:bg-primaria-suave hover:text-texto">
            <LogOut size={15} />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        {ABAS.filter((x) => x.id === aba).map(({ id, Tela }) => <Tela key={id} p={p} modo="privado" mostraHorario />)}
      </main>
    </div>
  );
}
