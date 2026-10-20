"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";

type Resultado<T = object> = ({ ok: true } & T) | { ok: false; erro: string };

const FALHOU = "Não deu certo. Confira a internet e tente de novo.";

async function gestor() {
  const ctx = await exigirOficina();
  return ctx.papel === "dono" || ctx.papel === "gerente" ? ctx : null;
}

const esquemaConvite = z.object({
  nome: z.string().trim().min(2, "Coloque o nome da pessoa").max(80),
  papel: z.enum(["vistoriador", "gerente"]),
});

/** Cria o convite. A pessoa entra na equipe quando abrir o link e aceitar. */
export async function criarConvite(dados: z.input<typeof esquemaConvite>): Promise<Resultado<{ token: string }>> {
  const ctx = await gestor();
  if (!ctx) return { ok: false, erro: FALHOU };
  const v = esquemaConvite.safeParse(dados);
  if (!v.success) return { ok: false, erro: v.error.issues[0].message };
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("convites")
    .insert({ empresa_id: ctx.empresa.id, nome: v.data.nome, papel: v.data.papel, criado_por: ctx.usuario.id })
    .select("token")
    .single();
  if (error || !data) return { ok: false, erro: FALHOU };
  revalidatePath("/equipe");
  return { ok: true, token: data.token };
}

export async function cancelarConvite(id: string): Promise<Resultado> {
  const ctx = await gestor();
  if (!ctx || !/^[0-9a-f-]{36}$/.test(id)) return { ok: false, erro: FALHOU };
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("convites").update({ cancelado: true }).eq("id", id).eq("empresa_id", ctx.empresa.id);
  if (error) return { ok: false, erro: FALHOU };
  revalidatePath("/equipe");
  return { ok: true };
}

/** Tira a pessoa da equipe (não apaga nada: as vistorias dela continuam). O dono não pode ser tirado. */
export async function tirarDaEquipe(id: string): Promise<Resultado> {
  const ctx = await gestor();
  if (!ctx || !/^[0-9a-f-]{36}$/.test(id)) return { ok: false, erro: FALHOU };
  const supabase = await criarClienteServidor();
  const { data: membro } = await supabase.from("usuarios_empresa").select("user_id, papel").eq("id", id).eq("empresa_id", ctx.empresa.id).maybeSingle();
  if (!membro) return { ok: false, erro: FALHOU };
  if (membro.papel === "dono") return { ok: false, erro: "O dono da oficina não pode sair da equipe." };
  if (membro.user_id === ctx.usuario.id) return { ok: false, erro: "Você não pode tirar a si mesmo." };
  const { error } = await supabase.from("usuarios_empresa").update({ ativo: false }).eq("id", id).eq("empresa_id", ctx.empresa.id);
  if (error) return { ok: false, erro: FALHOU };
  revalidatePath("/equipe");
  revalidatePath("/plano");
  return { ok: true };
}
