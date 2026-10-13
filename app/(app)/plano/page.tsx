import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { PagarPix } from "@/components/vf";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { diasAte } from "@/lib/cadastro";
import { formatarReais, gerarPixCopiaECola } from "@/lib/pix";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: "Meu plano" };

const dataBR = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR");

/**
 * Meu plano (fase de validação): mostra a situação e o Pix para pagar a mensalidade.
 * O pagamento é conferido à mão pelo administrador, que libera no /admin.
 */
export default async function MeuPlano() {
  const { empresa, papel } = await exigirOficina();
  if (papel === "vistoriador") redirect("/inicio");

  const supabase = await criarClienteServidor();
  const [{ data: plat }, { data: assinatura }, { data: planos }] = await Promise.all([
    supabase.from("plataforma").select("nome_produto, pix_chave, pix_nome_recebedor, pix_cidade").single(),
    supabase.from("assinaturas").select("status, fim_teste, proximo_vencimento, plano_id").eq("empresa_id", empresa.id).maybeSingle(),
    supabase.from("planos").select("id, nome, preco_mensal").eq("ativo", true).order("ordem"),
  ]);
  const plano = planos?.find((p) => p.id === assinatura?.plano_id) ?? planos?.[0];
  const valor = Number(plano?.preco_mensal ?? 0);

  const codigo =
    plat?.pix_chave && plat.pix_nome_recebedor && plat.pix_cidade && valor > 0
      ? gerarPixCopiaECola({
          chave: plat.pix_chave,
          nome: plat.pix_nome_recebedor,
          cidade: plat.pix_cidade,
          valor,
          descricao: plat.nome_produto ?? textos.produto.nome,
        })
      : null;

  const status = assinatura?.status ?? "teste";
  let situacao: { icone: React.ReactNode; titulo: string; texto?: string; classe: string };
  if (status === "ativa") {
    situacao = {
      icone: <CheckCircle2 aria-hidden />,
      titulo: "Plano em dia",
      texto: assinatura?.proximo_vencimento ? `Próximo pagamento: ${dataBR(assinatura.proximo_vencimento)}` : undefined,
      classe: "bg-acao-clara text-acao",
    };
  } else if (status === "teste") {
    const dias = assinatura?.fim_teste ? diasAte(assinatura.fim_teste) : 0;
    situacao = {
      icone: <Clock aria-hidden />,
      titulo: dias > 0 ? `Teste grátis: ${dias} ${dias === 1 ? "dia" : "dias"}` : "Teste grátis acabou",
      texto: assinatura?.fim_teste ? `Até ${dataBR(assinatura.fim_teste)}` : undefined,
      classe: dias > 0 ? "bg-oficina-clara text-oficina" : "bg-atencao-clara text-atencao-texto",
    };
  } else {
    situacao = {
      icone: <AlertTriangle aria-hidden />,
      titulo: "Pagamento pendente",
      texto: "Pague pelo Pix abaixo para continuar usando.",
      classe: "bg-atencao-clara text-atencao-texto",
    };
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-6">
      <h1 className="text-[1.75rem] font-extrabold">{textos.menu.meuPlano}</h1>

      <div className={`flex items-center gap-3 rounded-2xl px-4 py-4 [&_svg]:size-8 [&_svg]:shrink-0 ${situacao.classe}`}>
        {situacao.icone}
        <div>
          <p className="text-xl font-extrabold">{situacao.titulo}</p>
          {situacao.texto && <p className="text-base font-semibold">{situacao.texto}</p>}
        </div>
      </div>

      {plano && (
        <p className="text-lg">
          Plano <strong>{plano.nome}</strong>: {formatarReais(valor)} por mês
        </p>
      )}

      {codigo ? (
        <PagarPix codigo={codigo} valor={valor} descricao="Mensalidade" />
      ) : (
        <p className="rounded-2xl bg-superficie px-4 py-4 text-lg">Pagamento ainda não disponível. Fale com o suporte.</p>
      )}
    </main>
  );
}
