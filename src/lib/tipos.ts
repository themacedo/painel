// Contrato do painel.json. O modo privado recebe só totais gerados no Mac depois do sync;
// nenhum lançamento, nome de cliente ou credencial passa por aqui.

export type Status = "feito" | "previsto" | "atencao";

export type Empresa = { nome: string; logo?: string; cor?: string }; // logo: data URL

export type Painel = {
  atualizadoEm: string; // ISO 8601
  dono: string;
  empresas: { clt: Empresa; pj: Empresa };
  financas: {
    contas: { nome: string; tipo: "PF" | "PJ"; saldo: number }[];
    marco: {
      titulo: string;
      data: string; // AAAA-MM-DD
      disponivel: number;
      pagar: number;
      sobra: number;
      sobraAte: string;
      dependeDe: string[];
    };
    meta: { titulo: string; alvo: number; acumulado: number; proximo: { data: string; valor: number } | null };
    diaADia: { orcamento: number; gasto: number; ate: string };
    plano: { data: string; descricao: string; entra?: number; sai?: number; status: Status }[];
  };
  desempenho: {
    semanas: { rotulo: string; commitsClt: number; commitsPj: number; entregasPj: number; prsClt: number }[];
    historico: Semana[];
    marcos: { data: string; rotulo: string }[];
    notas: { inicio: string; geral: number; areas: Record<string, number>; destaque: string }[];
    atual: { nota: number | null; foraDoExpedientePct: number; destaque: string };
  };
};

// Uma semana da revisão (sábado a sexta). null = não medido naquela semana.
export type Semana = {
  inicio: string; // AAAA-MM-DD
  rotulo: string;
  commitsClt: number; commitsPj: number;
  prsClt: number; bugsClt: number; entregasPj: number; cartoesPj: number | null;
  foraClt: number | null; foraPj: number | null;
  aprov1Clt: number | null; aprov1Pj: number | null;
  constClt: number | null; constPj: number | null;
  cicloClt: number | null; cicloPj: number | null;
};
