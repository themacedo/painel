// O app: tela de login, carregando, erro, ou a Visão geral (a mesma tela do site) com os dados da API.
import { LogOut, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Painel } from "@/lib/tipos";
import { VisaoGeral } from "@/telas/VisaoGeral";

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
        <span className="text-sm font-semibold">Visão geral</span>
        <span className="text-xs text-texto-2">dados de {hora(p.atualizadoEm)} · lido às {hora(r.em).slice(-5)}</span>
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
        <VisaoGeral p={p} modo="privado" mostraHorario />
      </main>
    </div>
  );
}
