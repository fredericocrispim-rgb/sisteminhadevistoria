import { createBrowserClient } from "@supabase/ssr";

/** Acesso ao Supabase pelo navegador (respeita as regras de segurança do banco). */
export function criarClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
