// Tela compartilhada pelo site (Next) e pelo app desktop (Electron): recebe o painel já carregado.
import { Avaliacao } from "@/components/Avaliacao";
import { Secao } from "@/components/Cartao";
import { HistoricoCommits, HorasPorSemana, Linhas } from "@/components/GraficosDesempenho";
import { Marca } from "@/components/Marca";
import { Contador } from "@/components/Contador";
import { Variacao } from "@/components/Variacao";
import { corClt, corPj } from "@/lib/empresas";
import { diaMes } from "@/lib/formato";
import { comparar, mediaMovel, retrabalho, semanaDe, sobrecarga, type Chave } from "@/lib/metricas";
import { TriangleAlert } from "lucide-react";
import type { Empresa, HorasSemana, Painel, Semana } from "@/lib/tipos";

type Empresas = Painel["empresas"];

const num1 = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const h1 = (v: number) => `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`;
const madrugada = (h: HorasSemana) => (h.cltMadrugada ?? 0) + (h.pjMadrugada ?? 0) + (h.pessoalMadrugada ?? 0) + (h.outrosMadrugada ?? 0);

// Horas nas sessões do Claude: a última semana fechada contra a média das 4 anteriores, o pessoal no horário comercial,
// a madrugada e o gráfico por semana. É um piso (calls e trabalho fora do Claude não entram).
function HorasSessoes({ horas, e, horario }: { horas: HorasSemana[]; e: Empresas; horario: boolean }) {
  const ult = horas.at(-1)!;
  const ant = horas.slice(-5, -1);
  const media = ant.length ? ant.reduce((s, h) => s + h.total, 0) / ant.length : null;
  const todos = [
    { nome: "Total da semana", valor: h1(ult.total), sub: media == null ? "sem base" : `média das 4 anteriores: ${h1(media)}` },
    { nome: `${e.clt.nome} · ${e.pj.nome}`, valor: `${h1(ult.clt ?? 0)} · ${h1(ult.pj ?? 0)}`,
      sub: horario ? `${h1(ult.paralelo ?? 0)} com as duas abertas ao mesmo tempo` : "na semana" },
    { nome: "Pessoal em horário comercial", valor: h1(ult.pessoalExpediente ?? 0), sub: `de ${h1(ult.pessoal ?? 0)} no pessoal` },
    { nome: "Madrugada (00–06 h)", valor: h1(madrugada(ult)), sub: media == null ? "" : `média das 4 anteriores: ${h1(ant.reduce((s, h) => s + madrugada(h), 0) / ant.length)}` },
  ];
  const itens = horario ? todos : todos.slice(0, 2); // demo: sem horário comercial nem madrugada
  return (
    <>
      <dl className={`mb-4 grid grid-cols-2 gap-3 ${horario ? "lg:grid-cols-4" : ""}`}>
        {itens.map((i) => (
          <div key={i.nome} className="rounded-xl bg-superficie p-3">
            <dt className="text-xs text-texto-2">{i.nome}</dt>
            <dd className="num mt-1 text-lg font-medium">{i.valor}</dd>
            {i.sub && <p className="mt-1 text-xs text-texto-2">{i.sub}</p>}
          </div>
        ))}
      </dl>
      <HorasPorSemana horas={horas} series={[
        { chave: "clt", nome: e.clt.nome, cor: corClt(e) },
        { chave: "pj", nome: e.pj.nome, cor: corPj(e) },
        { chave: "pessoal", nome: "Pessoal", cor: "var(--barra-2)" },
        { chave: "outros", nome: "Sem classificação", cor: "var(--barra)" },
      ]} />
      <p className="mt-2 text-xs text-texto-2">
        Tempo ativo nas sessões do Claude (pausas acima de 10 min não contam), semanas de sábado a sexta. É um piso: calls,
        Teams e trabalho fora do Claude não aparecem.
      </p>
    </>
  );
}


type Metrica = { nome: string; chave: Chave; casas?: number; sufixo?: string; melhorSobe?: boolean; sub?: React.ReactNode };

function CartaoEmpresa({ empresa, hist, metricas }: { empresa: Empresa; hist: Semana[]; metricas: Metrica[] }) {
  return (
    <section className="rounded-2xl border border-borda bg-superficie-2 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Marca empresa={empresa} tamanho={22} />
        <h2 className="text-sm font-semibold">{empresa.nome}</h2>
        <span className="ml-auto text-xs text-texto-2">média das últimas 4 semanas</span>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        {metricas.map((m) => {
          const { atual, antes } = comparar(hist, m.chave);
          return (
            <div key={m.nome} className="rounded-xl bg-superficie p-3">
              <dt className="text-xs text-texto-2">{m.nome}</dt>
              <dd className="mt-1 flex items-baseline justify-between gap-2">
                <span className="num text-lg font-medium">{atual == null ? "—" : <Contador valor={atual} casas={m.casas ?? 0} formato={m.sufixo === "%" ? "pct" : "num"} />}</span>
                <Variacao atual={atual} antes={antes} melhorSobe={m.melhorSobe} />
              </dd>
              {m.sub && <p className="mt-1 text-xs text-texto-2">{m.sub}</p>}
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export function Desempenho({ p, modo, mostraHorario }: { p: Painel; modo: string; mostraHorario: boolean }) {
  void modo; void mostraHorario;
  const { historico: hist, marcos, notas } = p.desempenho;
  const e = p.empresas;
  const marco = marcos[0] && semanaDe(hist, marcos[0].data);
  const ultima = notas.at(-1);
  const mmClt = mediaMovel(hist, "foraClt");
  const mmPj = mediaMovel(hist, "foraPj");
  const fora = hist.map((s, i) => ({ rotulo: s.rotulo, clt: mmClt[i], pj: mmPj[i] }));
  const retr = retrabalho(hist);
  const desdeCriacao = comparar(hist, "cicloClt").atual; // inclui o tempo parado no backlog antes de chegar a mim
  const alerta = mostraHorario ? sobrecarga(hist, ultima?.areas["Energia e sono"]) : null;
  const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v)}%`);
  const mes = p.desempenho.notasMensais?.at(-1);
  const empresaDo: Record<string, Empresa | undefined> = { CLT: e.clt, PJ: e.pj };
  const gruposKpi = [...new Set((mes?.kpis ?? []).map((k) => k.grupo))].map((g) => ({
    grupo: g, nome: empresaDo[g]?.nome ?? g, empresa: empresaDo[g], kpis: (mes?.kpis ?? []).filter((k) => k.grupo === g),
  }));

  return (
    <div className="flex flex-col gap-3.5">
      {alerta && (
        <div role="status" className="entrar flex gap-3 rounded-2xl border border-alerta/40 bg-alerta-suave p-4 text-sm">
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-alerta" />
          <div>
            <p className="font-medium text-alerta">Risco de sobrecarga</p>
            <p className="mt-0.5">
              Fora do expediente em {pct(alerta.clt)} ({e.clt.nome}) e {pct(alerta.pj)} ({e.pj.nome}) na média de 4 semanas,
              com energia e sono em {alerta.energia}/10.
            </p>
            <p className="mt-1 text-texto-2">Ação da semana: {ultima?.acao ?? "horário de parada fixo e menos frentes em paralelo."}</p>
          </div>
        </div>
      )}

      {/* topo: cada frente com o ciclo contra antes de 15/09 (da avaliação mensal); sem avaliação, a média de 4 semanas */}
      {gruposKpi.length ? (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          {gruposKpi.map((g) => (
            <section key={g.grupo} className="entrar rounded-2xl border border-borda bg-superficie p-5 sm:p-6">
              <div className="mb-2 flex items-center gap-2.5">
                {g.empresa ? <Marca empresa={g.empresa} tamanho={24} /> : null}
                <h2 className="text-[17px] font-semibold">{g.nome}</h2>
                <span className="ml-auto text-xs text-texto-2">antes de 15/09 × ciclo</span>
              </div>
              {g.kpis.map((k) => {
                const u = k.unidade ?? "";
                const melhorou = k.antes == null || k.antes === k.depois ? null : (k.depois > k.antes) === (k.melhorSobe ?? true);
                const v = k.antes ? Math.round(((k.depois - k.antes) / k.antes) * 100) : null;
                return (
                  <div key={k.nome} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 border-t border-borda py-3.5">
                    <span className="text-[13px] text-texto-2">{k.nome}</span>
                    <span className={`num text-xs font-medium ${melhorou == null ? "text-texto-2" : melhorou ? "text-ok" : "text-alerta"}`}>
                      {v == null ? "" : `${v > 0 ? "▲" : "▼"} ${Math.abs(v)}%`}
                    </span>
                    <span className="num text-3xl font-medium">{num1(k.depois)}{u}</span>
                    <span className="num text-xs text-texto-2">{k.antes == null ? "sem base anterior" : `antes ${num1(k.antes)}${u}`}</span>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      ) : null}

      <Avaliacao semanais={notas} mensais={p.desempenho.notasMensais ?? []} nomes={{ CLT: e.clt.nome, PJ: e.pj.nome, Geral: "Geral" }} semKpis={!!gruposKpi.length} />

      <Secao titulo="Últimas 4 semanas" resumo="média móvel de cada frente, com a variação">
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <CartaoEmpresa empresa={e.clt} hist={hist} metricas={[
            { nome: "PRs por semana", chave: "prsClt", casas: 1 },
            { nome: "Cycle time do PR (dias)", chave: "cyclePrClt", casas: 1, melhorSobe: false },
            { nome: "Aprovação de 1ª", chave: "aprov1Clt", sufixo: "%",
              sub: retr ? <>Retrabalho: {retr.pct.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% ({retr.regr} de {retr.prs} PRs)</> : "Retrabalho: sem registro" },
            { nome: "Bugs resolvidos (sustentação)", chave: "bugsClt", casas: 1 },
            { nome: "Tempo de atendimento (dias)", chave: "atendClt", casas: 1, melhorSobe: false,
              sub: desdeCriacao == null ? undefined : <>Desde a abertura do bug: {desdeCriacao.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias</> },
            ...(mostraHorario ? [{ nome: "Fora do expediente", chave: "foraClt" as Chave, sufixo: "%", melhorSobe: false }] : []),
          ]} />
          <CartaoEmpresa empresa={e.pj} hist={hist} metricas={[
            { nome: "Entregas por semana", chave: "entregasPj", casas: 1 },
            { nome: "Lead time do card (dias)", chave: "leadPj", casas: 1, melhorSobe: false },
            { nome: "Aprovação de 1ª", chave: "aprov1Pj", sufixo: "%" },
            { nome: "Constância (8 semanas)", chave: "constPj", sufixo: "%" },
            { nome: "Pendências comigo", chave: "pendenciasPj", casas: 1, melhorSobe: false },
            ...(mostraHorario ? [{ nome: "Fora do expediente", chave: "foraPj" as Chave, sufixo: "%", melhorSobe: false }] : []),
          ]} />
        </div>
      </Secao>

      <Secao titulo={`Commits por semana · ${hist.length} semanas desde ${hist[0] ? diaMes(hist[0].inicio) : "—"}`} resumo={
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><Marca empresa={e.clt} tamanho={14} />{e.clt.nome}</span>
          <span className="flex items-center gap-1.5"><Marca empresa={e.pj} tamanho={14} />{e.pj.nome}</span>
        </span>}>
        <HistoricoCommits hist={hist}
          series={[{ chave: "commitsClt", nome: e.clt.nome, cor: corClt(e) }, { chave: "commitsPj", nome: e.pj.nome, cor: corPj(e) }]}
          marco={marco ? { rotulo: marco, texto: `${diaMes(marcos[0].data)} · ${marcos[0].rotulo}` } : undefined} />
      </Secao>

      <Secao titulo={mostraHorario ? "Entregas, PRs e fora do expediente" : "Entregas e PRs"} resumo={
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><i className="h-0.5 w-3 rounded" style={{ background: corClt(e) }} />PRs</span>
          <span className="flex items-center gap-1.5"><i className="h-0.5 w-3 rounded" style={{ background: corPj(e) }} />Entregas</span>
        </span>}>
        <div className={`grid grid-cols-1 gap-5 ${mostraHorario ? "xl:grid-cols-2" : ""}`}>
          <Linhas hist={hist} series={[
            { chave: "prsClt", nome: `PRs ${e.clt.nome}`, cor: corClt(e) },
            { chave: "entregasPj", nome: `Entregas ${e.pj.nome}`, cor: corPj(e) },
          ]} />
          {mostraHorario && (
            <div>
              <p className="mb-2 text-sm font-semibold">Commits fora do expediente <span className="text-xs font-normal text-texto-2">média móvel de 4 semanas</span></p>
              <Linhas hist={fora} unidade="%" dominio={[0, 100]} series={[
                { chave: "clt", nome: e.clt.nome, cor: corClt(e) },
                { chave: "pj", nome: e.pj.nome, cor: corPj(e) },
              ]} />
            </div>
          )}
        </div>
      </Secao>

      {!!p.desempenho.horas?.length && (
        <Secao titulo={`Horas nas sessões · semana de ${diaMes(p.desempenho.horas.at(-1)!.inicio)}`} resumo={
          <span className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5"><Marca empresa={e.clt} tamanho={14} />{e.clt.nome}</span>
            <span className="flex items-center gap-1.5"><Marca empresa={e.pj} tamanho={14} />{e.pj.nome}</span>
            <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm" style={{ background: "var(--barra-2)" }} />Pessoal</span>
          </span>}>
          <HorasSessoes horas={p.desempenho.horas} e={e} horario={mostraHorario} />
        </Secao>
      )}
    </div>
  );
}
