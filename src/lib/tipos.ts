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
    meta: {
      titulo: string; alvo: number; acumulado: number; proximo: { data: string; valor: number } | null;
      depositos?: { data: string; valor: number; feito: boolean }[];
    };
    compromissos?: { descricao: string; mensal: number; de: string; ate: string; fixo?: string; pagoNoMes?: boolean }[]; // de/ate: AAAA-MM
    diaADia: { orcamento: number; gasto: number; ate: string };
    plano: { data: string; descricao: string; entra?: number; sai?: number; status: Status }[];
    detalhe?: Detalhe;
  };
  desempenho: {
    semanas: { rotulo: string; commitsClt: number; commitsPj: number; entregasPj: number; prsClt: number }[];
    historico: Semana[];
    marcos: { data: string; rotulo: string }[];
    notas: { inicio: string; geral: number; areas: Record<string, number>; destaque: string; acao?: string }[];
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
  cyclePrClt?: number | null; // dias do 1º commit ao merge (mediana da semana)
  leadPj?: number | null; // dias da criação do card à entrega (mediana)
  regressoesClt?: number | null; // bugs causados por entregas minhas
  pendenciasPj?: number | null; // itens comigo em andamento
  atendClt?: number | null; // dias do 1º commit no bug até a resolução (mediana)
};

// Detalhe da tela Finanças: o mês até hoje contra os mesmos dias do mês anterior.
export type Detalhe = {
  mes: string; ate: string; anteriorAte: string;
  resumo: { receitas: number; despesas: number; despesasAnteriorMesmoPeriodo: number; despesasAnteriorMesCheio: number };
  categorias: {
    nome: string; atual: number; anterior: number;
    n?: number; bruto?: number; // lançamentos e total antes de créditos e estornos
    onde?: { nome: string; valor: number; n: number }[]; // até 3 estabelecimentos; pessoa física aparece sem nome
  }[];
  fixos: { nome: string; valor: number; dia: number; pago: boolean }[];
  parcelas: { mes: string; valor: number; itens?: { nome: string; parcela: string; valor: number; categoria: string }[] }[];
  pj: { faturamento: number; retiradas: number; custos: Record<string, number> };
  // o que entrou de cada fonte (a retirada PJ → PF é o mesmo dinheiro mudando de conta, não conta de novo)
  entradas?: { clt: number; pj: number; outros: number; custosPj: number };
  clt?: Clt;
  periodos?: { semana: Periodo[]; mes: Periodo[]; ano: Periodo[] };
  // dinheiro nas contas − tudo o que se deve no cartão, no fim de cada semana, mês e ano (o último ponto é hoje)
  posicaoSerie?: Record<"semana" | "mes" | "ano", PontoPosicao[]>;
};

export type Posicao = { contas: number; investimentos?: number; cartao: number; emprestimos?: number; posicao: number };
export type PontoPosicao = Posicao & { data: string; rotulo: string };
// o que mexe nas contas e na dívida sem ser receita nem gasto: resultado + ajustes = variação da posição
export type Ajustes = {
  parcelado?: number; // compras parceladas do período (valor total) − parcelas que caíram nele
  contasFora: number; custoPixCredito: number; emprestimos: number; aplicacoes: number;
  outrasTransferencias: number; naoExplicado: number;
};

export type Clt = { itens: { data: string; descricao: string; valor: number; situacao: "recebido" | "previsto" }[]; recebido: number; previsto: number };

// Um período do seletor (semana, mês ou ano). Em curso: cortado em hoje, e a comparação usa os mesmos dias.
export type Periodo = {
  chave: string; rotulo: string; inicio: string; fim: string; ate: string;
  anteriorInicio: string; anteriorAte: string; emCurso: boolean;
  entradas: { clt: number; pj: number; outros: number; custosPj: number };
  resumo: { receitas: number; despesas: number; despesasAnterior: number };
  // como um período negativo foi pago: rotativo do cartão, Pix no crédito para si, resgate líquido de aplicações
  cobertura?: { rotativo: number; pixCredito: number; resgates: number; jurosRotativo: number };
  posicao?: { inicio: Posicao; fim: Posicao }; // na véspera do início e no último dia (ou hoje)
  ajustes?: Ajustes;
  categorias: Detalhe["categorias"];
  clt: Clt;
  pj: Detalhe["pj"];
  fixos?: Detalhe["fixos"];
};
