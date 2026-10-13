import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { dataPassou } from "@/lib/cadastro";

export type Papel = "dono" | "gerente" | "vistoriador";

export type EmpresaResumo = {
  id: string;
  nome_fantasia: string;
  logo_app_url: string | null;
  cadastro_completo_pct: number;
  whatsapp: string | null;
  codigo_indicacao: string;
};

export type Contexto = {
  usuario: { id: string; email: string; nome: string | null; whatsapp: string | null };
  papel: Papel | null;
  empresa: EmpresaResumo | null;
  superadmin: boolean;
};

/**
 * Quem está usando o sistema agora (lido uma vez por acesso).
 * Retorna null se ninguém estiver logado.
 */
export const obterContexto = cache(async (): Promise<Contexto | null> => {
  const supabase = await criarClienteServidor();
  // getClaims confere a assinatura do login aqui mesmo (chave ES256), sem ir ao Supabase a cada tela
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const user = {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    user_metadata: (claims.user_metadata ?? {}) as Record<string, unknown>,
  };

  const [{ data: vinculo }, { data: admin }] = await Promise.all([
    supabase
      .from("usuarios_empresa")
      .select(
        "papel, empresas (id, nome_fantasia, logo_app_url, cadastro_completo_pct, whatsapp, codigo_indicacao)",
      )
      .eq("user_id", user.id)
      .eq("ativo", true)
      .order("criado_em")
      .limit(1)
      .maybeSingle(),
    supabase.from("superadmins").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  const meta = user.user_metadata;
  return {
    usuario: {
      id: user.id,
      email: user.email,
      nome: typeof meta.nome === "string" ? meta.nome : null,
      whatsapp: typeof meta.whatsapp === "string" ? meta.whatsapp : null,
    },
    papel: (vinculo?.papel as Papel | undefined) ?? null,
    empresa: (vinculo?.empresas as unknown as EmpresaResumo | null) ?? null,
    superadmin: Boolean(admin),
  };
});

/** Exige login. Sem login, vai para /entrar. */
export async function exigirLogin(): Promise<Contexto> {
  const ctx = await obterContexto();
  if (!ctx) redirect("/entrar");
  return ctx;
}

export type SituacaoPlano = {
  status: "teste" | "ativa" | "em_atraso" | "inadimplente" | "cancelada";
  fimTeste: string | null;
  proximoVencimento: string | null;
  /** Teste acabou ou mensalidade vencida: só a tela de pagamento abre. */
  bloqueado: boolean;
};

/**
 * Situação do plano da oficina. Regras (fase de validação, Pix manual):
 * - teste: bloqueia quando passa o último dia do teste (7 dias);
 * - ativa: bloqueia quando passa o vencimento + dias de carência;
 * - em atraso / inadimplente / cancelada: bloqueia.
 */
export const situacaoPlano = cache(async (empresaId: string): Promise<SituacaoPlano> => {
  const admin = criarClienteAdmin(); // vistoriador não lê "assinaturas", mas precisa saber se está bloqueado
  const [{ data: a }, { data: plat }] = await Promise.all([
    admin.from("assinaturas").select("status, fim_teste, proximo_vencimento").eq("empresa_id", empresaId).maybeSingle(),
    admin.from("plataforma").select("dias_carencia").single(),
  ]);
  const status = (a?.status ?? "teste") as SituacaoPlano["status"];
  let bloqueado = false;
  if (status === "teste") bloqueado = !a?.fim_teste || dataPassou(a.fim_teste);
  else if (status === "ativa") {
    if (a?.proximo_vencimento) {
      const limite = new Date(`${a.proximo_vencimento}T12:00:00Z`);
      limite.setUTCDate(limite.getUTCDate() + (plat?.dias_carencia ?? 0));
      bloqueado = dataPassou(limite.toISOString().slice(0, 10));
    }
  } else bloqueado = true;
  return { status, fimTeste: a?.fim_teste ?? null, proximoVencimento: a?.proximo_vencimento ?? null, bloqueado };
});

type ContextoOficina = Contexto & { empresa: EmpresaResumo; papel: Papel; plano: SituacaoPlano; bloqueado: boolean };

/**
 * Exige login E oficina cadastrada (sem oficina, vai para o cadastro).
 * Se o teste acabou ou a mensalidade venceu, vai direto para a tela de pagamento (/plano),
 * a não ser que a página permita (a própria tela de pagamento). O administrador nunca é bloqueado.
 */
export async function exigirOficina(opcoes?: { permitirBloqueado?: boolean }): Promise<ContextoOficina> {
  const ctx = await exigirLogin();
  if (!ctx.empresa || !ctx.papel) redirect("/cadastro");
  const plano = await situacaoPlano(ctx.empresa.id);
  const bloqueado = plano.bloqueado && !ctx.superadmin;
  if (bloqueado && !opcoes?.permitirBloqueado) redirect("/plano");
  return { ...(ctx as Contexto & { empresa: EmpresaResumo; papel: Papel }), plano, bloqueado };
}

export async function exigirSuperadmin(): Promise<Contexto> {
  const ctx = await exigirLogin();
  if (!ctx.superadmin) redirect("/inicio");
  return ctx;
}
