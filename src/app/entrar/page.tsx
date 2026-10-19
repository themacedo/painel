import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, emailPermitido, loginGoogleConfigurado } from "@/lib/auth";
import { modo } from "@/lib/dados";
import { BotaoGoogle } from "./BotaoGoogle";

export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  AccessDenied: "Esta conta Google não tem acesso a este painel.",
  OAuthCallback: "O Google não completou o login. Tente de novo.",
  Callback: "O Google não completou o login. Tente de novo.",
};

export default async function Entrar({ searchParams }: { searchParams: Promise<{ error?: string; callbackUrl?: string }> }) {
  if (modo === "demo") redirect("/");
  const { error, callbackUrl } = await searchParams;
  const sessao = await getServerSession(authOptions);
  // só caminhos deste site (nada de redirecionar para fora depois do login)
  const destino = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";
  if (sessao && emailPermitido(sessao.user?.email)) redirect(destino);

  return (
    <main className="grid min-h-dvh place-items-center bg-fundo px-4">
      <div className="entrar w-full max-w-sm rounded-2xl border border-borda bg-superficie p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primaria text-base font-bold text-white">P</span>
          <span className="text-lg font-semibold">Painel</span>
        </div>
        <h1 className="text-xl font-semibold">Entrar</h1>
        <p className="mt-1 text-sm text-texto-2">Finanças e desempenho, só para você.</p>
        {error && (
          <p role="alert" className="mt-5 rounded-lg bg-alerta-suave px-3 py-2 text-sm text-alerta">
            {ERROS[error] ?? "Não foi possível entrar. Tente de novo."}
          </p>
        )}
        <div className="mt-6">
          {loginGoogleConfigurado() ? <BotaoGoogle destino={destino} />
            : <p className="text-sm text-texto-2">O login com Google ainda não foi configurado neste site.</p>}
        </div>
        <p className="mt-8 text-xs text-texto-2">Acesso restrito. A sessão dura 30 dias neste aparelho.</p>
      </div>
    </main>
  );
}
