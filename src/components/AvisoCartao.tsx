import { diaMes, reais, reaisCurto } from "@/lib/formato";
import type { CicloCartao } from "@/lib/tipos";

const tom = {
  ok: { texto: "text-ok", rotulo: "Dentro do plano" },
  atencao: { texto: "text-alerta", rotulo: "Vai passar do plano" },
  estourou: { texto: "text-perigo", rotulo: "Já passou do que o plano paga" },
} as const;

// A conta do cartão, recalculada na hora em que a página abre: o que sobra para compras novas dividido pelos dias
// até o fechamento, contando hoje. A tela Hoje e o aviso completo usam a mesma conta.
export function contaCartao(c: CicloCartao) {
  const teto = c.teto ?? 0;
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const dias = Math.max(1, Math.round((Date.parse(c.fechamento) - Date.parse(hoje)) / 86_400_000) + 1);
  const reservado = c.reservado ?? 0;
  const livre = teto - c.atual - reservado; // negativo: só as cobranças fixas já passam do plano
  const sobra = Math.max(0, livre);
  const porDia = Math.floor((sobra / dias) * 100) / 100;
  const mostraProjecao = c.diasPassados >= 5 && c.novo > 0;
  return { teto, dias, reservado, livre, sobra, porDia, mostraProjecao, tom: c.status ? tom[c.status] : null };
}

// Barra única da fatura: o que já vinha, as compras novas, as fixas que ainda caem, o livre até o plano,
// a linha do plano e (quando passa) o "no ritmo atual" tracejado depois dela.
export function BarraFatura({ c }: { c: CicloCartao }) {
  const k = contaCartao(c);
  const fim = Math.max(k.teto, c.atual + k.reservado, k.mostraProjecao ? c.projecao : 0, 1);
  const pct = (v: number) => `${(Math.max(0, v) / fim) * 100}%`;
  const passa = k.mostraProjecao && c.projecao > k.teto;
  return (
    <div>
      <div className="relative flex h-3.5 overflow-hidden rounded-full bg-barra">
        <div className="encher h-full bg-texto-2" style={{ width: pct(c.comprometido) }} />
        <div className="encher h-full bg-texto" style={{ width: pct(c.novo) }} />
        <div className="encher h-full bg-alerta" style={{ width: pct(k.reservado) }} />
        <div className="h-full bg-primaria-suave" style={{ width: pct(k.sobra) }} />
        {passa && <div className="h-full rounded-r-full border-[1.5px] border-l-0 border-dashed border-alerta" style={{ width: pct(c.projecao - k.teto) }} />}
        {k.teto > 0 && <div className="absolute inset-y-0 w-0.5 bg-texto" style={{ left: pct(k.teto) }} aria-hidden />}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-texto-2">
        <li className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-texto-2" />Já vinha <span className="num">{reais(c.comprometido)}</span></li>
        <li className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-texto" />Compras novas <span className="num">{reais(c.novo)}</span></li>
        {k.reservado > 0 && <li className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-alerta" />Fixas a cair <span className="num">{reais(k.reservado)}</span></li>}
        <li className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] border border-primaria bg-primaria-suave" />Livre <span className="num">{reais(k.sobra)}</span></li>
        {k.teto > 0 && <li className="flex items-center gap-1.5"><i className="h-3 w-0.5 bg-texto" />Plano <span className="num">{reaisCurto(k.teto)}</span></li>}
      </ul>
    </div>
  );
}

// Fatura aberta do cartão × o que o plano reserva para pagá-la. Atualiza a cada sync.
export function AvisoCartao({ c }: { c: CicloCartao }) {
  if (c.teto === null || c.status === null) return null;
  const k = contaCartao(c);
  const t = k.tom!;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`mb-1 text-xs font-medium ${t.texto}`}>{t.rotulo}</p>
          <p className="num text-2xl font-medium">{reais(c.atual)} <span className="font-sans text-sm font-normal text-texto-2">de {reais(k.teto)} que o plano paga</span></p>
          <p className="mt-1 text-xs text-texto-2">
            Fatura do cartão que fecha em {diaMes(c.fechamento)} e vence em {diaMes(c.vencimento)} · {reais(c.comprometido)} já vinham de antes (parcelas e juros), {reais(c.novo)} de compras novas
          </p>
          <p className="mt-1 text-xs text-texto-2">Só compras no cartão de crédito. Débito e Pix da conta não entram aqui (estão no dia a dia).</p>
        </div>
        <div className="text-sm sm:text-right">
          {c.status === "estourou"
            ? <p className={t.texto}>Passou {reais(c.atual - k.teto)} do plano</p>
            : k.livre < 0
            ? <>
                <p className="text-alerta"><b>Sem espaço para compras novas no cartão</b></p>
                <p className="text-xs text-texto-2">Só o que já está na fatura e as cobranças fixas passam o plano em {reais(-k.livre)}</p>
              </>
            : <>
                <p>Pode gastar <b className="num">{reais(k.porDia)}</b> por dia no cartão</p>
                <p className="text-xs text-texto-2">{reais(k.sobra)} para compras novas ÷ {k.dias} {k.dias === 1 ? "dia" : "dias"} até {diaMes(c.fechamento)} (contando hoje){k.reservado > 0 && <>, já descontadas as cobranças fixas</>}</p>
              </>}
          {k.mostraProjecao && <p className={c.projecao > k.teto ? "text-alerta" : "text-texto-2"}>No ritmo atual: <span className="num">{reais(c.projecao)}</span> no fechamento</p>}
        </div>
      </div>
      <BarraFatura c={c} />
      {k.reservado > 0 && (
        <div className="text-xs">
          <p className="text-texto-2">Cobranças fixas que ainda vão cair nesta fatura: <b className="num text-texto">{reais(k.reservado)}</b> ({c.previstas?.length ?? 0})</p>
          <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            {c.previstas?.map((x) => (
              <li key={x.nome} className="flex justify-between gap-3 border-b border-borda py-1.5">
                <span className="text-texto-2">{x.nome} <span className="text-[11px]">(~dia {x.dia})</span></span>
                <span className="num">{reais(x.valor)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
