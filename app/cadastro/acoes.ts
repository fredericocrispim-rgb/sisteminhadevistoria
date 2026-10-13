"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { obterContexto } from "@/lib/sessao";
import { telefoneValido } from "@/lib/formatos";
import { progressoCadastro } from "@/lib/cadastro";
import { textos } from "@/lib/textos";

type Resultado<T = object> = ({ ok: true } & T) | { ok: false; erro: string };

const FALHOU = "Não deu certo. Confira a internet e tente de novo.";

async function ipDoUsuario() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
}

/* ---------- Passo 1: você e a oficina ---------- */

const esquemaPasso1 = z.object({
  nome: z.string().trim().min(2, textos.cadastro.voce.erroNome).max(80),
  whatsapp: z.string().refine(telefoneValido, textos.erros.telefoneInvalido),
  oficina: z.string().trim().min(2, textos.cadastro.oficina.erroNome).max(80),
  aceite: z.literal(true, { error: textos.cadastro.voce.erroAceite }),
});

/** Salva seu nome e WhatsApp, o aceite dos termos e cria (ou renomeia) a oficina. */
export async function salvarPasso1(dados: z.input<typeof esquemaPasso1>): Promise<Resultado<{ empresaId: string }>> {
  const ctx = await obterContexto();
  if (!ctx) return { ok: false, erro: FALHOU };
  const v = esquemaPasso1.safeParse(dados);
  if (!v.success) return { ok: false, erro: v.error.issues[0].message };
  const d = v.data;

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.updateUser({ data: { nome: d.nome, whatsapp: d.whatsapp } });
  if (error) return { ok: false, erro: FALHOU };

  const admin = criarClienteAdmin();
  const ip = await ipDoUsuario();
  const { data: plat } = await admin.from("plataforma").select("versao_termos_atual, versao_privacidade_atual").single();

  // Já tem oficina (voltou para corrigir): só atualiza o nome e o WhatsApp
  if (ctx.empresa) {
    if (ctx.papel === "dono" || ctx.papel === "gerente") {
      await supabase.from("empresas").update({ nome_fantasia: d.oficina, whatsapp: d.whatsapp }).eq("id", ctx.empresa.id);
    }
    revalidatePath("/", "layout");
    return { ok: true, empresaId: ctx.empresa.id };
  }

  const cookieStore = await cookies();
  const ref = cookieStore.get("vf_ref")?.value;
  let indicadaPor: string | null = null;
  if (ref) {
    const { data } = await admin.from("empresas").select("id").eq("codigo_indicacao", ref).maybeSingle();
    indicadaPor = data?.id ?? null;
  }

  const linha = {
    nome_fantasia: d.oficina,
    whatsapp: d.whatsapp,
    email: ctx.usuario.email,
    responsavel_nome: d.nome,
    segmento: "oficina",
    indicada_por_empresa_id: indicadaPor,
  };
  const { data: empresa, error: erroEmpresa } = await admin
    .from("empresas")
    .insert({ ...linha, cadastro_completo_pct: progressoCadastro(linha).pct })
    .select("id")
    .single();
  if (erroEmpresa || !empresa) return { ok: false, erro: FALHOU };

  const { error: erroVinculo } = await admin
    .from("usuarios_empresa")
    .insert({ empresa_id: empresa.id, user_id: ctx.usuario.id, nome: d.nome, papel: "dono" });
  if (erroVinculo) {
    await admin.from("empresas").delete().eq("id", empresa.id);
    return { ok: false, erro: FALHOU };
  }

  await Promise.all([
    admin.from("aceites_termos").insert([
      { usuario_id: ctx.usuario.id, empresa_id: empresa.id, documento: "termos", versao: plat?.versao_termos_atual ?? "1", ip },
      { usuario_id: ctx.usuario.id, empresa_id: empresa.id, documento: "privacidade", versao: plat?.versao_privacidade_atual ?? "1", ip },
    ]),
    indicadaPor
      ? admin.from("indicacoes").insert({ empresa_indicante_id: indicadaPor, empresa_indicada_id: empresa.id })
      : Promise.resolve(),
    admin.from("auditoria").insert({
      empresa_id: empresa.id,
      usuario_id: ctx.usuario.id,
      acao: "criou_oficina",
      entidade: "empresas",
      entidade_id: empresa.id,
      ip,
    }),
  ]);
  if (ref) cookieStore.delete("vf_ref");

  revalidatePath("/", "layout");
  return { ok: true, empresaId: empresa.id };
}

/* ---------- Passo 2: logo ---------- */

const esquemaLogo = z.object({
  logos: z.object({ app: z.string().url(), pdf: z.string().url(), email: z.string().url(), original: z.string().url() }),
});

export async function salvarLogo(dados: z.input<typeof esquemaLogo>): Promise<Resultado> {
  const ctx = await obterContexto();
  if (!ctx?.empresa || (ctx.papel !== "dono" && ctx.papel !== "gerente")) return { ok: false, erro: FALHOU };
  const v = esquemaLogo.safeParse(dados);
  if (!v.success) return { ok: false, erro: FALHOU };

  // Só aceita logos que estão na pasta desta oficina
  const pasta = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/marcas/${ctx.empresa.id}/`;
  const l = v.data.logos;
  if (!Object.values(l).every((u) => u.startsWith(pasta))) return { ok: false, erro: FALHOU };

  const supabase = await criarClienteServidor();
  const { data: atual } = await supabase.from("empresas").select("*").eq("id", ctx.empresa.id).single();
  const novo = { logo_app_url: l.app, logo_pdf_url: l.pdf, logo_email_url: l.email, logo_original_url: l.original };
  const { error } = await supabase
    .from("empresas")
    .update({ ...novo, cadastro_completo_pct: progressoCadastro({ ...atual, ...novo }).pct })
    .eq("id", ctx.empresa.id);
  if (error) return { ok: false, erro: FALHOU };

  revalidatePath("/", "layout");
  return { ok: true };
}
