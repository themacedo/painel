import { notFound } from "next/navigation";
import { Moldura } from "@/components/Moldura";
import { MovimentosWeb } from "@/components/MovimentosWeb";
import { carregarPainel, modo } from "@/lib/dados";

export const dynamic = "force-dynamic";

// só no modo privado: o aviso de cada sync traz lançamentos de verdade (o demo público não tem)
export default async function Pagina({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  if (modo !== "privado") notFound();
  const p = await carregarPainel();
  const { aviso } = await searchParams;
  return (
    <Moldura ativa="movimentos" titulo="Movimentos" modo={modo} dono={p.dono} atualizadoEm={p.atualizadoEm} pendentes={p.saude?.pendentes}>
      <MovimentosWeb inicial={aviso && /^\d{8,14}$/.test(aviso) ? aviso : null} />
    </Moldura>
  );
}
