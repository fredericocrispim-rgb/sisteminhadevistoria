"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { exigirSuperadmin } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { mensalidadeDaOficina } from "@/lib/mensalidade";

const hoje = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); // aaaa-mm-dd

function somarDias(data: string, dias: number) {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Pix conferido no extrato: registra a mensalidade como paga e libera mais 30 dias.
 */
export async function marcarComoPago(formData: FormData) {
  const ctx = await exigirSuperadmin();
  const empresaId = String(formData.get("empresa_id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(empresaId)) return;

  const admin = criarClienteAdmin();
  const [{ data: assinatura }, m] = await Promise.all([
    admin.from("assinaturas").select("id, plano_id, proximo_vencimento, status").eq("empresa_id", empresaId).single(),
    mensalidadeDaOficina(empresaId),
  ]);
  if (!assinatura) return;

  // Mantém o dia de vencimento: se pagou adiantado ou com atraso de até 5 dias, conta a partir do vencimento;
  // no fim do teste (ou atraso maior), conta a partir de hoje.
  const limite = somarDias(hoje(), -5);
  const base =
    assinatura.status === "ativa" && assinatura.proximo_vencimento && assinatura.proximo_vencimento >= limite
      ? assinatura.proximo_vencimento
      : hoje();
  const novoVencimento = somarDias(base, 30);

  await admin.from("faturas").insert({
    empresa_id: empresaId,
    assinatura_id: assinatura.id,
    descricao: `Mensalidade (Pix conferido à mão) · ${m.usuarios} ${m.usuarios === 1 ? "usuário" : "usuários"}`,
    valor: m.valor || 0.01,
    vencimento: hoje(),
    status: "paga",
    forma: "pix",
    pago_em: new Date().toISOString(),
    confirmado_por: ctx.usuario.id,
  });
  await admin
    .from("assinaturas")
    .update({ status: "ativa", plano_id: m.planoId, proximo_vencimento: novoVencimento })
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

/**
 * "Esqueci minha senha" sem e-mail: o administrador gera um link de uso único
 * e manda para a pessoa pelo WhatsApp. O link abre a tela de criar senha nova.
 */
export async function gerarLinkSenha(_: unknown, formData: FormData): Promise<{ link?: string; erro?: string; email?: string }> {
  await exigirSuperadmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { erro: "E-mail incompleto" };
  const { data, error } = await criarClienteAdmin().auth.admin.generateLink({ type: "recovery", email });
  if (error || !data.properties?.hashed_token) return { erro: "Não achei uma conta com esse e-mail", email };
  const h = await headers();
  const base = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  return { email, link: `${base}/auth/confirmar?token_hash=${data.properties.hashed_token}&type=recovery&voltar=/nova-senha` };
}

// ---------------------------------------------------------------------
// Gerenciar o acesso de cada oficina (painel do administrador)
// ---------------------------------------------------------------------

export type Resultado = { ok?: boolean; erro?: string };

const ehId = (v: string) => /^[0-9a-f-]{36}$/.test(v);
const ehData = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`));

async function registrar(empresaId: string, usuarioId: string, acao: string, detalhes: Record<string, unknown>) {
  await criarClienteAdmin().from("auditoria").insert({
    empresa_id: empresaId,
    usuario_id: usuarioId,
    acao,
    entidade: "empresas",
    entidade_id: empresaId,
    detalhes,
  });
}

/** Data que vale agora para a oficina: fim do teste ou vencimento da mensalidade. */
async function lerAssinatura(empresaId: string) {
  const { data } = await criarClienteAdmin()
    .from("assinaturas")
    .select("id, status, fim_teste, proximo_vencimento")
    .eq("empresa_id", empresaId)
    .maybeSingle();
  return data;
}

/** Muda a data de vencimento (ou de fim do teste). Também tira o bloqueio manual. */
export async function mudarVencimento(empresaId: string, data: string): Promise<Resultado> {
  const ctx = await exigirSuperadmin();
  if (!ehId(empresaId) || !ehData(data)) return { erro: "Data inválida" };
  const a = await lerAssinatura(empresaId);
  if (!a) return { erro: "Oficina sem assinatura" };
  const teste = a.status === "teste" || (a.status !== "ativa" && !a.proximo_vencimento);
  const { error } = await criarClienteAdmin()
    .from("assinaturas")
    .update(teste ? { status: "teste", fim_teste: data } : { status: "ativa", proximo_vencimento: data })
    .eq("id", a.id);
  if (error) return { erro: "Não consegui salvar. Tente de novo." };
  await registrar(empresaId, ctx.usuario.id, "vencimento_alterado", { para: data, teste });
  revalidatePath("/admin");
  return { ok: true };
}

/** Dá mais dias de uso (a partir de hoje ou do vencimento, o que for mais tarde). */
export async function darMaisDias(empresaId: string, dias: number): Promise<Resultado> {
  await exigirSuperadmin();
  if (!ehId(empresaId) || !Number.isInteger(dias) || dias < 1 || dias > 365) return { erro: "Número de dias inválido" };
  const a = await lerAssinatura(empresaId);
  if (!a) return { erro: "Oficina sem assinatura" };
  const atual = (a.status === "teste" ? a.fim_teste : a.proximo_vencimento) ?? hoje();
  return mudarVencimento(empresaId, somarDias(atual > hoje() ? atual : hoje(), dias));
}

/** Bloqueia na hora (a oficina só vê a tela do Pix), mesmo que a data ainda não tenha vencido. */
export async function bloquearAcesso(empresaId: string): Promise<Resultado> {
  const ctx = await exigirSuperadmin();
  if (!ehId(empresaId)) return { erro: "Oficina inválida" };
  const a = await lerAssinatura(empresaId);
  if (!a) return { erro: "Oficina sem assinatura" };
  await criarClienteAdmin().from("assinaturas").update({ status: "cancelada" }).eq("id", a.id);
  await registrar(empresaId, ctx.usuario.id, "acesso_bloqueado", { status_anterior: a.status });
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Tira o bloqueio. Se a data já passou da carência (continuaria bloqueado),
 * dá 7 dias a partir de hoje para a oficina ter tempo de pagar.
 */
export async function liberarAcesso(empresaId: string): Promise<Resultado> {
  const ctx = await exigirSuperadmin();
  if (!ehId(empresaId)) return { erro: "Oficina inválida" };
  const a = await lerAssinatura(empresaId);
  if (!a) return { erro: "Oficina sem assinatura" };
  const teste = !a.proximo_vencimento;
  const venc = (teste ? a.fim_teste : a.proximo_vencimento) ?? null;
  const limite = somarDias(hoje(), -5);
  const novaData = !venc || venc < limite ? somarDias(hoje(), 7) : venc;
  await criarClienteAdmin()
    .from("assinaturas")
    .update(teste ? { status: "teste", fim_teste: novaData } : { status: "ativa", proximo_vencimento: novaData })
    .eq("id", a.id);
  await registrar(empresaId, ctx.usuario.id, "acesso_liberado", { ate: novaData });
  revalidatePath("/admin");
  return { ok: true };
}

/** Liga ou desliga uma pessoa da equipe (o dono não pode ser desligado por aqui). */
export async function mudarUsuarioAtivo(vinculoId: string, ativo: boolean): Promise<Resultado> {
  const ctx = await exigirSuperadmin();
  if (!ehId(vinculoId)) return { erro: "Pessoa inválida" };
  const admin = criarClienteAdmin();
  const { data: v } = await admin.from("usuarios_empresa").select("empresa_id, papel, nome").eq("id", vinculoId).maybeSingle();
  if (!v) return { erro: "Pessoa não encontrada" };
  if (v.papel === "dono" && !ativo) return { erro: "Para tirar o acesso do dono, bloqueie a oficina" };
  await admin.from("usuarios_empresa").update({ ativo }).eq("id", vinculoId);
  await registrar(v.empresa_id, ctx.usuario.id, ativo ? "usuario_religado" : "usuario_desligado", { vinculo: vinculoId, nome: v.nome });
  revalidatePath("/admin");
  return { ok: true };
}

/** Anota que uma mensagem de cobrança foi aberta no WhatsApp (aparece como "Última mensagem"). */
export async function registrarMensagem(empresaId: string, modelo: string): Promise<Resultado> {
  const ctx = await exigirSuperadmin();
  if (!ehId(empresaId)) return { erro: "Oficina inválida" };
  await registrar(empresaId, ctx.usuario.id, "mensagem_whatsapp", { modelo: modelo.slice(0, 30) });
  revalidatePath("/admin");
  return { ok: true };
}
