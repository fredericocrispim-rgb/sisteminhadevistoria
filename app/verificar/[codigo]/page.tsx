import type { Metadata } from "next";
import { BadgeCheck, XCircle } from "lucide-react";
import { BotaoSecundario, EstadoVazio, LogoProduto } from "@/components/vf";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { dataHoraBR, nomeTipo, placaParaMostrar } from "@/lib/vistoria";
import { CompararPdf } from "./comparar-pdf";

export const metadata: Metadata = { title: "Verificar vistoria", robots: { index: false } };

/** Confirma se um termo é autêntico (pelo código impresso/QR Code do PDF). */
export default async function Resultado({ params }: PageProps<"/verificar/[codigo]">) {
  const { codigo } = await params;
  const valido = /^SV-[A-Z0-9]{4}-[A-Z0-9]{4}$|^VF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(codigo);
  const { data: v } = valido
    ? await criarClienteAdmin()
        .from("vistorias")
        .select("tipo, numero, status, concluida_em, pdf_hash_sha256, empresas (nome_fantasia, cidade, uf), veiculos (placa)")
        .eq("codigo_autenticidade", codigo)
        .maybeSingle()
    : { data: null };

  if (!v || v.status === "rascunho" || v.status === "cancelada") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4">
        <EstadoVazio icone={<XCircle aria-hidden />} titulo="Código não encontrado" texto="Este código não corresponde a nenhuma vistoria. Confira as letras e números." />
        <BotaoSecundario href="/verificar">Tentar outro código</BotaoSecundario>
      </main>
    );
  }

  const e = v.empresas as unknown as { nome_fantasia: string; cidade: string | null; uf: string | null };
  const carro = v.veiculos as unknown as { placa: string };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pt-10 pb-10">
      <LogoProduto comNome />
      <div className="flex flex-col items-center gap-2 rounded-3xl bg-acao-clara p-6 text-center text-acao">
        <BadgeCheck aria-hidden className="size-16" />
        <p className="text-2xl font-extrabold">Vistoria autêntica</p>
        <p className="text-base font-semibold text-foreground">Este código existe e foi registrado pelo sistema.</p>
      </div>
      <dl className="grid grid-cols-1 gap-3 rounded-2xl bg-superficie p-4 text-lg">
        <div>
          <dt className="text-base text-muted-foreground">Oficina</dt>
          <dd className="font-bold">
            {e.nome_fantasia}
            {e.cidade ? ` – ${e.cidade}/${e.uf ?? ""}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-base text-muted-foreground">Veículo</dt>
          <dd className="font-mono font-bold">{placaParaMostrar(carro.placa)}</dd>
        </div>
        <div>
          <dt className="text-base text-muted-foreground">Vistoria</dt>
          <dd className="font-bold">
            {nomeTipo(v.tipo)} nº {v.numero} · {v.concluida_em ? dataHoraBR(v.concluida_em) : ""}
          </dd>
        </div>
        <div>
          <dt className="text-base text-muted-foreground">Código</dt>
          <dd className="font-bold">{codigo}</dd>
        </div>
      </dl>
      {v.pdf_hash_sha256 && <CompararPdf hashEsperado={v.pdf_hash_sha256} />}
    </main>
  );
}
