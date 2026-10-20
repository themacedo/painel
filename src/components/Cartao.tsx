// Cartão base das telas (sem nada de Next: o app desktop usa o mesmo).
export function Cartao({ titulo, extra, children }: { titulo: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="entrar rounded-2xl border border-borda bg-superficie p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

// Seção do fim da tela: começa aberta e recolhe com um toque. O resumo fica ao lado do título.
export function Secao({ titulo, resumo, children }: { titulo: string; resumo?: React.ReactNode; children: React.ReactNode }) {
  return (
    <details open className="secao entrar rounded-2xl border border-borda bg-superficie">
      <summary className="flex min-h-13 items-center gap-3 px-4 font-semibold sm:px-5">
        <span className="text-[15px]">{titulo}</span>
        {resumo && <span className="ml-auto truncate text-xs font-normal text-texto-2">{resumo}</span>}
      </summary>
      <div className="border-t border-borda p-4 sm:p-5">{children}</div>
    </details>
  );
}
