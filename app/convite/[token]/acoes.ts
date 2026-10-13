"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export async function aceitarConvite(token: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("aceitar_convite", { p_token: token });
  if (error) {
    // Mensagens do banco já vêm em português simples (ex.: "Este convite não vale mais...")
    return { ok: false, erro: error.code === "P0001" ? error.message : "Não deu certo. Tente de novo." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
