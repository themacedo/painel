"use client";
// Tela Revisar (site, celular e app desktop): os lançamentos que a IA ou as regras deixaram para você decidir.
// Cada decisão vai para a fila da nuvem e o Mac aplica no ledger em até 10 minutos (com o cofre aberto). Até lá a
// lista publicada ainda traz o lançamento: os já enviados ficam guardados neste aparelho e somem da tela.
import { Check, CheckCheck, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cartao } from "@/components/Cartao";
import type { FonteRevisar, Pendente, Pendentes, RevisaoEnvio } from "@/lib/tipos";

const CHAVE = "revisar:enviados";
type Enviados = Record<string, string>; // id -> quando foi enviado (ISO)
const lerEnviados = (): Enviados => { try { return JSON.parse(localStorage.getItem(CHAVE) ?? "{}") as Enviados; } catch { return {}; } };
const gravarEnviados = (e: Enviados) => {
  const limite = Date.now() - 7 * 86_400_000; // a fila guarda 7 dias; depois disso não vale a pena lembrar
  const vivos = Object.fromEntries(Object.entries(e).filter(([, em]) => Date.parse(em) > limite));
  try { localStorage.setItem(CHAVE, JSON.stringify(vivos)); } catch { /* sem armazenamento: só não lembra */ }
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
// ano só quando não é o atual (há pendentes antigos esperando revisão)
const diaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}${iso.slice(0, 4) === String(new Date().getFullYear()) ? "" : `/${iso.slice(2, 4)}`}`;
const hora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

type Escolha = { categoria: string; essencial: string | null };

export function Revisar({ fonte }: { fonte: FonteRevisar }) {
  const [dados, setDados] = useState<Pendentes | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviados, setEnviados] = useState<Enviados>({});
  const [escolhas, setEscolhas] = useState<Record<number, Escolha>>({});
  const [enviando, setEnviando] = useState<Set<number>>(new Set());
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true); setErro(null);
    try { setDados(await fonte.carregar()); setEnviados(lerEnviados()); }
    catch (e) { setErro(e instanceof Error ? e.message : String(e)); }
    finally { setCarregando(false); }
  }, [fonte]);
  useEffect(() => { void carregar(); }, [carregar]);

  // some da tela o que foi enviado depois da lista publicada (a lista nova, sem ele, ainda não chegou)
  const itens = useMemo(() => (dados?.itens ?? []).filter((i) => {
    const em = enviados[String(i.id)];
    return !em || Date.parse(em) < Date.parse(dados!.geradoEm);
  }), [dados, enviados]);
  const naFila = Object.values(enviados).filter((em) => dados && Date.parse(em) >= Date.parse(dados.geradoEm)).length;

  const escolha = (i: Pendente): Escolha => escolhas[i.id] ?? { categoria: i.sugestao ?? "", essencial: null };
  const mudar = (id: number, e: Partial<Escolha>, i: Pendente) => setEscolhas((s) => ({ ...s, [id]: { ...escolha(i), ...e } }));

  async function enviar(lista: RevisaoEnvio[]) {
    if (!lista.length) return;
    const ids = new Set(lista.map((r) => r.id));
    setEnviando((s) => new Set([...s, ...ids])); setAviso(null);
    try {
      const n = await fonte.enviar(lista);
      const agora = new Date().toISOString();
      const novos = { ...lerEnviados(), ...Object.fromEntries(lista.map((r) => [String(r.id), agora])) };
      gravarEnviados(novos); setEnviados(novos);
      setAviso(`${n} enviado${n > 1 ? "s" : ""}. Entra${n > 1 ? "m" : ""} no painel em até 10 min, com o Mac ligado e o cofre aberto.`);
    } catch (e) {
      setAviso(`Não enviou: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setEnviando((s) => new Set([...s].filter((x) => !ids.has(x))));
    }
  }

  const comSugestao = itens.filter((i) => escolha(i).categoria);

  // categorias agrupadas por natureza; a natureza do lançamento primeiro
  const grupos = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const c of dados?.categorias ?? []) m.set(c.natureza, [...(m.get(c.natureza) ?? []), c.nome]);
    return m;
  }, [dados]);

  const topo = (
    <button type="button" onClick={() => void carregar()} disabled={carregando} aria-label="Atualizar a lista" title="Atualizar a lista"
      className="grid size-8 place-items-center rounded-lg border border-borda text-texto-2 hover:text-texto disabled:opacity-60">
      <RefreshCw size={14} className={carregando ? "animate-spin" : ""} />
    </button>
  );

  if (erro) {
    return <Cartao titulo="Para revisar" extra={topo}><p className="text-sm text-perigo">Não consegui carregar: {erro}</p></Cartao>;
  }
  if (!dados) return <Cartao titulo="Para revisar" extra={topo}><p className="text-sm text-texto-2">Carregando…</p></Cartao>;

  return (
    <div className="flex flex-col gap-3">
      <Cartao titulo={`Para revisar (${itens.length})`} extra={topo}>
        <p className="text-xs text-texto-2">
          Lista de {hora(dados.geradoEm)}{naFila ? ` · ${naFila} na fila para o Mac aplicar` : ""}. Escolha a categoria (a sugestão já vem marcada) e,
          se quiser, se foi essencial. O que você aprovar ensina as regras para os próximos.
        </p>
        {comSugestao.length > 1 && (
          <button type="button" disabled={comSugestao.some((i) => enviando.has(i.id))}
            onClick={() => void enviar(comSugestao.map((i) => ({ id: i.id, ...escolha(i) })))}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primaria px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 sm:w-auto">
            <CheckCheck size={16} /> Aprovar os {comSugestao.length} com categoria
          </button>
        )}
        {aviso && <p role="status" className="mt-3 rounded-lg bg-primaria-suave px-3 py-2 text-xs text-texto">{aviso}</p>}
        {!itens.length && <p className="mt-3 text-sm text-ok">Nada para revisar. Tudo em dia.</p>}
      </Cartao>

      <ul className="flex flex-col gap-2">
        {itens.map((i) => {
          const e = escolha(i), ocupado = enviando.has(i.id);
          const ordem = [...grupos.keys()].sort((a, b) => Number(b === i.natureza) - Number(a === i.natureza));
          return (
            <li key={i.id} className="entrar rounded-xl border border-borda bg-superficie p-3.5 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" title={i.descricao}>{i.descricao || "(sem descrição)"}</p>
                  <p className="mt-0.5 text-xs text-texto-2">
                    {diaMes(i.data)} · {i.conta}{i.parcela ? ` · parcela ${i.parcela}` : ""} · {i.motivo}
                  </p>
                </div>
                <span className={`shrink-0 text-sm font-semibold tabular-nums ${i.valor < 0 ? "text-perigo" : "text-ok"}`}>{brl.format(i.valor)}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select value={e.categoria} onChange={(x) => mudar(i.id, { categoria: x.target.value }, i)} aria-label="Categoria"
                  className="min-w-0 flex-1 basis-44 rounded-lg border border-borda bg-fundo px-2.5 py-2 text-sm">
                  <option value="">Escolha a categoria…</option>
                  {ordem.map((n) => (
                    <optgroup key={n} label={n}>
                      {grupos.get(n)!.map((c) => <option key={c} value={c}>{c}{c === i.sugestao ? " (sugestão)" : ""}</option>)}
                    </optgroup>
                  ))}
                </select>
                <div className="flex rounded-lg border border-borda p-0.5" role="radiogroup" aria-label="Essencial">
                  {dados.essencial.map((op) => (
                    <button key={op} type="button" role="radio" aria-checked={e.essencial === op}
                      onClick={() => mudar(i.id, { essencial: e.essencial === op ? null : op }, i)}
                      className={`rounded-md px-2.5 py-1.5 text-xs ${e.essencial === op ? "bg-primaria-suave font-medium text-primaria" : "text-texto-2"}`}>
                      {op}
                    </button>
                  ))}
                </div>
                <button type="button" disabled={!e.categoria || ocupado} onClick={() => void enviar([{ id: i.id, ...e }])}
                  className="flex items-center gap-1.5 rounded-lg border border-borda px-3 py-2 text-sm font-medium hover:bg-primaria-suave disabled:opacity-50">
                  <Check size={15} /> {ocupado ? "Enviando…" : "Aprovar"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
