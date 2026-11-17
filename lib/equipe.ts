import "server-only";
import { z } from "zod";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { formatarTelefone, telefoneValido } from "@/lib/formatos";
import { atualizarValorAsaas } from "@/lib/pagamentos/servidor";

export type ResultadoCadastro = { ok: true } | { ok: false; erro: string };

const FALHOU = "Não deu certo. Confira a internet e tente de novo.";

export const esquemaPessoa = z.object({
  nome: z.string().trim().min(2, "Coloque o nome da pessoa").max(80),
  whatsapp: z.string().refine(telefoneValido, "WhatsApp incompleto. Confira o DDD e o número."),
  email: z.string().trim().toLowerCase().email("E-mail incompleto. Confira.").max(160),
  senha: z.string().min(6, "A senha precisa de pelo menos 6 letras ou números").max(72),
  papel: z.enum(["vistoriador", "gerente"]),
  cupom: z.string().trim().toUpperCase().max(30).default(""),
});

export type DadosPessoa = z.input<typeof esquemaPessoa>;

/**
 * Cria a conta (já confirmada, sem e-mail) e põe a pessoa na equipe da oficina.
 * Usado pelo dono/gerente em /equipe e pelo administrador da plataforma no /admin.
 * Usuário a mais aumenta a mensalidade (lib/mensalidade.ts); com cupom válido, não é cobrado.
 */
export async function cadastrarNaEquipe(
  empresaId: string,
  autorId: string,
  dados: DadosPessoa,
  extra: Record<string, unknown> = {},
): Promise<ResultadoCadastro> {
  const v = esquemaPessoa.safeParse(dados);
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
    .insert({ empresa_id: empresaId, user_id: criado.user.id, nome: d.nome, papel: d.papel, cupom });
  if (erroEquipe) {
    await admin.auth.admin.deleteUser(criado.user.id); // não deixa conta solta sem oficina
    return { ok: false, erro: FALHOU };
  }
  await admin.from("auditoria").insert({
    empresa_id: empresaId,
    usuario_id: autorId,
    acao: "cadastrou_usuario",
    entidade: "usuarios_empresa",
    detalhes: { nome: d.nome, papel: d.papel, cupom, whatsapp: formatarTelefone(d.whatsapp), ...extra },
  });
  await atualizarValorAsaas(empresaId); // pessoa a mais muda a mensalidade
  return { ok: true };
}
