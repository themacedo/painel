"use client";
// O sino do topo (site e celular): leva à tela Movimentos e marca com um ponto quando há aviso de sync que você não viu.
import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { ULTIMO_VISTO } from "@/telas/Movimentos";

export function SinoAvisos({ ativo = false }: { ativo?: boolean }) {
  const [novo, setNovo] = useState(false);
  useEffect(() => {
    fetch("/api/avisos", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])).then((lista: { id: string }[]) => {
      let visto: string | null = null;
      try { visto = localStorage.getItem(ULTIMO_VISTO); } catch { /* sem armazenamento */ }
      setNovo(!!lista[0] && lista[0].id !== visto);
    }).catch(() => {});
  }, []);
  return (
    <Link href="/movimentos" aria-label={novo ? "Movimentos: há aviso novo" : "Movimentos"}
      className={`relative grid size-9 place-items-center rounded-xl ${ativo ? "bg-primaria-suave text-primaria" : "text-texto-2 hover:text-texto"}`}>
      <Bell size={19} strokeWidth={1.8} />
      {novo && !ativo && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-alerta" />}
    </Link>
  );
}
