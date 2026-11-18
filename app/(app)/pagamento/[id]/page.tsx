import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard, ExternalLink } from "lucide-react";
import { PagarPix } from "@/components/vf";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { linhaDigitavel, obterCobranca, qrCodePix } from "@/lib/pagamentos/asaas";
import { formatarReais } from "@/lib/pix";
import { textos } from "@/lib/textos";
import { EsperarPagamento } from "./esperar";
import { LinhaBoleto } from "./linha-boleto";

export const metadata: Metadata = { title: "Pagamento" };

const dataBR = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR");

const BOTAO_LINK =
  "tocavel inline-flex min-h-toque-grande w-full items-center justify-center gap-3 rounded-2xl bg-acao px-5 text-xl font-bold text-acao-texto select-none hover:bg-acao-escura [&_svg]:size-7 [&_svg]:shrink-0";

/**
 * Cobrança do Asaas esperando pagamento. Esta tela confere sozinha (webhook + consulta à API)
 * e abre o sistema quando o pagamento cai.
 * - Pix: QR Code e copia e cola já aparecem aqui.
 * - Boleto: link do boleto e linha digitável para copiar.
 * - Cartão: link da página do Asaas (cobrança antiga ou recusada).
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
  const boleto = f.forma === "boleto";
  const cartao = !pix && !boleto;
  let codigo: string | null = null;
  let linha: string | null = null;
  let linkBoleto: string | null = null;
  if (pix) {
    try {
      codigo = (await qrCodePix(f.id_externo)).payload;
    } catch (erro) {
      console.error("Asaas: falha ao pegar o QR Code", erro instanceof Error ? erro.message : erro);
    }
  }
  if (boleto) {
    const [l, c] = await Promise.allSettled([linhaDigitavel(f.id_externo), obterCobranca(f.id_externo)]);
    if (l.status === "fulfilled") linha = l.value.identificationField;
    else console.error("Asaas: falha ao pegar a linha digitável", l.reason instanceof Error ? l.reason.message : l.reason);
    if (c.status === "fulfilled") linkBoleto = c.value.bankSlipUrl ?? null;
  }
  const enderecoBoleto = linkBoleto || f.link_fatura;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pt-6">
      <div>
        <h1 className="text-[1.75rem] font-extrabold">{t.pagar}</h1>
        <p className="text-lg text-muted-foreground">
          {formatarReais(Number(f.valor))} · {pix ? t.pix : boleto ? t.boleto : t.cartao} · vence {dataBR(f.vencimento)}
        </p>
      </div>

      <EsperarPagamento faturaId={f.id} texto={pix ? t.esperandoPix : boleto ? t.esperandoBoleto : undefined} />

      {codigo && <PagarPix codigo={codigo} valor={Number(f.valor)} descricao="Mensalidade" />}

      {boleto && enderecoBoleto && (
        <a href={enderecoBoleto} target="_blank" rel="noopener" className={BOTAO_LINK}>
          <ExternalLink aria-hidden /> <span>{t.abrirBoleto}</span>
        </a>
      )}
      {linha && <LinhaBoleto linha={linha} />}

      {/* Cartão (recusado ou trocado): digitar o cartão aqui mesmo e pagar */}
      {cartao && (
        <Link href="/plano/forma?cartao=1" className={BOTAO_LINK}>
          <CreditCard aria-hidden /> <span>{t.pagarComOutroCartao}</span>
        </Link>
      )}

      {/* Pix sem QR Code (falha ao buscar): a página do Asaas resolve */}
      {pix && !codigo && f.link_fatura && (
        <a href={f.link_fatura} target="_blank" rel="noopener" className={BOTAO_LINK}>
          <ExternalLink aria-hidden /> <span>{t.abrirPagina}</span>
        </a>
      )}
    </main>
  );
}
