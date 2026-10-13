"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { obterContexto } from "@/lib/sessao";
import { cnpjValido, cpfValido, soNumeros, telefoneValido } from "@/lib/formatos";
import { corSeguraParaTextoBranco } from "@/lib/cores";
import { progressoCadastro } from "@/lib/cadastro";
import { textos } from "@/lib/textos";

type Resultado<T = object> = ({ ok: true } & T) | { ok: false; erro: string };

const FALHOU = "Não deu certo. Confira a internet e tente de novo.";

async function ipDoUsuario() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
}

/* ---------- Passo 1: Você ---------- */

const esquemaVoce = z.object({
  nome: z.string().trim().min(2, textos.cadastro.voce.erroNome).max(80),
  whatsapp: z.string().refine(telefoneValido, textos.erros.telefoneInvalido),
  aceite: z.literal(true, { error: textos.cadastro.voce.erroAceite }),
});

export async function salvarVoce(dados: z.input<typeof esquemaVoce>): Promise<Resultado> {
  const ctx = await obterContexto();
  if (!ctx) return { ok: false, erro: FALHOU };
  const v = esquemaVoce.safeParse(dados);
  if (!v.success) return { ok: false, erro: v.error.issues[0].message };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.updateUser({ data: { nome: v.data.nome, whatsapp: v.data.whatsapp } });
  if (error) return { ok: false, erro: FALHOU };

  const { data: plat } = await supabase.from("plataforma").select("versao_termos_atual, versao_privacidade_atual").single();
  const ip = await ipDoUsuario();
  await supabase.from("aceites_termos").insert([
    { usuario_id: ctx.usuario.id, documento: "termos", versao: plat?.versao_termos_atual ?? "1", ip },
    { usuario_id: ctx.usuario.id, documento: "privacidade", versao: plat?.versao_privacidade_atual ?? "1", ip },
  ]);
  return { ok: true };
}

/* ---------- Passo 2: buscas automáticas ---------- */

export type DadosEmpresaEncontrada = {
  razao_social: string | null;
  nome_fantasia: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  telefone: string | null;
  email: string | null;
};

const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Busca os dados públicos do CNPJ na BrasilAPI. Se falhar, a pessoa preenche à mão. */
export async function buscarCnpj(cnpj: string): Promise<DadosEmpresaEncontrada | null> {
  const d = soNumeros(cnpj);
  if (!cnpjValido(d)) return null;
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${d}`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const j = await r.json();
    const tipoRua = texto(j.descricao_tipo_de_logradouro);
    const rua = texto(j.logradouro);
    return {
      razao_social: texto(j.razao_social),
      nome_fantasia: texto(j.nome_fantasia),
      cep: texto(j.cep),
      logradouro: rua ? (tipoRua && !rua.startsWith(tipoRua) ? `${tipoRua} ${rua}` : rua) : null,
      numero: texto(j.numero),
      complemento: texto(j.complemento),
      bairro: texto(j.bairro),
      cidade: texto(j.municipio),
      uf: texto(j.uf),
      telefone: texto(j.ddd_telefone_1),
      email: texto(j.email)?.toLowerCase() ?? null,
    };
  } catch {
    return null;
  }
}

export async function buscarCep(cep: string) {
  const d = soNumeros(cep);
  if (d.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = await r.json();
    if (j.erro) return null;
    return { logradouro: texto(j.logradouro), bairro: texto(j.bairro), cidade: texto(j.localidade), uf: texto(j.uf) };
  } catch {
    return null;
  }
}

/* ---------- Passo 2: criar a oficina ---------- */

const SEGMENTOS = ["oficina", "funilaria", "autocentro", "guincho", "associacao", "outro"] as const;
const opcional = z
  .string()
  .trim()
  .max(160)
  .nullish()
  .transform((v) => v || null);

const esquemaOficina = z.object({
  documento: z.string().refine((v) => cnpjValido(v) || cpfValido(v), textos.cadastro.oficina.erroDocumento),
  nome: z.string().trim().min(2, textos.cadastro.oficina.erroNome).max(80),
  whatsapp: z.string().refine(telefoneValido, textos.erros.telefoneInvalido),
  segmento: z.enum(SEGMENTOS, { error: textos.erros.escolhaUmaOpcao }),
  faixa: z.string().max(20).nullish(),
  razao_social: opcional,
  cep: opcional,
  logradouro: opcional,
  numero: opcional,
  complemento: opcional,
  bairro: opcional,
  cidade: opcional,
  uf: z
    .string()
    .trim()
    .length(2)
    .nullish()
    .or(z.literal(""))
    .transform((v) => (v ? v.toUpperCase() : null)),
  telefone: opcional,
  email: opcional,
});

export type DadosOficina = z.input<typeof esquemaOficina>;

export async function criarOficina(dados: DadosOficina): Promise<Resultado<{ empresaId: string }>> {
  const ctx = await obterContexto();
  if (!ctx) return { ok: false, erro: FALHOU };
  if (ctx.empresa) return { ok: true, empresaId: ctx.empresa.id }; // já tem: não cria outra

  const v = esquemaOficina.safeParse(dados);
  if (!v.success) return { ok: false, erro: v.error.issues[0].message };
  const d = v.data;
  const doc = soNumeros(d.documento);

  const admin = criarClienteAdmin();
  const cookieStore = await cookies();
  const ref = cookieStore.get("vf_ref")?.value;
  let indicadaPor: string | null = null;
  if (ref) {
    const { data } = await admin.from("empresas").select("id").eq("codigo_indicacao", ref).maybeSingle();
    indicadaPor = data?.id ?? null;
  }

  const linha = {
    tipo_pessoa: doc.length === 14 ? "PJ" : "PF",
    cnpj_cpf: doc,
    razao_social: d.razao_social,
    nome_fantasia: d.nome,
    whatsapp: d.whatsapp,
    telefone: d.telefone,
    email: d.email ?? ctx.usuario.email,
    cep: d.cep ? soNumeros(d.cep) : null,
    logradouro: d.logradouro,
    numero: d.numero,
    complemento: d.complemento,
    bairro: d.bairro,
    cidade: d.cidade,
    uf: d.uf,
    segmento: d.segmento,
    vistorias_mes_estimadas: d.faixa ?? null,
    responsavel_nome: ctx.usuario.nome,
    indicada_por_empresa_id: indicadaPor,
  };

  const { data: empresa, error } = await admin
    .from("empresas")
    .insert({ ...linha, cadastro_completo_pct: progressoCadastro(linha).pct })
    .select("id")
    .single();
  if (error || !empresa) return { ok: false, erro: FALHOU };

  const { error: erroVinculo } = await admin
    .from("usuarios_empresa")
    .insert({ empresa_id: empresa.id, user_id: ctx.usuario.id, nome: ctx.usuario.nome, papel: "dono" });
  if (erroVinculo) {
    await admin.from("empresas").delete().eq("id", empresa.id);
    return { ok: false, erro: FALHOU };
  }

  await Promise.all([
    admin.from("aceites_termos").update({ empresa_id: empresa.id }).eq("usuario_id", ctx.usuario.id).is("empresa_id", null),
    indicadaPor
      ? admin.from("indicacoes").insert({ empresa_indicante_id: indicadaPor, empresa_indicada_id: empresa.id })
      : Promise.resolve(),
    admin.from("auditoria").insert({
      empresa_id: empresa.id,
      usuario_id: ctx.usuario.id,
      acao: "criou_oficina",
      entidade: "empresas",
      entidade_id: empresa.id,
      ip: await ipDoUsuario(),
    }),
  ]);
  if (ref) cookieStore.delete("vf_ref");

  revalidatePath("/", "layout");
  return { ok: true, empresaId: empresa.id };
}

/* ---------- Passo 3: logo e cor ---------- */

const esquemaLogo = z.object({
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logos: z
    .object({ app: z.string().url(), pdf: z.string().url(), email: z.string().url(), original: z.string().url() })
    .nullable(),
});

export async function salvarLogo(dados: z.input<typeof esquemaLogo>): Promise<Resultado> {
  const ctx = await obterContexto();
  if (!ctx?.empresa || (ctx.papel !== "dono" && ctx.papel !== "gerente")) return { ok: false, erro: FALHOU };
  const v = esquemaLogo.safeParse(dados);
  if (!v.success) return { ok: false, erro: FALHOU };

  // Só aceita logos que estão na pasta desta oficina
  const pasta = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/marcas/${ctx.empresa.id}/`;
  const logos = v.data.logos;
  if (logos && !Object.values(logos).every((u) => u.startsWith(pasta))) return { ok: false, erro: FALHOU };

  const supabase = await criarClienteServidor();
  const { data: atual } = await supabase.from("empresas").select("*").eq("id", ctx.empresa.id).single();
  const novo = {
    cor_primaria: corSeguraParaTextoBranco(v.data.cor),
    ...(logos
      ? { logo_app_url: logos.app, logo_pdf_url: logos.pdf, logo_email_url: logos.email, logo_original_url: logos.original }
      : {}),
  };
  const { error } = await supabase
    .from("empresas")
    .update({ ...novo, cadastro_completo_pct: progressoCadastro({ ...atual, ...novo }).pct })
    .eq("id", ctx.empresa.id);
  if (error) return { ok: false, erro: FALHOU };

  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------- Passo 4: convites da equipe ---------- */

const esquemaConvite = z.object({
  nome: z.string().trim().min(2, "Coloque o nome da pessoa").max(80),
  papel: z.enum(["vistoriador", "gerente"], { error: textos.erros.escolhaUmaOpcao }),
});

export async function criarConvite(dados: z.input<typeof esquemaConvite>): Promise<Resultado<{ link: string }>> {
  const ctx = await obterContexto();
  if (!ctx?.empresa || (ctx.papel !== "dono" && ctx.papel !== "gerente")) return { ok: false, erro: FALHOU };
  const v = esquemaConvite.safeParse(dados);
  if (!v.success) return { ok: false, erro: v.error.issues[0].message };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("convites")
    .insert({ empresa_id: ctx.empresa.id, nome: v.data.nome, papel: v.data.papel, criado_por: ctx.usuario.id })
    .select("token")
    .single();
  if (error || !data) return { ok: false, erro: FALHOU };

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? process.env.NEXT_PUBLIC_APP_URL : `${proto}://${host}`;
  return { ok: true, link: `${base}/convite/${data.token}` };
}
