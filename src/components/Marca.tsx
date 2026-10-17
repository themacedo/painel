import type { Empresa } from "@/lib/tipos";

// Logo (data URL vindo do painel.json) ou a inicial, com a cor da empresa.
export function Marca({ empresa, tamanho = 18 }: { empresa: Empresa; tamanho?: number }) {
  if (empresa.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={empresa.logo} alt="" width={tamanho} height={tamanho} className="shrink-0 rounded object-contain" />;
  }
  return (
    <span className="grid shrink-0 place-items-center rounded text-[10px] font-bold text-white"
      style={{ width: tamanho, height: tamanho, background: empresa.cor ?? "var(--texto-2)" }}>
      {empresa.nome.charAt(0)}
    </span>
  );
}
