"use client";

import { useLayoutEffect, useRef, useState } from "react";

type Formato = "brl" | "brlCurto" | "num" | "pct";

function formatar(v: number, formato: Formato, casas: number) {
  switch (formato) {
    case "brl": return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    case "brlCurto": return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
    case "pct": return `${v.toLocaleString("pt-BR", { maximumFractionDigits: casas })}%`;
    default: return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }
}

// Conta de 0 até o valor ao montar. O HTML do servidor já vem com o valor final; a contagem
// começa antes da primeira pintura (sem piscar) e não acontece com "reduzir movimento".
export function Contador({ valor, formato = "num", casas = 0, duracao = 900 }: {
  valor: number; formato?: Formato; casas?: number; duracao?: number;
}) {
  const [atual, setAtual] = useState(valor);
  const quadro = useRef(0);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setAtual(valor);
    const inicio = performance.now();
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracao);
      setAtual(valor * (1 - Math.pow(1 - t, 3))); // ease-out cúbico
      if (t < 1) quadro.current = requestAnimationFrame(passo);
    };
    setAtual(0);
    quadro.current = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro.current);
  }, [valor, duracao]);

  return <span className="tabular-nums">{formatar(atual, formato, casas)}</span>;
}
