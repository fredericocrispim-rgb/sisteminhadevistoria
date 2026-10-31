"use server";

import { revalidatePath } from "next/cache";
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
  type CobrancaAsaas,
} from "@/lib/pagamentos/asaas";
import { DESCRICAO_ASSINATURA, PROVEDOR_ASAAS, planoAVenda } from "@/lib/pagamentos/config";
import { aplicarPagamento, guardarCobranca } from "@/lib/pagamentos/servidor";
import { eStatusPago } from "@/lib/pagamentos/webhook";

type Resultado<T = object> = ({ ok: true } & T) | { ok: false; erro: string; campo?: string };

const FALHOU = "Não deu certo. Confira a internet e tente de novo.";

/** Só o dono mexe na assinatura (mesmo com o acesso bloqueado). */
async function dono() {
  const ctx = await exigirOficina({ permitirBloqueado: true });
  return ctx.papel === "dono" ? ctx : null;
}

const esquema = z.object({
  planoId: z.string().uuid("Escolha o plano"),
  forma: z.enum(["PIX", "CREDIT_CARD"], { message: "Escolha Pix ou cartão" }),
  nome: z.string().trim().min(3, "Coloque o nome ou a razão social").max(120),
  cpfCnpj: z.string().refine((v) => cpfValido(v) || cnpjValido(v), "CPF ou CNPJ inválido. Confira os números"),
  celular: z.string().refine(telefoneValido, "Celular inválido. Coloque o DDD"),
});

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A primeira cobrança aparece logo depois de criar a assinatura (o Asaas não manda junto). */
async function primeiraCobranca(idAssinatura: string): Promise<CobrancaAsaas | null> {
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const lista = await cobrancasDaAssinatura(idAssinatura);
    const aberta = lista.find((c) => c.status === "PENDING" || c.status === "OVERDUE");
    if (aberta) return aberta;
    await esperar(1000);
  }
  return null;
}

/**
 * Assinar: cria (ou reaproveita) o cliente no Asaas e a assinatura mensal, e pega a 1ª cobrança.
 * NÃO libera acesso: quem libera é o webhook (ou "Já paguei", que confere na API do Asaas).
 */
export async function assinar(dados: z.input<typeof esquema>): Promise<Resultado<{ destino: string; link?: string }>> {
  const ctx = await dono();
  if (!ctx) return { ok: false, erro: "Só o dono da oficina pode assinar." };
  if (!asaasLigado(ctx.empresa.id)) return { ok: false, erro: "Pagamento automático ainda não disponível. Fale com o suporte." };
  const v = esquema.safeParse(dados);
  if (!v.success) return { ok: false, erro: v.error.issues[0].message, campo: String(v.error.issues[0].path[0]) };
  const d = v.data;
  const empresaId = ctx.empresa.id;
  const admin = criarClienteAdmin();

  const [{ data: a }, { data: planos }, { data: plat }] = await Promise.all([
    admin.from("assinaturas").select("id, empresa_id, status, proximo_vencimento, provedor, id_assinatura_externa").eq("empresa_id", empresaId).single(),
    admin.from("planos").select("id, nome").eq("ativo", true).order("ordem"),
    admin.from("plataforma").select("nome_produto").single(),
  ]);
  // Só vende o plano à venda (Básico), mesmo que mandem outro id
  const plano = planoAVenda(planos ?? []);
  if (!a || !plano || plano.id !== d.planoId) return { ok: false, erro: FALHOU };

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

    // 1º vencimento: hoje; quem ainda tem dias pagos (Pix manual) só paga quando vencer
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

    let sub = await criarAssinatura({
      cliente: cliente.id,
      forma: d.forma,
      valor: m.valor,
      primeiroVencimento,
      descricao: DESCRICAO_ASSINATURA(plat?.nome_produto ?? textos.produto.nome, plano.nome),
      empresaId,
    });
    // Nunca boleto: o Asaas troca Pix por boleto quando a conta não tem chave Pix cadastrada.
    // Tenta acertar; se continuar diferente, desfaz a assinatura e pede a outra forma.
    if (sub.billingType !== d.forma) {
      sub = await atualizarAssinatura(sub.id, { forma: d.forma }).catch(() => sub);
      if (sub.billingType !== d.forma) {
        console.error(`Asaas: pediu ${d.forma} e veio ${sub.billingType} (a conta do Asaas tem chave Pix cadastrada?)`);
        await cancelarNoAsaas(sub.id).catch(() => undefined);
        return { ok: false, erro: textos.assinatura.formaIndisponivel(d.forma === "PIX" ? "Pix" : "Cartão"), campo: "forma" };
      }
    }
    await admin
      .from("assinaturas")
      .update({
        provedor: PROVEDOR_ASAAS,
        id_cliente_externo: cliente.id,
        id_assinatura_externa: sub.id,
        forma_pagamento: d.forma,
        // Assinou de novo depois de cancelar: com dias pagos, segue ativa; senão vale a régua normal (o pagamento confirma "ativa")
        ...(a.status === "cancelada" ? { status: aindaPago ? "ativa" : "em_atraso" } : {}),
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
    const faturaId = await guardarCobranca(cobranca, { ...a, status: a.status === "cancelada" ? "em_atraso" : a.status });
    // Pix e cartão: paga na página do próprio Asaas, aberta numa aba nova (o sistema nunca vê os dados do cartão).
    // Esta aba fica em /pagamento/... esperando a confirmação.
    return { ok: true, destino: `/pagamento/${faturaId}`, link: cobranca.invoiceUrl ?? undefined };
  } catch (erro) {
    console.error("Asaas: falha ao assinar", erro);
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

/** Troca Pix ⇄ cartão. Vale também para a cobrança em aberto, que volta para abrir a página do Asaas. */
export async function trocarForma(forma: "PIX" | "CREDIT_CARD"): Promise<Resultado<{ faturaId?: string; link?: string }>> {
  const ctx = await dono();
  if (!ctx || (forma !== "PIX" && forma !== "CREDIT_CARD")) return { ok: false, erro: FALHOU };
  const admin = criarClienteAdmin();
  const { data: a } = await admin.from("assinaturas").select("id, provedor, status, id_assinatura_externa").eq("empresa_id", ctx.empresa.id).single();
  if (a?.provedor !== PROVEDOR_ASAAS || !a.id_assinatura_externa || a.status === "cancelada") return { ok: false, erro: FALHOU };
  try {
    const sub = await atualizarAssinatura(a.id_assinatura_externa, { forma });
    // Pix virou boleto (conta sem chave Pix): não grava a troca
    if (sub.billingType !== forma) return { ok: false, erro: textos.assinatura.formaIndisponivel(forma === "PIX" ? "Pix" : "Cartão") };
    await admin.from("assinaturas").update({ forma_pagamento: forma, atualizado_em: new Date().toISOString() }).eq("id", a.id);
    const { data: abertas } = await admin
      .from("faturas")
      .update({ forma: forma === "CREDIT_CARD" ? "cartao" : "pix" })
      .eq("assinatura_id", a.id)
      .in("status", ["pendente", "vencida"])
      .select("id, link_fatura, vencimento");
    revalidatePath("/plano");
    const aberta = abertas?.sort((x, y) => x.vencimento.localeCompare(y.vencimento))[0];
    return { ok: true, faturaId: aberta?.id, link: aberta?.link_fatura ?? undefined };
  } catch (erro) {
    console.error("Asaas: falha ao trocar a forma de pagamento", erro);
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
