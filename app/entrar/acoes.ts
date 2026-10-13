"use server";

import { z } from "zod";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { textos } from "@/lib/textos";

const t = textos.conta;

const esquema = z.object({
  email: z.string().trim().toLowerCase().email(t.erros.emailInvalido).max(160),
  senha: z.string().min(6, t.erros.senhaCurta).max(72),
});

/**
 * Cria a conta direto no servidor, JÁ CONFIRMADA: não manda e-mail nenhum
 * (o Supabase grátis só deixa mandar poucos e-mails por hora).
 * Depois disso a tela entra com e-mail e senha normalmente.
 */
export async function criarConta(dados: z.input<typeof esquema>): Promise<{ ok: true } | { ok: false; erro: string }> {
  const v = esquema.safeParse(dados);
  if (!v.success) return { ok: false, erro: v.error.issues[0].message };
  const { error } = await criarClienteAdmin().auth.admin.createUser({
    email: v.data.email,
    password: v.data.senha,
    email_confirm: true,
  });
  if (error) {
    if (error.code === "email_exists" || /already/i.test(error.message)) return { ok: false, erro: t.erros.jaExiste };
    if (error.code === "weak_password") return { ok: false, erro: t.erros.senhaCurta };
    return { ok: false, erro: t.erros.falhou };
  }
  return { ok: true };
}
