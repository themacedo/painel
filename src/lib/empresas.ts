import type { Painel } from "./tipos";

type Empresas = Painel["empresas"];
export const corClt = (e: Empresas) => e.clt.cor ?? "var(--barra)";
export const corPj = (e: Empresas) => e.pj.cor ?? "var(--primaria)";
