import { Moldura } from "@/components/Moldura";
import { Desempenho } from "@/telas/Desempenho";
import { carregarPainel, modo, mostraHorario } from "@/lib/dados";

export const dynamic = "force-dynamic";

export default async function Pagina() {
  const p = await carregarPainel();
  return (
    <Moldura ativa="desempenho" titulo="Desempenho" modo={modo} dono={p.dono} atualizadoEm={p.atualizadoEm}>
      <Desempenho p={p} modo={modo} mostraHorario={mostraHorario} />
    </Moldura>
  );
}
