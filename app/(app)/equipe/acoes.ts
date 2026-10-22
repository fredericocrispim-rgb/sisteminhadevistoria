"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { formatarTelefone, telefoneValido } from "@/lib/formatos";

type Resultado<T = object> = ({ ok: true } & T) | { ok: false; erro: string };

const FALHOU = "Não deu certo. Confira a internet e tente de novo.";

async function gestor() {
  const ctx = await exigirOficina();
  return ctx.papel === "dono" || ctx.papel === "gerente" ? ctx : null;
}

const esquemaConvite = z.object({
  nome: z.string().trim().min(2, "Coloque o nome da pessoa").max(80),
  papel: z.enum(["vistoriador", "gerente"]),
});

/** Cria o convite. A pessoa entra na equipe quando abrir o link e aceitar. */
export async function criarConvite(dados: z.input<typeof esquemaConvite>): Promise<Resultado<{ token: string }>> {
  const ctx = await gestor();
  if (!ctx) return { ok: false, erro: FALHOU };
  const v = esquemaConvite.safeParse(dados);
  if (!v.success) return { ok: false, erro: v.error.issues[0].message };
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("convites")
    .insert({ empresa_id: ctx.empresa.id, nome: v.data.nome, papel: v.data.papel, criado_por: ctx.usuario.id })
    .select("token")
    .single();
  if (error || !data) return { ok: false, erro: FALHOU };
  revalidatePath("/equipe");
  return { ok: true, token: data.token };
}

const esquemaUsuario = z.object({
  nome: z.string().trim().min(2, "Coloque o nome da pessoa").max(80),
  whatsapp: z.string().refine(telefoneValido, "WhatsApp incompleto. Confira o DDD e o número."),
  email: z.string().trim().toLowerCase().email("E-mail incompleto. Confira.").max(160),
  senha: z.string().min(6, "A senha precisa de pelo menos 6 letras ou números").max(72),
  papel: z.enum(["vistoriador", "gerente"]),
  cupom: z.string().trim().toUpperCase().max(30).default(""),
});

/**
 * Cadastra a pessoa direto: o dono/gerente digita nome, e-mail e senha e ela já pode entrar.
 * A conta é criada já confirmada (sem e-mail). Usuário a mais aumenta a mensalidade (lib/mensalidade.ts).
 */
export async function cadastrarUsuario(dados: z.input<typeof esquemaUsuario>): Promise<Resultado> {
  const ctx = await gestor();
  if (!ctx) return { ok: false, erro: FALHOU };
  const v = esquemaUsuario.safeParse(dados);
  if (!v.success) return { ok: false, erro: v.error.issues[0].message };
  const d = v.data;
  const admin = criarClienteAdmin();

  // Cupom (ex.: CORTESIA): esse usuário não entra na cobrança. Vazio = cobra normalmente.
  let cupom: string | null = null;
  if (d.cupom) {
    const { data: c } = await admin.from("cupons").select("codigo").eq("codigo", d.cupom).eq("ativo", true).eq("usuario_gratis", true).maybeSingle();
    if (!c) return { ok: false, erro: "Este cupom não existe. Confira ou deixe em branco." };
    cupom = c.codigo;
  }

  const { data: criado, error } = await admin.auth.admin.createUser({
    email: d.email,
    password: d.senha,
    email_confirm: true,
    user_metadata: { nome: d.nome, whatsapp: formatarTelefone(d.whatsapp) },
  });
  if (error || !criado.user) {
    if (error?.code === "email_exists" || /already/i.test(error?.message ?? "")) {
      return { ok: false, erro: "Este e-mail já tem conta no sistema. Use outro e-mail." };
    }
    if (error?.code === "weak_password") return { ok: false, erro: "Senha fraca. Use pelo menos 6 letras ou números." };
    return { ok: false, erro: FALHOU };
  }

  const { error: erroEquipe } = await admin
    .from("usuarios_empresa")
    .insert({ empresa_id: ctx.empresa.id, user_id: criado.user.id, nome: d.nome, papel: d.papel, cupom });
  if (erroEquipe) {
    await admin.auth.admin.deleteUser(criado.user.id); // não deixa conta solta sem oficina
    return { ok: false, erro: FALHOU };
  }
  await admin.from("auditoria").insert({
    empresa_id: ctx.empresa.id,
    usuario_id: ctx.usuario.id,
    acao: "cadastrou_usuario",
    entidade: "usuarios_empresa",
    detalhes: { nome: d.nome, papel: d.papel, cupom, whatsapp: formatarTelefone(d.whatsapp) },
  });
  revalidatePath("/equipe");
  revalidatePath("/plano");
  return { ok: true };
}

export async function cancelarConvite(id: string): Promise<Resultado> {
  const ctx = await gestor();
  if (!ctx || !/^[0-9a-f-]{36}$/.test(id)) return { ok: false, erro: FALHOU };
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("convites").update({ cancelado: true }).eq("id", id).eq("empresa_id", ctx.empresa.id);
  if (error) return { ok: false, erro: FALHOU };
  revalidatePath("/equipe");
  return { ok: true };
}

/** Tira a pessoa da equipe (não apaga nada: as vistorias dela continuam). O dono não pode ser tirado. */
export async function tirarDaEquipe(id: string): Promise<Resultado> {
  const ctx = await gestor();
  if (!ctx || !/^[0-9a-f-]{36}$/.test(id)) return { ok: false, erro: FALHOU };
  const supabase = await criarClienteServidor();
  const { data: membro } = await supabase.from("usuarios_empresa").select("user_id, papel").eq("id", id).eq("empresa_id", ctx.empresa.id).maybeSingle();
  if (!membro) return { ok: false, erro: FALHOU };
  if (membro.papel === "dono") return { ok: false, erro: "O dono da oficina não pode sair da equipe." };
  if (membro.user_id === ctx.usuario.id) return { ok: false, erro: "Você não pode tirar a si mesmo." };
  const { error } = await supabase.from("usuarios_empresa").update({ ativo: false }).eq("id", id).eq("empresa_id", ctx.empresa.id);
  if (error) return { ok: false, erro: FALHOU };
  revalidatePath("/equipe");
  revalidatePath("/plano");
  return { ok: true };
}
