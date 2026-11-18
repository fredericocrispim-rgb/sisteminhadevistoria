import "server-only";
import { CICLO_ASAAS, type FormaPagamento } from "./config";

/**
 * Conversa com a API do Asaas (https://docs.asaas.com). SÓ no servidor: a chave fica em ASAAS_API_KEY
 * (variável de ambiente, nunca no navegador nem no GitHub).
 * Sandbox: https://api-sandbox.asaas.com/v3 · Produção: https://api.asaas.com/v3
 */

export type ClienteAsaas = { id: string; name: string; cpfCnpj: string; externalReference?: string | null };

export type CobrancaAsaas = {
  id: string;
  customer?: string;
  subscription?: string | null;
  value: number;
  netValue?: number;
  status: string;
  billingType: string;
  dueDate: string;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  confirmedDate?: string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  transactionReceiptUrl?: string | null;
  externalReference?: string | null;
  description?: string | null;
};

export type AssinaturaAsaas = {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  billingType: string;
  status: string;
  externalReference?: string | null;
  /** Só quando assina com cartão: o Asaas devolve o token (nunca o número inteiro). */
  creditCard?: { creditCardNumber?: string; creditCardBrand?: string; creditCardToken?: string } | null;
};

/** Dados do cartão: passam pelo servidor só para ir ao Asaas. NUNCA gravar nem pôr em log. */
export type CartaoAsaas = {
  nomeNoCartao: string;
  numero: string;
  mesValidade: string;
  anoValidade: string;
  cvv: string;
};

/** Dono do cartão (o Asaas exige CEP e número do endereço para a análise antifraude). */
export type TitularCartao = {
  nome: string;
  email: string;
  cpfCnpj: string;
  cep: string;
  numeroEndereco: string;
  celular: string;
};

export type QrCodePix = { encodedImage: string; payload: string; expirationDate?: string };

export class ErroAsaas extends Error {
  constructor(
    mensagem: string,
    public status: number,
    public detalhes?: unknown,
  ) {
    super(mensagem);
  }
}

/**
 * O Asaas vale para esta oficina? Sem a chave, o sistema continua no Pix manual.
 * ASAAS_SO_OFICINAS (ids separados por vírgula): fase de testes, só essas oficinas veem o Asaas; vazio = todas.
 */
export function asaasLigado(empresaId: string) {
  if (!process.env.ASAAS_API_KEY) return false;
  const so = (process.env.ASAAS_SO_OFICINAS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return so.length === 0 || so.includes(empresaId);
}

async function chamar<T>(caminho: string, opcoes: { metodo?: string; corpo?: unknown } = {}): Promise<T> {
  const chave = process.env.ASAAS_API_KEY;
  if (!chave) throw new ErroAsaas("ASAAS_API_KEY não configurada", 500);
  const base = (process.env.ASAAS_BASE_URL || "https://api-sandbox.asaas.com/v3").replace(/\/$/, "");
  const resposta = await fetch(`${base}${caminho}`, {
    method: opcoes.metodo ?? "GET",
    headers: {
      access_token: chave,
      "Content-Type": "application/json",
      "User-Agent": "VistoriaRapida/1.0",
    },
    body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
    cache: "no-store",
  });
  // Registro da chamada: só método, caminho e resultado (nunca o corpo, que pode ter dados do cartão)
  console.log(`Asaas: ${opcoes.metodo ?? "GET"} ${caminho} -> ${resposta.status}`);
  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : null;
  if (!resposta.ok) {
    const msg = dados?.errors?.map((e: { description?: string }) => e.description).join("; ") || `HTTP ${resposta.status}`;
    throw new ErroAsaas(`Asaas ${opcoes.metodo ?? "GET"} ${caminho}: ${msg}`, resposta.status, dados);
  }
  return dados as T;
}

type Lista<T> = { data: T[]; hasMore: boolean };

/**
 * Cliente do Asaas da oficina. O Asaas aceita clientes repetidos, então procura antes pelo
 * externalReference (id da oficina) e pelo CPF/CNPJ; só cria se não achar.
 */
export async function buscarOuCriarCliente(d: {
  empresaId: string;
  nome: string;
  cpfCnpj: string;
  celular?: string | null;
  email?: string | null;
}): Promise<ClienteAsaas> {
  const porRef = await chamar<Lista<ClienteAsaas>>(`/customers?externalReference=${encodeURIComponent(d.empresaId)}`);
  const achado =
    porRef.data[0] ?? (await chamar<Lista<ClienteAsaas>>(`/customers?cpfCnpj=${encodeURIComponent(d.cpfCnpj)}`)).data[0];
  const dados = {
    name: d.nome,
    cpfCnpj: d.cpfCnpj,
    mobilePhone: d.celular || undefined,
    email: d.email || undefined,
    externalReference: d.empresaId,
    notificationDisabled: false, // o Asaas avisa a oficina das cobranças (e-mail/SMS/WhatsApp, conforme o painel)
  };
  if (achado) return chamar<ClienteAsaas>(`/customers/${achado.id}`, { metodo: "PUT", corpo: dados });
  return chamar<ClienteAsaas>("/customers", { metodo: "POST", corpo: dados });
}

export async function criarAssinatura(d: {
  cliente: string;
  forma: FormaPagamento;
  valor: number;
  primeiroVencimento: string;
  descricao: string;
  empresaId: string;
  /** Cartão digitado no sistema: o Asaas já cobra a 1ª mensalidade e devolve o token. */
  cartao?: { dados: CartaoAsaas; titular: TitularCartao; ip: string };
}) {
  const corpo = {
    customer: d.cliente,
    billingType: d.forma,
    value: d.valor,
    nextDueDate: d.primeiroVencimento,
    cycle: CICLO_ASAAS,
    description: d.descricao,
    externalReference: d.empresaId,
    ...(d.cartao ? corpoCartao(d.cartao) : {}),
  };
  // Cartão no sistema: não tem página do Asaas para voltar
  if (d.cartao) return chamar<AssinaturaAsaas>("/subscriptions", { metodo: "POST", corpo });
  // Depois de pagar na fatura do Asaas, volta para o sistema. Voltar NÃO libera nada: quem libera é o webhook.
  // O Asaas só aceita se o site estiver cadastrado na conta (Minha conta > Informações); senão, assina sem a volta.
  const url = appUrl();
  if (url) {
    try {
      return await chamar<AssinaturaAsaas>("/subscriptions", {
        metodo: "POST",
        corpo: { ...corpo, callback: { successUrl: `${url}/plano`, autoRedirect: true } },
      });
    } catch (erro) {
      if (!(erro instanceof ErroAsaas && erro.status === 400 && /dom[ií]nio/i.test(erro.message))) throw erro;
      console.warn("Asaas: site não cadastrado na conta; assinatura sem volta automática");
    }
  }
  return chamar<AssinaturaAsaas>("/subscriptions", { metodo: "POST", corpo });
}

function corpoCartao(c: { dados: CartaoAsaas; titular: TitularCartao; ip: string }) {
  return {
    creditCard: {
      holderName: c.dados.nomeNoCartao,
      number: c.dados.numero,
      expiryMonth: c.dados.mesValidade,
      expiryYear: c.dados.anoValidade,
      ccv: c.dados.cvv,
    },
    creditCardHolderInfo: {
      name: c.titular.nome,
      email: c.titular.email,
      cpfCnpj: c.titular.cpfCnpj,
      postalCode: c.titular.cep,
      addressNumber: c.titular.numeroEndereco,
      mobilePhone: c.titular.celular,
    },
    remoteIp: c.ip,
  };
}

/** Troca o cartão da assinatura sem cobrar nada agora (as próximas mensalidades vão no cartão novo). */
export function trocarCartaoAssinatura(id: string, c: { dados: CartaoAsaas; titular: TitularCartao; ip: string }) {
  return chamar<AssinaturaAsaas>(`/subscriptions/${id}/creditCard`, { metodo: "PUT", corpo: corpoCartao(c) });
}

function appUrl() {
  const url = process.env.APP_URL?.replace(/\/$/, "");
  return url?.startsWith("https://") ? url : null;
}

export function obterAssinatura(id: string) {
  return chamar<AssinaturaAsaas>(`/subscriptions/${id}`);
}

/** Troca a forma de pagamento e/ou o valor (equipe mudou). updatePendingPayments também muda a cobrança em aberto. */
export function atualizarAssinatura(id: string, d: { forma?: FormaPagamento; valor?: number }) {
  return chamar<AssinaturaAsaas>(`/subscriptions/${id}`, {
    metodo: "PUT",
    corpo: { billingType: d.forma, value: d.valor, updatePendingPayments: true },
  });
}

/** Cancela no Asaas (apaga as cobranças em aberto). O acesso pago continua até acesso_ate. */
export function cancelarAssinatura(id: string) {
  return chamar<{ deleted: boolean; id: string }>(`/subscriptions/${id}`, { metodo: "DELETE" });
}

/** Cobranças já geradas da assinatura (a mais nova primeiro). */
export async function cobrancasDaAssinatura(id: string) {
  return (await chamar<Lista<CobrancaAsaas>>(`/subscriptions/${id}/payments?limit=20`)).data;
}

export function obterCobranca(id: string) {
  return chamar<CobrancaAsaas>(`/payments/${id}`);
}

/** Paga uma cobrança já existente com o cartão informado (cartão recusado, troca de cartão). */
export function pagarComCartao(idCobranca: string, c: { dados: CartaoAsaas; titular: TitularCartao; ip: string }) {
  const { creditCard, creditCardHolderInfo, remoteIp } = corpoCartao(c);
  return chamar<CobrancaAsaas & { creditCard?: AssinaturaAsaas["creditCard"] }>(`/payments/${idCobranca}/payWithCreditCard`, {
    metodo: "POST",
    corpo: { creditCard, creditCardHolderInfo, remoteIp },
  });
}

/** Linha digitável do boleto (para copiar e pagar no app do banco). */
export function linhaDigitavel(idCobranca: string) {
  return chamar<{ identificationField: string; nossoNumero?: string; barCode?: string }>(`/payments/${idCobranca}/identificationField`);
}

export function qrCodePix(idCobranca: string) {
  return chamar<QrCodePix>(`/payments/${idCobranca}/pixQrCode`);
}
