import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico: diz se as chaves estão configuradas no servidor, SEM mostrar os valores.
 * Abra /api/saude no navegador.
 */
export function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const publica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const secreta = process.env.SUPABASE_SECRET_KEY ?? "";
  const verificar = (valor: string, ok: boolean) => (!valor ? "FALTANDO" : ok ? "ok" : "formato estranho (confira espaços ou aspas)");
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: verificar(url, /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: verificar(publica, /^(sb_publishable_|eyJ)[A-Za-z0-9._-]+$/.test(publica)),
    SUPABASE_SECRET_KEY: verificar(secreta, /^(sb_secret_|eyJ)[A-Za-z0-9._-]+$/.test(secreta)),
  });
}
