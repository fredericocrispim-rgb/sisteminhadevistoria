"use server";

import { revalidatePath } from "next/cache";
import { exigirSuperadmin } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";

const hoje = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); // aaaa-mm-dd

function somarDias(data: string, dias: number) {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Pix conferido no extrato: registra a mensalidade como paga e libera mais 30 dias.
 * Se ainda tinha dias pagos, os 30 dias contam a partir do vencimento atual.
 */
export async function marcarComoPago(formData: FormData) {
  const ctx = await exigirSuperadmin();
  const empresaId = String(formData.get("empresa_id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(empresaId)) return;

  const admin = criarClienteAdmin();
  const [{ data: assinatura }, { data: planos }] = await Promise.all([
    admin.from("assinaturas").select("id, plano_id, proximo_vencimento, status").eq("empresa_id", empresaId).single(),
    admin.from("planos").select("id, preco_mensal").eq("ativo", true).order("ordem"),
  ]);
  if (!assinatura) return;
  const plano = planos?.find((p) => p.id === assinatura.plano_id) ?? planos?.[0];

  const base = assinatura.status === "ativa" && assinatura.proximo_vencimento && assinatura.proximo_vencimento > hoje() ? assinatura.proximo_vencimento : hoje();
  const novoVencimento = somarDias(base, 30);

  await admin.from("faturas").insert({
    empresa_id: empresaId,
    assinatura_id: assinatura.id,
    descricao: "Mensalidade (Pix conferido à mão)",
    valor: plano?.preco_mensal ?? 0.01,
    vencimento: hoje(),
    status: "paga",
    forma: "pix",
    pago_em: new Date().toISOString(),
    confirmado_por: ctx.usuario.id,
  });
  await admin
    .from("assinaturas")
    .update({ status: "ativa", plano_id: plano?.id ?? null, proximo_vencimento: novoVencimento })
    .eq("id", assinatura.id);
  await admin.from("auditoria").insert({
    empresa_id: empresaId,
    usuario_id: ctx.usuario.id,
    acao: "pix_confirmado",
    entidade: "assinaturas",
    entidade_id: assinatura.id,
    detalhes: { ate: novoVencimento },
  });

  revalidatePath("/admin");
}
