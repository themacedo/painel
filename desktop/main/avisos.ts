// Quando avisar (notificação do macOS), a partir do painel que acabou de chegar. Pura: recebe o painel, o "agora" e as
// chaves já avisadas (guardadas em disco) e devolve os avisos novos. Cada aviso tem uma chave: o mesmo aviso não
// repete, nem depois de reabrir o app.
export type Aviso = { chave: string; titulo: string; texto: string };

type P = Record<string, any>;
const H = 3_600_000;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dia = (iso: string) => iso.slice(0, 10);

export function decidirAvisos(p: P, agora: number, jaAvisados: Set<string>): Aviso[] {
  const out: Aviso[] = [];
  const s = p["saude"] ?? {};

  // 1) um sync novo
  const sync = s["sync"];
  if (sync?.em) {
    // como no celular: só "Sync concluído"; o que entrou, saiu e espera revisão fica na tela Movimentos (o clique abre)
    out.push({ chave: `sync:${sync.em}`, titulo: sync.status === "error" ? "O sync falhou" : "Sync concluído",
      texto: sync.status === "error" ? "Os dados não foram atualizados. Abra o Painel para ver." : "Toque para ver" });
  }

  // 2) banco parado no Pluggy (mais de 26 h), uma vez por banco por dia
  for (const c of s["conexoes"] ?? []) {
    const idade = c.ultima ? (agora - Date.parse(c.ultima)) / H : Infinity;
    if (c.status !== "UPDATED" || idade > 26) {
      out.push({ chave: `banco:${c.banco}:${dia(new Date(agora).toISOString())}`, titulo: `${c.banco} sem atualizar`,
        texto: c.status !== "UPDATED" ? `A conexão está em ${c.status}. Veja em meu.pluggy.ai.` : `Última atualização há ${Math.round(idade)} h. Atualize em meu.pluggy.ai.` });
    }
    // 3) autorização do Meu Pluggy perto de vencer (30 dias) ou vencida, uma vez por semana
    if (c.consentimento) {
      const dias = (Date.parse(c.consentimento) - agora) / (24 * H);
      if (dias <= 30) {
        const semana = Math.floor(agora / (7 * 24 * H));
        out.push({ chave: `consentimento:${c.banco}:${semana}`, titulo: dias < 0 ? `Autorização do ${c.banco} venceu` : `Autorização do ${c.banco} vence em ${Math.ceil(dias)} dias`,
          texto: "Renove em meu.pluggy.ai para o sync continuar." });
      }
    }
  }

  // 4) a nuvem divergiu do Mac
  const sombra = s["sombra"];
  if (sombra?.hoje && Number(sombra.diferencas ?? 0) > 0) {
    out.push({ chave: `sombra:${sombra.hoje}`, titulo: "Nuvem diferente do Mac", texto: `${sombra.diferencas} diferença(s) na comparação de ${sombra.hoje}.` });
  }

  // 5) cartão: passou do que o plano paga, uma vez por fatura
  const ciclo = p["financas"]?.["detalhe"]?.["cicloCartao"];
  if (ciclo?.status === "estourou") {
    out.push({ chave: `cartao:${ciclo.fechamento}`, titulo: "Cartão passou do plano",
      texto: `A fatura aberta está em ${brl(ciclo.atual)}, acima dos ${brl(ciclo.teto)} que o plano reserva.` });
  }

  return out.filter((a) => !jaAvisados.has(a.chave));
}
