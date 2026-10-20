// Tela compartilhada pelo site (Next) e pelo app desktop (Electron): recebe o painel já carregado.
import type { Painel } from "@/lib/tipos";
import { Cartao, Secao } from "@/components/Cartao";
import { Barra, Kpi } from "@/components/Kpi";
import { Contador } from "@/components/Contador";
import { diaMes, reais, reaisCurto } from "@/lib/formato";
import { saldoPrevisto } from "@/lib/plano";
import type { Status } from "@/lib/tipos";


const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const mesCurto = (ym: string) => `${MESES[Number(ym.slice(5, 7)) - 1].slice(0, 3)}/${ym.slice(2, 4)}`;
const nMeses = (de: string, ate: string) =>
  (Number(ate.slice(0, 4)) - Number(de.slice(0, 4))) * 12 + Number(ate.slice(5, 7)) - Number(de.slice(5, 7)) + 1;

const selo: Record<Status, string> = { feito: "bg-barra text-texto-2", previsto: "border border-borda text-texto-2", atencao: "bg-alerta-suave text-alerta" };
const textoSelo: Record<Status, string> = { feito: "Feito", previsto: "Previsto", atencao: "Atenção" };

export function Plano({ p, modo, mostraHorario }: { p: Painel; modo: string; mostraHorario: boolean }) {
  void modo; void mostraHorario;
  const f = p.financas;
  const hoje = p.atualizadoEm.slice(0, 7);
  const { saldoInicial, diaLivre, linhas, futuras, menor, noMenor } = saldoPrevisto(f);
  const porMes = linhas.reduce<Record<string, typeof linhas>>((acc, l) => ((acc[l.data.slice(0, 7)] ??= []).push(l), acc), {});
  const maxSaldo = Math.max(1, ...futuras.map((l) => Math.abs(l.saldo)));
  const ate = diaMes(linhas.at(-1)?.data ?? "");

  const depositos = f.meta.depositos ?? [];
  const feitos = depositos.filter((d) => d.feito).length;
  const compromissos = (f.compromissos ?? []).map((c) => {
    const total = nMeses(c.de, c.ate);
    // Meses anteriores ao atual contam como pagos; o atual, só se o item do plano com o mesmo nome já foi feito.
    // o status do mês vem da conta fixa ligada ao compromisso; sem ligação, do item do plano com o mesmo nome
    const pagoNoMes = c.pagoNoMes ?? f.plano.some((i) => i.status === "feito" && i.data.startsWith(hoje) && i.descricao === c.descricao);
    const pagos = Math.min(total, Math.max(0, nMeses(c.de, hoje) - 1 + (pagoNoMes ? 1 : 0)));
    return { ...c, total, pagos, falta: (total - pagos) * c.mensal };
  });
  const ativos = compromissos.filter((c) => c.ate >= hoje);
  const mensalAtivo = ativos.reduce((s, c) => s + c.mensal, 0);

  return (
    <div className="flex flex-col gap-3.5">
      {/* o ponto mais baixo do saldo previsto, e o gráfico do saldo depois de cada item que ainda vai acontecer */}
      <section className="entrar flex flex-col gap-5 rounded-2xl border border-borda bg-superficie p-5 sm:p-7">
        <div className="flex flex-wrap gap-x-12 gap-y-5">
          <div>
            <p className="text-[13px] text-texto-2">Menor saldo previsto</p>
            <p className={`num mt-1.5 text-4xl font-medium ${menor < 0 ? "text-perigo" : ""}`}><Contador valor={menor} formato="brl" /></p>
            <p className={`mt-2 text-[13px] font-medium ${menor < 0 ? "text-perigo" : "text-alerta"}`}>
              {noMenor ? <>Em {diaMes(noMenor.data)}, depois de {noMenor.descricao.toLowerCase()}</> : <>Hoje, antes do que está previsto</>}
            </p>
          </div>
          <div>
            <p className="text-[13px] text-texto-2">{menor < 0 ? "O plano fica negativo" : "Nunca fica negativo"}</p>
            <p className={`num mt-1.5 text-4xl font-medium ${menor < 0 ? "text-perigo" : "text-ok"}`}>{menor < 0 ? "atenção" : `até ${ate}`}</p>
            <p className="mt-2 text-[13px] text-texto-2">Saldo de hoje {reaisCurto(saldoInicial)} − {reaisCurto(diaLivre)} livres do dia a dia</p>
          </div>
        </div>
        {!!futuras.length && (
          <div>
            <div className="flex h-44 items-end gap-1.5 border-b border-borda sm:gap-2">
              {futuras.map((l, i) => (
                <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${diaMes(l.data)} · ${l.descricao}: ${reais(l.saldo)}`}>
                  {l === noMenor && <span className="num text-[11px] font-medium text-alerta">{reaisCurto(l.saldo)}</span>}
                  <div className={`w-full max-w-11 rounded-t-md ${l.saldo < 0 ? "bg-perigo" : l === noMenor ? "bg-alerta" : "bg-texto-2"}`}
                    style={{ height: `${Math.max(2, (Math.abs(l.saldo) / maxSaldo) * 140)}px` }} />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex gap-1.5 sm:gap-2">
              {futuras.map((l, i) => <span key={i} className="num min-w-0 flex-1 truncate text-center text-[10px] text-texto-2 sm:text-[11px]">{diaMes(l.data)}</span>)}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Cartao titulo="Linha do tempo" extra={<span className="text-xs text-texto-2">
            saldo previsto: {reaisCurto(saldoInicial)} hoje − {reaisCurto(diaLivre)} do dia a dia livre</span>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-sm">
                <thead>
                  <tr className="border-b border-borda text-left text-xs text-texto-2">
                    <th className="py-2 pr-3 font-medium">Data</th><th className="py-2 pr-3 font-medium">Item</th>
                    <th className="py-2 pr-3 text-right font-medium">Valor</th><th className="py-2 pr-3 text-right font-medium">Saldo previsto</th>
                    <th className="py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                {Object.entries(porMes).map(([mes, itens]) => (
                  <tbody key={mes}>
                    <tr><td colSpan={5} className="pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-texto-2">
                      {MESES[Number(mes.slice(5, 7)) - 1]} {mes.slice(0, 4)}</td></tr>
                    {itens.map((i, k) => (
                      <tr key={k} className={`border-b border-borda last:border-0 ${i.status === "feito" ? "opacity-60" : ""}`}>
                        <td className="num py-2.5 pr-3 text-[13px] text-texto-2">{diaMes(i.data)}</td>
                        <td className="py-2.5 pr-3">{i.descricao}</td>
                        <td className={`num py-2.5 pr-3 text-right text-[13px] ${i.entra ? "text-ok" : ""}`}>{i.entra ? `+ ${reais(i.entra)}` : `− ${reais(i.sai ?? 0)}`}</td>
                        <td className={`num py-2.5 pr-3 text-right text-[13px] ${i.saldo != null && i.saldo < 0 ? "text-perigo" : ""}`}>
                          {i.saldo == null ? "—" : reais(i.saldo)}</td>
                        <td className="py-2.5 text-right"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${selo[i.status]}`}>{textoSelo[i.status]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          </Cartao>
        </div>

        <div className="flex flex-col gap-3.5">
          <Cartao titulo={`Depósitos: ${f.meta.titulo}`} extra={<span className="num text-[13px] text-texto-2">{Math.round((f.meta.acumulado / Math.max(1, f.meta.alvo)) * 100)}%</span>}>
            <p className="num mb-3 text-[22px] font-medium">{reaisCurto(f.meta.acumulado)} <span className="font-sans text-[13px] text-texto-2">de {reaisCurto(f.meta.alvo)}</span></p>
            {!!depositos.length && (
              <div className="mb-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${depositos.length}, minmax(0, 1fr))` }}>
                {depositos.map((d, k) => <div key={k} className={`h-2 rounded-full ${d.feito ? "bg-ok" : "bg-barra"}`} />)}
              </div>
            )}
            <ol className="flex flex-col text-sm">
              {depositos.map((d, k) => {
                const acum = depositos.slice(0, k + 1).reduce((s, x) => s + x.valor, 0);
                return (
                  <li key={k} className="flex min-h-10 items-center gap-3 border-b border-borda last:border-0">
                    <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${d.feito ? "bg-ok text-fundo" : "bg-barra text-texto-2"}`}>{k + 1}</span>
                    <span className="num flex-1 text-[13px]">{diaMes(d.data)}{d.feito && <span className="font-sans text-xs text-texto-2"> · feito</span>}</span>
                    <span className="num">{reais(d.valor)}</span>
                    <span className="num w-20 text-right text-xs text-texto-2">{reaisCurto(acum)}</span>
                  </li>
                );
              })}
            </ol>
          </Cartao>
          <Cartao titulo="Compromissos com data para acabar">
            <p className="-mt-2 mb-2 text-xs text-texto-2"><span className="num">{reais(mensalAtivo)}</span> por mês hoje</p>
            <ul className="flex flex-col text-sm">
              {compromissos.map((c) => (
                <li key={c.descricao} className="border-t border-borda py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{c.descricao}</span><span className="num text-[13px]">{reais(c.mensal)}/mês</span>
                  </div>
                  <Barra pct={(c.pagos / c.total) * 100} cor="bg-texto-2" />
                  <p className="mt-1.5 flex justify-between gap-2 text-xs text-texto-2">
                    <span>{c.pagos} de {c.total} pagas · faltam {reaisCurto(c.falta)}</span><span>acaba em {mesCurto(c.ate)}</span>
                  </p>
                </li>
              ))}
            </ul>
          </Cartao>
        </div>
      </div>

      <Secao titulo="Os números do plano" resumo="reserva, próximo depósito, menor saldo, compromissos">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi titulo={f.meta.titulo} valor={<><Contador valor={f.meta.acumulado} formato="brlCurto" /> de {reaisCurto(f.meta.alvo)}</>}
            detalhe={<>{feitos} de {depositos.length} depósitos feitos</>}>
            <Barra pct={(f.meta.acumulado / Math.max(1, f.meta.alvo)) * 100} cor="bg-ok" />
          </Kpi>
          <Kpi titulo="Próximo depósito" valor={f.meta.proximo ? <Contador valor={f.meta.proximo.valor} formato="brl" /> : "—"}
            detalhe={f.meta.proximo ? <>Em {diaMes(f.meta.proximo.data)}</> : <>Meta concluída</>} />
          <Kpi titulo="Menor saldo previsto" valor={<Contador valor={menor} formato="brl" />} destaque={menor < 0 ? "alerta" : undefined}
            detalhe={menor < 0 ? <>O plano fica negativo em algum momento</> : <>O plano não fica negativo até {ate}</>} />
          <Kpi titulo="Compromissos por mês" valor={<Contador valor={mensalAtivo} formato="brl" />}
            detalhe={<>{ativos.length} com data para acabar</>} />
        </div>
      </Secao>
    </div>
  );
}
