import type { Painel, Status } from "@/lib/tipos";
import { diaMes, reais } from "@/lib/formato";

const selo: Record<Status, { texto: string; classe: string }> = {
  feito: { texto: "Feito", classe: "bg-ok-suave text-ok" },
  previsto: { texto: "Previsto", classe: "bg-primaria-suave text-primaria" },
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
              <td className="py-2.5 pr-3 text-texto-2">{diaMes(p.data)}</td>
              <td className="py-2.5 pr-3">{p.descricao}</td>
              <td className="py-2.5 pr-3 text-right text-ok">{p.entra ? reais(p.entra) : "—"}</td>
              <td className="py-2.5 pr-3 text-right">{p.sai ? reais(p.sai) : "—"}</td>
              <td className="py-2.5">
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${selo[p.status].classe}`}>{selo[p.status].texto}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
