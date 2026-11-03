"use server";

import { z } from "zod";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { textos } from "@/lib/textos";
import { emailConfigurado, gerarLinkCriarSenha, mandarEmail } from "@/lib/senha";

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

const LIMITE_POR_HORA = 5;

/**
 * "Esqueci minha senha": manda por e-mail um link para criar senha nova (uso único, vale 1 hora).
 * Responde igual exista ou não a conta (não revela quem tem cadastro). No máximo 5 e-mails por hora por conta.
 * Sem o serviço de e-mail configurado (RESEND_API_KEY), avisa a tela para mostrar o WhatsApp do suporte.
 */
export async function pedirLinkSenha(emailBruto: string): Promise<{ ok: true } | { ok: false; erro: string; semEmail?: boolean }> {
  const v = z.string().trim().toLowerCase().email().max(160).safeParse(emailBruto);
  if (!v.success) return { ok: false, erro: t.erros.emailInvalido };
  if (!emailConfigurado()) return { ok: false, erro: t.erros.falhou, semEmail: true };
  try {
    const r = await gerarLinkCriarSenha(v.data);
    if (!r) return { ok: true };
    const agora = Date.now();
    const anterior = (r.usuario.app_metadata?.links_senha ?? {}) as { inicio?: number; qtd?: number };
    const mesmaHora = anterior.inicio && agora - anterior.inicio < 60 * 60 * 1000;
    const qtd = mesmaHora ? (anterior.qtd ?? 0) + 1 : 1;
    if (qtd > LIMITE_POR_HORA) return { ok: false, erro: t.erros.muitasTentativas };
    await criarClienteAdmin().auth.admin.updateUserById(r.usuario.id, {
      app_metadata: { links_senha: { inicio: mesmaHora ? anterior.inicio : agora, qtd } },
    });
    const enviado = await mandarEmail({
      para: v.data,
      assunto: `Sua senha nova - ${textos.produto.nome}`,
      texto: `Olá! Toque no link para criar sua senha nova no ${textos.produto.nome} (vale por 1 hora, só uma vez): ${r.link}\n\nSe não foi você que pediu, ignore este e-mail.`,
      html: `<div style="font-family:Arial,sans-serif;font-size:17px;line-height:1.5;color:#111">
<p>Olá!</p>
<p>Toque no botão para criar sua senha nova no <b>${textos.produto.nome}</b>.</p>
<p><a href="${r.link}" style="display:inline-block;background:#13865a;color:#fff;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:12px">Criar senha nova</a></p>
<p style="color:#555;font-size:15px">O link vale por 1 hora e só uma vez. Se não foi você que pediu, ignore este e-mail.</p>
</div>`,
    });
    if (!enviado) return { ok: false, erro: t.erros.falhou, semEmail: true };
    return { ok: true };
  } catch (erro) {
    console.error("Falha ao mandar o link de senha", erro);
    return { ok: false, erro: t.erros.falhou };
  }
}
