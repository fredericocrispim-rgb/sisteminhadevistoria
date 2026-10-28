import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { placaParaMostrar, dataHoraBR } from "@/lib/vistoria";
import { telefoneParaWhatsapp } from "@/lib/formatos";
import { AcoesPronto } from "./acoes-pronto";

export const metadata: Metadata = { title: "Vistoria concluída" };

export default async function Pronto({ params }: PageProps<"/vistorias/[id]/pronto">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { empresa } = await exigirOficina();
  const supabase = await criarClienteServidor();
  const { data: v } = await supabase
    .from("vistorias")
    .select("id, tipo, numero, status, codigo_autenticidade, token_publico, pdf_url, concluida_em, veiculos (placa, modelo), clientes (nome, whatsapp)")
    .eq("id", id)
    .maybeSingle();
  if (!v) notFound();
  if (v.status === "rascunho") redirect(`/vistorias/${id}`);
  if (v.status === "cancelada") redirect("/vistorias");

  const carro = v.veiculos as unknown as { placa: string; modelo: string | null };
  const cliente = v.clientes as unknown as { nome: string; whatsapp: string | null } | null;
  const h = await headers();
  const base = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const link = `${base}/v/${v.token_publico}`;
  const chegada = v.tipo === "ENTRADA";
  const primeiroNome = cliente?.nome.split(" ")[0] ?? "";
  const mensagem =
    `Olá${primeiroNome ? `, ${primeiroNome}` : ""}! Aqui é da ${empresa.nome_fantasia}. ` +
    `Segue a vistoria de ${chegada ? "chegada" : "entrega"} do seu veículo ${placaParaMostrar(carro.placa)}, com fotos e o termo assinado: ${link}`;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-4 px-4 pt-10 text-center">
      <CheckCircle2 aria-hidden className="size-24 text-acao" />
      <h1 className="text-[2rem] leading-tight font-extrabold">Vistoria concluída</h1>
      <p className="font-mono text-3xl font-extrabold tracking-wider">{placaParaMostrar(carro.placa)}</p>
      <p className="text-lg text-muted-foreground">
        Nº {v.numero} · {v.concluida_em ? dataHoraBR(v.concluida_em) : ""}
        <br />
        Código {v.codigo_autenticidade}
      </p>
      <AcoesPronto
        vistoriaId={v.id}
        whatsappCliente={cliente?.whatsapp ? telefoneParaWhatsapp(cliente.whatsapp) : null}
        mensagem={mensagem}
        linkPdf={v.pdf_url ? `/v/${v.token_publico}/pdf` : null}
        linkPublico={`/v/${v.token_publico}`}
        enviada={v.status === "enviada"}
      />
    </main>
  );
}
