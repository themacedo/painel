// Contrato do painel.json. O modo privado recebe só totais gerados no Mac depois do sync;
// nenhum lançamento, nome de cliente ou credencial passa por aqui.

export type Status = "feito" | "previsto" | "atencao";

export type Empresa = { nome: string; logo?: string; cor?: string }; // logo: data URL

export type Painel = {
  saude?: Saude;
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
    horas?: HorasSemana[];
    notasMensais?: NotaMensal[];
    atual: { nota: number | null; foraDoExpedientePct: number; destaque: string };
  };
};

// Saúde dos dados (gerada no sync): último sync, cada banco no Pluggy, pendentes de revisão, última comparação da nuvem.
export type Saude = {
  sync: { em: string; status: string; novos: number; ultimoSucesso: string | null } | null;
  conexoes: { banco: string; status: string | null; ultima: string | null; proxima: string | null; consentimento?: string | null }[];
  pendentes: number;
  sombra: { hoje: string | null; sync: string | null; campos: number | null; diferencas: number | null } | null;
};

export type NotaSemanal = { inicio: string; geral: number; areas: Record<string, number>; destaque: string; acao?: string };

// Revisão mensal de coach (ciclo do dia 16 ao 15). grupo dos KPIs: "CLT", "PJ" ou "Geral" (o nome vem de empresas).
export type KpiMensal = { grupo: string; nome: string; antes: number | null; depois: number; unidade?: string; melhorSobe?: boolean };
export type LenteItem = { nome: string; valor: string; status: "ok" | "atencao" | "ruim"; leitura: string };
// Patamar por critério: de/ate são índices em Júnior (0), Pleno (1), Pleno avançado (2), Sênior (3); critico = abaixo da régua.
export type Patamar = { criterio: string; de: number; ate: number; critico?: boolean; leitura: string };
export type NotaMensal = NotaSemanal & { fim: string; acoes?: string[]; kpis?: KpiMensal[]; lentes?: { titulo: string; itens: LenteItem[] }[];
  patamares?: Patamar[]; veredito?: string; revisores?: string };

// Horas nas sessões do Claude numa semana (sábado a sexta), por empresa: total, a parte seg–sex 09–18 ("Expediente")
// e a de 00–06 ("Madrugada"). É um piso: calls e trabalho fora do Claude não entram. Chaves ausentes = 0.
export type HorasSemana = { inicio: string; total: number; paralelo?: number } & Partial<Record<
  "clt" | "pj" | "pessoal" | "outros" | `${"clt" | "pj" | "pessoal" | "outros"}${"Expediente" | "Madrugada"}`, number>>;

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
  cicloCartao?: CicloCartao | null;
  inicioDados?: string; // primeiro dia com dados (o Open Finance traz ~12 meses)
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
  anteriorCompleto?: boolean; // false: o período de comparação começa antes dos dados
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

// Fatura aberta do cartão × a reserva do plano para pagá-la (o item do plano com "fatura"/"cartão" no mês do vencimento)
export type CicloCartao = {
  inicio: string; fechamento: string; vencimento: string;
  teto: number | null; atual: number; comprometido: number; novo: number; projecao: number;
  dias: number; diasPassados: number; diasRestantes: number; porDia: number | null;
  status: "ok" | "atencao" | "estourou" | null;
  reservado?: number; // cobranças recorrentes (assinaturas etc.) que ainda vão cair nesta fatura
  previstas?: { nome: string; valor: number; dia: number }[];
};

// Tela Revisar: a lista que o Mac publica na nuvem (só atrás do login; nunca no painel.json nem no GitHub) e a
// decisão que volta pela fila. valor em reais (negativo = saída).
export type Pendente = { id: number; data: string; valor: number; conta: string; descricao: string; natureza: string | null;
  sugestao: string | null; motivo: string; parcela: string | null };
export type Pendentes = { geradoEm: string; itens: Pendente[]; categorias: { nome: string; natureza: string }[]; essencial: string[] };
export type RevisaoEnvio = { id: number; categoria: string; essencial: string | null };
export type FonteRevisar = { carregar(): Promise<Pendentes>; enviar(revisoes: RevisaoEnvio[]): Promise<number> };

// Avisos de sync (tela Movimentos): o que entrou e saiu em cada sync e o que está para revisar. Valores em centavos.
export type ItemAviso = { id: number; data: string; conta: string; sentido: "entrou" | "saiu"; valor: number; descricao: string;
  meio: string; categoria: string | null; revisar: boolean };
export type Aviso = { id: string; em: string; origem: "mac" | "nuvem"; sync: string; novos: ItemAviso[];
  totais: { entrou: number; saiu: number; lancamentos: number }; revisar: ItemAviso[]; alertas: string[] };
export type ResumoAviso = { id: string; em: string; origem: "mac" | "nuvem"; sync: string; alertas: string[]; lancamentos: number;
  entrou: number; saiu: number; revisar: number };
export type FonteAvisos = { indice(): Promise<ResumoAviso[]>; aviso(id: string): Promise<Aviso> };
