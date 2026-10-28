import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { valorComissao } from "@/lib/comissao";

/**
 * Cria a comissão (a pagar) do vendedor da oficina para pagamentos recebidos.
 * - `faturaIds`: só estas faturas; sem nada, todas as faturas pagas da oficina que ainda não têm comissão.
 * Oficina sem vendedor: não faz nada. Se o banco ainda não tiver as tabelas de comissão, não quebra nada.
 */
export async function criarComissoes(empresaId: string, faturaIds?: string[]) {
  const admin = criarClienteAdmin();
  const [{ data: empresa, error }, { data: plat }] = await Promise.all([
    admin.from("empresas").select("vendedor_id").eq("id", empresaId).maybeSingle(),
    admin.from("plataforma").select("comissao_percentual").single(),
  ]);
  if (error || !empresa?.vendedor_id) return 0;
  const percentual = Number(plat?.comissao_percentual ?? 50);

  let consulta = admin.from("faturas").select("id, valor, pago_em").eq("empresa_id", empresaId).eq("status", "paga");
  if (faturaIds) consulta = consulta.in("id", faturaIds);
  const [{ data: faturas }, { data: jaTem }] = await Promise.all([
    consulta,
    admin.from("comissoes").select("fatura_id").eq("empresa_id", empresaId),
  ]);
  const existentes = new Set((jaTem ?? []).map((c) => c.fatura_id));
  const novas = (faturas ?? [])
    .filter((f) => f.pago_em && !existentes.has(f.id))
    .map((f) => ({
      fatura_id: f.id,
      empresa_id: empresaId,
      vendedor_id: empresa.vendedor_id,
      valor_recebido: Number(f.valor),
      recebido_em: f.pago_em,
      percentual,
      valor: valorComissao(Number(f.valor), percentual),
    }));
  if (novas.length === 0) return 0;
  const { error: erroInsert } = await admin.from("comissoes").upsert(novas, { onConflict: "fatura_id", ignoreDuplicates: true });
  if (erroInsert) console.error("Falha ao criar comissão:", erroInsert.message);
  return erroInsert ? 0 : novas.length;
}
