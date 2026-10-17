"use client";

import { useEffect, useState } from "react";

// false quando o sistema pede "reduzir movimento" (os gráficos aparecem já prontos).
export function useMovimento() {
  const [ok, setOk] = useState(true);
  useEffect(() => setOk(!window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  return ok;
}
