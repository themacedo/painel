import type { Painel } from "./tipos";

type Financas = Painel["financas"];

// Saldo previsto: parte do saldo de hoje menos o dia a dia ainda livre (gasto aos poucos até o fim do mês)
// e aplica, em ordem, só o que ainda não aconteceu. Hoje e Plano usam a mesma conta.
export function saldoPrevisto(f: Financas) {
  const saldoInicial = f.contas.reduce((s, c) => s + c.saldo, 0);
  const diaLivre = Math.max(0, f.diaADia.orcamento - f.diaADia.gasto);
  let corrente = saldoInicial - diaLivre;
  const linhas = [...f.plano].sort((a, b) => a.data.localeCompare(b.data)).map((i) => {
    if (i.status !== "feito") corrente += (i.entra ?? 0) - (i.sai ?? 0);
    return { ...i, saldo: i.status === "feito" ? null : corrente };
  });
  const futuras = linhas.filter((l) => l.saldo != null) as (typeof linhas[number] & { saldo: number })[];
  const menor = Math.min(saldoInicial - diaLivre, ...futuras.map((l) => l.saldo));
  const noMenor = futuras.find((l) => l.saldo === menor) ?? null;
  return { saldoInicial, diaLivre, linhas, futuras, menor, noMenor };
}
