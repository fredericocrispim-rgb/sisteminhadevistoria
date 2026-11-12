import type { Metadata } from "next";
import Link from "next/link";
import { Check, ChevronRight, ClipboardList, LogIn, LogOut, PencilLine, Search, Send } from "lucide-react";
import { EstadoVazio, IconeChip } from "@/components/vf";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { dataHoraBR, nomeTipo, placaParaMostrar } from "@/lib/vistoria";
import { placaParaBanco } from "@/lib/formatos";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";
import { BotoesRascunho } from "./botoes-rascunho";

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
  const { empresa, papel, usuario } = await exigirOficina();
  const { busca } = await searchParams;
  const termo = typeof busca === "string" ? busca.trim() : "";
  const supabase = await criarClienteServidor();

  let consulta = supabase
    .from("vistorias")
    .select("id, numero, tipo, status, iniciada_em, concluida_em, veiculos!inner (placa, modelo), clientes (nome)")
    .eq("empresa_id", empresa.id)
    .neq("status", "cancelada") // canceladas ficam guardadas, mas não aparecem
    .order("iniciada_em", { ascending: false })
    .limit(60);
  // Vistoriador vê só as vistorias que ele fez (dono e gerente veem todas)
  if (papel === "vistoriador") consulta = consulta.eq("criado_por", usuario.id);
  if (termo) {
    const placa = placaParaBanco(termo);
    consulta = /^\d+$/.test(termo) ? consulta.eq("numero", Number(termo)) : consulta.ilike("veiculos.placa", `%${placa}%`);
  }
  const { data } = await consulta;
  const lista = (data ?? []) as unknown as Linha[];

  return (
    <main className="entrar-tela mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-6">
      <h1 className="text-[1.75rem] font-extrabold">{textos.menu.vistorias}</h1>
      <form className="relative">
        <Search aria-hidden className="absolute top-1/2 left-4 size-6 -translate-y-1/2 text-muted-foreground" />
        <input
          name="busca"
          defaultValue={termo}
          placeholder="Buscar pela placa ou número"
          autoCapitalize="characters"
          aria-label="Buscar pela placa ou número"
          className="cartao min-h-toque-grande w-full rounded-2xl border-2 border-transparent pr-4 pl-12 text-lg outline-none transition-[border-color,box-shadow] duration-150 focus:border-oficina focus:shadow-[0_0_0_4px_rgb(37_99_235/0.15)]"
        />
      </form>

      {lista.length === 0 ? (
        <EstadoVazio
          icone={<ClipboardList aria-hidden />}
          titulo={termo ? "Nada encontrado" : textos.vazio.nenhumaVistoria}
          texto={termo ? "Confira a placa ou o número." : textos.vazio.nenhumaVistoriaAcao}
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {lista.map((v) => {
            const rascunho = v.status === "rascunho";
            const chegada = nomeTipo(v.tipo) === "CHEGADA";
            const placaETipo = (
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-xl font-extrabold tracking-wider">{v.veiculos ? placaParaMostrar(v.veiculos.placa) : "—"}</span>
                <span className="block truncate text-base text-muted-foreground">
                  {chegada ? "Chegada" : "Entrega"} · Nº {v.numero} · {dataHoraBR(v.concluida_em ?? v.iniciada_em)}
                </span>
              </span>
            );
            // Não concluída: continuar ou cancelar (abandonada polui a lista)
            if (rascunho) {
              return (
                <li key={v.id} className="flex flex-col gap-2 rounded-2xl bg-atencao-clara p-3 ring-1 ring-atencao/30">
                  <Link href={`/vistorias/${v.id}`} className="flex items-center gap-3">
                    <IconeChip tom="atencao" className="bg-atencao">
                      <PencilLine />
                    </IconeChip>
                    {placaETipo}
                  </Link>
                  <BotoesRascunho id={v.id} />
                </li>
              );
            }
            return (
              <li key={v.id}>
                <Link
                  href={`/vistorias/${v.id}/pronto`}
                  className="tocavel cartao flex min-h-toque-grande items-center gap-3 rounded-2xl px-3 py-3"
                >
                  <IconeChip tom={chegada ? "oficina" : "acao"}>{chegada ? <LogIn /> : <LogOut />}</IconeChip>
                  {placaETipo}
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold",
                      v.status === "enviada" ? "bg-acao-clara text-acao" : "bg-superficie text-foreground",
                    )}
                  >
                    {v.status === "enviada" ? <Send aria-hidden className="size-3.5" /> : <Check aria-hidden className="size-3.5" strokeWidth={3} />}
                    {v.status === "enviada" ? "Enviada" : "Concluída"}
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
