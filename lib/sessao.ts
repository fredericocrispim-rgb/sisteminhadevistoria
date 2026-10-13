import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export type Papel = "dono" | "gerente" | "vistoriador";

export type EmpresaResumo = {
  id: string;
  nome_fantasia: string;
  cor_primaria: string;
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: vinculo }, { data: admin }] = await Promise.all([
    supabase
      .from("usuarios_empresa")
      .select(
        "papel, empresas (id, nome_fantasia, cor_primaria, logo_app_url, cadastro_completo_pct, whatsapp, codigo_indicacao)",
      )
      .eq("user_id", user.id)
      .eq("ativo", true)
      .order("criado_em")
      .limit(1)
      .maybeSingle(),
    supabase.from("superadmins").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  const meta = user.user_metadata ?? {};
  return {
    usuario: {
      id: user.id,
      email: user.email ?? "",
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

/** Exige login E oficina cadastrada. Sem oficina, vai para o cadastro. */
export async function exigirOficina(): Promise<Contexto & { empresa: EmpresaResumo; papel: Papel }> {
  const ctx = await exigirLogin();
  if (!ctx.empresa || !ctx.papel) redirect("/cadastro");
  return ctx as Contexto & { empresa: EmpresaResumo; papel: Papel };
}

export async function exigirSuperadmin(): Promise<Contexto> {
  const ctx = await exigirLogin();
  if (!ctx.superadmin) redirect("/inicio");
  return ctx;
}
