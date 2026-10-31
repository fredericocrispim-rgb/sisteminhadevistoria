import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { formatarKm, formatarPlaca, formatarTelefone } from "@/lib/formatos";
import { FOTOS_OBRIGATORIAS, pneusDoVeiculo, tipoVeiculo, type EstadoPneu } from "@/lib/vistoria";
import type { NivelCombustivel } from "@/components/vf";
import { AssistenteVistoria } from "../_passos/assistente";
import type { Avaria, DadosVistoria } from "../_passos/tipos";

export const metadata: Metadata = { title: "Vistoria" };
// Concluir gera o PDF no servidor: dá até 60 s
export const maxDuration = 60;

export default async function PaginaVistoria({ params, searchParams }: PageProps<"/vistorias/[id]">) {
  const { id } = await params;
  const { passo } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { empresa, usuario } = await exigirOficina();
  const supabase = await criarClienteServidor();

  const { data: v } = await supabase
    .from("vistorias")
    .select("*, veiculos (placa, marca, modelo, cor), clientes (nome, whatsapp)")
    .eq("id", id)
    .maybeSingle();
  if (!v) notFound();
  if (v.status === "cancelada") redirect("/vistorias");
  if (v.status !== "rascunho") redirect(`/vistorias/${id}/pronto`);

  const [{ data: fotos }, { data: avarias }, { data: pneus }, { data: itens }, { data: checklist }, entrada] = await Promise.all([
    supabase.from("vistoria_fotos").select("id, categoria, url").eq("vistoria_id", id),
    supabase.from("vistoria_avarias").select("id, numero, vista, x, y, tipo, descricao, nova_na_saida").eq("vistoria_id", id),
    supabase.from("vistoria_pneus").select("posicao, estado").eq("vistoria_id", id),
    supabase.from("vistoria_itens").select("item_nome, tem").eq("vistoria_id", id),
    supabase.from("itens_checklist_empresa").select("nome").eq("empresa_id", empresa.id).eq("ativo", true).order("ordem"),
    v.vistoria_entrada_id
      ? Promise.all([
          supabase.from("vistorias").select("id, concluida_em, iniciada_em, km, combustivel").eq("id", v.vistoria_entrada_id).maybeSingle(),
          supabase.from("vistoria_avarias").select("id, numero, vista, x, y, tipo, descricao, nova_na_saida").eq("vistoria_id", v.vistoria_entrada_id),
        ])
      : Promise.resolve(null),
  ]);

  // Prévias das fotos já tiradas (links temporários, a pasta é privada)
  const caminhos = (fotos ?? []).map((f) => f.url);
  const { data: assinadas } = caminhos.length
    ? await supabase.storage.from("vistorias").createSignedUrls(caminhos, 60 * 60)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const previa = (caminho: string) => assinadas?.find((a) => a.path === caminho)?.signedUrl ?? null;

  const carro = v.veiculos as unknown as { placa: string; marca: string | null; modelo: string | null; cor: string | null } | null;
  const cliente = v.clientes as unknown as { nome: string; whatsapp: string | null } | null;
  const paraAvaria = (a: Record<string, unknown>) => ({ ...a, x: Number(a.x), y: Number(a.y) }) as Avaria;

  const dados: DadosVistoria = {
    id: v.id,
    tipo: v.tipo,
    tipoVeiculo: tipoVeiculo(v.tipo_veiculo),
    empresaId: empresa.id,
    oficinaNome: empresa.nome_fantasia,
    responsavel: (v.tipo === "ENTRADA" ? v.recebido_por : v.liberado_por) ?? usuario.nome ?? usuario.email,
    carro: {
      placa: carro ? formatarPlaca(carro.placa) : "",
      marca: carro?.marca ?? "",
      modelo: carro?.modelo ?? "",
      cor: carro?.cor ?? "",
      km: v.km != null ? formatarKm(String(v.km)) : "",
      combustivel: (v.combustivel as NivelCombustivel | null) ?? null,
      chegouGuincho: v.chegou_guincho,
      placaGuincho: v.placa_guincho ? formatarPlaca(v.placa_guincho) : "",
      prestadorGuincho: v.prestador_guincho ?? "",
      clienteNome: cliente?.nome ?? "",
      clienteWhatsapp: cliente?.whatsapp ? formatarTelefone(cliente.whatsapp) : "",
    },
    entrada: entrada?.[0].data
      ? {
          id: entrada[0].data.id,
          data: entrada[0].data.concluida_em ?? entrada[0].data.iniciada_em,
          km: entrada[0].data.km,
          combustivel: entrada[0].data.combustivel,
        }
      : null,
    fotos: (fotos ?? []).map((f) => ({ id: f.id, categoria: f.categoria, caminho: f.url, previa: previa(f.url) })),
    avarias: (avarias ?? []).map(paraAvaria),
    avariasEntrada: (entrada?.[1].data ?? []).map(paraAvaria),
    pneus: Object.fromEntries((pneus ?? []).map((p) => [p.posicao, p.estado as EstadoPneu])),
    itens: Object.fromEntries((itens ?? []).map((i) => [i.item_nome, i.tem])),
    checklist: (checklist ?? []).map((c) => c.nome),
    observacoes: v.observacoes ?? "",
  };

  // Abre no passo pedido; senão, no primeiro que falta
  let inicial = Number(passo);
  // O passo 7 (assinatura da oficina) precisa da assinatura do cliente, que não fica salva: volta ao 6
  if (inicial === 7) inicial = 6;
  if (!(inicial >= 1 && inicial <= 6)) {
    const faltaFoto = FOTOS_OBRIGATORIAS.some((f) => !dados.fotos.some((x) => x.categoria === f.categoria));
    const faltaPneu = Object.keys(dados.pneus).length < pneusDoVeiculo(dados.tipoVeiculo).length;
    const faltaItem = dados.checklist.some((i) => dados.itens[i] === undefined);
    inicial = !carro ? 1 : faltaFoto ? 2 : faltaPneu ? (dados.avarias.length ? 4 : 3) : faltaItem ? 5 : 6;
  }

  return <AssistenteVistoria inicial={dados} passoInicial={inicial} />;
}
