import { CreditCard } from "lucide-react";
import { diaMes, reais } from "@/lib/formato";
import type { CicloCartao } from "@/lib/tipos";

const tom = {
  ok: { borda: "border-ok/40", texto: "text-ok", barra: "bg-ok", rotulo: "Dentro do plano" },
  atencao: { borda: "border-alerta/50", texto: "text-alerta", barra: "bg-alerta", rotulo: "No ritmo atual, passa do plano" },
  estourou: { borda: "border-perigo/60", texto: "text-perigo", barra: "bg-perigo", rotulo: "Já passou do que o plano paga" },
} as const;

// Fatura aberta do cartão × o que o plano reserva para pagá-la. Atualiza a cada sync.
export function AvisoCartao({ c }: { c: CicloCartao }) {
  if (c.teto === null || c.status === null) return null;
  const t = tom[c.status];
  const pct = (v: number) => `${Math.min(100, (v / Math.max(c.teto!, 1)) * 100)}%`;
  const mostraProjecao = c.diasPassados >= 5 && c.novo > 0;
  // recalculado na hora em que a página abre: o que sobra dividido pelos dias até o fechamento, contando hoje
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const dias = Math.max(1, Math.round((Date.parse(c.fechamento) - Date.parse(hoje)) / 86_400_000) + 1);
  const sobra = Math.max(0, c.teto - c.atual);
  const porDia = Math.floor((sobra / dias) * 100) / 100;
  return (
    <section className={`entrar rounded-xl border bg-superficie p-4 sm:p-5 ${t.borda}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><CreditCard className="size-4" />Cartão de crédito: quanto ainda cabe na fatura</h2>
        <span className={`text-xs font-medium ${t.texto}`}>{t.rotulo}</span>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-2xl font-semibold">{reais(c.atual)} <span className="text-sm font-normal text-texto-2">de {reais(c.teto)} que o plano paga</span></p>
          <p className="text-xs text-texto-2">
            Fatura do cartão que fecha em {diaMes(c.fechamento)} e vence em {diaMes(c.vencimento)} · {reais(c.comprometido)} já vinham de antes (parcelas e juros), {reais(c.novo)} de compras novas
          </p>
          <p className="mt-1 text-xs text-texto-2">Só compras no cartão de crédito. Débito e Pix da conta não entram aqui (estão no dia a dia).</p>
        </div>
        <div className="text-sm sm:text-right">
          {c.status === "estourou"
            ? <p className={t.texto}>Passou {reais(c.atual - c.teto)} do plano</p>
            : <>
                <p>Pode gastar <b>{reais(porDia)} por dia no cartão</b></p>
                <p className="text-xs text-texto-2">{reais(sobra)} para compras novas ÷ {dias} {dias === 1 ? "dia" : "dias"} até {diaMes(c.fechamento)} (contando hoje)</p>
              </>}
          {mostraProjecao && <p className={c.projecao > c.teto ? "text-alerta" : "text-texto-2"}>No ritmo atual: {reais(c.projecao)} no fechamento</p>}
        </div>
      </div>
      <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-primaria-suave">
        {mostraProjecao && <div className="absolute inset-y-0 left-0 rounded-full bg-alerta/30" style={{ width: pct(c.projecao) }} />}
        <div className={`encher absolute inset-y-0 left-0 rounded-full ${t.barra}`} style={{ width: pct(c.atual) }} />
      </div>
    </section>
  );
}
