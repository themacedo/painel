import { CheckCircle2, Circle, CreditCard, Landmark, Receipt, TrendingDown } from "lucide-react";
import { Cartao, Moldura } from "@/components/Moldura";
import { Barra, Kpi } from "@/components/Kpi";
import { GraficoParcelas } from "@/components/GraficoParcelas";
import { Marca } from "@/components/Marca";
import { Contador } from "@/components/Contador";
import { Variacao } from "@/components/Variacao";
import { carregarPainel, modo } from "@/lib/dados";
import { diaMes, reais, reaisCurto } from "@/lib/formato";

export const dynamic = "force-dynamic";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesCurto = (ym: string) => `${MESES[Number(ym.slice(5, 7)) - 1]}/${ym.slice(2, 4)}`;

export default async function Financas() {
  const p = await carregarPainel();
  const d = p.financas.detalhe;
  const moldura = { ativa: "financas" as const, titulo: "Finanças", modo, dono: p.dono, atualizadoEm: p.atualizadoEm };
  if (!d) {
    return <Moldura {...moldura}><p className="text-sm text-texto-2">Ainda sem detalhamento: o próximo sync gera estes dados.</p></Moldura>;
  }

  const r = d.resumo;
  const pagos = d.fixos.filter((f) => f.pago);
  const pendente = d.fixos.filter((f) => !f.pago).reduce((s, f) => s + f.valor, 0);
  const totalFixos = d.fixos.reduce((s, f) => s + f.valor, 0);
  const parcelas12 = d.parcelas.reduce((s, x) => s + x.valor, 0);
  const ultimaParcela = [...d.parcelas].reverse().find((x) => x.valor > 0);
  const livre = ultimaParcela ? d.parcelas[d.parcelas.indexOf(ultimaParcela) + 1]?.mes : d.parcelas[0]?.mes;
  const maxCat = Math.max(1, ...d.categorias.map((c) => Math.max(c.atual, c.anterior)));
  const custosPj = Object.entries(d.pj.custos);
  const e = p.empresas;

  return (
    <Moldura {...moldura}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi titulo={`Gasto em ${mesCurto(d.mes)} até ${diaMes(d.ate)}`} valor={<Contador valor={r.despesas} formato="brl" />} icone={TrendingDown} cor="bg-primaria"
          detalhe={<>Mesmo período do mês anterior: {reaisCurto(r.despesasAnteriorMesmoPeriodo)}{" "}
            <Variacao atual={r.despesas} antes={r.despesasAnteriorMesmoPeriodo} melhorSobe={false} /></>} />
        <Kpi titulo="Entrou no mês" valor={<Contador valor={r.receitas} formato="brl" />} icone={Landmark} cor="bg-ok"
          detalhe={<>Saldo do mês até agora: {reaisCurto(r.receitas - r.despesas)}</>} />
        <Kpi titulo="Contas fixas" valor={<><Contador valor={pagos.length} /> de {d.fixos.length} pagas</>} icone={Receipt} cor="bg-alerta"
          detalhe={<>Faltam {reaisCurto(pendente)} de {reaisCurto(totalFixos)}</>}>
          <Barra pct={(pagos.length / Math.max(1, d.fixos.length)) * 100} cor="bg-alerta" />
        </Kpi>
        <Kpi titulo="Parcelas nos próximos 12 meses" valor={<Contador valor={parcelas12} formato="brl" />} icone={CreditCard} cor="bg-[#8b5cf6]"
          detalhe={livre ? <>Livre de parcelas a partir de {mesCurto(livre)}</> : <>Parcelas em todos os 12 meses</>} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Cartao titulo="Gastos por categoria" extra={
            <div className="flex items-center gap-3 text-xs text-texto-2">
              <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-primaria" />até {diaMes(d.ate)}</span>
              <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-[var(--barra)]" />até {diaMes(d.anteriorAte)}</span>
            </div>}>
            <p className="-mt-1 mb-3 text-xs text-texto-2">Passe o mouse ou toque numa categoria para ver o resumo.</p>
            <ul className="flex flex-col gap-3">
              {d.categorias.filter((c) => c.atual > 0 || c.anterior > 0).map((c, idx) => {
                const creditos = (c.bruto ?? c.atual) - c.atual;
                return (
                  <li key={c.nome} tabIndex={0} aria-describedby={`cat-${idx}`}
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
                    {/* card do resumo: aparece ao passar o mouse ou ao focar (toque/teclado) */}
                    <div id={`cat-${idx}`} role="tooltip"
                      className="pointer-events-none absolute left-2 right-2 top-full z-20 mt-1 hidden rounded-lg border border-borda bg-superficie p-3 text-xs shadow-lg group-hover:block group-focus:block sm:left-auto sm:w-72">
                      <div className="mb-2 flex items-baseline justify-between">
                        <span className="font-semibold">{c.nome}</span>
                        <span className="font-semibold">{reais(c.atual)}</span>
                      </div>
                      <dl className="mb-2 grid grid-cols-2 gap-x-3 gap-y-1 text-texto-2">
                        <dt>Lançamentos</dt><dd className="text-right text-texto">{c.n ?? "—"}</dd>
                        <dt>Ticket médio</dt><dd className="text-right text-texto">{c.n ? reais((c.bruto ?? c.atual) / c.n) : "—"}</dd>
                        <dt>Do gasto do mês</dt><dd className="text-right text-texto">{r.despesas ? `${Math.round((100 * c.atual) / r.despesas)}%` : "—"}</dd>
                        <dt>Até {diaMes(d.anteriorAte)}</dt><dd className="text-right text-texto">{reais(c.anterior)}</dd>
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
        <Cartao titulo={`Contas fixas de ${mesCurto(d.mes)}`}>
          <ul className="divide-y divide-borda text-sm">
            {[...d.fixos].sort((a, b) => Number(a.pago) - Number(b.pago) || a.dia - b.dia).map((f) => (
              <li key={f.nome} className="flex items-center gap-2.5 py-2">
                {f.pago ? <CheckCircle2 size={16} className="shrink-0 text-ok" /> : <Circle size={16} className="shrink-0 text-alerta" />}
                <span className="min-w-0 flex-1 truncate">{f.nome}</span>
                <span className="text-xs text-texto-2">dia {f.dia}</span>
                <span className="w-24 text-right">{reais(f.valor)}</span>
              </li>
            ))}
          </ul>
        </Cartao>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Cartao titulo="Parcelas já assumidas, por mês" extra={<span className="text-xs text-texto-2">passe o mouse ou toque num mês para ver as compras</span>}>
            <GraficoParcelas dados={d.parcelas.map((x) => ({ rotulo: mesCurto(x.mes), valor: x.valor, itens: x.itens ?? [] }))} />
          </Cartao>
        </div>
        <Cartao titulo={`PJ em ${mesCurto(d.mes)}`} extra={<Marca empresa={e.pj} tamanho={18} />}>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between"><dt className="text-texto-2">Faturamento</dt><dd className="font-medium text-ok">{reais(d.pj.faturamento)}</dd></div>
            {custosPj.map(([c, v]) => (
              <div key={c} className="flex justify-between"><dt className="text-texto-2">{c}</dt><dd>− {reais(v)}</dd></div>
            ))}
            <div className="flex justify-between"><dt className="text-texto-2">Retiradas para a PF</dt><dd>− {reais(d.pj.retiradas)}</dd></div>
            <div className="flex justify-between border-t border-borda pt-3">
              <dt className="text-texto-2">Imposto e contador sobre o faturamento</dt>
              <dd className="font-medium">
                {d.pj.faturamento ? `${((custosPj.reduce((s, [, v]) => s + v, 0) / d.pj.faturamento) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—"}
              </dd>
            </div>
          </dl>
        </Cartao>
      </div>
    </Moldura>
  );
}
