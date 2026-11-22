"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { exigirOficina, situacaoPlano } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { cnpjValido, cpfValido, soNumeros, telefoneValido } from "@/lib/formatos";
import { hojeBR } from "@/lib/cadastro";
import { mensalidadeDaOficina } from "@/lib/mensalidade";
import { textos } from "@/lib/textos";
import {
  asaasLigado,
  atualizarAssinatura,
  buscarOuCriarCliente,
  cancelarAssinatura as cancelarNoAsaas,
  cobrancasDaAssinatura,
  criarAssinatura,
  ErroAsaas,
  obterCobranca,
  pagarComCartao,
  qrCodePix,
  trocarCartaoAssinatura,
  type AssinaturaAsaas,
  type CartaoAsaas,
  type TitularCartao,
  type CobrancaAsaas,
} from "@/lib/pagamentos/asaas";
import { DESCRICAO_ASSINATURA, PROVEDOR_ASAAS, formaDaFatura, nomeForma, planosAVenda, type FormaPagamento } from "@/lib/pagamentos/config";
import { cepValido, cvvValido, lerValidade, numeroCartaoValido } from "@/lib/pagamentos/cartao";
import { aplicarPagamento, guardarCobranca } from "@/lib/pagamentos/servidor";
import { eStatusPago } from "@/lib/pagamentos/webhook";

type Resultado<T = object> = ({ ok: true } & T) | { ok: false; erro: string; campo?: string };

const FALHOU = "Não deu certo. Confira a internet e tente de novo.";

/** Só o dono mexe na assinatura (mesmo com o acesso bloqueado). */
async function dono() {
  const ctx = await exigirOficina({ permitirBloqueado: true });
  return ctx.papel === "dono" ? ctx : null;
}

const esquemaCartao = z.object({
  nomeNoCartao: z.string().trim().min(3, "Coloque o nome como está no cartão").max(80),
  numero: z.string().refine(numeroCartaoValido, "Número do cartão errado. Confira"),
  validade: z.string().refine((v) => Boolean(lerValidade(v)), "Validade errada. Coloque mês e ano, ex.: 08/30"),
  cvv: z.string().refine(cvvValido, "Código de segurança errado (3 ou 4 números atrás do cartão)"),
  cep: z.string().refine(cepValido, "CEP errado. São 8 números"),
  numeroEndereco: z.string().trim().min(1, "Coloque o número do endereço").max(10),
});

const esquema = z
  .object({
    planoId: z.string().uuid("Escolha o plano"),
    forma: z.enum(["PIX", "CREDIT_CARD", "BOLETO"], { message: "Escolha Pix, cartão ou boleto" }),
    nome: z.string().trim().min(3, "Coloque o nome ou a razão social").max(120),
    cpfCnpj: z.string().refine((v) => cpfValido(v) || cnpjValido(v), "CPF ou CNPJ inválido. Confira os números"),
    celular: z.string().refine(telefoneValido, "Celular inválido. Coloque o DDD"),
    cartao: esquemaCartao.optional(),
  })
  .refine((d) => d.forma !== "CREDIT_CARD" || d.cartao, { message: "Coloque os dados do cartão", path: ["cartao"] });

export type DadosAssinar = z.input<typeof esquema>;

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A primeira cobrança aparece logo depois de criar a assinatura (o Asaas não manda junto). Cartão: pode já vir paga. */
async function primeiraCobranca(idAssinatura: string): Promise<CobrancaAsaas | null> {
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const lista = await cobrancasDaAssinatura(idAssinatura);
    const primeira = lista
      .filter((c) => c.status === "PENDING" || c.status === "OVERDUE" || eStatusPago(c.status))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    if (primeira) return primeira;
    await esperar(1000);
  }
  return null;
}

/** IP de quem está pagando (o Asaas exige no cartão, para a análise antifraude). */
async function ipDoCliente() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "127.0.0.1";
}

/** Cartão digitado + dono do cartão, no formato do Asaas. Não guarda nada. */
async function cartaoParaAsaas(
  c: z.output<typeof esquemaCartao>,
  quem: { nome: string; email: string; cpfCnpj: string; celular: string },
): Promise<{ dados: CartaoAsaas; titular: TitularCartao; ip: string }> {
  const validade = lerValidade(c.validade)!; // já conferida no esquema
  return {
    dados: {
      nomeNoCartao: c.nomeNoCartao,
      numero: soNumeros(c.numero),
      mesValidade: validade.mes,
      anoValidade: validade.ano,
      cvv: soNumeros(c.cvv),
    },
    titular: { ...quem, cep: soNumeros(c.cep), numeroEndereco: c.numeroEndereco },
    ip: await ipDoCliente(),
  };
}

/** Recusa do cartão: o motivo que o Asaas dá, em frase simples. */
function erroDoCartao(erro: unknown) {
  if (erro instanceof ErroAsaas && erro.status === 400) {
    const motivo = erro.message.replace(/^Asaas \w+ \S+: /, "").trim();
    return textos.assinatura.cartaoRecusado(/[.!]$/.test(motivo) ? motivo : `${motivo}.`);
  }
  return null;
}

/**
 * Assinar: cria (ou reaproveita) o cliente no Asaas e a assinatura mensal.
 * - Cartão: digitado aqui; o Asaas cobra na hora e devolve só um token (o número e o CVV nunca são gravados).
 * - Pix: a próxima tela mostra o QR Code e o copia e cola. Boleto: o link e a linha digitável.
 * Quem libera o acesso é o pagamento confirmado (webhook, ou consulta direta à API no servidor).
 */
export async function assinar(dados: DadosAssinar): Promise<Resultado<{ destino: string; pago?: boolean }>> {
  const ctx = await dono();
  if (!ctx) return { ok: false, erro: "Só o dono da oficina pode assinar." };
  if (!asaasLigado(ctx.empresa.id)) return { ok: false, erro: "Pagamento automático ainda não disponível. Fale com o suporte." };
  const v = esquema.safeParse(dados);
  if (!v.success) {
    const p = v.error.issues[0].path;
    return { ok: false, erro: v.error.issues[0].message, campo: p[0] === "cartao" && p[1] ? String(p[1]) : String(p[0]) };
  }
  const d = v.data;
  const empresaId = ctx.empresa.id;
  const admin = criarClienteAdmin();

  const [{ data: a }, { data: planos }, { data: plat }] = await Promise.all([
    admin.from("assinaturas").select("id, empresa_id, status, proximo_vencimento, provedor, id_assinatura_externa").eq("empresa_id", empresaId).single(),
    admin.from("planos").select("*").eq("ativo", true).order("ordem"),
    admin.from("plataforma").select("*").single(),
  ]);
  // Só vende os planos à venda (Básico e, com o vídeo ligado, Pro), mesmo que mandem outro id
  const plano = planosAVenda(planos ?? [], Boolean(plat?.video_ligado)).find((p) => p.id === d.planoId);
  if (!a || !plano) return { ok: false, erro: FALHOU };

  // Já tem assinatura no Asaas em andamento: não cria outra, leva para a cobrança em aberto
  if (a.provedor === PROVEDOR_ASAAS && a.id_assinatura_externa && a.status !== "cancelada" && a.status !== "inadimplente") {
    return { ok: true, destino: "/plano" };
  }

  try {
    await admin.from("empresas").update({ cnpj_cpf: soNumeros(d.cpfCnpj), razao_social: d.nome }).eq("id", empresaId);
    await admin.from("assinaturas").update({ plano_id: plano.id }).eq("id", a.id);
    const m = await mensalidadeDaOficina(empresaId);
    if (m.valor <= 0) return { ok: false, erro: "Seu plano não tem valor a pagar. Fale com o suporte." };

    const cliente = await buscarOuCriarCliente({
      empresaId,
      nome: d.nome,
      cpfCnpj: soNumeros(d.cpfCnpj),
      celular: soNumeros(d.celular),
      email: ctx.usuario.email,
    });

    // 1º vencimento: hoje; quem ainda tem dias pagos só paga quando vencer
    const hoje = hojeBR();
    const situ = await situacaoPlano(empresaId);
    const aindaPago = !situ.bloqueado && Boolean(situ.vencimento && situ.vencimento > hoje);
    const primeiroVencimento = aindaPago ? situ.vencimento! : hoje;

    // Assinatura antiga ainda viva no Asaas (bloqueio manual, estorno): cancela antes, para não cobrar duas vezes
    if (a.provedor === PROVEDOR_ASAAS && a.id_assinatura_externa) {
      try {
        await cancelarNoAsaas(a.id_assinatura_externa);
      } catch (erro) {
        if (!(erro instanceof ErroAsaas && erro.status === 404)) throw erro;
      }
    }

    const cartao =
      d.forma === "CREDIT_CARD" && d.cartao
        ? await cartaoParaAsaas(d.cartao, { nome: d.nome, email: ctx.usuario.email, cpfCnpj: soNumeros(d.cpfCnpj), celular: soNumeros(d.celular) })
        : undefined;

    let sub: AssinaturaAsaas;
    try {
      sub = await criarAssinatura({
        cliente: cliente.id,
        forma: d.forma,
        valor: m.valor,
        primeiroVencimento,
        descricao: DESCRICAO_ASSINATURA(plat?.nome_produto ?? textos.produto.nome, plano.nome),
        empresaId,
        cartao,
      });
    } catch (erro) {
      // Cartão recusado: o Asaas não cria a assinatura; a pessoa corrige ou usa outro cartão
      const recusa = cartao ? erroDoCartao(erro) : null;
      if (recusa) {
        console.log(`Asaas: cartão recusado na assinatura da oficina ${empresaId}`);
        return { ok: false, erro: recusa, campo: "cartao" };
      }
      throw erro;
    }
    // O Asaas troca Pix por boleto quando a conta não tem chave Pix cadastrada.
    // Tenta acertar; se continuar diferente, desfaz a assinatura e pede outra forma.
    if (sub.billingType !== d.forma) {
      const errada = sub;
      sub = await atualizarAssinatura(errada.id, { forma: d.forma }).catch(() => errada);
      if (sub.billingType !== d.forma) {
        console.error(`Asaas: pediu ${d.forma} e veio ${sub.billingType} (a conta do Asaas tem chave Pix cadastrada?)`);
        await cancelarNoAsaas(sub.id).catch(() => undefined);
        return { ok: false, erro: textos.assinatura.formaIndisponivel(nomeForma(d.forma)), campo: "forma" };
      }
    }
    await admin
      .from("assinaturas")
      .update({
        provedor: PROVEDOR_ASAAS,
        id_cliente_externo: cliente.id,
        id_assinatura_externa: sub.id,
        forma_pagamento: d.forma,
        // Do cartão, só o token, os 4 últimos números e a bandeira
        cartao_token: sub.creditCard?.creditCardToken ?? null,
        cartao_final: sub.creditCard?.creditCardNumber?.slice(-4) ?? null,
        cartao_bandeira: sub.creditCard?.creditCardBrand ?? null,
        // Assinou de novo depois de cancelar: com dias pagos, segue ativa; senão vale a régua normal (o pagamento confirma "ativa")
        // Sempre grava o status: o aviso SUBSCRIPTION_DELETED da assinatura antiga (cancelada logo acima)
        // pode chegar antes desta linha e marcar a oficina como "cancelada" por engano.
        status: a.status === "cancelada" ? (aindaPago ? "ativa" : "em_atraso") : a.status,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", a.id);
    await admin.from("auditoria").insert({
      empresa_id: empresaId,
      usuario_id: ctx.usuario.id,
      acao: "assinou_asaas",
      entidade: "assinaturas",
      detalhes: { forma: d.forma, plano: plano.nome, valor: m.valor, assinatura: sub.id },
    });

    const cobranca = await primeiraCobranca(sub.id);
    revalidatePath("/plano");
    if (!cobranca) return { ok: true, destino: "/plano" };
    // Cartão já aprovado: libera agora (o webhook chega depois e não repete nada)
    if (eStatusPago(cobranca.status)) {
      await aplicarPagamento(cobranca);
      return { ok: true, destino: "/inicio", pago: true };
    }
    const faturaId = await guardarCobranca(cobranca, { ...a, status: a.status === "cancelada" ? "em_atraso" : a.status });
    // Pix (QR Code) e boleto (link e linha digitável): tela da cobrança. Cartão com 1ª cobrança no futuro: Meu plano.
    return { ok: true, destino: cartao ? "/plano" : `/pagamento/${faturaId}` };
  } catch (erro) {
    console.error("Asaas: falha ao assinar", erro instanceof Error ? erro.message : erro);
    return { ok: false, erro: FALHOU };
  }
}

/** A tela do Pix pergunta a cada 3 s: o webhook já confirmou? (só lê o banco) */
export async function faturaPaga(faturaId: string): Promise<boolean> {
  const ctx = await exigirOficina({ permitirBloqueado: true });
  if (!/^[0-9a-f-]{36}$/.test(faturaId)) return false;
  const { data } = await criarClienteAdmin().from("faturas").select("status").eq("id", faturaId).eq("empresa_id", ctx.empresa.id).maybeSingle();
  return data?.status === "paga";
}

/** QR Code do Pix de uma cobrança da oficina (a tela pergunta de novo enquanto o Asaas ainda está gerando). */
export async function qrCodeDaFatura(faturaId: string): Promise<string | null> {
  const ctx = await dono();
  if (!ctx || !/^[0-9a-f-]{36}$/.test(faturaId)) return null;
  const { data: f } = await criarClienteAdmin()
    .from("faturas")
    .select("status, forma, id_externo")
    .eq("id", faturaId)
    .eq("empresa_id", ctx.empresa.id)
    .maybeSingle();
  if (!f?.id_externo || f.forma !== "pix" || f.status === "paga" || f.status === "cancelada") return null;
  try {
    return (await qrCodePix(f.id_externo)).payload || null;
  } catch (erro) {
    console.error("Asaas: QR Code ainda não disponível", erro instanceof Error ? erro.message : erro);
    return null;
  }
}

/** "Já paguei": confere direto na API do Asaas (no servidor). Se estiver paga, libera como o webhook faria. */
export async function jaPaguei(faturaId: string): Promise<Resultado<{ paga: boolean }>> {
  const ctx = await dono();
  if (!ctx || !/^[0-9a-f-]{36}$/.test(faturaId)) return { ok: false, erro: FALHOU };
  const { data: f } = await criarClienteAdmin().from("faturas").select("status, id_externo").eq("id", faturaId).eq("empresa_id", ctx.empresa.id).maybeSingle();
  if (!f?.id_externo) return { ok: false, erro: FALHOU };
  if (f.status === "paga") return { ok: true, paga: true };
  try {
    const c = await obterCobranca(f.id_externo);
    if (!eStatusPago(c.status)) return { ok: true, paga: false };
    await aplicarPagamento(c);
    revalidatePath("/plano");
    return { ok: true, paga: true };
  } catch (erro) {
    console.error("Asaas: falha ao conferir pagamento", erro);
    return { ok: false, erro: FALHOU };
  }
}

/** Troca para Pix ou boleto. A cobrança em aberto também muda e a tela dela mostra o QR Code ou o boleto. */
export async function trocarForma(forma: "PIX" | "BOLETO"): Promise<Resultado<{ faturaId?: string }>> {
  const ctx = await dono();
  if (!ctx || (forma !== "PIX" && forma !== "BOLETO")) return { ok: false, erro: FALHOU };
  const admin = criarClienteAdmin();
  const { data: a } = await admin.from("assinaturas").select("id, provedor, status, id_assinatura_externa").eq("empresa_id", ctx.empresa.id).single();
  if (a?.provedor !== PROVEDOR_ASAAS || !a.id_assinatura_externa || a.status === "cancelada") return { ok: false, erro: FALHOU };
  try {
    const sub = await atualizarAssinatura(a.id_assinatura_externa, { forma });
    // Pix virou boleto (conta sem chave Pix): não grava a troca
    if (sub.billingType !== forma) return { ok: false, erro: textos.assinatura.formaIndisponivel(nomeForma(forma)) };
    await admin
      .from("assinaturas")
      .update({
        forma_pagamento: forma,
        cartao_token: null,
        cartao_final: null,
        cartao_bandeira: null,
        cartao_recusado_em: null,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", a.id);
    const { data: abertas } = await admin
      .from("faturas")
      .update({ forma: formaDaFatura(forma) })
      .eq("assinatura_id", a.id)
      .in("status", ["pendente", "vencida"])
      .select("id, vencimento");
    await admin.from("auditoria").insert({ empresa_id: ctx.empresa.id, usuario_id: ctx.usuario.id, acao: "trocou_forma", entidade: "assinaturas", detalhes: { forma } });
    revalidatePath("/plano");
    const aberta = abertas?.sort((x, y) => x.vencimento.localeCompare(y.vencimento))[0];
    return { ok: true, faturaId: aberta?.id };
  } catch (erro) {
    console.error("Asaas: falha ao trocar a forma de pagamento", erro instanceof Error ? erro.message : erro);
    return { ok: false, erro: FALHOU };
  }
}

/**
 * Cartão novo (ou passar a pagar no cartão), digitado no sistema.
 * - Tem mensalidade vencendo hoje ou já vencida: paga ela agora com o cartão novo.
 * - As próximas mensalidades vão no cartão novo.
 * Recusado: nada muda e a pessoa vê o motivo. Do cartão, só fica o token, os 4 últimos números e a bandeira.
 */
export async function trocarCartao(dados: z.input<typeof esquemaCartao>): Promise<Resultado<{ pago: boolean }>> {
  const ctx = await dono();
  if (!ctx) return { ok: false, erro: FALHOU };
  const v = esquemaCartao.safeParse(dados);
  if (!v.success) return { ok: false, erro: v.error.issues[0].message, campo: String(v.error.issues[0].path[0]) };
  const admin = criarClienteAdmin();
  const [{ data: a }, { data: emp }] = await Promise.all([
    admin.from("assinaturas").select("id, provedor, status, forma_pagamento, id_assinatura_externa").eq("empresa_id", ctx.empresa.id).single(),
    admin.from("empresas").select("cnpj_cpf, razao_social, nome_fantasia, whatsapp").eq("id", ctx.empresa.id).single(),
  ]);
  if (a?.provedor !== PROVEDOR_ASAAS || !a.id_assinatura_externa || a.status === "cancelada") return { ok: false, erro: FALHOU };
  if (!emp?.cnpj_cpf) return { ok: false, erro: FALHOU };
  const cartao = await cartaoParaAsaas(v.data, {
    nome: emp.razao_social || ctx.usuario.nome || emp.nome_fantasia,
    email: ctx.usuario.email,
    cpfCnpj: soNumeros(emp.cnpj_cpf),
    celular: soNumeros(emp.whatsapp || ctx.usuario.whatsapp || ""),
  });
  const idSub = a.id_assinatura_externa;
  const eraCartao = a.forma_pagamento === "CREDIT_CARD";

  // Mensalidade para pagar já (vence hoje ou venceu)
  const { data: abertas } = await admin
    .from("faturas")
    .select("id, id_externo, vencimento")
    .eq("assinatura_id", a.id)
    .in("status", ["pendente", "vencida"])
    .lte("vencimento", hojeBR())
    .order("vencimento")
    .limit(1);
  const devida = abertas?.[0];

  try {
    if (!eraCartao) await atualizarAssinatura(idSub, { forma: "CREDIT_CARD" });
    let pago = false;
    let infoCartao: AssinaturaAsaas["creditCard"] = null;
    if (devida?.id_externo) {
      try {
        const c = await pagarComCartao(devida.id_externo, cartao);
        infoCartao = c.creditCard ?? null;
        if (eStatusPago(c.status)) {
          await aplicarPagamento(c);
          pago = true;
        }
      } catch (erro) {
        const recusa = erroDoCartao(erro);
        if (!recusa) throw erro;
        if (!eraCartao) await atualizarAssinatura(idSub, { forma: (a.forma_pagamento as FormaPagamento) ?? "PIX" }).catch(() => undefined);
        console.log(`Asaas: cartão novo recusado na oficina ${ctx.empresa.id}`);
        return { ok: false, erro: recusa, campo: "cartao" };
      }
    }
    // Próximas mensalidades no cartão novo
    try {
      const sub = await trocarCartaoAssinatura(idSub, cartao);
      infoCartao = sub.creditCard ?? infoCartao;
    } catch (erro) {
      const recusa = erroDoCartao(erro);
      // Já pagou com este cartão: segue (o Asaas tenta o cartão da assinatura no próximo mês)
      if (!recusa || pago) {
        if (!pago) throw erro;
        console.error("Asaas: pagou, mas não trocou o cartão da assinatura", erro instanceof Error ? erro.message : erro);
      } else {
        if (!eraCartao) await atualizarAssinatura(idSub, { forma: (a.forma_pagamento as FormaPagamento) ?? "PIX" }).catch(() => undefined);
        return { ok: false, erro: recusa, campo: "cartao" };
      }
    }
    await admin
      .from("assinaturas")
      .update({
        forma_pagamento: "CREDIT_CARD",
        cartao_token: infoCartao?.creditCardToken ?? null,
        cartao_final: infoCartao?.creditCardNumber?.slice(-4) ?? null,
        cartao_bandeira: infoCartao?.creditCardBrand ?? null,
        cartao_recusado_em: null,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", a.id);
    await admin.from("faturas").update({ forma: "cartao" }).eq("assinatura_id", a.id).in("status", ["pendente", "vencida"]);
    await admin.from("auditoria").insert({ empresa_id: ctx.empresa.id, usuario_id: ctx.usuario.id, acao: "trocou_cartao", entidade: "assinaturas", detalhes: { pagou_agora: pago } });
    revalidatePath("/plano");
    return { ok: true, pago };
  } catch (erro) {
    console.error("Asaas: falha ao trocar o cartão", erro instanceof Error ? erro.message : erro);
    return { ok: false, erro: FALHOU };
  }
}

/** Cancela no Asaas. A oficina continua usando até o fim do período já pago (acesso_ate). Nada é apagado. */
export async function cancelarAssinatura(): Promise<Resultado> {
  const ctx = await dono();
  if (!ctx) return { ok: false, erro: FALHOU };
  const admin = criarClienteAdmin();
  const { data: a } = await admin
    .from("assinaturas")
    .select("id, provedor, status, proximo_vencimento, acesso_ate, id_assinatura_externa")
    .eq("empresa_id", ctx.empresa.id)
    .single();
  if (a?.provedor !== PROVEDOR_ASAAS || !a.id_assinatura_externa) return { ok: false, erro: FALHOU };
  // Quem veio do Pix manual ainda não tem acesso_ate: vale o vencimento que já estava pago
  const pagoAte = a.acesso_ate ?? (a.status === "ativa" || a.status === "em_atraso" ? a.proximo_vencimento : null);
  try {
    await cancelarNoAsaas(a.id_assinatura_externa);
    await admin
      .from("assinaturas")
      .update({ status: "cancelada", acesso_ate: pagoAte, atualizado_em: new Date().toISOString() })
      .eq("id", a.id);
    await admin.from("faturas").update({ status: "cancelada" }).eq("assinatura_id", a.id).in("status", ["pendente", "vencida"]);
    await admin.from("auditoria").insert({ empresa_id: ctx.empresa.id, usuario_id: ctx.usuario.id, acao: "cancelou_assinatura", entidade: "assinaturas", detalhes: {} });
    revalidatePath("/plano");
    return { ok: true };
  } catch (erro) {
    console.error("Asaas: falha ao cancelar", erro);
    return { ok: false, erro: FALHOU };
  }
}
