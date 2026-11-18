import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { mensalidadeDaOficina } from "@/lib/mensalidade";
import { hojeBR } from "@/lib/cadastro";
import { textos } from "@/lib/textos";
import { asaasLigado, buscarOuCriarCliente, cancelarAssinatura, criarAssinatura } from "./asaas";
import { DESCRICAO_ASSINATURA, PROVEDOR_ASAAS } from "./config";
import { somarDias } from "./webhook";

/**
 * Passa os clientes do Pix manual para a assinatura mensal do Asaas (Pix), sem cobrar nada antes da hora:
 * a 1ª cobrança automática vence no fim do período que já foi pago (proximo_vencimento).
 * Só quem está com o plano pago (vencimento de hoje em diante), tem CPF/CNPJ e não é gratuita.
 * Quem não tem CPF/CNPJ vê em Meu plano o aviso para escolher como pagar (Pix, cartão ou boleto).
 * Cartão: o cliente precisa digitar o cartão uma vez, então não entra aqui (escolhe em Meu plano).
 */

type Candidata = {
  assinaturaId: string;
  empresaId: string;
  vencimento: string;
  planoNome: string | null;
  doc: string | null;
  nome: string;
  whatsapp: string | null;
};

async function candidatas(): Promise<Candidata[]> {
  const admin = criarClienteAdmin();
  const { data } = await admin
    .from("assinaturas")
    .select(
      "id, empresa_id, proximo_vencimento, provedor, status, planos(nome), empresas!inner(cnpj_cpf, razao_social, nome_fantasia, whatsapp, ativa, gratuita)",
    )
    .in("status", ["ativa", "em_atraso"])
    .gte("proximo_vencimento", hojeBR())
    .or(`provedor.is.null,provedor.neq.${PROVEDOR_ASAAS}`);
  type Linha = {
    id: string;
    empresa_id: string;
    proximo_vencimento: string;
    planos: { nome: string } | null;
    empresas: {
      cnpj_cpf: string | null;
      razao_social: string | null;
      nome_fantasia: string;
      whatsapp: string | null;
      ativa: boolean | null;
      gratuita: boolean | null;
    };
  };
  return ((data ?? []) as unknown as Linha[])
    .filter((l) => l.empresas.ativa !== false && !l.empresas.gratuita && asaasLigado(l.empresa_id))
    .map((l) => ({
      assinaturaId: l.id,
      empresaId: l.empresa_id,
      vencimento: l.proximo_vencimento,
      planoNome: l.planos?.nome ?? null,
      doc: l.empresas.cnpj_cpf?.replace(/\D/g, "") || null,
      nome: l.empresas.razao_social || l.empresas.nome_fantasia,
      whatsapp: l.empresas.whatsapp,
    }));
}

/** Quantas dá para passar agora e quantas faltam CPF/CNPJ (vão escolher em Meu plano). */
export async function contarParaMigrar() {
  const lista = await candidatas();
  return {
    prontas: lista.filter((c) => c.doc).length,
    semDocumento: lista.filter((c) => !c.doc).length,
  };
}

async function emailDoDono(empresaId: string) {
  const admin = criarClienteAdmin();
  const { data: v } = await admin
    .from("usuarios_empresa")
    .select("user_id")
    .eq("empresa_id", empresaId)
    .eq("papel", "dono")
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();
  if (!v) return null;
  const { data } = await admin.auth.admin.getUserById(v.user_id);
  return data.user?.email ?? null;
}

/** Passa até `limite` oficinas por vez (cada uma fala com o Asaas). */
export async function migrarParaAsaas(autorId: string, limite = 20) {
  const admin = criarClienteAdmin();
  const lista = (await candidatas()).filter((c) => c.doc);
  const { data: plat } = await admin.from("plataforma").select("*").single();
  const carencia = Number(plat?.dias_carencia ?? 5);
  const resultado = {
    migradas: 0,
    erros: [] as string[],
    restantes: Math.max(0, lista.length - limite),
  };

  for (const c of lista.slice(0, limite)) {
    try {
      const m = await mensalidadeDaOficina(c.empresaId);
      if (m.valor <= 0) continue;
      const cliente = await buscarOuCriarCliente({
        empresaId: c.empresaId,
        nome: c.nome,
        cpfCnpj: c.doc!,
        celular: c.whatsapp?.replace(/\D/g, "") || null,
        email: await emailDoDono(c.empresaId),
      });
      const sub = await criarAssinatura({
        cliente: cliente.id,
        forma: "PIX",
        valor: m.valor,
        primeiroVencimento: c.vencimento, // fim do período já pago: nada é cobrado antes
        descricao: DESCRICAO_ASSINATURA(plat?.nome_produto ?? textos.produto.nome, m.planoNome || c.planoNome || "Básico"),
        empresaId: c.empresaId,
      });
      if (sub.billingType !== "PIX") {
        await cancelarAssinatura(sub.id).catch(() => undefined);
        resultado.erros.push(`${c.nome}: o Asaas não aceitou Pix (a conta tem chave Pix?)`);
        continue;
      }
      await admin
        .from("assinaturas")
        .update({
          provedor: PROVEDOR_ASAAS,
          id_cliente_externo: cliente.id,
          id_assinatura_externa: sub.id,
          forma_pagamento: "PIX",
          // Já pago até o vencimento: se cancelar, usa até aqui
          acesso_ate: somarDias(c.vencimento, carencia),
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", c.assinaturaId);
      await admin.from("auditoria").insert({
        empresa_id: c.empresaId,
        usuario_id: autorId,
        acao: "migrou_asaas",
        entidade: "assinaturas",
        detalhes: {
          assinatura: sub.id,
          primeira_cobranca: c.vencimento,
          valor: m.valor,
        },
      });
      resultado.migradas++;
    } catch (erro) {
      console.error(`Asaas: falha ao migrar a oficina ${c.empresaId}`, erro instanceof Error ? erro.message : erro);
      resultado.erros.push(`${c.nome}: não deu certo (veja o log)`);
    }
  }
  return resultado;
}
