import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ErroLogin, esperarCodigo, gerarPkce, renovar, TOKEN, trocarCodigo, urlAutorizacao } from "../main/oauth";

describe("login de app de computador (loopback + PKCE)", () => {
  it("o desafio é o SHA-256 do verificador, em base64url, e cada login gera valores novos", () => {
    const a = gerarPkce(), b = gerarPkce();
    expect(a.desafio).toBe(createHash("sha256").update(a.verificador).digest("base64url"));
    expect(a.verificador).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(new Set([a.verificador, b.verificador, a.estado, b.estado]).size).toBe(4);
  });

  it("o endereço do Google pede só nome e e-mail, com PKCE S256, refresh token e o retorno local", () => {
    const u = new URL(urlAutorizacao({ clientId: "cid", redirectUri: "http://127.0.0.1:5000", desafio: "d", estado: "e" }));
    expect(u.origin + u.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(Object.fromEntries(u.searchParams)).toEqual({ client_id: "cid", redirect_uri: "http://127.0.0.1:5000", response_type: "code",
      scope: "openid email profile", code_challenge: "d", code_challenge_method: "S256", state: "e", access_type: "offline", prompt: "consent" });
  });

  it("troca o código pelo ID token e o refresh token, mandando o verificador; expiração com folga de 1 min", async () => {
    let enviado: URLSearchParams | null = null, url = "";
    const f = (async (u: string, init: RequestInit) => {
      url = u; enviado = init.body as URLSearchParams;
      return new Response(JSON.stringify({ id_token: "idt", expires_in: 3600, refresh_token: "rt" }), { status: 200 });
    }) as unknown as typeof fetch;
    const t = await trocarCodigo(f, { clientId: "cid", clientSecret: "seg", codigo: "c", verificador: "v", redirectUri: "http://127.0.0.1:1" }, 1000);
    expect(url).toBe(TOKEN);
    expect(Object.fromEntries(enviado!)).toEqual({ client_id: "cid", client_secret: "seg", code: "c", code_verifier: "v",
      redirect_uri: "http://127.0.0.1:1", grant_type: "authorization_code" });
    expect(t).toEqual({ idToken: "idt", expiraEm: 1000 + 3540_000, refreshToken: "rt" });
  });

  it("renovação recusada pelo Google vira ErroLogin com o código do erro (invalid_grant desfaz o login)", async () => {
    const f = (async () => new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 })) as unknown as typeof fetch;
    await expect(renovar(f, { clientId: "c", clientSecret: "s", refreshToken: "r" })).rejects.toEqual(new ErroLogin("invalid_grant"));
  });

  it("o servidor local só aceita o retorno com o state certo e entrega o código", async () => {
    const { redirectUri, codigo } = await esperarCodigo("estado-certo");
    expect(redirectUri).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    const errado = await fetch(`${redirectUri}/?code=roubado&state=outro`);
    expect(errado.status).toBe(400); // um retorno forjado não encerra o login
    const certo = await fetch(`${redirectUri}/?code=abc&state=estado-certo`);
    expect(certo.status).toBe(200);
    await expect(codigo).resolves.toBe("abc");
  });

  it("login cancelado no Google rejeita; e desiste sozinho depois do tempo limite", async () => {
    const a = await esperarCodigo("s1");
    await fetch(`${a.redirectUri}/?error=access_denied&state=s1`);
    await expect(a.codigo).rejects.toThrow("access_denied");
    const b = await esperarCodigo("s2", 50);
    await expect(b.codigo).rejects.toThrow("tempo esgotado");
  });
});
