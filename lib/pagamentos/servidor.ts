import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarComissoes } from "@/lib/comissoes-servidor";
import type { CobrancaAsaas } from "./asaas";
import { PROVEDOR_ASAAS } from "./config";
import { somarDias, somarUmMes, type AcaoWebhook, type Deps, type EventoAsaas } from "./webhook";

/**
 * Liga o webhook (e o botão "Já paguei") ao banco. Tudo com a chave secreta, só no servidor.
 * Cobrança do Asaas = linha em `faturas` (id_externo = id da cobrança).
 */

type Assinatura = { id: string; empresa_id: string; status: string; proximo_vencimento: string | null };

const STATUS_FATURA: Record<string, string> = {
  PENDING: "pendente",
  OVERDUE: "vencida",
  RECEIVED: "paga",
  CONFIRMED: "paga",
  RECEIVED_IN_CASH: "paga",
  REFUNDED: "estornada",
};

async function acharAssinatura(c: CobrancaAsaas): Promise<Assinatura | null> {
  const admin = criarClienteAdmin();
  const campos = "id, empresa_id, status, proximo_vencimento";
  if (c.subscription) {
    const { data } = await admin.from("assinaturas").select(campos).eq("id_assinatura_externa", c.subscription).maybeSingle();
    if (data) return data;
  }
  // Reserva: a assinatura/cobrança leva o id da oficina em externalReference
  if (c.externalReference && /^[0-9a-f-]{36}$/.test(c.externalReference)) {
    const { data } = await admin.from("assinaturas").select(campos).eq("empresa_id", c.externalReference).maybeSingle();
    if (data) return data;
  }
  return null;
}

/** Grava (ou atualiza) a cobrança como fatura da oficina. Não mexe numa fatura que já está paga. */
export async function guardarCobranca(c: CobrancaAsaas, a: Assinatura) {
  const admin = criarClienteAdmin();
  const linha = {
    empresa_id: a.empresa_id,
    assinatura_id: a.id,
    descricao: c.description || "Mensalidade",
    valor: c.value,
    vencimento: c.dueDate,
    forma: c.billingType === "CREDIT_CARD" ? "cartao" : "pix",
    id_externo: c.id,
    link_fatura: c.invoiceUrl ?? null,
    link_comprovante: c.transactionReceiptUrl ?? null,
  };
  const { data: existente } = await admin.from("faturas").select("id, status").eq("id_externo", c.id).maybeSingle();
  if (existente) {
    // "paga" só vira em aplicarPagamento (que cria a comissão); paga/estornada não voltam atrás
    const novo = STATUS_FATURA[c.status];
    const travada = existente.status === "paga" || existente.status === "estornada";
    const status = travada || !novo || novo === "paga" ? existente.status : novo;
    await admin.from("faturas").update({ ...linha, status }).eq("id", existente.id);
    return existente.id as string;
  }
  const { data, error } = await admin
    .from("faturas")
    .upsert({ ...linha, status: c.status === "OVERDUE" ? "vencida" : "pendente" }, { onConflict: "id_externo", ignoreDuplicates: true })
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return data.id as string;
  const { data: outra } = await admin.from("faturas").select("id").eq("id_externo", c.id).single();
  return outra?.id as string;
}

/**
 * Pagamento confirmado: fatura paga, assinatura ativa e acesso até o próximo vencimento + carência.
 * Só a primeira confirmação cria a comissão (o cartão manda CONFIRMED e depois RECEIVED).
 */
export async function aplicarPagamento(c: CobrancaAsaas) {
  const a = await acharAssinatura(c);
  if (!a) {
    console.log(`Asaas: cobrança ${c.id} sem assinatura conhecida`);
    return;
  }
  const admin = criarClienteAdmin();
  await guardarCobranca(c, a);
  const pagoEm = c.confirmedDate || c.clientPaymentDate || c.paymentDate;
  const { data: virouPaga } = await admin
    .from("faturas")
    .update({ status: "paga", pago_em: pagoEm ? `${pagoEm}T12:00:00-03:00` : new Date().toISOString(), link_comprovante: c.transactionReceiptUrl ?? null })
    .eq("id_externo", c.id)
    .neq("status", "paga")
    .select("id");
  if (virouPaga?.length) await criarComissoes(a.empresa_id, virouPaga.map((f) => f.id));

  const { data: plat } = await admin.from("plataforma").select("dias_carencia").single();
  const seguinte = somarUmMes(c.dueDate);
  // Nunca anda para trás (evento antigo chegando depois de um mais novo)
  const proximo = a.proximo_vencimento && a.status !== "teste" && a.proximo_vencimento > seguinte ? a.proximo_vencimento : seguinte;
  await admin
    .from("assinaturas")
    .update({
      // Cancelada continua cancelada (só usa até o fim do período pago)
      status: a.status === "cancelada" ? "cancelada" : "ativa",
      proximo_vencimento: proximo,
      acesso_ate: somarDias(proximo, plat?.dias_carencia ?? 5),
      forma_pagamento: c.billingType === "CREDIT_CARD" ? "CREDIT_CARD" : "PIX",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", a.id);
}

export async function aplicarAcao(acao: AcaoWebhook) {
  const admin = criarClienteAdmin();
  switch (acao.tipo) {
    case "pago":
      return aplicarPagamento(acao.cobranca);
    case "cobranca": {
      const a = await acharAssinatura(acao.cobranca);
      if (a) await guardarCobranca(acao.cobranca, a);
      return;
    }
    case "atrasado": {
      const a = await acharAssinatura(acao.cobranca);
      if (!a) return;
      await guardarCobranca(acao.cobranca, a);
      await admin.from("faturas").update({ status: "vencida" }).eq("id_externo", acao.cobranca.id).eq("status", "pendente");
      // Continua usando até acesso_ate / carência (a regra de acesso cuida do bloqueio)
      if (a.status === "ativa") await admin.from("assinaturas").update({ status: "em_atraso", atualizado_em: new Date().toISOString() }).eq("id", a.id);
      return;
    }
    case "cobranca_removida":
      await admin.from("faturas").update({ status: "cancelada" }).eq("id_externo", acao.cobranca.id).neq("status", "paga");
      return;
    case "estorno": {
      const a = await acharAssinatura(acao.cobranca);
      await admin.from("faturas").update({ status: "estornada" }).eq("id_externo", acao.cobranca.id);
      // Estorno ou contestação no cartão: bloqueia na hora (o Frederico libera no /admin se resolver)
      if (a) await admin.from("assinaturas").update({ status: "inadimplente", acesso_ate: null, atualizado_em: new Date().toISOString() }).eq("id", a.id);
      return;
    }
    case "assinatura_encerrada":
      // Usa até o fim do período já pago (acesso_ate); depois bloqueia
      await admin
        .from("assinaturas")
        .update({ status: "cancelada", atualizado_em: new Date().toISOString() })
        .eq("id_assinatura_externa", acao.assinaturaId)
        .neq("status", "inadimplente");
      return;
    default:
      return;
  }
}

/** Funções que o webhook usa para falar com o banco. */
export function depsWebhook(): Deps {
  const admin = criarClienteAdmin();
  return {
    async registrarEvento(e: EventoAsaas) {
      const { error } = await admin
        .from("eventos_pagamento")
        .insert({ provedor: PROVEDOR_ASAAS, id_evento_provedor: e.id, tipo: e.event, payload: e });
      if (!error) return true;
      if (error.code === "23505") return false; // já recebido
      throw new Error(error.message);
    },
    aplicar: (acao) => aplicarAcao(acao),
    async concluirEvento(id) {
      await admin.from("eventos_pagamento").update({ processado_em: new Date().toISOString() }).eq("provedor", PROVEDOR_ASAAS).eq("id_evento_provedor", id);
    },
    async desfazerEvento(id) {
      await admin.from("eventos_pagamento").delete().eq("provedor", PROVEDOR_ASAAS).eq("id_evento_provedor", id);
    },
  };
}
