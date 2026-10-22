"use client";
// Tela Movimentos (site, celular e app desktop): o aviso de cada sync, o que entrou, o que saiu, por onde e por qual
// meio, e tudo o que está para revisar. O push chega só com "Sync concluído"; o detalhe é este, atrás do login.
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cartao } from "@/components/Cartao";
import { Kpi } from "@/components/Kpi";
import type { Aviso, FonteAvisos, ItemAviso, ResumoAviso } from "@/lib/tipos";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const reais = (centavos: number) => brl.format(centavos / 100);
const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const dia = (iso: string) => new Date(`${iso}T12:00:00-03:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
const ORIGEM = { mac: "Mac", nuvem: "nuvem" } as const;

export const ULTIMO_VISTO = "movimentos:visto";
export const marcarVisto = (id: string) => { try { localStorage.setItem(ULTIMO_VISTO, id); } catch { /* sem armazenamento */ } };

function Linha({ i }: { i: ItemAviso }) {
  const entrou = i.sentido === "entrou";
  const Icone = entrou ? ArrowDownLeft : ArrowUpRight;
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className={`grid size-8 shrink-0 place-items-center rounded-full ${entrou ? "bg-primaria-suave text-ok" : "bg-barra text-texto-2"}`}>
        <Icone size={16} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{i.descricao || "(sem descrição)"}</p>
        <p className="truncate text-xs text-texto-2">
          {i.conta} · {i.meio}{i.categoria ? ` · ${i.categoria}` : ""}
          {i.revisar && <span className="ml-1.5 rounded-full bg-alerta-suave px-1.5 text-[11px] font-medium text-alerta">revisar</span>}
        </p>
      </div>
      <span className={`num shrink-0 text-sm font-medium ${entrou ? "text-ok" : ""}`}>{entrou ? "+" : "−"}{reais(i.valor)}</span>
    </li>
  );
}

function PorDia({ itens }: { itens: ItemAviso[] }) {
  const grupos = useMemo(() => {
    const m = new Map<string, ItemAviso[]>();
    for (const i of itens) m.set(i.data, [...(m.get(i.data) ?? []), i]);
    return [...m.entries()].sort(([a], [b]) => (a < b ? 1 : -1));
  }, [itens]);
  return (
    <div className="flex flex-col gap-3">
      {grupos.map(([d, lista]) => (
        <div key={d}>
          <p className="text-xs font-medium uppercase tracking-wide text-texto-2">{dia(d)}</p>
          <ul className="divide-y divide-borda">{lista.map((i) => <Linha key={i.id} i={i} />)}</ul>
        </div>
      ))}
    </div>
  );
}

type Props = { fonte: FonteAvisos; inicial?: string | null; aRevisar?: React.ReactNode; extra?: React.ReactNode };

export function Movimentos({ fonte, inicial, aRevisar, extra }: Props) {
  const [indice, setIndice] = useState<ResumoAviso[] | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [escolhido, setEscolhido] = useState<string | null>(inicial ?? null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true); setErro(null);
    try {
      const lista = await fonte.indice();
      setIndice(lista);
      setEscolhido((atual) => (atual && lista.some((r) => r.id === atual) ? atual : lista[0]?.id ?? null));
      if (lista[0]) marcarVisto(lista[0].id);
    } catch (e) { setErro(e instanceof Error ? e.message : String(e)); }
    finally { setCarregando(false); }
  }, [fonte]);
  useEffect(() => { void carregar(); }, [carregar]);
  useEffect(() => {
    if (!escolhido) { setAviso(null); return; }
    let vivo = true;
    fonte.aviso(escolhido).then((a) => { if (vivo) setAviso(a); }, (e) => { if (vivo) setErro(e instanceof Error ? e.message : String(e)); });
    return () => { vivo = false; };
  }, [fonte, escolhido]);

  return (
    <div className="flex flex-col gap-4 entrar">
      {extra}
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-texto-2" htmlFor="aviso">Sync</label>
        <select id="aviso" className="min-h-9 rounded-lg border border-borda bg-superficie px-2 text-sm" value={escolhido ?? ""}
          onChange={(e) => setEscolhido(e.target.value)} disabled={!indice?.length}>
          {(indice ?? []).map((r) => (
            <option key={r.id} value={r.id}>{quando(r.em)} · {ORIGEM[r.origem]} · {r.lancamentos} novo{r.lancamentos === 1 ? "" : "s"}</option>
          ))}
        </select>
        <button type="button" onClick={() => void carregar()} className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-texto-2 hover:text-texto">
          <RefreshCw size={15} className={carregando ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {erro && <p className="rounded-2xl border border-borda bg-superficie p-4 text-sm text-perigo">{erro}</p>}
      {!erro && !carregando && !indice?.length && (
        <p className="rounded-2xl border border-borda bg-superficie p-4 text-sm text-texto-2">Ainda não há aviso de sync. O primeiro chega no próximo sync, do Mac ou da nuvem.</p>
      )}

      {aviso && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi titulo="Entrou" valor={reais(aviso.totais.entrou)} detalhe={`${aviso.novos.filter((i) => i.sentido === "entrou").length} lançamento(s)`} />
            <Kpi titulo="Saiu" valor={reais(aviso.totais.saiu)} detalhe={`${aviso.novos.filter((i) => i.sentido === "saiu").length} lançamento(s)`} />
            <Kpi titulo="Lançamentos novos" valor={aviso.totais.lancamentos} detalhe={`sync de ${quando(aviso.em)}`} />
            <Kpi titulo="Para revisar" valor={aviso.revisar.length} detalhe={aviso.revisar.length ? "abra a tela Revisar" : "tudo em dia"}
              destaque={aviso.revisar.length ? "alerta" : undefined} />
          </div>

          {(aviso.sync !== "success" || aviso.alertas.length > 0) && (
            <div className="flex gap-2.5 rounded-2xl bg-alerta-suave p-4 text-sm text-alerta">
              <AlertTriangle size={18} className="shrink-0" />
              <div>
                {aviso.sync !== "success" && <p className="font-medium">O sync terminou como “{aviso.sync}”.</p>}
                {aviso.alertas.map((a) => <p key={a}>{a}</p>)}
              </div>
            </div>
          )}

          <Cartao titulo="O que entrou e saiu" extra={<span className="text-xs text-texto-2">{aviso.origem === "mac" ? "pelo Mac" : "pela nuvem"}</span>}>
            {aviso.novos.length ? <PorDia itens={aviso.novos} /> : <p className="text-sm text-texto-2">Nenhum lançamento novo neste sync.</p>}
          </Cartao>

          <Cartao titulo="Para revisar" extra={aviso.revisar.length > 0 ? aRevisar : undefined}>
            {aviso.revisar.length ? <PorDia itens={aviso.revisar} /> : <p className="text-sm text-texto-2">Nada para revisar.</p>}
          </Cartao>
        </>
      )}
    </div>
  );
}
