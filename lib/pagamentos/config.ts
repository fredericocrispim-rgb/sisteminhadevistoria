/**
 * Configuração da cobrança (arquivo único).
 *
 * PLANOS E PREÇOS: ficam na tabela `planos` do banco (nome, preço mensal, pessoas incluídas, preço por pessoa a mais),
 * para o Frederico mudar sem mexer no código. Decisões de 30/10/2026:
 * - Básico R$ 49,90/mês: dono + 3 pessoas; cada pessoa a mais + R$ 19,90 (cupom: não paga). Profissional e Rede na tabela.
 * - Só mensal (sem plano anual por enquanto).
 * - Sem teste grátis: quem se cadastra tem 1 dia para pagar (`plataforma.dias_teste`).
 * - Tolerância depois do vencimento: `plataforma.dias_carencia` (5 dias).
 */

export const PROVEDOR_ASAAS = "asaas";

export type FormaPagamento = "PIX" | "CREDIT_CARD";

export const FORMAS_PAGAMENTO: { valor: FormaPagamento; rotulo: string; dica: string }[] = [
  { valor: "PIX", rotulo: "Pix", dica: "Paga todo mês pelo QR Code" },
  { valor: "CREDIT_CARD", rotulo: "Cartão de crédito", dica: "Renova sozinho todo mês" },
];

/** Ciclo da assinatura no Asaas (só mensal por enquanto). */
export const CICLO_ASAAS = "MONTHLY" as const;

/** Descrição que aparece na fatura do Asaas. */
export const DESCRICAO_ASSINATURA = (produto: string, plano: string) => `${produto} - plano ${plano} (mensal)`;

/** Situações de cobrança no Asaas que contam como paga. */
export const STATUS_PAGO = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"] as const;

/**
 * Pix Automático (débito autorizado uma vez no app do banco): não implementado. Para ligar, entra como
 * uma terceira forma aqui e em asaas.ts (autorização), sem mudar o webhook nem a regra de acesso.
 */
export const PIX_AUTOMATICO_LIGADO = false;

export function nomeForma(forma: string | null | undefined) {
  return FORMAS_PAGAMENTO.find((f) => f.valor === forma)?.rotulo ?? "Pix";
}
