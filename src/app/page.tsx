import { CalendarClock, Landmark, PiggyBank, ShoppingBasket } from "lucide-react";
import { Cartao, Moldura } from "@/components/Moldura";
import { Barra, Kpi } from "@/components/Kpi";
import { GraficoSemanas } from "@/components/GraficoSemanas";
import { TabelaPlano } from "@/components/TabelaPlano";
import { Marca } from "@/components/Marca";
import { corClt, corPj } from "@/lib/empresas";
import { carregarPainel, modo } from "@/lib/dados";
import { diaMes, diasAte, reais, reaisCurto } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function Pagina() {
  const p = await carregarPainel();
  const { financas: f, desempenho: d, empresas: e } = p;
  const saldo = f.contas.reduce((s, c) => s + c.saldo, 0);
  const saldoPj = f.contas.filter((c) => c.tipo === "PJ").reduce((s, c) => s + c.saldo, 0);
  const faltam = diasAte(f.marco.data);
  const restante = f.diaADia.orcamento - f.diaADia.gasto;
  const ultima = d.semanas.at(-1);
  const penultima = d.semanas.at(-2);

  return (
    <Moldura ativa="visao" titulo="Visão geral" modo={modo} dono={p.dono} atualizadoEm={p.atualizadoEm}>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi titulo="Saldo nas contas" valor={reais(saldo)} icone={Landmark} cor="bg-primaria"
            detalhe={<>PJ {reaisCurto(saldoPj)} · PF {reaisCurto(saldo - saldoPj)}</>} />
          <Kpi titulo={f.marco.titulo} valor={reais(f.marco.pagar)} icone={CalendarClock} cor="bg-alerta"
            detalhe={<>Em {diaMes(f.marco.data)} ({faltam > 0 ? `faltam ${faltam} dias` : "hoje"}) · sobra {reaisCurto(f.marco.sobra)} até {diaMes(f.marco.sobraAte)}</>} />
          <Kpi titulo={f.meta.titulo} valor={reais(f.meta.acumulado)} icone={PiggyBank} cor="bg-ok"
            detalhe={f.meta.proximo ? <>Meta {reaisCurto(f.meta.alvo)} · próximo depósito {reaisCurto(f.meta.proximo.valor)} em {diaMes(f.meta.proximo.data)}</> : <>Meta {reaisCurto(f.meta.alvo)}</>}>
            <Barra pct={(f.meta.acumulado / f.meta.alvo) * 100} cor="bg-ok" />
          </Kpi>
          <Kpi titulo="Dia a dia do mês" valor={reais(restante)} icone={ShoppingBasket} cor="bg-[#8b5cf6]"
            detalhe={<>Livre de {reaisCurto(f.diaADia.orcamento)} até {diaMes(f.diaADia.ate)} · já gasto {reaisCurto(f.diaADia.gasto)}</>}>
            <Barra pct={(f.diaADia.gasto / f.diaADia.orcamento) * 100} cor={restante < 0 ? "bg-perigo" : "bg-[#8b5cf6]"} />
          </Kpi>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Cartao titulo="Desempenho por semana" extra={
              <div className="flex items-center gap-3 text-xs text-texto-2">
                <span className="flex items-center gap-1.5">{e.clt.logo ? <Marca empresa={e.clt} tamanho={14} /> : <i className="size-2.5 rounded-sm" style={{ background: corClt(e) }} />}{e.clt.nome}</span>
                <span className="flex items-center gap-1.5">{e.pj.logo ? <Marca empresa={e.pj} tamanho={14} /> : <i className="size-2.5 rounded-sm" style={{ background: corPj(e) }} />}{e.pj.nome}</span>
              </div>}>
              <GraficoSemanas semanas={d.semanas} empresas={e} />
            </Cartao>
          </div>
          <Cartao titulo="Semana atual">
            <div className="flex items-end gap-2">
              <p className="text-4xl font-semibold tracking-tight">{d.atual.nota == null ? "—" : d.atual.nota.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
              <p className="pb-1 text-sm text-texto-2">/ 10</p>
            </div>
            <p className="mt-3 text-sm">{d.atual.destaque}</p>
            {ultima && (
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-fundo p-3">
                  <dt className="flex items-center gap-1.5 text-xs text-texto-2"><Marca empresa={e.pj} tamanho={14} />Entregas {e.pj.nome}</dt>
                  <dd className="text-lg font-semibold">{ultima.entregasPj}
                    {penultima && <span className="ml-1 text-xs font-normal text-texto-2">({penultima.entregasPj} antes)</span>}</dd>
                </div>
                <div className="rounded-lg bg-fundo p-3">
                  <dt className="flex items-center gap-1.5 text-xs text-texto-2"><Marca empresa={e.clt} tamanho={14} />PRs {e.clt.nome}</dt>
                  <dd className="text-lg font-semibold">{ultima.prsClt}
                    {penultima && <span className="ml-1 text-xs font-normal text-texto-2">({penultima.prsClt} antes)</span>}</dd>
                </div>
                <div className="col-span-2 rounded-lg bg-fundo p-3">
                  <dt className="text-xs text-texto-2">Commits fora do expediente</dt>
                  <dd className="text-lg font-semibold">{d.atual.foraDoExpedientePct}%</dd>
                </div>
              </dl>
            )}
          </Cartao>
        </div>

        <div className="mt-3">
          <Cartao titulo="Plano do mês" extra={
            <p className="text-xs text-texto-2">Depende de: {f.marco.dependeDe.join(" · ")}</p>}>
            <TabelaPlano plano={f.plano} />
          </Cartao>
        </div>
    </Moldura>
  );
}
