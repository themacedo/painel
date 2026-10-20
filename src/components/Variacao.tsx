// Seta e % de variação. melhorSobe=false para métricas em que cair é bom (ciclo, fora do expediente).
export function Variacao({ atual, antes, melhorSobe = true }: { atual: number | null; antes: number | null; melhorSobe?: boolean }) {
  if (atual == null || antes == null || antes === 0) return <span className="text-xs text-texto-2">sem base</span>;
  const pct = ((atual - antes) / antes) * 100;
  if (Math.abs(pct) < 15) return <span className="text-xs text-texto-2">manteve</span>;
  const bom = pct > 0 === melhorSobe;
  return (
    <span className={`text-xs font-medium ${bom ? "text-ok" : "text-alerta"}`}>
      {pct > 0 ? "▲" : "▼"} {Math.abs(Math.round(pct))}%
    </span>
  );
}
