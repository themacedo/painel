import { Moldura } from "@/components/Moldura";
import { Plano } from "@/telas/Plano";
import { carregarPainel, modo, mostraHorario } from "@/lib/dados";

export const dynamic = "force-dynamic";

export default async function Pagina() {
  const p = await carregarPainel();
  return (
    <Moldura ativa="plano" titulo="Plano" modo={modo} dono={p.dono} atualizadoEm={p.atualizadoEm}>
      <Plano p={p} modo={modo} mostraHorario={mostraHorario} />
    </Moldura>
  );
}
