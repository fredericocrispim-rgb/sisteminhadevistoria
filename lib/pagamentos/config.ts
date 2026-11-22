/**
 * Configuração da cobrança (arquivo único).
 *
 * PLANOS E PREÇOS: ficam na tabela `planos` do banco (nome, preço mensal, pessoas incluídas, preço por pessoa a mais),
 * para o Frederico mudar sem mexer no código. Decisões de 30/10/2026:
 * - Básico R$ 49,90/mês: dono + 3 pessoas; cada pessoa a mais + R$ 19,90 (cupom: não paga).
 * - Pro (31/10/2026): Básico + R$ 30, com vídeo de até 1 minuto (planos.video_segundos). Rede fora da venda.
 * - Só mensal (sem plano anual por enquanto).
 * - Sem teste grátis: quem se cadastra tem 1 dia para pagar (`plataforma.dias_teste`).
 * - Tolerância depois do vencimento: `plataforma.dias_carencia` (5 dias).
 */

export const PROVEDOR_ASAAS = "asaas";

/** Plano à venda (decisão de 30/10/2026: só o Básico). Os outros continuam na tabela, mas não aparecem em /assinar. */
export const PLANO_A_VENDA = "Básico";

export function planoAVenda<T extends { nome: string }>(planos: T[]): T | undefined {
  const chave = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return planos.find((p) => chave(p.nome) === chave(PLANO_A_VENDA)) ?? planos[0];
}

/**
 * Planos que aparecem em /assinar: o Básico e, com o vídeo ligado (plataforma.video_ligado), o Pro
 * (plano com vídeo, decisão de 31/10/2026).
 */
export function planosAVenda<T extends { nome: string; video_segundos?: number | null }>(planos: T[], videoLigado: boolean): T[] {
  const basico = planoAVenda(planos.filter((p) => !p.video_segundos));
  const pro = videoLigado ? planos.find((p) => (p.video_segundos ?? 0) > 0) : undefined;
  return [basico, pro].filter((p): p is T => Boolean(p));
}

export type FormaPagamento = "PIX" | "CREDIT_CARD" | "BOLETO";

export const FORMAS_PAGAMENTO: { valor: FormaPagamento; rotulo: string; dica: string }[] = [
  { valor: "PIX", rotulo: "Pix", dica: "Paga todo mês pelo QR Code" },
  { valor: "CREDIT_CARD", rotulo: "Cartão de crédito", dica: "Renova sozinho todo mês" },
  { valor: "BOLETO", rotulo: "Boleto", dica: "Paga todo mês o boleto" },
];

/** Forma da cobrança do Asaas (billingType) como fica gravada em faturas.forma. */
export function formaDaFatura(billingType: string | null | undefined): "pix" | "cartao" | "boleto" {
  if (billingType === "CREDIT_CARD") return "cartao";
  if (billingType === "BOLETO") return "boleto";
  return "pix";
}

/** Forma da assinatura (assinaturas.forma_pagamento) a partir do billingType do Asaas. */
export function formaDaAssinatura(billingType: string | null | undefined): FormaPagamento {
  return billingType === "CREDIT_CARD" || billingType === "BOLETO" ? billingType : "PIX";
}

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

/**
 * Cobrança que a oficina deve pagar agora: a em aberto que vence PRIMEIRO.
 * O Asaas já gera a do mês seguinte logo depois de assinar (cerca de 40 dias antes), então
 * costuma haver duas em aberto; pagar a mais nova deixaria a do mês atual vencer.
 */
export function faturaEmAberto<T extends { status: string; vencimento: string }>(faturas: T[] | null | undefined): T | undefined {
  return (faturas ?? [])
    .filter((f) => f.status === "pendente" || f.status === "vencida")
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0];
}

export function nomeForma(forma: string | null | undefined) {
  return FORMAS_PAGAMENTO.find((f) => f.valor === forma)?.rotulo ?? "Pix";
}

/** aaaa-mm-dd + n dias */
function maisDias(data: string, dias: number) {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Folga para o dia de vencimento do Asaas não bater exatamente com o do sistema. */
const FOLGA_DIAS = 5;

type CobrancaSimples = { id: string; status: string; dueDate: string };

/**
 * Mudou o plano (ou a equipe): quais cobranças já geradas recebem o valor novo.
 * Só as do PRÓXIMO período: em aberto, vencendo depois de hoje e a partir do fim do período já pago
 * (`pagoAte` = próximo vencimento da oficina). A do período pago ou em andamento fica com o valor antigo.
 */
export function cobrancasParaValorNovo<T extends CobrancaSimples>(cobrancas: T[], hoje: string, pagoAte: string | null): T[] {
  const inicioProximo = pagoAte ? maisDias(pagoAte, -FOLGA_DIAS) : null;
  return cobrancas.filter((c) => c.status === "PENDING" && c.dueDate > hoje && (!inicioProximo || c.dueDate >= inicioProximo));
}

/**
 * Pagamento confirmado à mão no painel (Pix direto na conta) para uma oficina do Asaas:
 * as cobranças em aberto desse mesmo período (vencendo antes do novo vencimento) sobram e devem sair.
 * A do período seguinte fica.
 */
export function cobrancasDoPeriodoPago<T extends CobrancaSimples>(cobrancas: T[], novoVencimento: string): T[] {
  const limite = maisDias(novoVencimento, -FOLGA_DIAS);
  return cobrancas.filter((c) => (c.status === "PENDING" || c.status === "OVERDUE") && c.dueDate < limite);
}
