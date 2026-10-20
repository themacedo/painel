// A sessão do app: o refresh token do Google, cifrado pelo safeStorage do Electron (no macOS, a chave fica no Keychain),
// e o ID token de 1 hora só em memória. Mais o client secret, lido do Keychain.
import { execFile } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { app, safeStorage } from "electron";
import { CLIENT_ID, KEYCHAIN_SERVICO } from "./config";
import { ErroLogin, renovar, type Tokens } from "./oauth";

const arquivo = () => join(app.getPath("userData"), "sessao.bin");
let tokens: Tokens | null = null;

export function lerSegredo(): Promise<string | null> {
  return new Promise((ok) =>
    execFile("/usr/bin/security", ["find-generic-password", "-s", KEYCHAIN_SERVICO, "-w"], (erro, saida) => ok(erro ? null : saida.trim() || null)));
}

export const temSessao = () => existsSync(arquivo());

export function guardar(t: Tokens) {
  tokens = t;
  if (t.refreshToken) {
    if (!safeStorage.isEncryptionAvailable()) throw new Error("cofre do sistema indisponível: não guardo o token em texto puro");
    writeFileSync(arquivo(), safeStorage.encryptString(t.refreshToken), { mode: 0o600 });
  }
}

export function sair() {
  tokens = null;
  rmSync(arquivo(), { force: true });
}

/** Um ID token válido: o da memória, ou renovado com o refresh token guardado. null = precisa logar. */
export async function idToken(): Promise<string | null> {
  if (tokens && tokens.expiraEm > Date.now()) return tokens.idToken;
  if (!temSessao()) return null;
  const segredo = await lerSegredo();
  if (!segredo) throw new Error("client secret não está no Keychain");
  const refreshToken = safeStorage.decryptString(readFileSync(arquivo()));
  try {
    tokens = await renovar(fetch, { clientId: CLIENT_ID, clientSecret: segredo, refreshToken });
  } catch (e) {
    // só o Google dizendo que o refresh não vale mais (revogado, senha trocada) desfaz o login; sem rede, mantém
    if (e instanceof ErroLogin && e.message === "invalid_grant") { sair(); return null; }
    throw e;
  }
  return tokens.idToken;
}
