import { notFound } from "next/navigation";
import { Moldura } from "@/components/Moldura";
import { RevisarWeb } from "@/components/RevisarWeb";
import { carregarPainel, modo } from "@/lib/dados";

export const dynamic = "force-dynamic";

// só no modo privado: o demo público não tem lançamentos (nem fictícios) para revisar
export default async function Pagina() {
  if (modo !== "privado") notFound();
  const p = await carregarPainel();
  return (
    <Moldura ativa="revisar" titulo="Revisar" modo={modo} dono={p.dono} atualizadoEm={p.atualizadoEm}>
      <RevisarWeb />
    </Moldura>
  );
}
