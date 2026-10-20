import { Moldura } from "@/components/Moldura";
import { Financas } from "@/telas/Financas";
import { carregarPainel, modo, mostraHorario } from "@/lib/dados";

export const dynamic = "force-dynamic";

export default async function Pagina() {
  const p = await carregarPainel();
  return (
    <Moldura ativa="financas" titulo="Finanças" modo={modo} dono={p.dono} atualizadoEm={p.atualizadoEm}>
      <Financas p={p} modo={modo} mostraHorario={mostraHorario} />
    </Moldura>
  );
}
