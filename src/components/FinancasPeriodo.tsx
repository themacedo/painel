"use client";

import { useMemo, useState } from "react";
import { Cartao, Secao } from "@/components/Cartao";
import { Barra, Kpi } from "@/components/Kpi";
import { GraficoParcelas } from "@/components/GraficoParcelas";
import { GraficoPosicao } from "@/components/GraficoPosicao";
import { AvisoCartao } from "@/components/AvisoCartao";
import { Marca } from "@/components/Marca";
import { Contador } from "@/components/Contador";
import { Variacao } from "@/components/Variacao";
import { diaMes, reais, reaisCurto } from "@/lib/formato";
import type { Detalhe, Painel, Periodo, Posicao } from "@/lib/tipos";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesCurto = (ym: string) => `${MESES[Number(ym.slice(5, 7)) - 1]}/${ym.slice(2, 4)}`;
type Modo = "semana" | "mes" | "ano";
const NOMES: Record<Modo, string> = { semana: "Semana", mes: "Mês", ano: "Ano" };

// JSON antigo, sem períodos: o mês atual vira o único período.
function periodoDoMes(d: Detalhe): Periodo {
  return {
    chave: `m-${d.mes}`, rotulo: mesCurto(d.mes), inicio: `${d.mes}-01`, fim: d.ate, ate: d.ate,
    anteriorInicio: d.anteriorAte, anteriorAte: d.anteriorAte, emCurso: true,
    entradas: d.entradas ?? { clt: 0, pj: d.pj.faturamento, outros: d.resumo.receitas, custosPj: 0 },
    resumo: { receitas: d.resumo.receitas, despesas: d.resumo.despesas, despesasAnterior: d.resumo.despesasAnteriorMesmoPeriodo },
    categorias: d.categorias, clt: d.clt ?? { itens: [], recebido: 0, previsto: 0 }, pj: d.pj, fixos: d.fixos,
  };
}

function titulo(modo: Modo, p: Periodo) {
  if (modo === "semana") return p.emCurso ? `Gasto na semana até ${diaMes(p.ate)}` : `Gasto na semana ${p.rotulo}`;
  if (modo === "mes") return p.emCurso ? `Gasto em ${p.rotulo} até ${diaMes(p.ate)}` : `Gasto em ${p.rotulo}`;
  return p.emCurso ? `Gasto em ${p.rotulo} até ${diaMes(p.ate)}` : `Gasto em ${p.rotulo}`;
}

const anterior: Record<Modo, string> = { semana: "Semana anterior", mes: "Mês anterior", ano: "Ano anterior" };
const doPeriodo: Record<Modo, string> = { semana: "da semana", mes: "do mês", ano: "do ano" };

export function FinancasPeriodo({ d, empresas: e, plano = [] }: { d: Detalhe; empresas: Painel["empresas"]; plano?: Painel["financas"]["plano"] }) {
  const periodos = useMemo(() => d.periodos ?? { semana: [], mes: [periodoDoMes(d)], ano: [] }, [d]);
  const [modo, setModo] = useState<Modo>("mes");
  const [chave, setChave] = useState<string>(periodos.mes[0]?.chave ?? "");
  const lista = periodos[modo];
  const p = lista.find((x) => x.chave === chave) ?? lista[0];

  // resumo aberto por toque ou clique (no celular não existe "passar o mouse"); o mouse continua abrindo por cima
  const [aberta, setAberta] = useState<string | null>(null);
  const trocarModo = (m: Modo) => { setModo(m); setChave(periodos[m][0]?.chave ?? ""); };

  if (!p) return <p className="text-sm text-texto-2">Sem dados para este período.</p>;

  const r = p.resumo, en = p.entradas;
  const serie = d.posicaoSerie?.[modo];
  const entrou = en.clt + en.pj + en.outros;
  const fixos = p.fixos ?? [];
  const pagos = fixos.filter((f) => f.pago);
  const pendente = fixos.filter((f) => !f.pago).reduce((s, f) => s + f.valor, 0);
  const parcelas12 = d.parcelas.reduce((s, x) => s + x.valor, 0);
  const ultimaParcela = [...d.parcelas].reverse().find((x) => x.valor > 0);
  const livre = ultimaParcela ? d.parcelas[d.parcelas.indexOf(ultimaParcela) + 1]?.mes : d.parcelas[0]?.mes;
  const cats = p.categorias.filter((c) => c.atual > 0 || c.anterior > 0);
  const maxCat = Math.max(1, ...cats.map((c) => Math.max(c.atual, p.anteriorCompleto !== false ? c.anterior : 0)));
  const maior = cats[0];
  const custosPj = Object.entries(p.pj.custos);
  // os dados começam no meio de um período (histórico do Open Finance): comparar com um período incompleto engana
  const comparavel = p.anteriorCompleto !== false;
  const semBase = `os dados começam em ${(d.inicioDados ?? p.anteriorInicio).split("-").reverse().join("/")}`;
  const comparacao = p.emCurso ? `${anterior[modo]} (mesmos dias)` : anterior[modo];

  const cardClt = (
    <Cartao titulo={`${e.clt.nome} · ${p.rotulo}`} extra={<Marca empresa={e.clt} tamanho={18} />}>
      <dl className="flex flex-col gap-3 text-sm">
        {p.clt.itens.map((i) => (
          <div key={i.data + i.descricao} className="flex items-baseline justify-between gap-2">
            <dt className="text-texto-2">{i.descricao} <span className="text-xs">({diaMes(i.data)})</span></dt>
            <dd className="flex items-baseline gap-2">
              {i.situacao === "previsto" && <span className="rounded-md bg-primaria-suave px-1.5 py-0.5 text-[11px] text-primaria">previsto</span>}
              <span className={i.situacao === "recebido" ? "font-medium text-ok" : ""}>{reais(i.valor)}</span>
            </dd>
          </div>
        ))}
        {!p.clt.itens.length && <p className="text-texto-2">Nenhum pagamento no período.</p>}
        <div className="flex justify-between border-t border-borda pt-3">
          <dt className="text-texto-2">Total {doPeriodo[modo]}</dt>
          <dd className="font-medium">{reais(p.clt.recebido + p.clt.previsto)}</dd>
        </div>
      </dl>
    </Cartao>
  );
  const cardPj = (
    <Cartao titulo={`${e.pj.nome} · ${p.rotulo}`} extra={<Marca empresa={e.pj} tamanho={18} />}>
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between"><dt className="text-texto-2">Faturamento</dt><dd className="font-medium text-ok">{reais(p.pj.faturamento)}</dd></div>
        {custosPj.map(([c, v]) => (
          <div key={c} className="flex justify-between"><dt className="text-texto-2">{c}</dt><dd>− {reais(v)}</dd></div>
        ))}
        <div className="flex justify-between"><dt className="text-texto-2">Retiradas para a PF</dt><dd>− {reais(p.pj.retiradas)}</dd></div>
        <div className="flex justify-between border-t border-borda pt-3">
          <dt className="text-texto-2">Imposto e contador sobre o faturamento</dt>
          <dd className="font-medium">
            {p.pj.faturamento ? `${((custosPj.reduce((s, [, v]) => s + v, 0) / p.pj.faturamento) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—"}
          </dd>
        </div>
      </dl>
    </Cartao>
  );

  return (
    <div className="flex flex-col gap-3.5">
      {/* Seletor: tipo de período + qual período */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Tipo de período" className="flex rounded-xl border border-borda bg-superficie p-1">
          {(["semana", "mes", "ano"] as Modo[]).map((m) => (
            <button key={m} role="tab" aria-selected={modo === m} disabled={!periodos[m].length} onClick={() => trocarModo(m)}
              className={`min-h-9 rounded-lg px-3.5 text-sm transition-colors disabled:opacity-40 ${modo === m ? "bg-texto font-semibold text-fundo" : "text-texto-2 hover:text-texto"}`}>
              {NOMES[m]}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="periodo">Período</label>
        <select id="periodo" value={p.chave} onChange={(ev) => setChave(ev.target.value)}
          className="min-h-11 rounded-xl border border-borda bg-superficie px-3 text-sm text-texto outline-none focus-visible:ring-2 focus-visible:ring-primaria">
          {lista.map((x) => <option key={x.chave} value={x.chave}>{x.rotulo}{x.emCurso ? " (em curso)" : ""}</option>)}
        </select>
      </div>

      <div key={p.chave} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi titulo={titulo(modo, p)} valor={<Contador valor={r.despesas} formato="brl" />}
          detalhe={comparavel ? <>{comparacao}: {reaisCurto(r.despesasAnterior)}{" "}<Variacao atual={r.despesas} antes={r.despesasAnterior} melhorSobe={false} /></>
                                : <>Sem comparação: {semBase}</>} />
        <Kpi titulo={`Entrou ${doPeriodo[modo]}`} valor={<span className="text-ok"><Contador valor={entrou} formato="brl" /></span>}
          detalhe={<>{e.clt.nome} {reaisCurto(en.clt)} · {e.pj.nome} {reaisCurto(en.pj)}{en.outros > 0.5 && <> · outros {reaisCurto(en.outros)}</>}
            {p.clt.previsto > 0 && <><br />Previsto: {reaisCurto(p.clt.previsto)} ({e.clt.nome})</>}</>} />
        <Kpi titulo="Maior categoria" valor={<span className="font-sans font-semibold">{maior ? maior.nome : "—"}</span>}
          detalhe={maior ? <>{reais(maior.atual)} · {r.despesas ? Math.round((100 * maior.atual) / r.despesas) : 0}% do gasto {doPeriodo[modo]}</> : <>Sem gastos no período</>} />
        {modo === "mes" && (
          <Kpi titulo="Contas fixas" valor={<><Contador valor={pagos.length} /> de {fixos.length} <span className="font-sans text-sm text-texto-2">pagas</span></>}
            detalhe={<>Faltam {reaisCurto(pendente)} de {reaisCurto(fixos.reduce((s, f) => s + f.valor, 0))}</>}>
            <Barra pct={(pagos.length / Math.max(1, fixos.length)) * 100} cor="bg-alerta" />
          </Kpi>
        )}
        <Kpi titulo="Parcelas nos próximos 12 meses" valor={<Contador valor={parcelas12} formato="brl" />}
          detalhe={livre ? <>Livre de parcelas a partir de {mesCurto(livre)}</> : <>Parcelas em todos os 12 meses</>} />
      </div>

      <Fechamento p={p} modo={modo} entrou={entrou}
        competencia={modo === "mes" && p.emCurso && p.posicao && d.faturaAberta ? { fatura: d.faturaAberta, plano } : null} />

      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Cartao titulo="Gastos por categoria" extra={
            <div className="flex items-center gap-3 text-xs text-texto-2">
              <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-texto" />{p.rotulo}</span>
              {comparavel
                ? <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-barra" />{comparacao.toLowerCase()}</span>
                : <span>sem comparação: {semBase}</span>}
            </div>}>
            <p className="-mt-1 mb-3 text-xs text-texto-2">Passe o mouse, toque ou clique numa categoria para ver o resumo.</p>
            {!cats.length && <p className="text-sm text-texto-2">Nenhum gasto no período.</p>}
            <ul className="flex flex-col gap-2">
              {cats.map((c, idx) => {
                const creditos = (c.bruto ?? c.atual) - c.atual;
                return (
                  <li key={p.chave + c.nome} tabIndex={0} aria-describedby={`cat-${idx}`} role="button" aria-expanded={aberta === c.nome}
                    onClick={() => setAberta((x) => (x === c.nome ? null : c.nome))}
                    onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setAberta((x) => (x === c.nome ? null : c.nome)); } if (ev.key === "Escape") setAberta(null); }}
                    className="group relative cursor-pointer -mx-2 rounded-xl px-2 py-1.5 outline-none hover:bg-superficie-2 focus-visible:bg-superficie-2 focus-visible:ring-2 focus-visible:ring-primaria">
                    <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                      <span>{c.nome}</span>
                      <span className="flex items-baseline gap-2">
                        <b className="num font-medium">{reais(c.atual)}</b>
                        {comparavel && <Variacao atual={c.atual} antes={c.anterior} melhorSobe={false} />}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="encher h-2 rounded-full bg-texto" style={{ width: `${(c.atual / maxCat) * 100}%` }} />
                      {comparavel && <div className="encher h-2 rounded-full bg-barra" style={{ width: `${(c.anterior / maxCat) * 100}%` }} />}
                    </div>
                    <div id={`cat-${idx}`} role="tooltip"
                      className={`pointer-events-none absolute left-2 right-2 top-full z-40 mt-1 rounded-xl border border-borda bg-superficie p-3 text-xs shadow-lg sm:left-auto sm:w-72 ${aberta === c.nome ? "block" : "hidden group-hover:block"}`}>
                      <div className="mb-2 flex items-baseline justify-between">
                        <span className="font-semibold">{c.nome}</span>
                        <span className="num font-semibold">{reais(c.atual)}</span>
                      </div>
                      <dl className="mb-2 grid grid-cols-2 gap-x-3 gap-y-1 text-texto-2">
                        <dt>Lançamentos</dt><dd className="num text-right text-texto">{c.n ?? "—"}</dd>
                        <dt>Ticket médio</dt><dd className="num text-right text-texto">{c.n ? reais((c.bruto ?? c.atual) / c.n) : "—"}</dd>
                        <dt>Do gasto {doPeriodo[modo]}</dt><dd className="num text-right text-texto">{r.despesas ? `${Math.round((100 * c.atual) / r.despesas)}%` : "—"}</dd>
                        <dt>{anterior[modo]}</dt><dd className="num text-right text-texto">{reais(c.anterior)}</dd>
                        {creditos > 0.5 && <><dt>Créditos e estornos</dt><dd className="num text-right text-ok">− {reais(creditos)}</dd></>}
                      </dl>
                      {!!c.onde?.length && (
                        <>
                          <p className="mb-1 font-medium">Onde mais gastou</p>
                          <ul className="flex flex-col gap-1">
                            {c.onde.map((o) => (
                              <li key={o.nome} className="flex justify-between gap-3">
                                <span className="truncate">{o.nome}{o.n > 1 && <span className="text-texto-2"> · {o.n}x</span>}</span>
                                <span className="num shrink-0">{reais(o.valor)}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Cartao>
        </div>
        {modo === "mes" ? (
          <Cartao titulo={`Contas fixas de ${p.rotulo}`}>
            <ul className="divide-y divide-borda text-sm">
              {[...fixos].sort((a, b) => Number(a.pago) - Number(b.pago) || a.dia - b.dia).map((f) => (
                <li key={f.nome} className="flex min-h-11 items-center gap-2.5">
                  <span className="num w-11 text-xs text-texto-2">dia {f.dia}</span>
                  <span className="min-w-0 flex-1 truncate">{f.nome}</span>
                  <span className="num text-[13px]">{reais(f.valor)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${f.pago ? "bg-ok-suave text-ok" : "bg-alerta-suave text-alerta"}`}>{f.pago ? "Pago" : "A vencer"}</span>
                </li>
              ))}
            </ul>
          </Cartao>
        ) : (
          <div className="flex flex-col gap-3.5">{cardClt}{cardPj}</div>
        )}
      </div>

      {serie && serie.length > 1 && (
        <Secao titulo={`Posição real ${porModo[modo]}`} resumo={`contas + investimentos − cartão − empréstimos, no fim de cada ${unidade[modo]}`}>
          <GraficoPosicao dados={serie} destaque={p.ate} />
        </Secao>
      )}

      <Secao titulo="Parcelas já assumidas, por mês" resumo={<>{reais(parcelas12)} nos próximos 12 meses · toque num mês para ver as compras</>}>
        <GraficoParcelas dados={d.parcelas.map((x) => ({ rotulo: mesCurto(x.mes), valor: x.valor, itens: x.itens ?? [] }))} />
      </Secao>

      {modo === "mes" && (
        <Secao titulo={`${e.clt.nome} e ${e.pj.nome} em ${p.rotulo}`} resumo={`entrou ${reaisCurto(en.clt)} e ${reaisCurto(en.pj)}`}>
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">{cardClt}{cardPj}</div>
        </Secao>
      )}

      {d.cicloCartao && d.cicloCartao.teto !== null && d.cicloCartao.status !== null && (
        <Secao titulo="Cartão de crédito: quanto ainda cabe na fatura" resumo={`fecha ${diaMes(d.cicloCartao.fechamento)} · vence ${diaMes(d.cicloCartao.vencimento)}`}>
          <AvisoCartao c={d.cicloCartao} />
        </Secao>
      )}
    </div>
  );
}


// Como o período fechou: resultado (entrou − gastou) e, quando houve, de onde veio a diferença.
const porModo: Record<Modo, string> = { semana: "semana a semana", mes: "mês a mês", ano: "ano a ano" };
const unidade: Record<Modo, string> = { semana: "semana", mes: "mês", ano: "ano" };

type Competencia = { fatura: NonNullable<Detalhe["faturaAberta"]>; plano: Painel["financas"]["plano"] };

function Fechamento({ p, modo, entrou, competencia }: { p: Periodo; modo: Modo; entrou: number; competencia: Competencia | null }) {
  const r = p.resumo, en = p.entradas, c = p.cobertura;
  const resultado = entrou - r.despesas - en.custosPj;
  const negativo = resultado < 0;
  const linhas = c ? [
    { nome: modo === "mes" ? "Ficou no rotativo do cartão" : "Ficou no rotativo do cartão (soma das faturas)", valor: c.rotativo },
    { nome: "Pix no crédito para você", valor: c.pixCredito },
    { nome: "Resgate líquido de aplicações", valor: c.resgates },
  ].filter((l) => l.valor > 0.5) : [];
  const nome = modo === "semana" ? "a semana" : modo === "mes" ? "o mês" : "o ano";
  const a = p.ajustes;
  const ajustes = a ? [
    { nome: "Compras parceladas (total − parcelas do período)", valor: a.parcelado ?? 0 },
    { nome: "De/para contas suas fora do app", valor: a.contasFora },
    { nome: "Pix no crédito (limite do cartão)", valor: a.custoPixCredito },
    { nome: "Empréstimo (juros e encargos)", valor: a.emprestimos },
    { nome: "Aplicações (resgate − aplicação)", valor: a.aplicacoes },
    { nome: "Outras transferências", valor: a.outrasTransferencias },
    { nome: "Não explicado", valor: a.naoExplicado },
  ].filter((l) => Math.abs(l.valor) >= 0.5) : [];
  const variacao = p.posicao ? p.posicao.fim.posicao - p.posicao.inicio.posicao : null;
  return (
    <Cartao titulo={`Como ${nome} fechou${p.emCurso ? " até agora" : ""}`}>
      {/* mês em curso: só o que é deste mês (contas no último dia − fatura em aberto); a posição total, com as
          próximas faturas, fica para os períodos fechados */}
      {competencia ? <CompetenciaMes p={p} {...competencia} /> : p.posicao && (
        <>
          <PosicaoReal ini={p.posicao.inicio} fim={p.posicao.fim} emCurso={p.emCurso} />
          <Cascata ini={p.posicao.inicio.posicao} entrou={entrou} gastou={r.despesas} custosPj={en.custosPj} fim={p.posicao.fim.posicao} />
        </>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><dt className="text-texto-2">Entrou</dt><dd className="text-ok">{reais(entrou)}</dd></div>
          <div className="flex justify-between"><dt className="text-texto-2">Gastou</dt><dd>− {reais(r.despesas)}</dd></div>
          {en.custosPj > 0.5 && <div className="flex justify-between"><dt className="text-texto-2">Custos da PJ</dt><dd>− {reais(en.custosPj)}</dd></div>}
          <div className="flex justify-between border-t border-borda pt-2 text-base">
            <dt className="font-medium">Resultado</dt>
            <dd className={`font-semibold ${negativo ? "text-perigo" : "text-ok"}`}>{negativo ? "− " : ""}{reais(Math.abs(resultado))}</dd>
          </div>
          {!competencia && ajustes.length > 0 && (
            <>
              <p className="pt-1 text-xs text-texto-2">Fora do resultado (não é receita nem gasto, mas mexe na posição):</p>
              {ajustes.map((l) => (
                <div key={l.nome} className="flex justify-between gap-3">
                  <dt className="text-texto-2">{l.nome}</dt>
                  <dd className={l.valor < 0 ? "" : "text-ok"}>{l.valor < 0 ? "− " : "+ "}{reais(Math.abs(l.valor))}</dd>
                </div>
              ))}
            </>
          )}
          {!competencia && variacao !== null && (
            <div className="flex justify-between border-t border-borda pt-2 text-base">
              <dt className="font-medium">Variação da posição real</dt>
              <dd className={`font-semibold ${variacao < 0 ? "text-perigo" : "text-ok"}`}>{variacao < 0 ? "− " : "+ "}{reais(Math.abs(variacao))}</dd>
            </div>
          )}
          <p className="text-xs text-texto-2">
            {negativo ? "Gastou mais do que entrou no período: a diferença virou dívida ou saiu do que você tinha." : "Entrou mais do que saiu no período."} Compras no cartão contam na data da compra.
          </p>
        </dl>
        <div className="text-sm">
          {linhas.length ? (
            <>
              <p className="mb-2 font-medium">{negativo ? "De onde veio a diferença" : "Mesmo assim, ficou para depois"}</p>
              <dl className="flex flex-col gap-2">
                {linhas.map((l) => (
                  <div key={l.nome} className="flex justify-between gap-3"><dt className="text-texto-2">{l.nome}</dt><dd className="text-alerta">{reais(l.valor)}</dd></div>
                ))}
                {c && c.jurosRotativo > 0.5 && (
                  <div className="flex justify-between gap-3 border-t border-borda pt-2"><dt className="text-texto-2">Juros e IOF do rotativo</dt><dd className="text-perigo">{reais(c.jurosRotativo)}</dd></div>
                )}
              </dl>
            </>
          ) : (
            <p className="text-texto-2">Sem rotativo, Pix no crédito ou resgate no período.
              {c && c.jurosRotativo > 0.5 && <> Juros e IOF do rotativo de antes: <b className="text-perigo">{reais(c.jurosRotativo)}</b>.</>}</p>
          )}
        </div>
      </div>
    </Cartao>
  );
}

export function composicao(x: Posicao) {
  const partes = [`${reais(x.contas)} nas contas`];
  if ((x.investimentos ?? 0) >= 0.5) partes.push(`+ ${reais(x.investimentos!)} investidos`);
  partes.push(`− ${reais(x.cartao)} no cartão`);
  if ((x.emprestimos ?? 0) >= 0.5) partes.push(`− ${reais(x.emprestimos!)} de empréstimo`);
  return partes.join(" ");
}

// O que você tem menos o que deve (cartão e empréstimos): o acumulado. O resultado do período é o quanto isso mudou.
// O fechamento do mês em curso por competência: o dinheiro nas contas no último dia (saldo de hoje mais o que o
// plano ainda prevê no mês) menos o que fica em aberto da fatura fechada. Parcelas das próximas faturas e compras
// depois do fechamento não são deste mês: aparecem só como aviso. Pagamento de cartão previsto no plano não entra
// como saída (ele já reduz a fatura em aberto quando acontece).
const DO_CARTAO = /cart[aã]o|fatura/i;
function CompetenciaMes({ p, fatura, plano }: { p: Periodo } & Competencia) {
  const fim = p.posicao!.fim, invest = fim.investimentos ?? 0;
  const previstos = plano.filter((i) => i.status !== "feito" && i.data >= p.inicio && i.data <= p.fim && !DO_CARTAO.test(i.descricao))
    .sort((a, b) => (a.data < b.data ? -1 : 1));
  const contas = fim.contas + previstos.reduce((t, i) => t + (i.entra ?? 0) - (i.sai ?? 0), 0) + invest;
  const fechamento = contas - fatura.aberto;
  const proximas = Math.max(0, fim.cartao - fatura.aberto);
  const deAntes = (fatura.rotativo ?? 0) + (fatura.encargos ?? 0);
  const sinal = (v: number) => `${v < 0 ? "− " : ""}${reais(Math.abs(v))}`;
  const dm = (iso: string) => iso.slice(8, 10) + "/" + iso.slice(5, 7);
  const Linha = ({ nome, valor, forte = false }: { nome: string; valor: number; forte?: boolean }) => (
    <div className={`flex justify-between gap-3 ${forte ? "border-t border-borda pt-2 font-medium" : ""}`}>
      <dt className={forte ? "" : "text-texto-2"}>{nome}</dt>
      <dd className={`num ${forte && valor < 0 ? "text-perigo" : ""}`}>{sinal(valor)}</dd>
    </div>
  );
  return (
    <div className="mb-4 flex flex-col gap-4 border-b border-borda pb-4">
      <div>
        <p className="text-xs text-texto-2">Fechamento de {p.rotulo} no último dia do mês, contando só o que é deste mês</p>
        <p className={`num text-3xl font-medium ${fechamento < 0 ? "text-perigo" : "text-ok"}`}>{sinal(fechamento)}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 text-sm lg:grid-cols-2">
        <dl className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-texto-2">1. Dinheiro nas contas em {dm(p.fim)}</p>
          <Linha nome="Saldo hoje (todas as contas)" valor={fim.contas} />
          {previstos.map((i) => <Linha key={i.data + i.descricao} nome={`${dm(i.data)} · ${i.descricao}`} valor={(i.entra ?? 0) - (i.sai ?? 0)} />)}
          {invest > 0.5 && <Linha nome="Investimentos" valor={invest} />}
          <Linha nome="Fica nas contas" valor={contas} forte />
        </dl>
        <dl className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-texto-2">2. Fatura fechada em {dm(fatura.fechamento)} (vence {dm(fatura.vencimento)})</p>
          {deAntes > 0.5 && <>
            <Linha nome="Veio de antes: saldo em rotativo" valor={fatura.rotativo ?? 0} />
            <Linha nome="Veio de antes: juros, IOF e encerramento" valor={fatura.encargos ?? 0} />
            <Linha nome="Compras do ciclo" valor={fatura.compras ?? 0} />
          </>}
          <Linha nome="Total da fatura" valor={fatura.total} forte={deAntes > 0.5} />
          <Linha nome="Já pago depois do fechamento" valor={-fatura.pago} />
          <Linha nome="Fica em aberto" valor={fatura.aberto} forte />
          <div className="mt-2 flex justify-between gap-3 border-t border-borda pt-2 text-base font-semibold">
            <dt>Fechamento</dt><dd className={`num ${fechamento < 0 ? "text-perigo" : "text-ok"}`}>{sinal(fechamento)}</dd>
          </div>
        </dl>
      </div>
      {deAntes > 0.5 && (
        <p className="rounded-xl bg-alerta-suave px-3 py-2 text-sm text-alerta">
          O negativo vem de antes: a fatura de {p.rotulo} trouxe {reais(deAntes)} de dívida anterior (rotativo, juros e IOF).
          {fatura.pago > 0.5 ? ` Em ${p.rotulo} você pagou ${reais(fatura.pago)} da fatura` : " Nada foi pago ainda"} e sobram {reais(fatura.aberto)}.
        </p>
      )}
      {proximas > 0.5 && (
        <p className="mt-4 text-xs text-texto-2">
          Fora deste mês: {reais(proximas)} já estão nas próximas faturas (parcelas seguintes e compras depois do fechamento).
        </p>
      )}
    </div>
  );
}

function PosicaoReal({ ini, fim, emCurso }: { ini: Posicao; fim: Posicao; emCurso: boolean }) {
  const delta = fim.posicao - ini.posicao;
  const sinal = (v: number) => `${v < 0 ? "− " : ""}${reais(Math.abs(v))}`;
  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-borda pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs text-texto-2">Posição real {emCurso ? "hoje" : "no fim do período"} · tudo o que você deve, próximas faturas incluídas</p>
        <p className={`num text-3xl font-medium ${fim.posicao < 0 ? "text-perigo" : ""}`}>{sinal(fim.posicao)}</p>
        <p className="text-xs text-texto-2">{composicao(fim)}</p>
      </div>
      <div className="text-sm sm:text-right">
        <p className="text-texto-2">No início: {sinal(ini.posicao)}</p>
        <p className={delta < 0 ? "text-perigo" : "text-ok"}>
          {delta < 0 ? "Afundou " : "Melhorou "}{reais(Math.abs(delta))} no período
        </p>
      </div>
    </div>
  );
}

// A posição do período em cascata: início → entrou → gastou → custos da PJ → (o que mexeu fora do resultado) → fim.
// A escala começa perto do menor ponto para as diferenças aparecerem; o texto embaixo diz de onde ela parte.
function Cascata({ ini, entrou, gastou, custosPj, fim }: { ini: number; entrou: number; gastou: number; custosPj: number; fim: number }) {
  const aposEntrar = ini + entrou, aposGastar = aposEntrar - gastou, aposCustos = aposGastar - custosPj;
  const fora = fim - aposCustos;
  const pontos = [0, ini, aposEntrar, aposGastar, aposCustos, fim];
  const topo = Math.max(...pontos), baixo = Math.min(...pontos);
  const minPos = Math.min(ini, aposGastar, aposCustos, fim);
  const base = baixo < 0 ? baixo : Math.floor((minPos * 0.92) / 1000) * 1000;
  const faixa = Math.max(1, topo - base);
  const barra = (de: number, ate: number) => {
    const a = Math.max(Math.min(de, ate), base), b = Math.max(de, ate);
    return { left: `${((a - base) / faixa) * 100}%`, width: `${Math.max(0.4, ((b - a) / faixa) * 100)}%` };
  };
  const linhas = [
    { nome: "Início", valor: reais(ini), cor: "bg-texto-2", ...barra(Math.min(0, ini), ini) },
    { nome: "Entrou", valor: `+ ${reais(entrou)}`, cor: "bg-ok", ...barra(ini, aposEntrar) },
    { nome: "Gastou", valor: `− ${reais(gastou)}`, cor: "bg-alerta", ...barra(aposGastar, aposEntrar) },
    ...(custosPj > 0.5 ? [{ nome: "Custos da PJ", valor: `− ${reais(custosPj)}`, cor: "bg-alerta", ...barra(aposCustos, aposGastar) }] : []),
    ...(Math.abs(fora) >= 0.5 ? [{ nome: "Fora do resultado", valor: `${fora < 0 ? "−" : "+"} ${reais(Math.abs(fora))}`, cor: "bg-barra-2", ...barra(aposCustos, fim) }] : []),
    { nome: "Fim", valor: reais(fim), cor: fim < 0 ? "bg-perigo" : "bg-texto", ...barra(Math.min(0, fim), fim) },
  ];
  return (
    <div className="mb-4 flex flex-col gap-1.5 border-b border-borda pb-4">
      {linhas.map((l) => (
        <div key={l.nome} className="grid grid-cols-[7rem_minmax(0,1fr)_7.5rem] items-center gap-3 text-[13px] sm:grid-cols-[8rem_minmax(0,1fr)_8.5rem]">
          <span className="text-texto-2">{l.nome}</span>
          <span className="relative h-4 rounded bg-superficie-2"><span className={`absolute inset-y-0 rounded ${l.cor}`} style={{ left: l.left, width: l.width }} /></span>
          <span className="num text-right">{l.valor}</span>
        </div>
      ))}
      <p className="mt-1 text-xs text-texto-2">Escala a partir de {reaisCurto(base)}.</p>
    </div>
  );
}
