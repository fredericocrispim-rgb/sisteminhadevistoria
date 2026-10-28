import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/** Páginas que exigem login. */
const PROTEGIDAS = ["/inicio", "/vistorias", "/patio", "/mais", "/plano", "/cadastro", "/admin", "/nova-senha", "/indicar", "/equipe"];

/**
 * Roda antes de cada página:
 * 1. Renova a sessão do Supabase (o usuário não precisa entrar de novo toda hora).
 * 2. Manda para /entrar quem tenta abrir uma página interna sem login.
 * 3. Guarda o código de indicação (?ref=CODIGO) por 30 dias.
 * 4. Anota o último uso de quem está logado (para o painel do administrador).
 */
export async function proxy(request: NextRequest, evento: NextFetchEvent) {
  let resposta = NextResponse.next({ request });

  // Sem as chaves do Supabase (configuração incompleta), não derruba o site inteiro.
  // Veja /api/saude para saber qual chave falta.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.error("Faltam as chaves do Supabase. Abra /api/saude.");
    return resposta;
  }

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

  let logado = false;
  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getClaims();
    userId = data?.claims?.sub ?? null;
    logado = Boolean(userId);
  } catch (erro) {
    console.error("Falha ao conferir o login no proxy:", erro);
  }
  const { pathname, searchParams } = request.nextUrl;

  // Último uso (aparece no /admin): anota no máximo a cada 15 minutos, depois de responder (não atrasa a tela)
  if (userId && !request.cookies.has("vf_visto") && process.env.SUPABASE_SECRET_KEY) {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    evento.waitUntil(
      admin.auth.admin
        .updateUserById(userId, { app_metadata: { ultimo_acesso: new Date().toISOString() } })
        .then(({ error }) => error && console.error("Falha ao anotar o último uso:", error.message)),
    );
    resposta.cookies.set("vf_visto", "1", { maxAge: 60 * 15, httpOnly: true, sameSite: "lax", path: "/" });
  }

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|js|webmanifest)$).*)"],
};
