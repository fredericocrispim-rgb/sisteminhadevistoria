import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Acesso TOTAL ao banco (ignora as regras de segurança). Só no servidor e só quando necessário:
 * página pública da vistoria, verificação de autenticidade, confirmar Pix no /admin.
 */
export function criarClienteAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
