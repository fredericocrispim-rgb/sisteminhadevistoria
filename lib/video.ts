import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * Vídeo da vistoria (plano Pro). Fica desligado até o Frederico ligar no /admin
 * (plataforma.video_ligado), porque no plano grátis do Supabase (1 GB) não cabem vídeos.
 * Guardado por plataforma.dias_guardar_video (1 ano); depois o arquivo é apagado e o registro fica.
 */

export type VideoPublico = {
  src: string | null;
  tipo: string;
  duracao: number | null;
  sha256: string | null;
  apagado: boolean;
};

/** Quantos segundos de vídeo a oficina pode gravar por vistoria (0 = não grava). */
export async function segundosDeVideo(empresaId: string): Promise<number> {
  const admin = criarClienteAdmin();
  // select("*"): antes da migração do vídeo, as colunas não existem e o resultado é 0
  const [{ data: plat }, { data: a }] = await Promise.all([
    admin.from("plataforma").select("*").single(),
    admin.from("assinaturas").select("planos (*)").eq("empresa_id", empresaId).maybeSingle(),
  ]);
  if (!plat?.video_ligado) return 0;
  const plano = a?.planos as unknown as { video_segundos?: number } | null;
  return plano?.video_segundos ?? 0;
}

/** O vídeo de uma vistoria concluída, com link temporário (1 hora) para assistir. */
export async function videoDaVistoria(vistoriaId: string): Promise<VideoPublico | null> {
  const admin = criarClienteAdmin();
  const { data: v, error } = await admin
    .from("vistoria_videos")
    .select("url, tipo, duracao_segundos, sha256, apagado_em")
    .eq("vistoria_id", vistoriaId)
    .maybeSingle();
  if (error || !v) return null; // sem vídeo (ou banco ainda sem a tabela)
  if (v.apagado_em) return { src: null, tipo: v.tipo, duracao: v.duracao_segundos, sha256: v.sha256, apagado: true };
  const { data: link } = await admin.storage.from("vistorias").createSignedUrl(v.url, 60 * 60);
  return { src: link?.signedUrl ?? null, tipo: v.tipo, duracao: v.duracao_segundos, sha256: v.sha256, apagado: false };
}
