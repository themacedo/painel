import { Moldura } from "@/components/Moldura";
import { FinancasPeriodo } from "@/components/FinancasPeriodo";
import { carregarPainel, modo } from "@/lib/dados";

export const dynamic = "force-dynamic";

export default async function Financas() {
  const p = await carregarPainel();
  const d = p.financas.detalhe;
  return (
    <Moldura ativa="financas" titulo="Finanças" modo={modo} dono={p.dono} atualizadoEm={p.atualizadoEm}>
      {d ? <FinancasPeriodo d={d} empresas={p.empresas} />
         : <p className="text-sm text-texto-2">Ainda sem detalhamento: o próximo sync gera estes dados.</p>}
    </Moldura>
  );
}
