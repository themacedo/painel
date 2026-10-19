"use client";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

// compacto: só o ícone (no celular, no fim da linha das abas)
export function BotaoSair({ compacto = false }: { compacto?: boolean }) {
  const sair = () => void signOut({ callbackUrl: "/entrar" });
  if (compacto) {
    return (
      <button type="button" onClick={sair} aria-label="Sair" title="Sair"
        className="grid size-8 shrink-0 place-items-center rounded-lg border border-borda text-texto-2 hover:text-texto">
        <LogOut size={16} />
      </button>
    );
  }
  return (
    <button type="button" onClick={sair}
      className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-texto-2 hover:text-texto">
      <LogOut size={16} />
      Sair
    </button>
  );
}
