import { Cartao, Moldura } from "@/components/Moldura";
import { HistoricoCommits, Linhas } from "@/components/GraficosDesempenho";
import { Marca } from "@/components/Marca";
import { Contador } from "@/components/Contador";
import { Variacao } from "@/components/Variacao";
import { carregarPainel, modo } from "@/lib/dados";
import { corClt, corPj } from "@/lib/empresas";
import { diaMes } from "@/lib/formato";
import { comparar, mediaMovel, retrabalho, semanaDe, sobrecarga, type Chave } from "@/lib/metricas";
import { TriangleAlert } from "lucide-react";
import type { Empresa, Semana } from "@/lib/tipos";

export const dynamic = "force-dynamic";

type Metrica = { nome: string; chave: Chave; casas?: number; sufixo?: string; melhorSobe?: boolean; sub?: React.ReactNode };

function CartaoEmpresa({ empresa, hist, metricas }: { empresa: Empresa; hist: Semana[]; metricas: Metrica[] }) {
  return (
    <section className="entrar rounded-xl border border-borda bg-superficie p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Marca empresa={empresa} tamanho={22} />
        <h2 className="text-sm font-semibold">{empresa.nome}</h2>
        <span className="ml-auto text-xs text-texto-2">média das últimas 4 semanas</span>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        {metricas.map((m) => {
          const { atual, antes } = comparar(hist, m.chave);
          return (
            <div key={m.nome} className="rounded-lg bg-fundo p-3">
              <dt className="text-xs text-texto-2">{m.nome}</dt>
              <dd className="mt-1 flex items-baseline justify-between gap-2">
                <span className="text-lg font-semibold">{atual == null ? "—" : <Contador valor={atual} casas={m.casas ?? 0} formato={m.sufixo === "%" ? "pct" : "num"} />}</span>
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

export default async function Desempenho() {
  const p = await carregarPainel();
  const { historico: hist, marcos, notas } = p.desempenho;
  const e = p.empresas;
  const marco = marcos[0] && semanaDe(hist, marcos[0].data);
  const ultima = notas.at(-1);
  const anterior = notas.at(-2);
  const mmClt = mediaMovel(hist, "foraClt");
  const mmPj = mediaMovel(hist, "foraPj");
  const fora = hist.map((s, i) => ({ rotulo: s.rotulo, clt: mmClt[i], pj: mmPj[i] }));
  const retr = retrabalho(hist);
  const alerta = sobrecarga(hist, ultima?.areas["Energia e sono"]);
  const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v)}%`);

  return (
    <Moldura ativa="desempenho" titulo="Desempenho" modo={modo} dono={p.dono} atualizadoEm={p.atualizadoEm}>
      {alerta && (
        <div role="status" className="entrar mb-3 flex gap-3 rounded-xl border border-alerta/40 bg-alerta-suave p-4 text-sm">
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
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <CartaoEmpresa empresa={e.clt} hist={hist} metricas={[
          { nome: "PRs por semana", chave: "prsClt", casas: 1 },
          { nome: "Cycle time do PR (dias)", chave: "cyclePrClt", casas: 1, melhorSobe: false },
          { nome: "Aprovação de 1ª", chave: "aprov1Clt", sufixo: "%",
            sub: retr ? <>Retrabalho: {retr.pct.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% ({retr.regr} de {retr.prs} PRs)</> : "Retrabalho: sem registro" },
          { nome: "Bugs resolvidos (sustentação)", chave: "bugsClt", casas: 1 },
          { nome: "Bug na fila (dias)", chave: "cicloClt", casas: 1, melhorSobe: false },
          { nome: "Fora do expediente", chave: "foraClt", sufixo: "%", melhorSobe: false },
        ]} />
        <CartaoEmpresa empresa={e.pj} hist={hist} metricas={[
          { nome: "Entregas por semana", chave: "entregasPj", casas: 1 },
          { nome: "Lead time do card (dias)", chave: "leadPj", casas: 1, melhorSobe: false },
          { nome: "Aprovação de 1ª", chave: "aprov1Pj", sufixo: "%" },
          { nome: "Constância (8 semanas)", chave: "constPj", sufixo: "%" },
          { nome: "Pendências comigo", chave: "pendenciasPj", casas: 1, melhorSobe: false },
          { nome: "Fora do expediente", chave: "foraPj", sufixo: "%", melhorSobe: false },
        ]} />
      </div>

      <div className="mt-3">
        <Cartao titulo={`Commits por semana · ${hist.length} semanas desde ${hist[0] ? diaMes(hist[0].inicio) : "—"}`} extra={
          <div className="flex items-center gap-3 text-xs text-texto-2">
            <span className="flex items-center gap-1.5"><Marca empresa={e.clt} tamanho={14} />{e.clt.nome}</span>
            <span className="flex items-center gap-1.5"><Marca empresa={e.pj} tamanho={14} />{e.pj.nome}</span>
          </div>}>
          <HistoricoCommits hist={hist}
            series={[{ chave: "commitsClt", nome: e.clt.nome, cor: corClt(e) }, { chave: "commitsPj", nome: e.pj.nome, cor: corPj(e) }]}
            marco={marco ? { rotulo: marco, texto: `${diaMes(marcos[0].data)} · ${marcos[0].rotulo}` } : undefined} />
        </Cartao>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Cartao titulo="Entregas e PRs" extra={
          <div className="flex items-center gap-3 text-xs text-texto-2">
            <span className="flex items-center gap-1.5"><i className="h-0.5 w-3 rounded" style={{ background: corClt(e) }} />PRs</span>
            <span className="flex items-center gap-1.5"><i className="h-0.5 w-3 rounded" style={{ background: corPj(e) }} />Entregas</span>
          </div>}>
          <Linhas hist={hist} series={[
            { chave: "prsClt", nome: `PRs ${e.clt.nome}`, cor: corClt(e) },
            { chave: "entregasPj", nome: `Entregas ${e.pj.nome}`, cor: corPj(e) },
          ]} />
        </Cartao>
        <Cartao titulo="Commits fora do expediente" extra={<span className="text-xs text-texto-2">média móvel de 4 semanas</span>}>
          <Linhas hist={fora} unidade="%" dominio={[0, 100]} series={[
            { chave: "clt", nome: e.clt.nome, cor: corClt(e) },
            { chave: "pj", nome: e.pj.nome, cor: corPj(e) },
          ]} />
        </Cartao>
      </div>

      <div className="mt-3">
        <Cartao titulo={ultima ? `Avaliação da semana de ${diaMes(ultima.inicio)}` : "Avaliação da semana"} extra={
          ultima && <p className="text-sm"><b className="text-lg"><Contador valor={ultima.geral} casas={1} /></b>
            <span className="text-texto-2"> / 10 geral</span></p>}>
          {ultima ? (
            <>
              <p className="mb-4 text-sm">{ultima.destaque}</p>
              <ul className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                {Object.entries(ultima.areas).map(([area, nota]) => {
                  const antes = anterior?.areas[area];
                  const cor = nota >= 8 ? "bg-ok" : nota >= 6 ? "bg-primaria" : nota >= 4 ? "bg-alerta" : "bg-perigo";
                  return (
                    <li key={area}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{area}</span>
                        <span className="font-medium">{nota}
                          {antes != null && antes !== nota && (
                            <span className={`ml-1.5 text-xs ${nota > antes ? "text-ok" : "text-perigo"}`}>{nota > antes ? "▲" : "▼"}{Math.abs(nota - antes)}</span>
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-primaria-suave">
                        <div className={`encher h-full rounded-full ${cor}`} style={{ width: `${nota * 10}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              {notas.length < 2 && <p className="mt-4 text-xs text-texto-2">A comparação com a semana anterior aparece a partir da próxima revisão.</p>}
            </>
          ) : <p className="text-sm text-texto-2">Ainda sem avaliação registrada.</p>}
        </Cartao>
      </div>
    </Moldura>
  );
}
