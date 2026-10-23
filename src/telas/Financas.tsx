// Tela compartilhada pelo site (Next) e pelo app desktop (Electron): recebe o painel já carregado.
import type { Painel } from "@/lib/tipos";
import { FinancasPeriodo } from "@/components/FinancasPeriodo";


export function Financas({ p, modo, mostraHorario }: { p: Painel; modo: string; mostraHorario: boolean }) {
  void modo; void mostraHorario;
  const d = p.financas.detalhe;
  return (
    <>
      {d ? <FinancasPeriodo d={d} empresas={p.empresas} plano={p.financas.plano} />
         : <p className="text-sm text-texto-2">Ainda sem detalhamento: o próximo sync gera estes dados.</p>}
    </>
  );
}
