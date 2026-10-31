import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ChevronDown, ExternalLink } from "lucide-react";
import { PagarPix } from "@/components/vf";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { qrCodePix } from "@/lib/pagamentos/asaas";
import { formatarReais } from "@/lib/pix";
import { textos } from "@/lib/textos";
import { EsperarPagamento } from "./esperar";

export const metadata: Metadata = { title: "Pagamento" };

const dataBR = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR");

/**
 * Esperando o pagamento de uma cobrança do Asaas. A página do Asaas (Pix ou cartão) abre numa aba nova;
 * esta tela confere sozinha (webhook + consulta à API) e abre o sistema quando o pagamento cai.
 * Pix: o QR Code também fica aqui, para quem preferir.
 */
export default async function Pagamento({ params }: PageProps<"/pagamento/[id]">) {
  const { id } = await params;
  const { empresa, papel } = await exigirOficina({ permitirBloqueado: true });
  if (papel !== "dono") redirect("/plano");
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const { data: f } = await criarClienteAdmin()
    .from("faturas")
    .select("id, valor, vencimento, status, forma, id_externo, link_fatura")
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();
  if (!f?.id_externo) notFound();
  if (f.status === "paga" || f.status === "cancelada" || f.status === "estornada") redirect("/plano");

  const t = textos.assinatura;
  const pix = f.forma === "pix";
  let codigo: string | null = null;
  if (pix) {
    try {
      codigo = (await qrCodePix(f.id_externo)).payload;
    } catch (erro) {
      console.error("Asaas: falha ao pegar o QR Code", erro);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pt-6">
      <div>
        <h1 className="text-[1.75rem] font-extrabold">{t.pagar}</h1>
        <p className="text-lg text-muted-foreground">
          {formatarReais(Number(f.valor))} · {pix ? "Pix" : "Cartão"} · vence {dataBR(f.vencimento)}
        </p>
      </div>

      <EsperarPagamento faturaId={f.id} />

      {f.link_fatura && (
        <a
          href={f.link_fatura}
          target="_blank"
          rel="noopener"
          className="tocavel inline-flex min-h-toque-grande w-full items-center justify-center gap-3 rounded-2xl bg-acao px-5 text-xl font-bold text-acao-texto select-none hover:bg-acao-escura [&_svg]:size-7 [&_svg]:shrink-0"
        >
          <ExternalLink aria-hidden /> <span>{t.abrirPagina}</span>
        </a>
      )}

      {codigo && (
        <details className="group rounded-3xl bg-superficie">
          <summary className="tocavel flex min-h-toque cursor-pointer list-none items-center justify-between gap-2 px-5 text-lg font-bold [&::-webkit-details-marker]:hidden">
            {t.verQrAqui}
            <ChevronDown aria-hidden className="size-6 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4">
            <PagarPix codigo={codigo} valor={Number(f.valor)} descricao="Mensalidade" />
          </div>
        </details>
      )}
    </main>
  );
}
