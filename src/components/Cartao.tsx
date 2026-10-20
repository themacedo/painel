// Cartão base das telas (sem nada de Next: o app desktop usa o mesmo).
export function Cartao({ titulo, extra, children }: { titulo: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="entrar rounded-xl border border-borda bg-superficie p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}
