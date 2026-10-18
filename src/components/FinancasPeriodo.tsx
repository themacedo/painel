"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, CreditCard, Landmark, PieChart, Receipt, TrendingDown } from "lucide-react";
import { Cartao } from "@/components/Moldura";
import { Barra, Kpi } from "@/components/Kpi";
import { GraficoParcelas } from "@/components/GraficoParcelas";
import { GraficoPosicao } from "@/components/GraficoPosicao";
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

export function FinancasPeriodo({ d, empresas: e }: { d: Detalhe; empresas: Painel["empresas"] }) {
  const periodos = useMemo(() => d.periodos ?? { semana: [], mes: [periodoDoMes(d)], ano: [] }, [d]);
  const [modo, setModo] = useState<Modo>("mes");
  const [chave, setChave] = useState<string>(periodos.mes[0]?.chave ?? "");
  const lista = periodos[modo];
  const p = lista.find((x) => x.chave === chave) ?? lista[0];

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
  const maxCat = Math.max(1, ...cats.map((c) => Math.max(c.atual, c.anterior)));
  const maior = cats[0];
  const custosPj = Object.entries(p.pj.custos);
  const comparacao = p.emCurso ? `${anterior[modo]} (mesmos dias)` : anterior[modo];

  const cardClt = (
    <Cartao titulo={`CLT · ${p.rotulo}`} extra={<Marca empresa={e.clt} tamanho={18} />}>
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
    <Cartao titulo={`PJ · ${p.rotulo}`} extra={<Marca empresa={e.pj} tamanho={18} />}>
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
    <>
      {/* Seletor: tipo de período + qual período */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Tipo de período" className="flex rounded-lg border border-borda bg-superficie p-0.5">
          {(["semana", "mes", "ano"] as Modo[]).map((m) => (
            <button key={m} role="tab" aria-selected={modo === m} disabled={!periodos[m].length} onClick={() => trocarModo(m)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors disabled:opacity-40 ${modo === m ? "bg-primaria-suave font-medium text-primaria" : "text-texto-2 hover:text-texto"}`}>
              {NOMES[m]}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="periodo">Período</label>
        <select id="periodo" value={p.chave} onChange={(ev) => setChave(ev.target.value)}
          className="rounded-lg border border-borda bg-superficie px-3 py-2 text-sm text-texto outline-none focus-visible:ring-2 focus-visible:ring-primaria">
          {lista.map((x) => <option key={x.chave} value={x.chave}>{x.rotulo}{x.emCurso ? " (em curso)" : ""}</option>)}
        </select>
      </div>

      <div key={p.chave} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi titulo={titulo(modo, p)} valor={<Contador valor={r.despesas} formato="brl" />} icone={TrendingDown} cor="bg-primaria"
          detalhe={<>{comparacao}: {reaisCurto(r.despesasAnterior)}{" "}<Variacao atual={r.despesas} antes={r.despesasAnterior} melhorSobe={false} /></>} />
        <Kpi titulo={`Entrou ${doPeriodo[modo]}`} valor={<Contador valor={entrou} formato="brl" />} icone={Landmark} cor="bg-ok"
          detalhe={<>{e.clt.nome} {reaisCurto(en.clt)} · {e.pj.nome} {reaisCurto(en.pj)}{en.outros > 0.5 && <> · outros {reaisCurto(en.outros)}</>}
            {p.clt.previsto > 0 && <><br />Previsto: {reaisCurto(p.clt.previsto)} ({e.clt.nome})</>}</>} />
        {modo === "mes" ? (
          <Kpi titulo="Contas fixas" valor={<><Contador valor={pagos.length} /> de {fixos.length} pagas</>} icone={Receipt} cor="bg-alerta"
            detalhe={<>Faltam {reaisCurto(pendente)} de {reaisCurto(fixos.reduce((s, f) => s + f.valor, 0))}</>}>
            <Barra pct={(pagos.length / Math.max(1, fixos.length)) * 100} cor="bg-alerta" />
          </Kpi>
        ) : (
          <Kpi titulo="Maior categoria" valor={maior ? maior.nome : "—"} icone={PieChart} cor="bg-alerta"
            detalhe={maior ? <>{reais(maior.atual)} · {r.despesas ? Math.round((100 * maior.atual) / r.despesas) : 0}% do gasto {doPeriodo[modo]}</> : <>Sem gastos no período</>} />
        )}
        <Kpi titulo="Parcelas nos próximos 12 meses" valor={<Contador valor={parcelas12} formato="brl" />} icone={CreditCard} cor="bg-[#8b5cf6]"
          detalhe={livre ? <>Livre de parcelas a partir de {mesCurto(livre)}</> : <>Parcelas em todos os 12 meses</>} />
      </div>

      <div className="mt-3">
        <Fechamento p={p} modo={modo} entrou={entrou} />
      </div>

      {serie && serie.length > 1 && (
        <div className="mt-3">
          <Cartao titulo={`Posição real ${porModo[modo]}`} extra={<span className="text-xs text-texto-2">contas + investimentos − cartão − empréstimos, no fim de cada {unidade[modo]}</span>}>
            <GraficoPosicao dados={serie} destaque={p.ate} />
          </Cartao>
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Cartao titulo="Gastos por categoria" extra={
            <div className="flex items-center gap-3 text-xs text-texto-2">
              <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-primaria" />{p.rotulo}</span>
              <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-[var(--barra)]" />{comparacao.toLowerCase()}</span>
            </div>}>
            <p className="-mt-1 mb-3 text-xs text-texto-2">Passe o mouse ou toque numa categoria para ver o resumo.</p>
            {!cats.length && <p className="text-sm text-texto-2">Nenhum gasto no período.</p>}
            <ul className="flex flex-col gap-3">
              {cats.map((c, idx) => {
                const creditos = (c.bruto ?? c.atual) - c.atual;
                return (
                  <li key={p.chave + c.nome} tabIndex={0} aria-describedby={`cat-${idx}`}
                    className="group relative -mx-2 rounded-lg px-2 py-1 outline-none hover:bg-fundo focus-visible:bg-fundo focus-visible:ring-2 focus-visible:ring-primaria">
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span>{c.nome}</span>
                      <span className="flex items-baseline gap-2">
                        <b className="font-medium">{reais(c.atual)}</b>
                        <Variacao atual={c.atual} antes={c.anterior} melhorSobe={false} />
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="encher h-1.5 rounded-full bg-primaria" style={{ width: `${(c.atual / maxCat) * 100}%` }} />
                      <div className="encher h-1.5 rounded-full bg-[var(--barra)]" style={{ width: `${(c.anterior / maxCat) * 100}%` }} />
                    </div>
                    <div id={`cat-${idx}`} role="tooltip"
                      className="pointer-events-none absolute left-2 right-2 top-full z-20 mt-1 hidden rounded-lg border border-borda bg-superficie p-3 text-xs shadow-lg group-hover:block group-focus:block sm:left-auto sm:w-72">
                      <div className="mb-2 flex items-baseline justify-between">
                        <span className="font-semibold">{c.nome}</span>
                        <span className="font-semibold">{reais(c.atual)}</span>
                      </div>
                      <dl className="mb-2 grid grid-cols-2 gap-x-3 gap-y-1 text-texto-2">
                        <dt>Lançamentos</dt><dd className="text-right text-texto">{c.n ?? "—"}</dd>
                        <dt>Ticket médio</dt><dd className="text-right text-texto">{c.n ? reais((c.bruto ?? c.atual) / c.n) : "—"}</dd>
                        <dt>Do gasto {doPeriodo[modo]}</dt><dd className="text-right text-texto">{r.despesas ? `${Math.round((100 * c.atual) / r.despesas)}%` : "—"}</dd>
                        <dt>{anterior[modo]}</dt><dd className="text-right text-texto">{reais(c.anterior)}</dd>
                        {creditos > 0.5 && <><dt>Créditos e estornos</dt><dd className="text-right text-ok">− {reais(creditos)}</dd></>}
                      </dl>
                      {!!c.onde?.length && (
                        <>
                          <p className="mb-1 font-medium">Onde mais gastou</p>
                          <ul className="flex flex-col gap-1">
                            {c.onde.map((o) => (
                              <li key={o.nome} className="flex justify-between gap-3">
                                <span className="truncate">{o.nome}{o.n > 1 && <span className="text-texto-2"> · {o.n}x</span>}</span>
                                <span className="shrink-0">{reais(o.valor)}</span>
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
                <li key={f.nome} className="flex items-center gap-2.5 py-2">
                  {f.pago ? <CheckCircle2 size={16} className="shrink-0 text-ok" /> : <Circle size={16} className="shrink-0 text-alerta" />}
                  <span className="min-w-0 flex-1 truncate">{f.nome}</span>
                  <span className="text-xs text-texto-2">dia {f.dia}</span>
                  <span className="w-24 text-right">{reais(f.valor)}</span>
                </li>
              ))}
            </ul>
          </Cartao>
        ) : (
          <div className="flex flex-col gap-3">{cardClt}{cardPj}</div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className={modo === "mes" ? "xl:col-span-2" : "xl:col-span-3"}>
          <Cartao titulo="Parcelas já assumidas, por mês" extra={<span className="text-xs text-texto-2">passe o mouse ou toque num mês para ver as compras</span>}>
            <GraficoParcelas dados={d.parcelas.map((x) => ({ rotulo: mesCurto(x.mes), valor: x.valor, itens: x.itens ?? [] }))} />
          </Cartao>
        </div>
        {modo === "mes" && <div className="flex flex-col gap-3">{cardClt}{cardPj}</div>}
      </div>
    </>
  );
}


// Como o período fechou: resultado (entrou − gastou) e, quando houve, de onde veio a diferença.
const porModo: Record<Modo, string> = { semana: "semana a semana", mes: "mês a mês", ano: "ano a ano" };
const unidade: Record<Modo, string> = { semana: "semana", mes: "mês", ano: "ano" };

function Fechamento({ p, modo, entrou }: { p: Periodo; modo: Modo; entrou: number }) {
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
      {p.posicao && <PosicaoReal ini={p.posicao.inicio} fim={p.posicao.fim} emCurso={p.emCurso} />}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><dt className="text-texto-2">Entrou</dt><dd className="text-ok">{reais(entrou)}</dd></div>
          <div className="flex justify-between"><dt className="text-texto-2">Gastou</dt><dd>− {reais(r.despesas)}</dd></div>
          {en.custosPj > 0.5 && <div className="flex justify-between"><dt className="text-texto-2">Custos da PJ</dt><dd>− {reais(en.custosPj)}</dd></div>}
          <div className="flex justify-between border-t border-borda pt-2 text-base">
            <dt className="font-medium">Resultado</dt>
            <dd className={`font-semibold ${negativo ? "text-perigo" : "text-ok"}`}>{negativo ? "− " : ""}{reais(Math.abs(resultado))}</dd>
          </div>
          {ajustes.length > 0 && (
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
          {variacao !== null && (
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
function PosicaoReal({ ini, fim, emCurso }: { ini: Posicao; fim: Posicao; emCurso: boolean }) {
  const delta = fim.posicao - ini.posicao;
  const sinal = (v: number) => `${v < 0 ? "− " : ""}${reais(Math.abs(v))}`;
  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-borda pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs text-texto-2">Posição real {emCurso ? "hoje" : "no fim do período"}</p>
        <p className={`text-2xl font-semibold ${fim.posicao < 0 ? "text-perigo" : "text-ok"}`}>{sinal(fim.posicao)}</p>
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
