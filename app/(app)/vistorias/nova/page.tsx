import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Keyboard } from "lucide-react";
import { BotaoSecundario, EstadoVazio } from "@/components/vf";
import { ListaPatio } from "@/components/vf/lista-patio";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { listarPatio } from "@/lib/patio";
import { formatarPlaca, formatarTelefone } from "@/lib/formatos";
import { tipoVeiculo, type TipoVeiculo } from "@/lib/vistoria";
import type { NivelCombustivel } from "@/components/vf";
import { NovaVistoria } from "./nova-vistoria";
import { CARRO_VAZIO, type DadosCarro, type InfoEntrada } from "../_passos/tipos";

export const metadata: Metadata = { title: "Nova vistoria" };

export default async function PaginaNova({ searchParams }: PageProps<"/vistorias/nova">) {
  await exigirOficina();
  const q = await searchParams;
  const tipo = q.tipo === "SAIDA" ? "SAIDA" : "ENTRADA";
  const entradaId = typeof q.entrada === "string" && /^[0-9a-f-]{36}$/.test(q.entrada) ? q.entrada : null;

  // ENTREGA sem carro escolhido: mostra os carros do pátio
  if (tipo === "SAIDA" && !entradaId && q.manual !== "1") {
    const carros = await listarPatio();
    return (
      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-4 pb-10">
        <Link href="/inicio" className="tocavel inline-flex min-h-toque items-center gap-1.5 self-start rounded-2xl px-2 text-lg font-bold">
          <ArrowLeft aria-hidden className="size-7" /> Voltar
        </Link>
        <h1 className="text-[1.75rem] leading-tight font-extrabold">Qual carro vai sair?</h1>
        {carros.length ? (
          <ListaPatio carros={carros} />
        ) : (
          <EstadoVazio titulo="Nenhum carro no pátio" texto="Os carros aparecem aqui depois da vistoria de CHEGADA." />
        )}
        <BotaoSecundario href="/vistorias/nova?tipo=SAIDA&manual=1" icone={<Keyboard aria-hidden />}>
          O carro não está na lista
        </BotaoSecundario>
      </main>
    );
  }

  // ENTREGA ligada à chegada: já vem preenchida
  let inicial: DadosCarro = CARRO_VAZIO;
  let entrada: InfoEntrada = null;
  let veiculoInicial: TipoVeiculo | null = null;
  if (entradaId) {
    const supabase = await criarClienteServidor();
    const { data: e } = await supabase
      .from("vistorias")
      .select("id, concluida_em, iniciada_em, km, combustivel, tipo_veiculo, veiculos (placa, marca, modelo, cor), clientes (nome, whatsapp)")
      .eq("id", entradaId)
      .maybeSingle();
    if (e) {
      const carro = e.veiculos as unknown as { placa: string; marca: string | null; modelo: string | null; cor: string | null };
      const cliente = e.clientes as unknown as { nome: string; whatsapp: string | null } | null;
      inicial = {
        ...CARRO_VAZIO,
        placa: formatarPlaca(carro.placa),
        marca: carro.marca ?? "",
        modelo: carro.modelo ?? "",
        cor: carro.cor ?? "",
        combustivel: null as NivelCombustivel | null,
        clienteNome: cliente?.nome ?? "",
        clienteWhatsapp: cliente?.whatsapp ? formatarTelefone(cliente.whatsapp) : "",
      };
      veiculoInicial = tipoVeiculo(e.tipo_veiculo);
      entrada = { id: e.id, data: e.concluida_em ?? e.iniciada_em, km: e.km, combustivel: e.combustivel };
    }
  }

  return <NovaVistoria tipo={tipo} inicial={inicial} entrada={entrada} veiculoInicial={veiculoInicial} />;
}
