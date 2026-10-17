import { NextResponse, type NextRequest } from "next/server";

// No modo privado, tudo pede senha (HTTP Basic). Sem PAINEL_SENHA configurada, nega o acesso.
export function middleware(req: NextRequest) {
  if (process.env.PAINEL_MODO !== "privado") return NextResponse.next();
  const senha = process.env.PAINEL_SENHA;
  const auth = req.headers.get("authorization") ?? "";
  if (senha && auth.startsWith("Basic ")) {
    const par = atob(auth.slice(6));
    const informada = par.slice(par.indexOf(":") + 1);
    if (informada === senha) return NextResponse.next();
  }
  return new NextResponse("Acesso restrito", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="painel", charset="UTF-8"' },
  });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
