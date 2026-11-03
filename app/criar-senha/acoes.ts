"use server";

import { criarClienteServidor } from "@/lib/supabase/servidor";
import { textos } from "@/lib/textos";

const t = textos.conta;

/**
 * Usa o link de senha nova (só aqui, quando a pessoa toca em "Salvar nova senha"):
 * confere o link, já deixa a pessoa logada e grava a senha.
 */
export async function salvarSenhaPeloLink(token: string, senha: string): Promise<{ ok: true } | { ok: false; erro: string; vencido?: boolean }> {
  if (senha.length < 6) return { ok: false, erro: t.erros.senhaCurta };
  if (senha.length > 72) return { ok: false, erro: t.erros.falhou };
  if (!/^[0-9a-f]{20,128}$/i.test(token)) return { ok: false, erro: t.linkVencido, vencido: true };
  const supabase = await criarClienteServidor();
  const { error: erroLink } = await supabase.auth.verifyOtp({ token_hash: token, type: "recovery" });
  if (erroLink) return { ok: false, erro: t.linkVencido, vencido: true };
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) {
    if (error.code === "same_password") return { ok: false, erro: t.erros.senhaIgual };
    if (error.code === "weak_password") return { ok: false, erro: t.erros.senhaCurta };
    return { ok: false, erro: t.erros.falhou };
  }
  return { ok: true };
}
