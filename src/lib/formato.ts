const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const reais = (v: number) => brl.format(v);
export const reaisCurto = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

export const diaMes = (iso: string) => {
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}`;
};

export const diasAte = (iso: string, hoje = new Date()) => {
  const alvo = new Date(`${iso.slice(0, 10)}T00:00:00-03:00`);
  return Math.ceil((alvo.getTime() - hoje.getTime()) / 86_400_000);
};

export const dataHora = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(iso));
