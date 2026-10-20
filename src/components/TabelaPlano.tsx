import type { Painel, Status } from "@/lib/tipos";
import { diaMes, reais } from "@/lib/formato";

const selo: Record<Status, { texto: string; classe: string }> = {
  feito: { texto: "Feito", classe: "bg-barra text-texto-2" },
  previsto: { texto: "Previsto", classe: "border border-borda text-texto-2" },
  atencao: { texto: "Atenção", classe: "bg-alerta-suave text-alerta" },
};

export function TabelaPlano({ plano }: { plano: Painel["financas"]["plano"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-borda text-left text-xs text-texto-2">
            <th className="py-2 pr-3 font-medium">Data</th>
            <th className="py-2 pr-3 font-medium">Item</th>
            <th className="py-2 pr-3 text-right font-medium">Entra</th>
            <th className="py-2 pr-3 text-right font-medium">Sai</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {plano.map((p, i) => (
            <tr key={i} className="border-b border-borda last:border-0">
              <td className="num py-2.5 pr-3 text-[13px] text-texto-2">{diaMes(p.data)}</td>
              <td className="py-2.5 pr-3">{p.descricao}</td>
              <td className="num py-2.5 pr-3 text-right text-[13px] text-ok">{p.entra ? reais(p.entra) : "—"}</td>
              <td className="num py-2.5 pr-3 text-right text-[13px]">{p.sai ? reais(p.sai) : "—"}</td>
              <td className="py-2.5">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${selo[p.status].classe}`}>{selo[p.status].texto}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
