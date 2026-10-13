import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, LogOut } from "lucide-react";
import { LogoProduto, PagarPix } from "@/components/vf";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { diasAte } from "@/lib/cadastro";
import { formatarReais, gerarPixCopiaECola } from "@/lib/pix";
import { textos } from "@/lib/textos";
import { sair } from "../mais/acoes";

export const metadata: Metadata = { title: "Meu plano" };

const dataBR = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR");

/**
 * Meu plano / tela de pagamento (Pix manual).
 * Quando o teste de 7 dias acaba (ou a mensalidade vence), TODO acesso cai aqui.
 */
export default async function MeuPlano() {
  const { empresa, papel, plano, bloqueado } = await exigirOficina({ permitirBloqueado: true });
  const gestor = papel === "dono" || papel === "gerente";
  if (!gestor && !bloqueado) redirect("/inicio");

  const admin = criarClienteAdmin();
  const [{ data: plat }, { data: assinatura }, { data: planos }] = await Promise.all([
    admin.from("plataforma").select("nome_produto, pix_chave, pix_nome_recebedor, pix_cidade").single(),
    admin.from("assinaturas").select("plano_id").eq("empresa_id", empresa.id).maybeSingle(),
    admin.from("planos").select("id, nome, preco_mensal").eq("ativo", true).order("ordem"),
  ]);
  const p = planos?.find((x) => x.id === assinatura?.plano_id) ?? planos?.[0];
  const valor = Number(p?.preco_mensal ?? 0);
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

  let situacao: { icone: ReactNode; titulo: string; texto?: string; classe: string };
  if (bloqueado) {
    situacao = {
      icone: <AlertTriangle aria-hidden />,
      titulo: plano.status === "teste" ? "Seu teste grátis acabou" : "Mensalidade vencida",
      texto: gestor ? "Pague pelo Pix abaixo para continuar usando." : "Peça ao dono da oficina para pagar a mensalidade.",
      classe: "bg-atencao-clara text-atencao-texto",
    };
  } else if (plano.status === "ativa") {
    situacao = {
      icone: <CheckCircle2 aria-hidden />,
      titulo: "Plano em dia",
      texto: plano.proximoVencimento ? `Próximo pagamento: ${dataBR(plano.proximoVencimento)}` : undefined,
      classe: "bg-acao-clara text-acao",
    };
  } else {
    const dias = plano.fimTeste ? diasAte(plano.fimTeste) : 0;
    situacao = {
      icone: <Clock aria-hidden />,
      titulo: `Teste grátis: ${dias} ${dias === 1 ? "dia" : "dias"}`,
      texto: plano.fimTeste ? `Até ${dataBR(plano.fimTeste)}` : undefined,
      classe: "bg-oficina-clara text-oficina",
    };
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-6">
      {bloqueado ? <LogoProduto comNome /> : <h1 className="text-[1.75rem] font-extrabold">{textos.menu.meuPlano}</h1>}

      <div className={`flex items-center gap-3 rounded-2xl px-4 py-4 [&_svg]:size-8 [&_svg]:shrink-0 ${situacao.classe}`}>
        {situacao.icone}
        <div>
          <p className="text-xl font-extrabold">{situacao.titulo}</p>
          {situacao.texto && <p className="text-base font-semibold">{situacao.texto}</p>}
        </div>
      </div>

      {gestor && (
        <>
          {p && (
            <p className="text-lg">
              {empresa.nome_fantasia} · Plano <strong>{p.nome}</strong>: {formatarReais(valor)} por mês
            </p>
          )}
          {codigo ? (
            <PagarPix codigo={codigo} valor={valor} descricao="Mensalidade" />
          ) : (
            <p className="rounded-2xl bg-superficie px-4 py-4 text-lg">Pagamento ainda não disponível. Fale com o suporte.</p>
          )}
        </>
      )}

      {bloqueado && (
        <form action={sair} className="mt-2">
          <button
            type="submit"
            className="tocavel flex min-h-toque w-full items-center justify-center gap-2 rounded-2xl px-4 text-lg font-bold text-muted-foreground [&_svg]:size-6"
          >
            <LogOut aria-hidden /> {textos.entrar.sair}
          </button>
        </form>
      )}
    </main>
  );
}
