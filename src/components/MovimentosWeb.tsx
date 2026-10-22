"use client";
// No site e no celular a tela Movimentos fala com as rotas /api/* do próprio site, que repassam para a API da nuvem.
// Aqui também fica o botão que inscreve este aparelho no push dos avisos de sync.
import Link from "next/link";
import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Movimentos } from "@/telas/Movimentos";
import type { Aviso, FonteAvisos, ResumoAviso } from "@/lib/tipos";

async function json<T>(r: Response): Promise<T> {
  const corpo = (await r.json().catch(() => ({}))) as T & { erro?: string };
  if (!r.ok) throw new Error(corpo.erro ?? `HTTP ${r.status}`);
  return corpo;
}
const fonte: FonteAvisos = {
  indice: async () => json<ResumoAviso[]>(await fetch("/api/avisos", { cache: "no-store" })),
  aviso: async (id) => json<Aviso>(await fetch(`/api/avisos/${id}`, { cache: "no-store" })),
};

// a chave pública do servidor de push vem em base64url; o navegador quer os bytes
const bytes = (b64: string) => {
  const s = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};
const nomeAparelho = () => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return "iPhone";
  if (/Android/.test(ua)) return "Android";
  if (/Macintosh/.test(ua)) return /Chrome\//.test(ua) ? "Mac · Chrome" : "Mac · Safari";
  return "Navegador";
};

type Estado = "carregando" | "sem-suporte" | "instalar" | "negado" | "desligado" | "ligado";

function AtivarAvisos() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ios = /iPhone|iPad/.test(navigator.userAgent);
      const instalado = window.matchMedia("(display-mode: standalone)").matches;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setEstado(ios && !instalado ? "instalar" : "sem-suporte");
      if (Notification.permission === "denied") return setEstado("negado");
      const reg = await navigator.serviceWorker.register("/sw.js");
      setEstado((await reg.pushManager.getSubscription()) ? "ligado" : "desligado");
    })().catch(() => setEstado("sem-suporte"));
  }, []);

  async function ligar() {
    setMsg(null);
    try {
      if ((await Notification.requestPermission()) !== "granted") return setEstado("negado");
      const { chave } = await json<{ chave: string }>(await fetch("/api/push/chave", { cache: "no-store" }));
      const reg = await navigator.serviceWorker.register("/sw.js");
      const insc = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes(chave) });
      await json(await fetch("/api/push/inscricao", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inscricao: insc.toJSON(), aparelho: nomeAparelho() }) }));
      setEstado("ligado");
    } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
  }
  async function desligar() {
    setMsg(null);
    try {
      const insc = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
      if (insc) {
        await fetch("/api/push/inscricao", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: insc.endpoint }) });
        await insc.unsubscribe();
      }
      setEstado("desligado");
    } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
  }

  if (estado === "carregando") return null;
  const texto: Record<Estado, string> = {
    carregando: "",
    "sem-suporte": "Este navegador não recebe notificações.",
    instalar: "No iPhone, as notificações só funcionam com o painel na Tela de Início: toque em Compartilhar → Adicionar à Tela de Início e abra por lá.",
    negado: "As notificações estão bloqueadas para este site. Libere nos ajustes do navegador e volte aqui.",
    desligado: "Receba um aviso neste aparelho a cada sync (só “Sync concluído”, sem valores).",
    ligado: "Este aparelho recebe um aviso a cada sync.",
  };
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-borda bg-superficie p-4">
      {estado === "ligado" ? <Bell size={18} className="text-ok" /> : <BellOff size={18} className="text-texto-2" />}
      <p className="min-w-0 flex-1 text-sm">{texto[estado]}{msg && <span className="block text-perigo">{msg}</span>}</p>
      {estado === "desligado" && (
        <button type="button" onClick={() => void ligar()} className="min-h-9 rounded-lg bg-primaria px-3 text-sm font-medium text-fundo">Ativar notificações</button>
      )}
      {estado === "ligado" && (
        <button type="button" onClick={() => void desligar()} className="min-h-9 rounded-lg px-3 text-sm text-texto-2 hover:text-texto">Desativar</button>
      )}
    </div>
  );
}

export function MovimentosWeb({ inicial }: { inicial: string | null }) {
  return <Movimentos fonte={fonte} inicial={inicial} extra={<AtivarAvisos />}
    aRevisar={<Link href="/revisar" className="text-sm font-medium text-primaria">Ir para Revisar</Link>} />;
}
