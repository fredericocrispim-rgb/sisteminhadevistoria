import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { hojeBR } from "@/lib/cadastro";
import { asaasLigado } from "@/lib/pagamentos/asaas";
import { PROVEDOR_ASAAS } from "@/lib/pagamentos/config";
import { TrocarForma } from "./trocar-forma";

export const metadata: Metadata = { title: "Forma de pagamento" };

/**
 * Trocar a forma de pagamento (Pix, cartão ou boleto) ou o cartão. Só o dono, com assinatura no Asaas.
 * ?cartao=1 abre direto nos dados do cartão (botão "Trocar o cartão" e cartão recusado).
 */
export default async function PaginaForma({ searchParams }: PageProps<"/plano/forma">) {
  const { empresa, papel, plano } = await exigirOficina({
    permitirBloqueado: true,
  });
  const temAssinatura =
    asaasLigado(empresa.id) && plano.provedor === PROVEDOR_ASAAS && Boolean(plano.idAssinaturaExterna) && plano.status !== "cancelada";
  if (papel !== "dono" || !temAssinatura) redirect("/plano");
  const { cartao } = await searchParams;

  // Mensalidade para pagar já (vence hoje ou venceu): o cartão novo paga ela na hora
  const { data: devidas } = await criarClienteAdmin()
    .from("faturas")
    .select("valor")
    .eq("empresa_id", empresa.id)
    .in("status", ["pendente", "vencida"])
    .not("id_externo", "is", null)
    .lte("vencimento", hojeBR())
    .order("vencimento")
    .limit(1);

  return (
    <TrocarForma
      atual={plano.formaPagamento}
      cartaoFinal={plano.cartaoFinal}
      valorDevido={devidas?.[0] ? Number(devidas[0].valor) : null}
      abrirNoCartao={cartao === "1"}
    />
  );
}
