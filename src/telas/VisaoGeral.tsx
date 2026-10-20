import { Cartao, Secao } from "@/components/Cartao";
import { Barra } from "@/components/Kpi";
import { GraficoSemanas } from "@/components/GraficoSemanas";
import { TabelaPlano } from "@/components/TabelaPlano";
import { AvisoCartao, BarraFatura, contaCartao } from "@/components/AvisoCartao";
import { Marca } from "@/components/Marca";
import { Contador } from "@/components/Contador";
import { SaudeDados } from "@/components/SaudeDados";
import { corClt, corPj } from "@/lib/empresas";
import { diaMes, diasAte, reais, reaisCurto } from "@/lib/formato";
import { saldoPrevisto } from "@/lib/plano";
import type { Painel } from "@/lib/tipos";

// A tela Hoje (antes Visão geral), sem moldura nem carga de dados: o site (Next) e o app desktop (Electron) usam esta tela.
// No topo, a resposta rápida (quanto dá para gastar hoje); embaixo, em seções abertas, tudo o que a tela sempre mostrou.
// aoRevisar: o app desktop troca de aba; sem ele, o site usa o link /revisar (só no modo privado).
export function VisaoGeral({ p, modo, mostraHorario, aoRevisar }: { p: Painel; modo: string; mostraHorario: boolean; aoRevisar?: () => void }) {
  const { financas: f, desempenho: d, empresas: e } = p;
  const saldo = f.contas.reduce((s, c) => s + c.saldo, 0);
  const saldoPj = f.contas.filter((c) => c.tipo === "PJ").reduce((s, c) => s + c.saldo, 0);
  const faltam = diasAte(f.marco.data);
  const restante = f.diaADia.orcamento - f.diaADia.gasto;
  const ultima = d.semanas.at(-1);
  const penultima = d.semanas.at(-2);
  const c = f.detalhe?.cicloCartao;
  const k = c && c.teto !== null && c.status !== null ? contaCartao(c) : null;
  const prev = saldoPrevisto(f);
  const proximos = prev.futuras.filter((l) => l.data <= f.marco.sobraAte);
  const maxSaldo = Math.max(1, ...proximos.map((l) => l.saldo));
  const pendentes = p.saude?.pendentes ?? 0;

  return (
    <div className="flex flex-col gap-3.5">
      {p.saude && <SaudeDados saude={p.saude} referencia={modo === "demo" ? p.atualizadoEm : undefined} />}

      {/* quanto posso gastar hoje: cartão por dia e dia a dia livre, lado a lado, e a fatura numa barra só */}
      <section className="entrar grid grid-cols-1 gap-6 rounded-2xl border border-borda bg-superficie p-5 sm:grid-cols-2 sm:p-7">
        {k && c && (
          <div>
            <p className="text-[13px] text-texto-2">No cartão, por dia até {diaMes(c.fechamento)}</p>
            {c.status === "estourou"
              ? <p className="num mt-1.5 text-4xl font-medium text-perigo sm:text-5xl">{reaisCurto(c.atual - k.teto)} <span className="font-sans text-base">acima</span></p>
              : <p className="num mt-1.5 text-4xl font-medium sm:text-5xl"><Contador valor={k.porDia} formato="brl" /></p>}
            <p className="mt-2.5 text-[13px] text-texto-2">
              {k.livre < 0 ? "Sem espaço para compras novas no cartão" : <>{reais(k.sobra)} livres para compras novas, em {k.dias} {k.dias === 1 ? "dia" : "dias"}</>}
            </p>
          </div>
        )}
        <div className={k ? "sm:border-l sm:border-borda sm:pl-8" : ""}>
          <p className="text-[13px] text-texto-2">Dia a dia, até {diaMes(f.diaADia.ate)}</p>
          <p className={`num mt-1.5 text-4xl font-medium sm:text-5xl ${restante < 0 ? "text-perigo" : ""}`}><Contador valor={restante} formato="brl" /></p>
          <Barra pct={(f.diaADia.gasto / Math.max(1, f.diaADia.orcamento)) * 100} cor={restante < 0 ? "bg-perigo" : "bg-texto-2"} />
          <p className="mt-2 text-[13px] text-texto-2">Livre de {reaisCurto(f.diaADia.orcamento)} · já gasto {reaisCurto(f.diaADia.gasto)}</p>
        </div>
        {k && c && (
          <div className="sm:col-span-2">
            <div className="mb-2.5 flex flex-wrap justify-between gap-2 text-[13px]">
              <span>Fatura que fecha em {diaMes(c.fechamento)} <span className="num text-texto-2">{reais(c.atual)} de {reais(k.teto)}</span></span>
              <span className={`font-medium ${k.tom!.texto}`}>
                {k.tom!.rotulo}{k.mostraProjecao && <>: no ritmo atual fecha em {reaisCurto(c.projecao)}{c.projecao > k.teto && <>, {reaisCurto(c.projecao - k.teto)} acima</>}</>}
              </span>
            </div>
            <BarraFatura c={c} />
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="entrar rounded-2xl border border-borda bg-superficie p-4 sm:p-5">
          <p className="text-[13px] text-texto-2">Saldo nas contas</p>
          <p className="num mt-1.5 text-2xl font-medium"><Contador valor={saldo} formato="brl" /></p>
          <p className="mt-2 text-xs text-texto-2">PJ {reaisCurto(saldoPj)} · PF {reaisCurto(saldo - saldoPj)}</p>
        </div>
        <div className="entrar rounded-2xl border border-borda bg-superficie p-4 sm:p-5">
          <p className="text-[13px] text-texto-2">{f.marco.titulo} em {diaMes(f.marco.data)}</p>
          <p className="num mt-1.5 text-2xl font-medium"><Contador valor={f.marco.pagar} formato="brl" /></p>
          <p className={`mt-2 text-xs ${faltam > 0 && faltam <= 7 ? "text-alerta" : "text-texto-2"}`}>
            {faltam > 0 ? `Faltam ${faltam} dias` : "Hoje"} · sobra {reaisCurto(f.marco.sobra)} até {diaMes(f.marco.sobraAte)}
          </p>
        </div>
        <div className="entrar rounded-2xl border border-borda bg-superficie p-4 sm:p-5">
          <p className="text-[13px] text-texto-2">{f.meta.titulo}</p>
          <p className="num mt-1.5 text-2xl font-medium"><Contador valor={f.meta.acumulado} formato="brlCurto" /> <span className="font-sans text-sm text-texto-2">de {reaisCurto(f.meta.alvo)}</span></p>
          <Barra pct={(f.meta.acumulado / Math.max(1, f.meta.alvo)) * 100} cor="bg-ok" />
          <p className="mt-2 text-xs text-texto-2">
            {f.meta.proximo ? <>Próximo depósito {reaisCurto(f.meta.proximo.valor)} em {diaMes(f.meta.proximo.data)}</> : <>Meta {reaisCurto(f.meta.alvo)}</>}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-3.5">
        <section className="entrar min-w-0 flex-[999_1_520px] rounded-2xl border border-borda bg-superficie p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[15px] font-semibold">Próximos dias, até {diaMes(f.marco.sobraAte)}</h2>
            <span className="text-xs text-texto-2">Depende de: {f.marco.dependeDe.join(" · ")}</span>
          </div>
          {!proximos.length && <p className="text-sm text-texto-2">Nada previsto até {diaMes(f.marco.sobraAte)}.</p>}
          <ul>
            {proximos.map((l, i) => (
              <li key={i} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-borda py-2.5 last:border-0 sm:grid-cols-[3.25rem_minmax(0,1fr)_7.5rem_minmax(0,1.1fr)] sm:min-h-11 sm:py-0">
                <span className="num row-span-2 text-[13px] text-texto-2 sm:row-span-1">{diaMes(l.data)}</span>
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="min-w-0 break-words">{l.descricao}</span>
                  {l.status === "atencao" && <span className="shrink-0 rounded-full bg-alerta-suave px-2 py-0.5 text-[11px] font-semibold text-alerta">Dia apertado</span>}
                </span>
                <span className={`num text-right text-[13px] ${l.entra ? "text-ok" : ""}`}>{l.entra ? `+ ${reais(l.entra)}` : `− ${reais(l.sai ?? 0)}`}</span>
                <span className="col-span-2 flex items-center gap-2.5 sm:col-span-1">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-barra sm:h-2">
                    <span className={`encher block h-full rounded-full ${l.saldo < 0 ? "bg-perigo" : "bg-texto-2"}`} style={{ width: `${Math.max(0, (l.saldo / maxSaldo) * 100)}%` }} />
                  </span>
                  <span className={`num w-24 text-right text-xs ${l.saldo < 0 ? "text-perigo" : ""}`}>{reais(l.saldo)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3.5">
          {pendentes > 0 && (
            <section className="entrar flex flex-col gap-3 rounded-2xl bg-texto p-5 text-fundo">
              <p className="text-[13px] opacity-75">Para revisar</p>
              <p className="text-xl font-semibold leading-tight">{pendentes} {pendentes === 1 ? "lançamento esperando" : "lançamentos esperando"} categoria</p>
              {aoRevisar
                ? <button type="button" onClick={aoRevisar} className="min-h-11 rounded-xl bg-fundo font-semibold text-texto">Revisar agora</button>
                : modo === "privado"
                ? <a href="/revisar" className="grid min-h-11 place-items-center rounded-xl bg-fundo font-semibold text-texto">Revisar agora</a>
                : <p className="text-xs opacity-75">A revisão fica no modo privado.</p>}
            </section>
          )}
          <Cartao titulo="Semana atual">
            <div className="flex items-end gap-2">
              <p className="num text-4xl font-medium">{d.atual.nota == null ? "—" : <Contador valor={d.atual.nota} casas={1} />}</p>
              <p className="pb-1 text-sm text-texto-2">/ 10</p>
            </div>
            <p className="mt-2 text-sm">{d.atual.destaque}</p>
            {ultima && (
              <dl className="mt-3 text-sm">
                <div className="flex items-baseline justify-between gap-2 border-b border-borda py-2">
                  <dt className="flex items-center gap-1.5"><Marca empresa={e.pj} tamanho={14} />Entregas {e.pj.nome}</dt>
                  <dd className="num text-lg">{ultima.entregasPj}{penultima && <span className="ml-1 text-xs text-texto-2">({penultima.entregasPj} antes)</span>}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-2 border-b border-borda py-2 last:border-0">
                  <dt className="flex items-center gap-1.5"><Marca empresa={e.clt} tamanho={14} />PRs {e.clt.nome}</dt>
                  <dd className="num text-lg">{ultima.prsClt}{penultima && <span className="ml-1 text-xs text-texto-2">({penultima.prsClt} antes)</span>}</dd>
                </div>
                {mostraHorario && (
                  <div className="flex items-baseline justify-between gap-2 py-2">
                    <dt>Commits fora do expediente</dt>
                    <dd className="num text-lg"><Contador valor={d.atual.foraDoExpedientePct} formato="pct" /></dd>
                  </div>
                )}
              </dl>
            )}
          </Cartao>
        </div>
      </div>

      {c && c.teto !== null && c.status !== null && (
        <Secao titulo="Cartão de crédito: quanto ainda cabe na fatura" resumo={`fecha ${diaMes(c.fechamento)} · vence ${diaMes(c.vencimento)}`}>
          <AvisoCartao c={c} />
        </Secao>
      )}

      <Secao titulo="Desempenho por semana" resumo={
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">{e.clt.logo ? <Marca empresa={e.clt} tamanho={14} /> : <i className="size-2.5 rounded-sm" style={{ background: corClt(e) }} />}{e.clt.nome}</span>
          <span className="flex items-center gap-1.5">{e.pj.logo ? <Marca empresa={e.pj} tamanho={14} /> : <i className="size-2.5 rounded-sm" style={{ background: corPj(e) }} />}{e.pj.nome}</span>
        </span>}>
        <GraficoSemanas semanas={d.semanas} empresas={e} />
      </Secao>

      <Secao titulo={`Plano até ${diaMes(f.marco.sobraAte)}`} resumo={`Depende de: ${f.marco.dependeDe.join(" · ")}`}>
        <TabelaPlano plano={f.plano.filter((i) => i.data <= f.marco.sobraAte)} />
      </Secao>
    </div>
  );
}
