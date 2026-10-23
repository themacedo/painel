"use client";
// Coach da semana: a leitura da semana, o veredito e as ações para a semana seguinte em destaque (e a conversa, quando
// houver mais de um coach). Só aparece quando a semana tem a conversa gravada na revisão de sexta.
import { MessagesSquare } from "lucide-react";
import type { CoachSemana as Coach } from "@/lib/tipos";

const diaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const fimDa = (inicio: string) => new Date(Date.parse(`${inicio}T12:00:00Z`) + 6 * 86_400_000).toISOString().slice(0, 10);

export function CoachSemana({ inicio, coach }: { inicio: string; coach: Coach }) {
  const acoes = coach.acoes ?? [];
  return (
    <section className="entrar rounded-2xl border border-borda bg-superficie p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <MessagesSquare size={18} className="text-primaria" aria-hidden />
        <h2 className="text-[15px] font-semibold">Coach da semana</h2>
        <span className="ml-auto text-xs text-texto-2">
          {diaMes(inicio)} a {diaMes(fimDa(inicio))}{coach.modelos?.length ? ` · ${coach.modelos.join(" e ")}` : ""}
        </span>
      </div>

      {coach.veredito && <p className="mb-3 text-[15px] font-medium leading-snug">{coach.veredito}</p>}

      {acoes.length > 0 && (
        <div className="mb-4 rounded-xl bg-primaria-suave p-3.5">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-texto-2">Para a próxima semana</p>
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
            {acoes.map((a) => <li key={a}>{a}</li>)}
          </ol>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {coach.conversa.map((f, i) => (
          <li key={i} className="border-l-2 border-borda pl-3">
            <p className="mb-0.5 text-xs font-medium text-texto-2">{f.autor}</p>
            <p className="whitespace-pre-line text-sm leading-relaxed">{f.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
