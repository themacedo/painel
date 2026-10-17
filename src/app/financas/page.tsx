import { CheckCircle2, Circle, CreditCard, Landmark, Receipt, TrendingDown } from "lucide-react";
import { Cartao, Moldura } from "@/components/Moldura";
import { Barra, Kpi } from "@/components/Kpi";
import { GraficoParcelas } from "@/components/GraficoParcelas";
import { Marca } from "@/components/Marca";
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
        <Kpi titulo={`Gasto em ${mesCurto(d.mes)} até ${diaMes(d.ate)}`} valor={reais(r.despesas)} icone={TrendingDown} cor="bg-primaria"
          detalhe={<>Mesmo período do mês anterior: {reaisCurto(r.despesasAnteriorMesmoPeriodo)}{" "}
            <Variacao atual={r.despesas} antes={r.despesasAnteriorMesmoPeriodo} melhorSobe={false} /></>} />
        <Kpi titulo="Entrou no mês" valor={reais(r.receitas)} icone={Landmark} cor="bg-ok"
          detalhe={<>Saldo do mês até agora: {reaisCurto(r.receitas - r.despesas)}</>} />
        <Kpi titulo="Contas fixas" valor={`${pagos.length} de ${d.fixos.length} pagas`} icone={Receipt} cor="bg-alerta"
          detalhe={<>Faltam {reaisCurto(pendente)} de {reaisCurto(totalFixos)}</>}>
          <Barra pct={(pagos.length / Math.max(1, d.fixos.length)) * 100} cor="bg-alerta" />
        </Kpi>
        <Kpi titulo="Parcelas nos próximos 12 meses" valor={reais(parcelas12)} icone={CreditCard} cor="bg-[#8b5cf6]"
          detalhe={livre ? <>Livre de parcelas a partir de {mesCurto(livre)}</> : <>Parcelas em todos os 12 meses</>} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Cartao titulo="Gastos por categoria" extra={
            <div className="flex items-center gap-3 text-xs text-texto-2">
              <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-primaria" />até {diaMes(d.ate)}</span>
              <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-[var(--barra)]" />até {diaMes(d.anteriorAte)}</span>
            </div>}>
            <ul className="flex flex-col gap-3">
              {d.categorias.filter((c) => c.atual > 0 || c.anterior > 0).map((c) => (
                <li key={c.nome}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span>{c.nome}</span>
                    <span className="flex items-baseline gap-2">
                      <b className="font-medium">{reais(c.atual)}</b>
                      <Variacao atual={c.atual} antes={c.anterior} melhorSobe={false} />
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="h-1.5 rounded-full bg-primaria" style={{ width: `${(c.atual / maxCat) * 100}%` }} />
                    <div className="h-1.5 rounded-full bg-[var(--barra)]" style={{ width: `${(c.anterior / maxCat) * 100}%` }} />
                  </div>
                </li>
              ))}
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
          <Cartao titulo="Parcelas já assumidas, por mês">
            <GraficoParcelas dados={d.parcelas.map((x) => ({ rotulo: mesCurto(x.mes), valor: x.valor }))} />
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
