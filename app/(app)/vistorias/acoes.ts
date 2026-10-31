"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { obterContexto, temAssinaturaAtiva } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { placaParaBanco, placaValida, telefoneValido, kmParaNumero } from "@/lib/formatos";
import { FOTOS_OBRIGATORIAS, PNEUS, PNEUS_MOTO, pneusDoVeiculo } from "@/lib/vistoria";
import { gerarTermoPdf } from "@/lib/pdf/termo";

type Resultado<T = object> = ({ ok: true } & T) | { ok: false; erro: string };
const FALHOU = "Não deu certo. Confira a internet e tente de novo.";

async function contextoOficina() {
  const ctx = await obterContexto();
  if (!ctx?.empresa) return null;
  return ctx as typeof ctx & { empresa: NonNullable<typeof ctx.empresa> };
}

const BLOQUEADO = "Acesso bloqueado: falta pagar a mensalidade. Abra Meu plano para pagar.";

/** Sem assinatura em dia (temAssinaturaAtiva): não deixa fazer vistoria nova (o administrador nunca é bloqueado). */
async function bloqueado(ctx: NonNullable<Awaited<ReturnType<typeof contextoOficina>>>) {
  return !ctx.superadmin && !(await temAssinaturaAtiva(ctx.empresa.id));
}

/* ---------- Buscar carro pela placa (preenchimento automático) ---------- */

export async function buscarPorPlaca(placa: string) {
  const ctx = await contextoOficina();
  if (!ctx || !placaValida(placa)) return null;
  const supabase = await criarClienteServidor();
  const { data: veiculo } = await supabase
    .from("veiculos")
    .select("id, placa, marca, modelo, ano, cor, tipo, clientes (nome, whatsapp, email)")
    .eq("empresa_id", ctx.empresa.id)
    .eq("placa", placaParaBanco(placa))
    .maybeSingle();
  if (!veiculo) return null;
  const { data: ultima } = await supabase
    .from("vistorias")
    .select("km")
    .eq("veiculo_id", veiculo.id)
    .in("status", ["concluida", "enviada"])
    .order("iniciada_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  const cliente = veiculo.clientes as unknown as { nome: string; whatsapp: string | null; email: string | null } | null;
  return {
    tipoVeiculo: veiculo.tipo as string,
    marca: veiculo.marca ?? "",
    modelo: veiculo.modelo ?? "",
    cor: veiculo.cor ?? "",
    clienteNome: cliente?.nome ?? "",
    clienteWhatsapp: cliente?.whatsapp ?? "",
    ultimoKm: ultima?.km ?? null,
  };
}

/* ---------- Passo 1: carro e cliente ---------- */

const esquemaPasso1 = z.object({
  vistoriaId: z.string().uuid().nullish(),
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  tipoVeiculo: z.enum(["carro", "moto", "caminhao"]).default("carro"),
  entradaId: z.string().uuid().nullish(),
  placa: z.string().refine(placaValida, "Placa incompleta"),
  marca: z.string().trim().min(1, "Escolha a marca").max(40),
  modelo: z.string().trim().max(60).default(""),
  cor: z.string().trim().min(1, "Escolha a cor").max(30),
  km: z.string().refine((v) => kmParaNumero(v) !== null, "Coloque o km"),
  combustivel: z.enum(["vazio", "1/4", "1/2", "3/4", "cheio"], { error: "Marque o combustível" }),
  chegouGuincho: z.boolean(),
  placaGuincho: z.string().trim().max(10).default(""),
  prestadorGuincho: z.string().trim().max(80).default(""),
  clienteNome: z.string().trim().min(2, "Coloque o nome do cliente").max(80),
  clienteWhatsapp: z.string().refine(telefoneValido, "WhatsApp do cliente incompleto"),
});

export async function salvarCarroCliente(dados: z.input<typeof esquemaPasso1>): Promise<Resultado<{ id: string }>> {
  const ctx = await contextoOficina();
  if (!ctx) return { ok: false, erro: FALHOU };
  if (await bloqueado(ctx)) return { ok: false, erro: BLOQUEADO };
  const v = esquemaPasso1.safeParse(dados);
  if (!v.success) return { ok: false, erro: v.error.issues[0].message };
  const d = v.data;
  const supabase = await criarClienteServidor();
  const empresaId = ctx.empresa.id;
  const whatsapp = d.clienteWhatsapp;

  // Cliente: reaproveita pelo WhatsApp
  let clienteId: string | null = null;
  {
    const { data: existente } = await supabase.from("clientes").select("id").eq("empresa_id", empresaId).eq("whatsapp", whatsapp).maybeSingle();
    if (existente) {
      clienteId = existente.id;
      await supabase.from("clientes").update({ nome: d.clienteNome }).eq("id", existente.id);
    } else {
      const { data: novo, error } = await supabase
        .from("clientes")
        .insert({ empresa_id: empresaId, nome: d.clienteNome, whatsapp })
        .select("id")
        .single();
      if (error) return { ok: false, erro: FALHOU };
      clienteId = novo.id;
    }
  }

  // Veículo: reaproveita pela placa
  const placa = placaParaBanco(d.placa);
  let veiculoId: string;
  {
    const dadosVeiculo = { marca: d.marca, modelo: d.modelo || null, cor: d.cor, tipo: d.tipoVeiculo, cliente_id: clienteId };
    const { data: existente } = await supabase.from("veiculos").select("id").eq("empresa_id", empresaId).eq("placa", placa).maybeSingle();
    if (existente) {
      veiculoId = existente.id;
      await supabase.from("veiculos").update(dadosVeiculo).eq("id", existente.id);
    } else {
      const { data: novo, error } = await supabase
        .from("veiculos")
        .insert({ empresa_id: empresaId, placa, ...dadosVeiculo })
        .select("id")
        .single();
      if (error) return { ok: false, erro: FALHOU };
      veiculoId = novo.id;
    }
  }

  const campos = {
    veiculo_id: veiculoId,
    cliente_id: clienteId,
    tipo_veiculo: d.tipoVeiculo,
    km: kmParaNumero(d.km),
    combustivel: d.combustivel,
    chegou_guincho: d.tipo === "ENTRADA" && d.chegouGuincho,
    placa_guincho: d.chegouGuincho ? placaParaBanco(d.placaGuincho) || null : null,
    prestador_guincho: d.chegouGuincho ? d.prestadorGuincho || null : null,
  };

  if (d.vistoriaId) {
    const { error } = await supabase.from("vistorias").update(campos).eq("id", d.vistoriaId).eq("status", "rascunho");
    if (error) return { ok: false, erro: FALHOU };
    return { ok: true, id: d.vistoriaId };
  }

  const { data: unidade } = await supabase.from("unidades").select("id").eq("empresa_id", empresaId).order("criado_em").limit(1).single();
  if (!unidade) return { ok: false, erro: FALHOU };
  const nomeUsuario = ctx.usuario.nome ?? ctx.usuario.email;
  const { data: nova, error } = await supabase
    .from("vistorias")
    .insert({
      empresa_id: empresaId,
      unidade_id: unidade.id,
      tipo: d.tipo,
      criado_por: ctx.usuario.id,
      vistoria_entrada_id: d.tipo === "SAIDA" ? (d.entradaId ?? null) : null,
      ...(d.tipo === "ENTRADA" ? { recebido_por: nomeUsuario } : { liberado_por: nomeUsuario }),
      ...campos,
    })
    .select("id")
    .single();
  if (error || !nova) return { ok: false, erro: FALHOU };
  revalidatePath("/inicio");
  return { ok: true, id: nova.id };
}

/* ---------- Passo 4: pneus ---------- */

const esquemaPneus = z.object({
  vistoriaId: z.string().uuid(),
  pneus: z
    .array(z.object({ posicao: z.enum([...PNEUS, ...PNEUS_MOTO].map((p) => p.posicao) as [string, ...string[]]), estado: z.enum(["bom", "ruim", "ausente"]) }))
    .min(2)
    .max(5),
});

export async function salvarPneus(dados: z.input<typeof esquemaPneus>): Promise<Resultado> {
  const ctx = await contextoOficina();
  if (!ctx) return { ok: false, erro: FALHOU };
  const v = esquemaPneus.safeParse(dados);
  if (!v.success) return { ok: false, erro: "Marque todos os pneus" };
  const d = v.data;
  const supabase = await criarClienteServidor();

  // Os pneus têm de ser exatamente os do veículo (moto: 2; carro e caminhão: 5)
  const { data: vt } = await supabase.from("vistorias").select("tipo_veiculo").eq("id", d.vistoriaId).single();
  const esperados = pneusDoVeiculo(vt?.tipo_veiculo).map((p) => p.posicao);
  if (d.pneus.length !== esperados.length || !esperados.every((p) => d.pneus.some((x) => x.posicao === p))) {
    return { ok: false, erro: "Marque todos os pneus" };
  }

  await supabase.from("vistoria_pneus").delete().eq("vistoria_id", d.vistoriaId);
  const r = await supabase.from("vistoria_pneus").insert(d.pneus.map((p) => ({ vistoria_id: d.vistoriaId, ...p })));
  if (r.error) return { ok: false, erro: FALHOU };
  return { ok: true };
}

/* ---------- Passo 5: itens do carro e observações ---------- */

const esquemaItens = z.object({
  vistoriaId: z.string().uuid(),
  itens: z.array(z.object({ nome: z.string().max(60), tem: z.boolean() })).max(60),
  observacoes: z.string().max(4000).default(""),
});

export async function salvarItens(dados: z.input<typeof esquemaItens>): Promise<Resultado> {
  const ctx = await contextoOficina();
  if (!ctx) return { ok: false, erro: FALHOU };
  const v = esquemaItens.safeParse(dados);
  if (!v.success) return { ok: false, erro: "Marque todos os itens" };
  const d = v.data;
  const supabase = await criarClienteServidor();

  await supabase.from("vistoria_itens").delete().eq("vistoria_id", d.vistoriaId);
  const r1 = d.itens.length
    ? await supabase.from("vistoria_itens").insert(d.itens.map((i) => ({ vistoria_id: d.vistoriaId, item_nome: i.nome, tem: i.tem })))
    : { error: null };
  const r2 = await supabase.from("vistorias").update({ observacoes: d.observacoes || null }).eq("id", d.vistoriaId);
  if (r1.error || r2.error) return { ok: false, erro: FALHOU };
  return { ok: true };
}

/* ---------- Passos 6 e 7: concluir (trava a vistoria e gera o PDF) ---------- */

const imagemPng = z.string().startsWith("data:image/png;base64,").max(2_000_000);

const esquemaConcluir = z
  .object({
    vistoriaId: z.string().uuid(),
    nomeAssinante: z.string().trim().max(80).default(""),
    documentoAssinante: z.string().trim().max(20).default(""),
    assinaturaCliente: imagemPng.nullish(),
    clienteAusente: z.string().trim().max(300).nullish(),
    assinaturaResponsavel: imagemPng,
    latitude: z.number().min(-90).max(90).nullish(),
    longitude: z.number().min(-180).max(180).nullish(),
  })
  .refine((d) => (d.assinaturaCliente && d.nomeAssinante.length >= 2) || (d.clienteAusente && d.clienteAusente.length >= 3), {
    message: "Falta a assinatura e o nome do cliente",
  });

export async function concluirVistoria(dados: z.input<typeof esquemaConcluir>): Promise<Resultado<{ id: string }>> {
  const ctx = await contextoOficina();
  if (!ctx) return { ok: false, erro: FALHOU };
  if (await bloqueado(ctx)) return { ok: false, erro: BLOQUEADO };
  const v = esquemaConcluir.safeParse(dados);
  if (!v.success) return { ok: false, erro: v.error.issues[0].message };
  const d = v.data;
  const supabase = await criarClienteServidor();

  const { data: vistoria } = await supabase
    .from("vistorias")
    .select("id, empresa_id, status, codigo_autenticidade, veiculo_id, tipo_veiculo")
    .eq("id", d.vistoriaId)
    .single();
  if (!vistoria || vistoria.status !== "rascunho") return { ok: false, erro: "Esta vistoria já foi concluída." };

  // Confere o obrigatório
  const [{ data: fotos }, { count: pneus }] = await Promise.all([
    supabase.from("vistoria_fotos").select("categoria").eq("vistoria_id", d.vistoriaId),
    supabase.from("vistoria_pneus").select("id", { count: "exact", head: true }).eq("vistoria_id", d.vistoriaId),
  ]);
  const faltaFoto = FOTOS_OBRIGATORIAS.find((f) => !fotos?.some((x) => x.categoria === f.categoria));
  if (faltaFoto) return { ok: false, erro: `Falta a foto: ${faltaFoto.titulo}` };
  if ((pneus ?? 0) < pneusDoVeiculo(vistoria.tipo_veiculo).length) return { ok: false, erro: "Falta marcar os pneus" };
  if (!vistoria.veiculo_id) return { ok: false, erro: "Falta o carro e o cliente" };

  // Guarda as assinaturas
  const pasta = `${vistoria.empresa_id}/${vistoria.id}`;
  const enviarPng = async (nome: string, dataUrl: string) => {
    const caminho = `${pasta}/${nome}.png`;
    const bytes = Buffer.from(dataUrl.split(",")[1], "base64");
    const { error } = await supabase.storage.from("vistorias").upload(caminho, bytes, { contentType: "image/png", upsert: false });
    if (error && !/exists/i.test(error.message)) throw error;
    return caminho;
  };
  let assinaturaCliente: string | null = null;
  let assinaturaResponsavel: string;
  try {
    if (d.assinaturaCliente) assinaturaCliente = await enviarPng("assinatura-cliente", d.assinaturaCliente);
    assinaturaResponsavel = await enviarPng("assinatura-responsavel", d.assinaturaResponsavel);
  } catch {
    return { ok: false, erro: FALHOU };
  }

  // Evidências e trava (a partir daqui o banco não deixa mais alterar)
  const h = await headers();
  const { error: erroConcluir } = await supabase
    .from("vistorias")
    .update({
      status: "concluida",
      concluida_em: new Date().toISOString(),
      nome_assinante_cliente: d.assinaturaCliente ? d.nomeAssinante : null,
      documento_assinante: d.documentoAssinante || null,
      assinatura_cliente_url: assinaturaCliente,
      cliente_ausente_justificativa: d.assinaturaCliente ? null : d.clienteAusente,
      assinatura_responsavel_url: assinaturaResponsavel,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      ip_conclusao: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      aparelho: (h.get("user-agent") ?? "").slice(0, 300),
    })
    .eq("id", vistoria.id)
    .eq("status", "rascunho");
  if (erroConcluir) return { ok: false, erro: FALHOU };

  await supabase.from("auditoria").insert({
    empresa_id: vistoria.empresa_id,
    usuario_id: ctx.usuario.id,
    acao: "concluiu_vistoria",
    entidade: "vistorias",
    entidade_id: vistoria.id,
  });

  // PDF + código SHA-256 (se falhar, a vistoria já está salva; dá para gerar de novo depois)
  await gerarEGuardarPdf(vistoria.id, `${vistoria.empresa_id}/${vistoria.id}/termo-${vistoria.codigo_autenticidade}.pdf`);

  revalidatePath("/inicio");
  revalidatePath("/vistorias");
  revalidatePath("/patio");
  return { ok: true, id: vistoria.id };
}

async function urlBase() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

async function gerarEGuardarPdf(vistoriaId: string, caminho: string) {
  try {
    const admin = criarClienteAdmin();
    const pdf = await gerarTermoPdf(vistoriaId, await urlBase());
    const { error } = await admin.storage.from("vistorias").upload(caminho, pdf, { contentType: "application/pdf", upsert: true });
    if (error) throw error;
    const hash = createHash("sha256").update(pdf).digest("hex");
    await admin.from("vistorias").update({ pdf_url: caminho, pdf_hash_sha256: hash }).eq("id", vistoriaId).is("pdf_url", null);
  } catch (erro) {
    console.error("Falha ao gerar o PDF da vistoria", vistoriaId, erro);
  }
}

/** Tenta de novo gerar o PDF (se falhou na conclusão). */
export async function gerarPdfDeNovo(vistoriaId: string): Promise<Resultado> {
  const ctx = await contextoOficina();
  if (!ctx) return { ok: false, erro: FALHOU };
  const supabase = await criarClienteServidor();
  const { data: v } = await supabase.from("vistorias").select("id, empresa_id, status, pdf_url, codigo_autenticidade").eq("id", vistoriaId).single();
  if (!v || v.status === "rascunho" || v.status === "cancelada") return { ok: false, erro: FALHOU };
  if (!v.pdf_url) await gerarEGuardarPdf(v.id, `${v.empresa_id}/${v.id}/termo-${v.codigo_autenticidade}.pdf`);
  revalidatePath(`/vistorias/${vistoriaId}/pronto`);
  return { ok: true };
}

/** Marca que foi enviada ao cliente (pelo botão do WhatsApp). */
export async function registrarEnvio(vistoriaId: string, destino: string) {
  const ctx = await contextoOficina();
  if (!ctx) return;
  const supabase = await criarClienteServidor();
  await supabase.from("envios").insert({ vistoria_id: vistoriaId, canal: "whatsapp_link", destino, status: "enviado" });
  await supabase.from("vistorias").update({ status: "enviada" }).eq("id", vistoriaId).eq("status", "concluida");
}

/** Apaga um rascunho (só dono/gerente; vistoria concluída nunca é apagada). */
export async function apagarRascunho(vistoriaId: string): Promise<Resultado> {
  const ctx = await contextoOficina();
  if (!ctx) return { ok: false, erro: FALHOU };
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("vistorias").delete().eq("id", vistoriaId).eq("status", "rascunho");
  if (error) return { ok: false, erro: FALHOU };
  revalidatePath("/inicio");
  revalidatePath("/vistorias");
  return { ok: true };
}

/**
 * Cancela uma vistoria abandonada (que não foi concluída): some da lista, mas fica guardada.
 * Vistoria concluída nunca é cancelada. Quem vê a vistoria pode cancelar (o vistoriador só vê as dele).
 */
export async function cancelarVistoria(vistoriaId: string): Promise<Resultado> {
  return mudarRascunho(vistoriaId, "rascunho", "cancelada");
}

/** "Desfazer" do cancelamento: a vistoria volta para a lista, como estava. */
export async function restaurarVistoria(vistoriaId: string): Promise<Resultado> {
  return mudarRascunho(vistoriaId, "cancelada", "rascunho");
}

async function mudarRascunho(vistoriaId: string, de: "rascunho" | "cancelada", para: "rascunho" | "cancelada"): Promise<Resultado> {
  const ctx = await contextoOficina();
  if (!ctx || !/^[0-9a-f-]{36}$/.test(vistoriaId)) return { ok: false, erro: FALHOU };
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("vistorias")
    .update({ status: para })
    .eq("id", vistoriaId)
    .eq("empresa_id", ctx.empresa.id)
    .eq("status", de)
    .is("concluida_em", null)
    .select("id");
  if (error || !data?.length) return { ok: false, erro: FALHOU };
  revalidatePath("/inicio");
  revalidatePath("/vistorias");
  return { ok: true };
}
