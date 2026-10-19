"use client";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function BotaoSair({ compacto = false }: { compacto?: boolean }) {
  return (
    <button type="button" onClick={() => void signOut({ callbackUrl: "/entrar" })}
      className={compacto ? "shrink-0 rounded-lg px-3 py-1.5 text-sm text-texto-2"
        : "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-texto-2 hover:text-texto"}>
      {!compacto && <LogOut size={16} />}
      Sair
    </button>
  );
}
