import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

// Modo privado: tudo pede login. Com o Google configurado (AUTH_GOOGLE_ID), uma sessão de um e-mail permitido;
// sem ele, a senha antiga (HTTP Basic com PAINEL_SENHA), para o site não abrir enquanto o Google não está pronto.
// Sem nenhum dos dois, nega. Ficam livres só a tela de login, as rotas do next-auth e o que o celular pede para
// instalar o app (manifesto e ícones, sem dado nenhum).
const LIVRES = ["/entrar", "/privacidade", "/api/auth/", "/manifest.webmanifest", "/icones/"];

export async function middleware(req: NextRequest) {
  if (process.env.PAINEL_MODO !== "privado") return NextResponse.next();
  const { pathname, search } = req.nextUrl;

  if (process.env.AUTH_GOOGLE_ID) {
    if (LIVRES.some((p) => pathname === p || pathname.startsWith(p))) return NextResponse.next();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const permitidos = (process.env.PAINEL_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    // confere de novo a cada pedido: tirar um e-mail de PAINEL_EMAILS derruba a sessão dele na hora
    if (typeof token?.email === "string" && permitidos.includes(token.email.toLowerCase())) return NextResponse.next();
    const destino = new URL("/entrar", req.url);
    if (pathname !== "/") destino.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(destino);
  }

  const senha = process.env.PAINEL_SENHA;
  const auth = req.headers.get("authorization") ?? "";
  if (senha && auth.startsWith("Basic ")) {
    const par = atob(auth.slice(6));
    if (par.slice(par.indexOf(":") + 1) === senha) return NextResponse.next();
  }
  return new NextResponse("Acesso restrito", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="painel", charset="UTF-8"' },
  });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
