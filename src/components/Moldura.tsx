import Link from "next/link";
import { BotaoSair } from "./BotaoSair";
import { Casca, type Tela } from "./Casca";
import { SinoAvisos } from "./SinoAvisos";
import { dataHora } from "@/lib/formato";

// com o login do Google ligado, há sessão para encerrar
const comLogin = () => process.env.PAINEL_MODO === "privado" && Boolean(process.env.AUTH_GOOGLE_ID);

type Props = {
  ativa: Tela; titulo: string; modo: string; dono: string; atualizadoEm: string; pendentes?: number; children: React.ReactNode;
};

// A moldura do site: a mesma Casca do app do Mac, com as abas virando links.
export function Moldura({ ativa, titulo, modo, dono, atualizadoEm, pendentes, children }: Props) {
  // Revisar mostra lançamentos de verdade: só no modo privado
  const telas: Tela[] = ["visao", "plano", "financas", "desempenho", ...(modo === "privado" ? ["revisar" as const] : [])];
  return (
    <Casca telas={telas} ativa={ativa} titulo={titulo} pendentes={pendentes}
      aba={(t, p) => <Link href={t.href} {...p} />}
      linha={<>Olá, {dono.split(" ")[0]} · atualizado em {dataHora(atualizadoEm)}</>}
      selo={modo === "demo"
        ? <span className="shrink-0 rounded-full bg-alerta-suave px-3 py-1 text-xs font-medium text-alerta">Dados fictícios</span>
        : <SinoAvisos ativo={ativa === "movimentos"} />}
      rodape={<>
        {comLogin() && <BotaoSair />}
        <p className="mt-1 px-2.5 text-xs text-texto-2">{modo === "demo" ? "Modo demonstração" : "Modo privado"}</p>
      </>}
      topoMovel={comLogin() && <BotaoSair compacto />}>
      {children}
    </Casca>
  );
}

export { Cartao } from "./Cartao";
