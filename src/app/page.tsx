import { Moldura } from "@/components/Moldura";
import { VisaoGeral } from "@/telas/VisaoGeral";
import { carregarPainel, modo, mostraHorario } from "@/lib/dados";

export const dynamic = "force-dynamic";

export default async function Pagina() {
  const p = await carregarPainel();
  return (
    <Moldura ativa="visao" titulo="Visão geral" modo={modo} dono={p.dono} atualizadoEm={p.atualizadoEm}>
      <VisaoGeral p={p} modo={modo} mostraHorario={mostraHorario} />
    </Moldura>
  );
}
