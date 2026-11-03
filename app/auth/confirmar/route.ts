import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { criarClienteServidor } from "@/lib/supabase/servidor";

/**
 * Para onde vai o link dos e-mails (confirmar conta / criar senha nova).
 * Se der certo, já entra. Se o link foi aberto em outro aparelho, o e-mail fica
 * confirmado do mesmo jeito e a pessoa só precisa entrar com a senha.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const voltarBruto = searchParams.get("voltar") ?? "/inicio";
  const voltar = voltarBruto.startsWith("/") && !voltarBruto.startsWith("//") ? voltarBruto : "/inicio";
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;

  // Senha nova: NÃO usa o link aqui (a prévia do WhatsApp abre o link sozinha e gastaria o link).
  // Leva para /criar-senha, que só usa o link quando a pessoa toca em "Salvar nova senha".
  if (tokenHash && tipo === "recovery") {
    return NextResponse.redirect(new URL(`/criar-senha?token=${encodeURIComponent(tokenHash)}`, origin));
  }

  const supabase = await criarClienteServidor();
  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && tipo) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo })).error;
  }

  if (ok) return NextResponse.redirect(new URL(voltar, origin));
  if (voltar === "/nova-senha") return NextResponse.redirect(new URL("/entrar?erro=link", origin));
  return NextResponse.redirect(new URL(`/entrar?confirmado=1&voltar=${encodeURIComponent(voltar)}`, origin));
}
