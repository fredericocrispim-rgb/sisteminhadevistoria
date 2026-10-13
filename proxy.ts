import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Páginas que exigem login. */
const PROTEGIDAS = ["/inicio", "/vistorias", "/patio", "/mais", "/cadastro", "/admin"];

/**
 * Roda antes de cada página:
 * 1. Renova a sessão do Supabase (o usuário não precisa entrar de novo toda hora).
 * 2. Manda para /entrar quem tenta abrir uma página interna sem login.
 * 3. Guarda o código de indicação (?ref=CODIGO) por 30 dias.
 */
export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(lista) {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          resposta = NextResponse.next({ request });
          lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims?.sub);
  const { pathname, searchParams } = request.nextUrl;

  const ref = searchParams.get("ref");
  const guardarRef = (r: NextResponse) => {
    if (ref && /^[A-Z0-9]{4,12}$/i.test(ref)) {
      r.cookies.set("vf_ref", ref.toUpperCase(), { maxAge: 60 * 60 * 24 * 30, httpOnly: true, sameSite: "lax", path: "/" });
    }
    return r;
  };

  if (!logado && PROTEGIDAS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    url.searchParams.set("voltar", pathname);
    return guardarRef(copiarCookies(resposta, NextResponse.redirect(url)));
  }

  if (logado && pathname === "/entrar") {
    const url = request.nextUrl.clone();
    url.pathname = searchParams.get("voltar")?.startsWith("/") ? searchParams.get("voltar")! : "/inicio";
    url.search = "";
    return guardarRef(copiarCookies(resposta, NextResponse.redirect(url)));
  }

  return guardarRef(resposta);
}

/** Leva os cookies de sessão renovados para a resposta de redirecionamento. */
function copiarCookies(de: NextResponse, para: NextResponse) {
  de.cookies.getAll().forEach((c) => para.cookies.set(c));
  return para;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)"],
};
