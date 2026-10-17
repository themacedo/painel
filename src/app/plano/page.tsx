import { CalendarClock, Hourglass, PiggyBank, Wallet } from "lucide-react";
import { Cartao, Moldura } from "@/components/Moldura";
import { Barra, Kpi } from "@/components/Kpi";
import { carregarPainel, modo } from "@/lib/dados";
import { diaMes, reais, reaisCurto } from "@/lib/formato";
import type { Status } from "@/lib/tipos";

export const dynamic = "force-dynamic";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const mesCurto = (ym: string) => `${MESES[Number(ym.slice(5, 7)) - 1].slice(0, 3)}/${ym.slice(2, 4)}`;
const nMeses = (de: string, ate: string) =>
  (Number(ate.slice(0, 4)) - Number(de.slice(0, 4))) * 12 + Number(ate.slice(5, 7)) - Number(de.slice(5, 7)) + 1;

const selo: Record<Status, string> = { feito: "bg-ok-suave text-ok", previsto: "bg-primaria-suave text-primaria", atencao: "bg-alerta-suave text-alerta" };
const textoSelo: Record<Status, string> = { feito: "Feito", previsto: "Previsto", atencao: "Atenção" };

export default async function Plano() {
  const p = await carregarPainel();
  const f = p.financas;
  const hoje = p.atualizadoEm.slice(0, 7);
  const saldoInicial = f.contas.reduce((s, c) => s + c.saldo, 0);

  // Saldo previsto: parte do saldo de hoje menos o dia a dia ainda livre (gasto aos poucos até o fim do mês)
  // e aplica, em ordem, só o que ainda não aconteceu.
  const diaLivre = Math.max(0, f.diaADia.orcamento - f.diaADia.gasto);
  let corrente = saldoInicial - diaLivre;
  const linhas = [...f.plano].sort((a, b) => a.data.localeCompare(b.data)).map((i) => {
    if (i.status !== "feito") corrente += (i.entra ?? 0) - (i.sai ?? 0);
    return { ...i, saldo: i.status === "feito" ? null : corrente };
  });
  const menor = Math.min(saldoInicial - diaLivre, ...linhas.filter((l) => l.saldo != null).map((l) => l.saldo as number));
  const porMes = linhas.reduce<Record<string, typeof linhas>>((acc, l) => ((acc[l.data.slice(0, 7)] ??= []).push(l), acc), {});

  const depositos = f.meta.depositos ?? [];
  const feitos = depositos.filter((d) => d.feito).length;
  const compromissos = (f.compromissos ?? []).map((c) => {
    const total = nMeses(c.de, c.ate);
    // Meses anteriores ao atual contam como pagos; o atual, só se o item do plano com o mesmo nome já foi feito.
    const pagoNoMes = f.plano.some((i) => i.status === "feito" && i.data.startsWith(hoje) && i.descricao === c.descricao);
    const pagos = Math.min(total, Math.max(0, nMeses(c.de, hoje) - 1 + (pagoNoMes ? 1 : 0)));
    return { ...c, total, pagos, falta: (total - pagos) * c.mensal };
  });
  const mensalAtivo = compromissos.filter((c) => c.ate >= hoje).reduce((s, c) => s + c.mensal, 0);

  return (
    <Moldura ativa="plano" titulo="Plano" modo={modo} dono={p.dono} atualizadoEm={p.atualizadoEm}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi titulo={f.meta.titulo} valor={`${reaisCurto(f.meta.acumulado)} de ${reaisCurto(f.meta.alvo)}`} icone={PiggyBank} cor="bg-ok"
          detalhe={<>{feitos} de {depositos.length} depósitos feitos</>}>
          <Barra pct={(f.meta.acumulado / Math.max(1, f.meta.alvo)) * 100} cor="bg-ok" />
        </Kpi>
        <Kpi titulo="Próximo depósito" valor={f.meta.proximo ? reais(f.meta.proximo.valor) : "—"} icone={CalendarClock} cor="bg-primaria"
          detalhe={f.meta.proximo ? <>Em {diaMes(f.meta.proximo.data)}</> : <>Meta concluída</>} />
        <Kpi titulo="Menor saldo previsto" valor={reais(menor)} icone={Wallet} cor={menor < 0 ? "bg-perigo" : "bg-alerta"}
          detalhe={menor < 0 ? <>O plano fica negativo em algum momento</> : <>O plano não fica negativo até {diaMes(linhas.at(-1)?.data ?? "")}</>} />
        <Kpi titulo="Compromissos por mês" valor={reais(mensalAtivo)} icone={Hourglass} cor="bg-[#8b5cf6]"
          detalhe={<>{compromissos.filter((c) => c.ate >= hoje).length} com data para acabar</>} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Cartao titulo="Linha do tempo" extra={<span className="text-xs text-texto-2">
            saldo previsto: {reaisCurto(saldoInicial)} hoje − {reaisCurto(diaLivre)} do dia a dia livre</span>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-sm">
                <thead>
                  <tr className="border-b border-borda text-left text-xs text-texto-2">
                    <th className="py-2 pr-3 font-medium">Data</th><th className="py-2 pr-3 font-medium">Item</th>
                    <th className="py-2 pr-3 text-right font-medium">Valor</th><th className="py-2 pr-3 text-right font-medium">Saldo previsto</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                {Object.entries(porMes).map(([mes, itens]) => (
                  <tbody key={mes}>
                    <tr><td colSpan={5} className="pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-texto-2">
                      {MESES[Number(mes.slice(5, 7)) - 1]} {mes.slice(0, 4)}</td></tr>
                    {itens.map((i, k) => (
                      <tr key={k} className={`border-b border-borda last:border-0 ${i.status === "feito" ? "text-texto-2" : ""}`}>
                        <td className="py-2 pr-3 text-texto-2">{diaMes(i.data)}</td>
                        <td className="py-2 pr-3">{i.descricao}</td>
                        <td className={`py-2 pr-3 text-right ${i.entra ? "text-ok" : ""}`}>{i.entra ? `+ ${reais(i.entra)}` : `− ${reais(i.sai ?? 0)}`}</td>
                        <td className={`py-2 pr-3 text-right font-medium ${i.saldo != null && i.saldo < 0 ? "text-perigo" : ""}`}>
                          {i.saldo == null ? "—" : reais(i.saldo)}</td>
                        <td className="py-2"><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${selo[i.status]}`}>{textoSelo[i.status]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          </Cartao>
        </div>

        <div className="flex flex-col gap-3">
          <Cartao titulo={`Depósitos: ${f.meta.titulo}`}>
            <ol className="flex flex-col gap-2.5 text-sm">
              {depositos.map((d, k) => {
                const acum = depositos.slice(0, k + 1).reduce((s, x) => s + x.valor, 0);
                return (
                  <li key={k} className="flex items-center gap-3">
                    <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${d.feito ? "bg-ok text-white" : "bg-primaria-suave text-primaria"}`}>{k + 1}</span>
                    <span className="flex-1">{diaMes(d.data)}</span>
                    <span className="font-medium">{reais(d.valor)}</span>
                    <span className="w-20 text-right text-xs text-texto-2">{reaisCurto(acum)}</span>
                  </li>
                );
              })}
            </ol>
          </Cartao>
          <Cartao titulo="Compromissos com data para acabar">
            <ul className="flex flex-col gap-4 text-sm">
              {compromissos.map((c) => (
                <li key={c.descricao}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span>{c.descricao}</span><span className="font-medium">{reais(c.mensal)}/mês</span>
                  </div>
                  <Barra pct={(c.pagos / c.total) * 100} cor="bg-[#8b5cf6]" />
                  <p className="mt-1.5 text-xs text-texto-2">
                    {c.pagos} de {c.total} pagas · acaba em {mesCurto(c.ate)} · faltam {reaisCurto(c.falta)}
                  </p>
                </li>
              ))}
            </ul>
          </Cartao>
        </div>
      </div>
    </Moldura>
  );
}
