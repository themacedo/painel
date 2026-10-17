import type { Semana } from "./tipos";

type Chave = { [K in keyof Semana]: Semana[K] extends number | null ? K : never }[keyof Semana];

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
