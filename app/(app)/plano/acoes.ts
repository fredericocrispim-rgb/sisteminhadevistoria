"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hojeBR } from "@/lib/cadastro";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { atualizarValorAsaas } from "@/lib/pagamentos/servidor";

/** "Continuar para o sistema": não mostra o Pix de novo hoje e segue para o início. */
export async function continuarSemPagar() {
  const c = await cookies();
  c.set("vf_aviso_pix", hojeBR(), { maxAge: 60 * 60 * 24, httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/inicio");
}

/**
 * Básico ⇄ Pro (só o dono). Vale na hora para gravar vídeo; o valor novo entra na próxima
 * mensalidade (no Asaas, a assinatura e a cobrança em aberto já passam para o valor novo).
 * Os vídeos já gravados continuam guardados se voltar para o Básico.
 */
export async function trocarPlano(pro: boolean): Promise<{ ok: true } | { ok: false; erro: string }> {
  const { empresa, papel, usuario } = await exigirOficina({ permitirBloqueado: true });
  if (papel !== "dono") return { ok: false, erro: "Só o dono da oficina muda o plano." };
  const admin = criarClienteAdmin();
  const [{ data: plat }, { data: planos }] = await Promise.all([
    admin.from("plataforma").select("*").single(),
    admin.from("planos").select("*").eq("ativo", true).order("ordem"),
  ]);
  if (!plat?.video_ligado) return { ok: false, erro: "O plano Pro ainda não está disponível." };
  const plano = (planos ?? []).find((p) => (pro ? (p.video_segundos ?? 0) > 0 : (p.video_segundos ?? 0) === 0));
  if (!plano) return { ok: false, erro: "Não consegui mudar o plano. Tente de novo." };

  const { error } = await admin.from("assinaturas").update({ plano_id: plano.id }).eq("empresa_id", empresa.id);
  if (error) return { ok: false, erro: "Não consegui mudar o plano. Tente de novo." };
  await admin.from("auditoria").insert({
    empresa_id: empresa.id,
    usuario_id: usuario.id,
    acao: "mudou_plano",
    entidade: "assinaturas",
    detalhes: { plano: plano.nome },
  });
  await atualizarValorAsaas(empresa.id);
  revalidatePath("/plano");
  return { ok: true };
}
