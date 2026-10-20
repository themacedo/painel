// Processo principal: a janela, o ícone na barra de menu, o login e a chamada à API. A tela não tem acesso ao Node:
// só pede "carregar", "entrar", "sair" e as duas chamadas da tela Revisar pelo preload.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { app, BrowserWindow, ipcMain, Menu, nativeImage, Notification, shell, Tray } from "electron";
import { decidirAvisos } from "./avisos";
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

// preferências e avisos já dados, em disco (sobrevivem a reabrir o app)
const arq = (n: string) => join(app.getPath("userData"), n);
const lerJson = <T>(n: string, padrao: T): T => { try { return existsSync(arq(n)) ? (JSON.parse(readFileSync(arq(n), "utf8")) as T) : padrao; } catch { return padrao; } };
const gravarJson = (n: string, v: unknown) => writeFileSync(arq(n), JSON.stringify(v), { mode: 0o600 });

function avisar(p: Record<string, any>) {
  if (!Notification.isSupported()) return;
  const ja: string[] = lerJson("avisos.json", []);
  const novos = decidirAvisos(p, Date.now(), new Set(ja));
  for (const a of novos) {
    const n = new Notification({ title: a.titulo, body: a.texto, silent: false });
    n.on("click", () => { janela?.show(); janela?.focus(); });
    n.show();
  }
  if (novos.length) gravarJson("avisos.json", [...ja, ...novos.map((a) => a.chave)].slice(-300));
}

// Abrir ao entrar no Mac: um LaunchAgent do usuário que roda `open -a`. O registro de login do macOS
// (setLoginItemSettings) é ignorado em app sem assinatura da Apple; o LaunchAgent funciona sempre.
const AGENTE = join(homedir(), "Library/LaunchAgents/br.themacedo.painel.abrir.plist");
const abreNoLogin = () => existsSync(AGENTE);
function abrirNoLogin(ligar: boolean) {
  if (!ligar) { rmSync(AGENTE, { force: true }); return; }
  const appPath = app.getPath("exe").replace(/\/Contents\/MacOS\/[^/]+$/, ""); // .../Painel.app
  mkdirSync(join(homedir(), "Library/LaunchAgents"), { recursive: true });
  writeFileSync(AGENTE, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>br.themacedo.painel.abrir</string>
  <key>ProgramArguments</key><array><string>/usr/bin/open</string><string>-a</string><string>${appPath}</string></array>
  <key>RunAtLoad</key><true/>
</dict></plist>
`, { mode: 0o644 });
}

// um pedido por vez; foco e relógio não pedem de novo se o último foi há menos de 30 s (o botão Atualizar força)
let emCurso: Promise<Resultado> | null = null;
let ultimoEm = 0;
function carregar(forcar = false): Promise<Resultado> {
  if (emCurso) return emCurso;
  if (!forcar && ultimo && Date.now() - ultimoEm < 30_000) return Promise.resolve(ultimo);
  emCurso = buscar().finally(() => { emCurso = null; ultimoEm = Date.now(); });
  return emCurso;
}

async function buscar(): Promise<Resultado> {
  try {
    if (!(await lerSegredo())) return (ultimo = { estado: "sem-segredo" });
    const token = await idToken();
    if (!token) return (ultimo = { estado: "sem-login" });
    const r = await fetch(`${API}/painel`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.status === 401) { sair(); return (ultimo = { estado: "sem-login" }); }
    if (!r.ok) return (ultimo = { estado: "erro", mensagem: `API respondeu ${r.status}` });
    ultimo = { estado: "ok", painel: (await r.json()) as Record<string, any>, em: new Date().toISOString() };
    atualizarBandeja(ultimo.painel);
    avisar(ultimo.painel);
    return ultimo;
  } catch (e) {
    return (ultimo = { estado: "erro", mensagem: e instanceof Error ? e.message : String(e) });
  }
}

// Tela Revisar: a lista de pendentes e o envio das decisões, pela mesma API e o mesmo login. Erro volta como
// { erro } para a tela mostrar (o IPC não carrega exceções com mensagem útil).
async function api(caminho: string, init: RequestInit = {}): Promise<unknown> {
  try {
    const token = await idToken();
    if (!token) return { erro: "entre de novo para revisar" };
    const r = await fetch(`${API}${caminho}`, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` } });
    const corpo = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    return r.ok ? corpo : { erro: String(corpo["erro"] ?? `API respondeu ${r.status}`) };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : String(e) };
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
  return carregar(true);
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
    { label: "Atualizar agora", click: async () => janela?.webContents.send("painel:atualizado", await carregar(true)) },
    { type: "separator" },
    { label: "Abrir ao entrar no Mac", type: "checkbox", enabled: app.isPackaged, checked: abreNoLogin(),
      click: (item) => { abrirNoLogin(item.checked); gravarJson("prefs.json", { ...lerJson("prefs.json", {}), abrirNoLogin: item.checked }); } },
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
  ipcMain.handle("painel:carregar", (_e, forcar?: boolean) => carregar(Boolean(forcar)));
  // instalado: abre ao entrar no Mac, ligado na primeira vez (o dono pediu); desligar pelo menu da barra fica gravado
  const prefs = lerJson<{ abrirNoLogin?: boolean }>("prefs.json", {});
  if (app.isPackaged && prefs.abrirNoLogin !== false && !abreNoLogin()) abrirNoLogin(true);
  ipcMain.handle("auth:entrar", () => entrar().catch((e: Error) => ({ estado: "erro", mensagem: e.message }) as Resultado));
  ipcMain.handle("revisar:pendentes", () => api("/pendentes"));
  ipcMain.handle("revisar:enviar", (_e, revisoes: unknown[]) =>
    api("/revisoes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revisoes }) }));
  ipcMain.handle("auth:sair", () => { sair(); ultimo = { estado: "sem-login" }; bandeja?.setTitle(""); return ultimo; });
  criarJanela();
  criarBandeja();
  carregar();
  setInterval(async () => janela?.webContents.send("painel:atualizado", await carregar()), ATUALIZAR_MIN * 60_000);
});
