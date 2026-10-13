import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** Acesso ao Supabase no servidor, com o login de quem está usando (respeita as regras de segurança). */
export async function criarClienteServidor() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(lista) {
          try {
            lista.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Chamado de um Server Component: o proxy renova a sessão.
          }
        },
      },
    },
  );
}
