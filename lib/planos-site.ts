import "server-only";
import { cache } from "react";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * Os 2 planos à venda, para as páginas públicas (preços, tela inicial e páginas por tipo de negócio).
 * Os valores vêm da tabela `planos` (o Frederico muda lá, sem mexer no código). Se o banco não responder,
 * usa os valores combinados em 30-31/10/2026.
 */
export type PlanoSite = {
  nome: string;
  preco: number;
  /** Pessoas incluídas (o dono conta). */
  inclusos: number;
  extra: number;
  videoSegundos: number;
};

const PADRAO: PlanoSite[] = [
  { nome: "Básico", preco: 49.9, inclusos: 4, extra: 19.9, videoSegundos: 0 },
  { nome: "Pro", preco: 79.9, inclusos: 4, extra: 19.9, videoSegundos: 60 },
];

export const planosDoSite = cache(async (): Promise<{ basico: PlanoSite; pro: PlanoSite }> => {
  try {
    // "*": video_segundos só existe depois da migração do vídeo
    const { data } = await criarClienteAdmin().from("planos").select("*").eq("ativo", true).order("ordem");
    const lista = (data ?? []) as Record<string, unknown>[];
    const montar = (p: Record<string, unknown> | undefined, padrao: PlanoSite): PlanoSite =>
      p
        ? {
            nome: String(p.nome ?? padrao.nome),
            preco: Number(p.preco_mensal ?? padrao.preco),
            inclusos: Number(p.limite_usuarios ?? padrao.inclusos),
            extra: Number(p.preco_usuario_extra ?? padrao.extra),
            videoSegundos: Number(p.video_segundos ?? 0),
          }
        : padrao;
    const semAcento = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const basico = lista.find((p) => !Number(p.video_segundos) && semAcento(p.nome) === "basico") ?? lista.find((p) => !Number(p.video_segundos));
    const pro = lista.find((p) => Number(p.video_segundos) > 0);
    return { basico: montar(basico, PADRAO[0]), pro: montar(pro, PADRAO[1]) };
  } catch {
    return { basico: PADRAO[0], pro: PADRAO[1] };
  }
});

/** "49,90" (sem o R$). */
export function centavos(valor: number) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
