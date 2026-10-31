import { timingSafeEqual } from "node:crypto";
import type { CobrancaAsaas } from "./asaas";

/**
 * Webhook do Asaas: o Asaas avisa o sistema quando uma cobrança muda (paga, vencida, estornada...).
 * Esta parte não fala com o banco (recebe as funções em `Deps`), para poder ser testada.
 * Regras: confere o token (cabeçalho asaas-access-token), ignora evento repetido (id do evento),
 * responde 200 rápido. Só o webhook (ou a consulta direta à API no servidor) libera o acesso.
 */

export type EventoAsaas = {
  id: string;
  event: string;
  dateCreated?: string;
  payment?: CobrancaAsaas;
  subscription?: { id: string; status?: string; externalReference?: string | null };
};

export type AcaoWebhook =
  | { tipo: "pago"; cobranca: CobrancaAsaas }
  | { tipo: "cobranca"; cobranca: CobrancaAsaas }
  | { tipo: "atrasado"; cobranca: CobrancaAsaas }
  | { tipo: "cobranca_removida"; cobranca: CobrancaAsaas }
  | { tipo: "estorno"; cobranca: CobrancaAsaas }
  | { tipo: "assinatura_encerrada"; assinaturaId: string }
  | { tipo: "ignorar" }
  | { tipo: "desconhecido" };

const IGNORADOS = new Set([
  "PAYMENT_CHECKOUT_VIEWED",
  "PAYMENT_BANK_SLIP_VIEWED",
  "PAYMENT_ANTICIPATED",
  "PAYMENT_AUTHORIZED",
  "PAYMENT_AWAITING_RISK_ANALYSIS",
  "PAYMENT_APPROVED_BY_RISK_ANALYSIS",
  "PAYMENT_DUNNING_REQUESTED",
  "PAYMENT_DUNNING_RECEIVED",
  "PAYMENT_RECEIVED_IN_CASH_UNDONE",
  "PAYMENT_SPLIT_CANCELLED",
  "PAYMENT_SPLIT_DIVERGENCE_BLOCK",
  "PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED",
  "SUBSCRIPTION_CREATED",
  "SUBSCRIPTION_UPDATED",
  "SUBSCRIPTION_SPLIT_DISABLED",
  "SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK",
  "SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK_FINISHED",
]);

/** O que fazer com cada evento do Asaas. */
export function acaoDoEvento(e: EventoAsaas): AcaoWebhook {
  const c = e.payment;
  switch (e.event) {
    // Pix: CREATED → RECEIVED direto. Cartão: CONFIRMED na hora e RECEIVED ~30 dias depois. Os dois liberam.
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED":
      return c ? { tipo: "pago", cobranca: c } : { tipo: "desconhecido" };
    case "PAYMENT_CREATED":
    case "PAYMENT_UPDATED":
    case "PAYMENT_RESTORED":
    case "PAYMENT_REFUND_DENIED":
      return c ? (eStatusPago(c.status) ? { tipo: "pago", cobranca: c } : { tipo: "cobranca", cobranca: c }) : { tipo: "desconhecido" };
    case "PAYMENT_OVERDUE":
      return c ? { tipo: "atrasado", cobranca: c } : { tipo: "desconhecido" };
    case "PAYMENT_DELETED":
    case "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED":
    case "PAYMENT_REPROVED_BY_RISK_ANALYSIS":
      return c ? { tipo: "cobranca_removida", cobranca: c } : { tipo: "desconhecido" };
    case "PAYMENT_REFUNDED":
    case "PAYMENT_PARTIALLY_REFUNDED":
    case "PAYMENT_REFUND_IN_PROGRESS":
    case "PAYMENT_CHARGEBACK_REQUESTED":
    case "PAYMENT_CHARGEBACK_DISPUTE":
    case "PAYMENT_AWAITING_CHARGEBACK_REVERSAL":
      return c ? { tipo: "estorno", cobranca: c } : { tipo: "desconhecido" };
    case "SUBSCRIPTION_DELETED":
    case "SUBSCRIPTION_INACTIVATED":
      return e.subscription?.id ? { tipo: "assinatura_encerrada", assinaturaId: e.subscription.id } : { tipo: "desconhecido" };
    default:
      return IGNORADOS.has(e.event) ? { tipo: "ignorar" } : { tipo: "desconhecido" };
  }
}

export function eStatusPago(status: string) {
  return status === "RECEIVED" || status === "CONFIRMED" || status === "RECEIVED_IN_CASH";
}

/** Compara o token sem vazar, pelo tempo de resposta, quantos caracteres acertou. */
export function tokenValido(recebido: string | null, esperado: string | undefined) {
  // Espaço ou quebra de linha colados sem querer no painel (Vercel/Asaas) não derrubam o webhook
  const r = recebido?.trim();
  const e = esperado?.trim();
  if (!r || !e) return false;
  const a = Buffer.from(r);
  const b = Buffer.from(e);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type Deps = {
  /** Grava o evento (único pelo id). Retorna false se já tinha recebido. */
  registrarEvento(e: EventoAsaas): Promise<boolean>;
  aplicar(acao: AcaoWebhook, e: EventoAsaas): Promise<void>;
  concluirEvento(id: string): Promise<void>;
  /** Falhou ao processar: apaga o registro para o Asaas mandar de novo. */
  desfazerEvento(id: string): Promise<void>;
  log?: (msg: string) => void;
};

export type RespostaWebhook = { status: number; corpo: { ok: boolean; motivo?: string } };

export async function receberWebhook(
  entrada: { token: string | null; tokenEsperado: string | undefined; corpo: string },
  deps: Deps,
): Promise<RespostaWebhook> {
  const log = deps.log ?? console.log;
  if (!entrada.tokenEsperado) {
    log("Webhook Asaas: ASAAS_WEBHOOK_TOKEN não configurado");
    return { status: 500, corpo: { ok: false, motivo: "nao_configurado" } };
  }
  if (!tokenValido(entrada.token, entrada.tokenEsperado)) {
    return { status: 401, corpo: { ok: false, motivo: "token_invalido" } };
  }

  let evento: EventoAsaas;
  try {
    evento = JSON.parse(entrada.corpo);
  } catch {
    return { status: 400, corpo: { ok: false, motivo: "json_invalido" } };
  }
  if (!evento?.id || !evento.event) return { status: 400, corpo: { ok: false, motivo: "sem_id" } };

  if (!(await deps.registrarEvento(evento))) {
    return { status: 200, corpo: { ok: true, motivo: "repetido" } };
  }

  const acao = acaoDoEvento(evento);
  if (acao.tipo === "desconhecido") log(`Webhook Asaas: evento não tratado ${evento.event} (${evento.id})`);
  try {
    await deps.aplicar(acao, evento);
    await deps.concluirEvento(evento.id);
  } catch (erro) {
    log(`Webhook Asaas: falha ao processar ${evento.event} (${evento.id}): ${erro instanceof Error ? erro.message : erro}`);
    await deps.desfazerEvento(evento.id);
    return { status: 500, corpo: { ok: false, motivo: "falha" } };
  }
  return { status: 200, corpo: { ok: true } };
}

/** Vencimento seguinte do ciclo mensal (mesmo dia; fim do mês quando o dia não existe). */
export function somarUmMes(data: string): string {
  const [a, m, d] = data.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(a, m + 1, 0)).getUTCDate(); // último dia do mês seguinte
  const fim = new Date(Date.UTC(a, m, Math.min(d, ultimoDia)));
  return fim.toISOString().slice(0, 10);
}

export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
