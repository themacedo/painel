// Processo principal: a janela, o ícone na barra de menu, o login e a chamada à API. A tela não tem acesso ao Node:
// só pede "carregar", "entrar" e "sair" pelo preload.
import { join } from "node:path";
import { app, BrowserWindow, ipcMain, Menu, nativeImage, shell, Tray } from "electron";
import { API, ATUALIZAR_MIN, CLIENT_ID } from "./config";
import { esperarCodigo, gerarPkce, trocarCodigo, urlAutorizacao } from "./oauth";
import { guardar, idToken, lerSegredo, sair } from "./sessao";

export type Resultado =
  | { estado: "ok"; painel: Record<string, any>; em: string }
  | { estado: "sem-login" }
  | { estado: "sem-segredo" }
  | { estado: "erro"; mensagem: string };

let janela: BrowserWindow | null = null;
let bandeja: Tray | null = null;
let ultimo: Resultado | null = null;

async function carregar(): Promise<Resultado> {
  try {
    if (!(await lerSegredo())) return (ultimo = { estado: "sem-segredo" });
    const token = await idToken();
    if (!token) return (ultimo = { estado: "sem-login" });
    const r = await fetch(`${API}/painel`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.status === 401) { sair(); return (ultimo = { estado: "sem-login" }); }
    if (!r.ok) return (ultimo = { estado: "erro", mensagem: `API respondeu ${r.status}` });
    ultimo = { estado: "ok", painel: (await r.json()) as Record<string, any>, em: new Date().toISOString() };
    atualizarBandeja(ultimo.painel);
    return ultimo;
  } catch (e) {
    return (ultimo = { estado: "erro", mensagem: e instanceof Error ? e.message : String(e) });
  }
}

async function entrar(): Promise<Resultado> {
  const segredo = await lerSegredo();
  if (!segredo) return { estado: "sem-segredo" };
  const { verificador, desafio, estado } = gerarPkce();
  const { redirectUri, codigo } = await esperarCodigo(estado);
  await shell.openExternal(urlAutorizacao({ clientId: CLIENT_ID, redirectUri, desafio, estado }));
  const c = await codigo;
  guardar(await trocarCodigo(fetch, { clientId: CLIENT_ID, clientSecret: segredo, codigo: c, verificador, redirectUri }));
  janela?.show(); janela?.focus();
  return carregar();
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// O essencial na barra de menu: quanto cabe por dia no cartão e a sobra até o próximo salário.
function atualizarBandeja(p: Record<string, any>) {
  if (!bandeja) return;
  const ciclo = p["financas"]?.["detalhe"]?.["cicloCartao"], marco = p["financas"]?.["marco"];
  const partes = [ciclo?.porDia != null ? `cartão ${brl(ciclo.porDia)}/dia` : null, marco ? `sobra ${brl(marco.sobra)}` : null].filter(Boolean);
  bandeja.setTitle(partes.length ? ` ${partes.join(" · ")}` : "");
  bandeja.setToolTip(`Painel · atualizado ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`);
}

function criarBandeja() {
  const icone = nativeImage.createFromPath(join(__dirname, "../renderer/bandeja.png")).resize({ width: 16, height: 16 });
  icone.setTemplateImage(true);
  bandeja = new Tray(icone);
  bandeja.setContextMenu(Menu.buildFromTemplate([
    { label: "Abrir o Painel", click: () => { janela?.show(); janela?.focus(); } },
    { label: "Atualizar agora", click: async () => janela?.webContents.send("painel:atualizado", await carregar()) },
    { type: "separator" },
    { label: "Sair do app", role: "quit" },
  ]));
}

function criarJanela() {
  janela = new BrowserWindow({
    width: 1280, height: 860, minWidth: 380, show: false, backgroundColor: "#000000", title: "Painel",
    titleBarStyle: "hiddenInset",
    webPreferences: { preload: join(__dirname, "preload.cjs"), contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  // a tela é local e só fala com o processo principal: nada de navegar nem abrir janelas
  janela.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  janela.webContents.on("will-navigate", (e) => e.preventDefault());
  // PAINEL_ABA abre direto numa aba (para conferir as telas); sem ela, vale a última aba usada
  janela.loadFile(join(__dirname, "../renderer/index.html"), process.env["PAINEL_ABA"] ? { query: { aba: process.env["PAINEL_ABA"] } } : {});
  janela.once("ready-to-show", () => janela?.show());
  janela.on("close", (e) => { if (process.platform === "darwin" && !sairDeVez) { e.preventDefault(); janela?.hide(); } });
}

let sairDeVez = false;
if (!app.requestSingleInstanceLock()) app.quit();
app.on("second-instance", () => { janela?.show(); janela?.focus(); });
app.on("before-quit", () => { sairDeVez = true; });
app.on("activate", () => { janela?.show(); });

app.whenReady().then(() => {
  ipcMain.handle("painel:carregar", () => carregar());
  ipcMain.handle("auth:entrar", () => entrar().catch((e: Error) => ({ estado: "erro", mensagem: e.message }) as Resultado));
  ipcMain.handle("auth:sair", () => { sair(); ultimo = { estado: "sem-login" }; bandeja?.setTitle(""); return ultimo; });
  criarJanela();
  criarBandeja();
  carregar();
  setInterval(async () => janela?.webContents.send("painel:atualizado", await carregar()), ATUALIZAR_MIN * 60_000);
});
