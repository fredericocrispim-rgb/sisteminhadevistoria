import "server-only";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export type CarroNoPatio = {
  entradaId: string;
  placa: string;
  descricao: string;
  cliente: string | null;
  chegouEm: string;
  dias: number;
};

/** Carros que tiveram CHEGADA concluída e ainda não tiveram ENTREGA. */
export async function listarPatio(): Promise<CarroNoPatio[]> {
  const supabase = await criarClienteServidor();
  const { data: entradas } = await supabase
    .from("vistorias")
    .select("id, concluida_em, iniciada_em, veiculos (placa, marca, modelo, cor), clientes (nome)")
    .eq("tipo", "ENTRADA")
    .in("status", ["concluida", "enviada"])
    .eq("exemplo", false)
    .order("concluida_em", { ascending: false })
    .limit(300);
  if (!entradas?.length) return [];

  const { data: saidas } = await supabase
    .from("vistorias")
    .select("vistoria_entrada_id")
    .eq("tipo", "SAIDA")
    .in("status", ["concluida", "enviada"])
    .in(
      "vistoria_entrada_id",
      entradas.map((e) => e.id),
    );
  const entregues = new Set((saidas ?? []).map((s) => s.vistoria_entrada_id));
  const agora = Date.now();

  return entradas
    .filter((e) => !entregues.has(e.id))
    .map((e) => {
      const carro = e.veiculos as unknown as { placa: string; marca: string | null; modelo: string | null; cor: string | null };
      const cliente = e.clientes as unknown as { nome: string } | null;
      const chegouEm = e.concluida_em ?? e.iniciada_em;
      return {
        entradaId: e.id,
        placa: carro.placa,
        descricao: [carro.marca, carro.modelo, carro.cor].filter(Boolean).join(" · "),
        cliente: cliente?.nome ?? null,
        chegouEm,
        dias: Math.floor((agora - new Date(chegouEm).getTime()) / 86400000),
      };
    });
}
