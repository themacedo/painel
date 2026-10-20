import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Login com Google no modo privado. Só entram os e-mails de PAINEL_EMAILS (separados por vírgula), verificados pelo
// Google. Sessão num JWT assinado (cookie httpOnly), sem banco. Nada de e-mail fixo no código: o repositório é público.
export const emailsPermitidos = () =>
  (process.env.PAINEL_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export const emailPermitido = (email: unknown) =>
  typeof email === "string" && emailsPermitidos().includes(email.toLowerCase());

export const loginGoogleConfigurado = () => Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
      // offline + consent: o Google devolve um refresh token, que renova o id_token (1 h) para a API da nuvem
      authorization: { params: { prompt: "consent select_account", access_type: "offline" } },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/entrar", error: "/entrar" },
  callbacks: {
    // o Google confirma o e-mail; o painel confere se é um dos permitidos
    signIn: ({ account, profile }) =>
      account?.provider === "google" && (profile as { email_verified?: boolean } | undefined)?.email_verified === true
      && emailPermitido(profile?.email),
    // guarda no JWT (cifrado, cookie httpOnly) o id_token do Google e o refresh token: as rotas /api/pendentes e
    // /api/revisoes falam com a API da nuvem, que só aceita o login Google do dono
    jwt: ({ token, account }) => {
      if (account?.provider === "google") {
        token.idToken = account.id_token;
        token.idTokenExp = account.expires_at;
        if (account.refresh_token) token.refreshToken = account.refresh_token;
      }
      return token;
    },
  },
};
