import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { fasePagamento, hojeBR, type FasePagamento } from "@/lib/cadastro";

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
  /** Data que vale agora: fim do teste ou vencimento da mensalidade. */
  vencimento: string | null;
  fase: FasePagamento;
  diasParaVencer: number;
  diasAtraso: number;
  /** Dias de atraso tolerados antes de bloquear (plataforma.dias_carencia). */
  carencia: number;
  /** Mais de `carencia` dias de atraso: só a tela de pagamento abre. */
  bloqueado: boolean;
  /** Oficina inativada no /admin: ninguém da equipe usa o sistema (nada é apagado). */
  inativa: boolean;
  /** pix_manual (Pix conferido à mão) ou asaas (Pix/cartão com liberação automática). */
  provedor: string;
  formaPagamento: "PIX" | "CREDIT_CARD" | null;
  /** Até quando usa (Asaas): vencimento do ciclo pago + carência. Assinatura cancelada usa até esta data. */
  acessoAte: string | null;
  idAssinaturaExterna: string | null;
};

/**
 * Situação do plano da oficina (Pix manual). Quem se cadastra tem 1 dia para pagar (fim_teste):
 * passou esse dia sem pagar, bloqueia na hora. Para as mensalidades:
 * - faltando 3 dias ou menos: mostra o Pix ao entrar (pode continuar);
 * - vencido há até 5 dias: mostra o Pix com "Mensalidade em atraso" (pode continuar);
 * - vencido há mais de 5 dias: bloqueado (só a tela do Pix).
 * Inadimplente (marcado à mão, estorno ou chargeback no Asaas): bloqueado.
 * Cancelada: usa até acesso_ate (fim do período já pago); sem essa data, bloqueado.
 * Só o webhook do Asaas (ou o /admin) muda status e datas; nada vindo do navegador libera acesso.
 */
export const situacaoPlano = cache(async (empresaId: string): Promise<SituacaoPlano> => {
  const admin = criarClienteAdmin(); // vistoriador não lê "assinaturas", mas precisa saber se está bloqueado
  const [{ data: a }, { data: plat }, { data: emp }] = await Promise.all([
    admin
      .from("assinaturas")
      .select("status, fim_teste, proximo_vencimento, provedor, forma_pagamento, acesso_ate, id_assinatura_externa").eq("empresa_id", empresaId).maybeSingle(),
    admin.from("plataforma").select("dias_carencia").single(),
    admin.from("empresas").select("ativa").eq("id", empresaId).maybeSingle(),
  ]);
  const status = (a?.status ?? "teste") as SituacaoPlano["status"];
  // Primeiro pagamento (fim do prazo de 1 dia): sem carência, bloqueia assim que vence
  const carencia = status === "teste" ? 0 : (plat?.dias_carencia ?? 5);
  const vencimento = (status === "teste" ? a?.fim_teste : a?.proximo_vencimento) ?? null;
  const r =
    status === "cancelada"
      ? fasePagamento(a?.acesso_ate ?? null, hojeBR(), 0) // sem data: bloqueado
      : fasePagamento(vencimento, hojeBR(), carencia);
  const inativa = emp?.ativa === false;
  const fase: FasePagamento = status === "inadimplente" || inativa ? "bloqueado" : r.fase;
  return {
    status,
    fimTeste: a?.fim_teste ?? null,
    proximoVencimento: a?.proximo_vencimento ?? null,
    vencimento,
    fase,
    diasParaVencer: r.diasParaVencer,
    diasAtraso: r.diasAtraso,
    carencia,
    bloqueado: fase === "bloqueado",
    inativa,
    provedor: a?.provedor ?? "pix_manual",
    formaPagamento: (a?.forma_pagamento as SituacaoPlano["formaPagamento"]) ?? null,
    acessoAte: a?.acesso_ate ?? null,
    idAssinaturaExterna: a?.id_assinatura_externa ?? null,
  };
});

/** A oficina pode usar o sistema (fazer vistoria)? Sem assinatura em dia, entra, mas só vê a tela de pagamento. */
export async function temAssinaturaAtiva(empresaId: string) {
  return !(await situacaoPlano(empresaId)).bloqueado;
}

type ContextoOficina = Contexto & { empresa: EmpresaResumo; papel: Papel; plano: SituacaoPlano; bloqueado: boolean };

/**
 * Exige login E oficina cadastrada (sem oficina, vai para o cadastro).
 * Com mais de 5 dias de atraso (teste ou mensalidade), vai direto para a tela de pagamento (/plano),
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
