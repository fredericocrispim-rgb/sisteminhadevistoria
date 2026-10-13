import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ClipboardList, Search } from "lucide-react";
import { EstadoVazio } from "@/components/vf";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { dataHoraBR, nomeTipo, placaParaMostrar } from "@/lib/vistoria";
import { placaParaBanco } from "@/lib/formatos";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: "Vistorias" };

type Linha = {
  id: string;
  numero: number;
  tipo: string;
  status: string;
  iniciada_em: string;
  concluida_em: string | null;
  veiculos: { placa: string; modelo: string | null } | null;
  clientes: { nome: string } | null;
};

export default async function Vistorias({ searchParams }: PageProps<"/vistorias">) {
  const { empresa } = await exigirOficina();
  const { busca } = await searchParams;
  const termo = typeof busca === "string" ? busca.trim() : "";
  const supabase = await criarClienteServidor();

  let consulta = supabase
    .from("vistorias")
    .select("id, numero, tipo, status, iniciada_em, concluida_em, veiculos!inner (placa, modelo), clientes (nome)")
    .eq("empresa_id", empresa.id)
    .order("iniciada_em", { ascending: false })
    .limit(60);
  if (termo) {
    const placa = placaParaBanco(termo);
    consulta = /^\d+$/.test(termo) ? consulta.eq("numero", Number(termo)) : consulta.ilike("veiculos.placa", `%${placa}%`);
  }
  const { data } = await consulta;
  const lista = (data ?? []) as unknown as Linha[];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-6">
      <h1 className="text-[1.75rem] font-extrabold">{textos.menu.vistorias}</h1>
      <form className="relative">
        <Search aria-hidden className="absolute top-1/2 left-4 size-6 -translate-y-1/2 text-muted-foreground" />
        <input
          name="busca"
          defaultValue={termo}
          placeholder="Buscar pela placa ou número"
          autoCapitalize="characters"
          aria-label="Buscar pela placa ou número"
          className="min-h-toque-grande w-full rounded-2xl border-2 border-transparent bg-superficie pr-4 pl-12 text-lg outline-none focus:border-oficina"
        />
      </form>

      {lista.length === 0 ? (
        <EstadoVazio
          icone={<ClipboardList aria-hidden />}
          titulo={termo ? "Nada encontrado" : textos.vazio.nenhumaVistoria}
          texto={termo ? "Confira a placa ou o número." : textos.vazio.nenhumaVistoriaAcao}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {lista.map((v) => {
            const rascunho = v.status === "rascunho";
            return (
              <li key={v.id}>
                <Link
                  href={rascunho ? `/vistorias/${v.id}` : `/vistorias/${v.id}/pronto`}
                  className="tocavel flex min-h-toque-grande items-center gap-3 rounded-2xl bg-superficie px-4 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-xl font-extrabold tracking-wider">{v.veiculos ? placaParaMostrar(v.veiculos.placa) : "—"}</span>
                    <span className="block truncate text-base text-muted-foreground">
                      {nomeTipo(v.tipo) === "CHEGADA" ? "Chegada" : "Entrega"} · Nº {v.numero} · {dataHoraBR(v.concluida_em ?? v.iniciada_em)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-sm font-bold",
                      rascunho ? "bg-atencao-clara text-atencao-texto" : v.status === "enviada" ? "bg-acao-clara text-acao" : "bg-background",
                    )}
                  >
                    {rascunho ? "Continuar" : v.status === "enviada" ? "Enviada" : "Concluída"}
                  </span>
                  <ChevronRight aria-hidden className="size-6 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
