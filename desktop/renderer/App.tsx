// O app: tela de login, carregando, erro, ou a tela Hoje (a mesma tela do site) com os dados da API.
import { LogOut, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FonteRevisar, Painel, Pendentes, RevisaoEnvio } from "@/lib/tipos";
import { Desempenho } from "@/telas/Desempenho";
import { Financas } from "@/telas/Financas";
import { Plano } from "@/telas/Plano";
import { Revisar } from "@/telas/Revisar";
import { VisaoGeral } from "@/telas/VisaoGeral";

// a tela Revisar fala com a API pelo processo principal (o token fica lá, não na tela)
const semErro = <T,>(r: T | { erro: string }): T => { if (r && typeof r === "object" && "erro" in r) throw new Error(r.erro); return r as T; };
const fonteRevisar: FonteRevisar = {
  carregar: async () => semErro(await window.fin.pendentes()),
  enviar: async (revisoes) => semErro(await window.fin.revisar(revisoes)).enviadas,
};
const TelaRevisar = () => <Revisar fonte={fonteRevisar} />;

const ABAS = [
  { id: "visao", nome: "Hoje", Tela: VisaoGeral },
  { id: "plano", nome: "Plano", Tela: Plano },
  { id: "financas", nome: "Finanças", Tela: Financas },
  { id: "desempenho", nome: "Desempenho", Tela: Desempenho },
  { id: "revisar", nome: "Revisar", Tela: TelaRevisar },
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
    fin: { carregar(forcar?: boolean): Promise<Resultado>; entrar(): Promise<Resultado>; sair(): Promise<Resultado>; aoAtualizar(cb: (r: Resultado) => void): () => void;
      pendentes(): Promise<Pendentes | { erro: string }>; revisar(revisoes: RevisaoEnvio[]): Promise<{ enviadas: number } | { erro: string }> };
  }
}

const hora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function Centro({ children }: { children: React.ReactNode }) {
  return (
    <main className="arrastar grid min-h-dvh place-items-center bg-fundo px-4">
      <div className="w-full max-w-sm rounded-2xl border border-borda bg-superficie p-8">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-texto text-base font-bold text-fundo">P</span>
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
        <button type="button" onClick={() => fazer(() => window.fin.carregar(true))} className="mt-6 w-full rounded-xl border border-borda px-4 py-3 text-sm">
          Tentar de novo
        </button>
      </Centro>
    );
  }

  const p = r.painel;
  return (
    <div className="min-h-dvh bg-fundo">
      <header className="arrastar sticky top-0 z-40 flex items-center gap-3 border-b border-borda bg-fundo/90 py-2.5 pl-20 pr-4 backdrop-blur">
        <span className="grid size-7 place-items-center rounded-lg bg-texto text-sm font-bold text-fundo">P</span>
        <nav className="flex min-w-0 gap-0.5 overflow-x-auto rounded-xl border border-borda bg-superficie p-1" role="tablist">
          {ABAS.map((x) => (
            <button key={x.id} type="button" role="tab" aria-selected={aba === x.id} onClick={() => irPara(x.id)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] ${aba === x.id ? "bg-primaria-suave font-semibold text-primaria" : "text-texto-2 hover:text-texto"}`}>
              {x.nome}
              {x.id === "revisar" && !!p.saude?.pendentes && <span className="num rounded-full bg-alerta-suave px-1.5 text-[11px] font-medium text-alerta">{p.saude.pendentes}</span>}
            </button>
          ))}
        </nav>
        <span className="hidden text-xs text-texto-2 md:inline">dados de {hora(p.atualizadoEm)} · lido às {hora(r.em).slice(-5)}</span>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" title="Atualizar" aria-label="Atualizar" disabled={ocupado} onClick={() => fazer(() => window.fin.carregar(true))}
            className="grid size-8 place-items-center rounded-lg text-texto-2 hover:bg-primaria-suave hover:text-texto">
            <RefreshCw size={15} className={ocupado ? "animate-spin" : ""} />
          </button>
          <button type="button" title="Sair" aria-label="Sair" onClick={() => fazer(() => window.fin.sair())}
            className="grid size-8 place-items-center rounded-lg text-texto-2 hover:bg-primaria-suave hover:text-texto">
            <LogOut size={15} />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <h1 className="mb-5 text-[28px] font-semibold tracking-tight">{ABAS.find((x) => x.id === aba)!.nome}</h1>
        {aba === "visao" ? <VisaoGeral p={p} modo="privado" mostraHorario aoRevisar={() => irPara("revisar")} />
          : ABAS.filter((x) => x.id === aba).map(({ id, Tela }) => <Tela key={id} p={p} modo="privado" mostraHorario />)}
      </main>
    </div>
  );
}
