// Login Google de app de computador: o navegador do sistema abre a tela do Google e devolve o código para um servidor
// local temporário (127.0.0.1, porta aleatória), com PKCE. É o fluxo que o Google aceita para apps instalados; o
// navegador embutido do Electron é bloqueado por ele. Funções puras ou com fetch/servidor injetáveis, para testar.
import { createHash, randomBytes } from "node:crypto";
import { createServer, type Server } from "node:http";

export const AUTORIZAR = "https://accounts.google.com/o/oauth2/v2/auth";
export const TOKEN = "https://oauth2.googleapis.com/token";

const b64url = (b: Buffer) => b.toString("base64url");

export function gerarPkce() {
  const verificador = b64url(randomBytes(32));
  return { verificador, desafio: b64url(createHash("sha256").update(verificador).digest()), estado: b64url(randomBytes(16)) };
}

export function urlAutorizacao(o: { clientId: string; redirectUri: string; desafio: string; estado: string; email?: string }) {
  const q = new URLSearchParams({
    client_id: o.clientId, redirect_uri: o.redirectUri, response_type: "code", scope: "openid email profile",
    code_challenge: o.desafio, code_challenge_method: "S256", state: o.estado,
    access_type: "offline", prompt: "consent", // offline + consent: o Google devolve o refresh token
    ...(o.email ? { login_hint: o.email } : {}),
  });
  return `${AUTORIZAR}?${q}`;
}

export type Tokens = { idToken: string; expiraEm: number; refreshToken?: string };

async function postarToken(f: typeof fetch, corpo: Record<string, string>, agora: number): Promise<Tokens> {
  const r = await f(TOKEN, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(corpo) });
  const j = (await r.json()) as { id_token?: string; expires_in?: number; refresh_token?: string; error?: string };
  if (!r.ok || !j.id_token) throw new ErroLogin(j.error ?? `HTTP ${r.status}`);
  // folga de 1 min para não usar um token prestes a vencer
  return { idToken: j.id_token, expiraEm: agora + ((j.expires_in ?? 3600) - 60) * 1000, ...(j.refresh_token ? { refreshToken: j.refresh_token } : {}) };
}

export class ErroLogin extends Error {}

export const trocarCodigo = (f: typeof fetch, o: { clientId: string; clientSecret: string; codigo: string; verificador: string; redirectUri: string }, agora = Date.now()) =>
  postarToken(f, { client_id: o.clientId, client_secret: o.clientSecret, code: o.codigo, code_verifier: o.verificador,
    redirect_uri: o.redirectUri, grant_type: "authorization_code" }, agora);

export const renovar = (f: typeof fetch, o: { clientId: string; clientSecret: string; refreshToken: string }, agora = Date.now()) =>
  postarToken(f, { client_id: o.clientId, client_secret: o.clientSecret, refresh_token: o.refreshToken, grant_type: "refresh_token" }, agora);

const PAGINA = (titulo: string, texto: string) => `<!doctype html><meta charset="utf-8"><title>${titulo}</title>
<body style="font-family:system-ui;background:#000;color:#ededed;display:grid;place-items:center;height:100vh;margin:0">
<div style="text-align:center"><h1 style="font-size:20px">${titulo}</h1><p style="color:#8f8f8f">${texto}</p></div>`;

/** Sobe o servidor local, devolve o redirect_uri e uma promessa com o código (confere o state; desiste em 5 min). */
export async function esperarCodigo(estado: string, limiteMs = 5 * 60_000): Promise<{ redirectUri: string; codigo: Promise<string>; servidor: Server }> {
  let resolver!: (c: string) => void, rejeitar!: (e: Error) => void;
  const codigo = new Promise<string>((ok, erro) => { resolver = ok; rejeitar = erro; });
  const servidor = createServer((req, res) => {
    const u = new URL(req.url ?? "/", "http://127.0.0.1");
    if (u.pathname !== "/") { res.writeHead(404).end(); return; }
    const erro = u.searchParams.get("error"), c = u.searchParams.get("code");
    if (u.searchParams.get("state") !== estado) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" }).end(PAGINA("Login recusado", "O retorno não veio deste pedido de login."));
      return;
    }
    if (erro || !c) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" }).end(PAGINA("Login cancelado", "Pode fechar esta aba e tentar de novo pelo app."));
      rejeitar(new ErroLogin(erro ?? "sem código"));
    } else {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(PAGINA("Pronto", "Login feito. Pode fechar esta aba e voltar ao Painel."));
      resolver(c);
    }
  });
  await new Promise<void>((ok) => servidor.listen(0, "127.0.0.1", ok));
  const porta = (servidor.address() as { port: number }).port;
  const timer = setTimeout(() => rejeitar(new ErroLogin("tempo esgotado")), limiteMs);
  codigo.finally(() => { clearTimeout(timer); servidor.close(); }).catch(() => {});
  return { redirectUri: `http://127.0.0.1:${porta}`, codigo, servidor };
}
