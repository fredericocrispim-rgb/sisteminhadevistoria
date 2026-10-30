import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { BotaoPrincipal, PagarPix } from "@/components/vf";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { qrCodePix } from "@/lib/pagamentos/asaas";
import { textos } from "@/lib/textos";
import { EsperarPagamento } from "./esperar";

export const metadata: Metadata = { title: "Pagamento" };

const dataBR = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR");

/**
 * Pagamento de uma cobrança do Asaas. Pix: QR Code e "Copiar código" aqui mesmo.
 * Cartão: leva para a fatura do Asaas. A tela confere sozinha a cada 3 s (webhook) e tem "Já paguei".
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

  let codigo: string | null = null;
  if (f.forma === "pix") {
    try {
      codigo = (await qrCodePix(f.id_externo)).payload;
    } catch (erro) {
      console.error("Asaas: falha ao pegar o QR Code", erro);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-6">
      <div>
        <h1 className="text-[1.75rem] font-extrabold">{textos.assinatura.pagar}</h1>
        <p className="text-lg text-muted-foreground">Vencimento: {dataBR(f.vencimento)}</p>
      </div>
      {codigo ? (
        <PagarPix codigo={codigo} valor={Number(f.valor)} descricao="Mensalidade" />
      ) : (
        f.link_fatura && (
          <BotaoPrincipal href={f.link_fatura} nativo icone={<ExternalLink aria-hidden />}>
            {f.forma === "cartao" ? "Pagar com cartão" : "Abrir a cobrança"}
          </BotaoPrincipal>
        )
      )}
      <EsperarPagamento faturaId={f.id} />
    </main>
  );
}
