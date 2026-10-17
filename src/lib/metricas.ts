import type { Semana } from "./tipos";

export type Chave = { [K in keyof Semana]-?: NonNullable<Semana[K]> extends number ? K : never }[keyof Semana];

// Média ignorando semanas não medidas (null). Sem nenhum valor: null.
export function media(semanas: Semana[], chave: Chave): number | null {
  const vals = semanas.map((s) => s[chave]).filter((v): v is number => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

const medidas = (semanas: Semana[], chave: Chave) => semanas.filter((s) => s[chave] != null).length;

// Últimas n semanas × as n anteriores. Com menos de 2 semanas medidas no período anterior, não há base.
export function comparar(hist: Semana[], chave: Chave, n = 4) {
  const antes = hist.slice(-2 * n, -n);
  return { atual: media(hist.slice(-n), chave), antes: medidas(antes, chave) >= 2 ? media(antes, chave) : null };
}

// Média móvel (janela de n semanas, ignorando as não medidas), para séries que oscilam muito.
export function mediaMovel(hist: Semana[], chave: Chave, n = 4): (number | null)[] {
  return hist.map((_, i) => media(hist.slice(Math.max(0, i - n + 1), i + 1), chave));
}

// Semana (rótulo) que contém a data do marco.
export function semanaDe(hist: Semana[], data: string): string | undefined {
  return [...hist].reverse().find((s) => s.inicio <= data)?.rotulo;
}

// Retrabalho: regressões ÷ PRs nas últimas n semanas, só nas semanas em que as regressões foram registradas.
export function retrabalho(hist: Semana[], n = 4) {
  const sem = hist.slice(-n).filter((s) => s.regressoesClt != null);
  const regr = sem.reduce((a, s) => a + (s.regressoesClt ?? 0), 0);
  const prs = sem.reduce((a, s) => a + s.prsClt, 0);
  return sem.length && prs ? { pct: (100 * regr) / prs, regr, prs } : null;
}

// Alerta de sobrecarga: fora do expediente alto (média de 4 semanas) e energia/sono baixos na última avaliação.
export function sobrecarga(hist: Semana[], energia: number | undefined) {
  const clt = media(hist.slice(-4), "foraClt");
  const pj = media(hist.slice(-4), "foraPj");
  const alto = (clt ?? 0) > 30 || (pj ?? 0) > 25;
  return alto && energia != null && energia <= 6 ? { clt, pj, energia } : null;
}
