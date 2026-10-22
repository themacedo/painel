// O app: tela de login, carregando, erro, ou a tela Hoje (a mesma tela do site) com os dados da API.
import { Bell, LogOut, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Aviso, FonteAvisos, FonteRevisar, Painel, Pendentes, ResumoAviso, RevisaoEnvio } from "@/lib/tipos";
import { Desempenho } from "@/telas/Desempenho";
import { Financas } from "@/telas/Financas";
import { Plano } from "@/telas/Plano";
import { Movimentos } from "@/telas/Movimentos";
import { Revisar } from "@/telas/Revisar";
import { Casca } from "@/components/Casca";
import { VisaoGeral } from "@/telas/VisaoGeral";

// a tela Revisar fala com a API pelo processo principal (o token fica lá, não na tela)
const semErro = <T,>(r: T | { erro: string }): T => { if (r && typeof r === "object" && "erro" in r) throw new Error(r.erro); return r as T; };
const fonteRevisar: FonteRevisar = {
  carregar: async () => semErro(await window.fin.pendentes()),
  enviar: async (revisoes) => semErro(await window.fin.revisar(revisoes)).enviadas,
};
const TelaRevisar = () => <Revisar fonte={fonteRevisar} />;
const fonteAvisos: FonteAvisos = {
  indice: async () => semErro(await window.fin.avisos()),
  aviso: async (id) => semErro(await window.fin.aviso(id)),
};

const ABAS = [
  { id: "visao", nome: "Hoje", Tela: VisaoGeral },
  { id: "plano", nome: "Plano", Tela: Plano },
  { id: "financas", nome: "Finanças", Tela: Financas },
  { id: "desempenho", nome: "Desempenho", Tela: Desempenho },
  { id: "revisar", nome: "Revisar", Tela: TelaRevisar },
  { id: "movimentos", nome: "Movimentos", Tela: () => null }, // sem aba: abre pelo sino e pelo clique na notificação (desenhada à parte)
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
      pendentes(): Promise<Pendentes | { erro: string }>; revisar(revisoes: RevisaoEnvio[]): Promise<{ enviadas: number } | { erro: string }>;
      avisos(): Promise<ResumoAviso[] | { erro: string }>; aviso(id: string): Promise<Aviso | { erro: string }>; aoIrPara(cb: (aba: string) => void): () => void };
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
    // clique na notificação do sync: abre a tela Movimentos
    const pararIr = window.fin.aoIrPara((a) => { if (ABAS.some((x) => x.id === a)) irPara(a as Aba); });
    const aoFocar = () => window.fin.carregar().then(setR);
    window.addEventListener("focus", aoFocar);
    return () => { parar(); pararIr(); window.removeEventListener("focus", aoFocar); };
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
  const botao = "grid size-9 place-items-center rounded-xl border border-borda text-texto-2 hover:text-texto";
  const acoes = (
    <div className="flex items-center gap-1.5">
      <button type="button" title="Movimentos" aria-label="Movimentos" onClick={() => irPara("movimentos")}
        className={aba === "movimentos" ? `${botao} bg-primaria-suave text-primaria` : botao}>
        <Bell size={15} />
      </button>
      <button type="button" title="Atualizar" aria-label="Atualizar" disabled={ocupado} onClick={() => fazer(() => window.fin.carregar(true))} className={botao}>
        <RefreshCw size={15} className={ocupado ? "animate-spin" : ""} />
      </button>
      <button type="button" title="Sair" aria-label="Sair" onClick={() => fazer(() => window.fin.sair())} className={botao}>
        <LogOut size={15} />
      </button>
    </div>
  );
  // a mesma moldura do site (Casca): lateral em janela larga, abas embaixo em janela estreita
  return (
    <Casca telas={ABAS.filter((x) => x.id !== "movimentos").map((x) => x.id)} ativa={aba} arrastar pendentes={p.saude?.pendentes}
      titulo={ABAS.find((x) => x.id === aba)!.nome}
      aba={(t, props) => <button type="button" onClick={() => irPara(t.id)} {...props} />}
      linha={<>Olá, {p.dono.split(" ")[0]} · dados de {hora(p.atualizadoEm)} · lido às {hora(r.em).slice(-5)}</>}
      rodape={<div className="flex items-center justify-between gap-2 px-2.5">{acoes}<span className="text-xs text-texto-2">App do Mac</span></div>}
      topoMovel={acoes}>
      {aba === "visao" ? <VisaoGeral p={p} modo="privado" mostraHorario aoRevisar={() => irPara("revisar")} />
        : aba === "movimentos" ? <Movimentos fonte={fonteAvisos}
          aRevisar={<button type="button" onClick={() => irPara("revisar")} className="text-sm font-medium text-primaria">Ir para Revisar</button>} />
        : ABAS.filter((x) => x.id === aba).map(({ id, Tela }) => <Tela key={id} p={p} modo="privado" mostraHorario />)}
    </Casca>
  );
}
