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
