import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Lock, LogOut } from "lucide-react";
import { LogoProduto, PagarPix } from "@/components/vf";
import { exigirOficina } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { formatarReais, gerarPixCopiaECola } from "@/lib/pix";
import { mensalidadeDaOficina } from "@/lib/mensalidade";
import { textos } from "@/lib/textos";
import { sair } from "../mais/acoes";
import { continuarSemPagar } from "./acoes";

export const metadata: Metadata = { title: "Meu plano" };

const dataBR = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR");
const dias = (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`;

/**
 * Meu plano / tela do Pix (régua de cobrança):
 * - cadastro novo: 1 dia para pagar; passou o dia, bloqueia (sem carência);
 * - faltando 3 dias ou menos: aparece ao entrar, com "Continuar para o sistema";
 * - vencido até 5 dias: "Mensalidade em atraso", ainda pode continuar;
 * - mais de 5 dias: bloqueado, só esta tela.
 */
export default async function MeuPlano({ searchParams }: PageProps<"/plano">) {
  const { empresa, papel, plano, bloqueado } = await exigirOficina({ permitirBloqueado: true });
  const { aviso } = await searchParams;
  // Plano e Pix: só o dono (gerente e vistoriador não veem; se estiver bloqueado, pedem ao dono)
  const gestor = papel === "dono";
  if (!gestor && !bloqueado) redirect("/inicio");

  const admin = criarClienteAdmin();
  const [{ data: plat }, m] = await Promise.all([
    admin.from("plataforma").select("nome_produto, pix_chave, pix_nome_recebedor, pix_cidade").single(),
    mensalidadeDaOficina(empresa.id),
  ]);
  // O valor (e o QR Code) acompanha o tamanho da equipe: usuário a mais soma na mensalidade
  const valor = m.valor;
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

  const teste = plano.status === "teste";
  const venc = plano.vencimento ? dataBR(plano.vencimento) : "";
  const faltamParaBloquear = Math.max(0, plano.carencia - plano.diasAtraso + 1);

  let situacao: { icone: ReactNode; titulo: string; texto?: string; classe: string };
  switch (plano.fase) {
    case "bloqueado":
      situacao = {
        icone: <Lock aria-hidden />,
        titulo: "Acesso bloqueado",
        texto: gestor
          ? `${teste ? "O prazo para pagar" : "A mensalidade"} venceu em ${venc}. Pague pelo Pix para liberar.`
          : "Peça ao dono da oficina para pagar a mensalidade.",
        classe: "bg-perigo-clara text-perigo",
      };
      break;
    case "atrasado":
      situacao = {
        icone: <AlertTriangle aria-hidden />,
        titulo: "Mensalidade em atraso",
        texto: `Venceu em ${venc}. O acesso será bloqueado em ${dias(faltamParaBloquear)}.`,
        classe: "bg-atencao-clara text-atencao-texto",
      };
      break;
    case "vence_logo":
      situacao = {
        icone: <Clock aria-hidden />,
        titulo:
          plano.diasParaVencer === 0
            ? teste
              ? "Hoje é o último dia para pagar"
              : "Sua mensalidade vence hoje"
            : teste
              ? plano.diasParaVencer === 1
                ? "Pague pelo Pix até amanhã"
                : `Pague pelo Pix em até ${dias(plano.diasParaVencer)}`
              : `Sua mensalidade vence em ${dias(plano.diasParaVencer)}`,
        texto: teste ? `Prazo: ${venc}. Sem pagamento, o acesso é bloqueado.` : `Vencimento: ${venc}. Pague pelo Pix para não ser bloqueado.`,
        classe: "bg-oficina-clara text-oficina",
      };
      break;
    default:
      situacao = teste
        ? {
            icone: <Clock aria-hidden />,
            titulo: "Pague pelo Pix",
            texto: `Prazo: ${venc}`,
            classe: "bg-oficina-clara text-oficina",
          }
        : {
            icone: <CheckCircle2 aria-hidden />,
            titulo: "Plano em dia",
            texto: venc ? `Próximo pagamento: ${venc}` : undefined,
            classe: "bg-acao-clara text-acao",
          };
  }

  const mostrarContinuar = !bloqueado && aviso === "1";

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-6">
      {bloqueado || mostrarContinuar ? <LogoProduto comNome /> : <h1 className="text-[1.75rem] font-extrabold">{textos.menu.meuPlano}</h1>}

      <div className={`flex items-center gap-3 rounded-2xl px-4 py-4 [&_svg]:size-8 [&_svg]:shrink-0 ${situacao.classe}`}>
        {situacao.icone}
        <div>
          <p className="text-xl font-extrabold">{situacao.titulo}</p>
          {situacao.texto && <p className="text-base font-semibold">{situacao.texto}</p>}
        </div>
      </div>

      {gestor && (
        <>
          {m.planoNome && (
            <div className="rounded-2xl bg-superficie px-4 py-3 text-lg">
              <p>
                {empresa.nome_fantasia} · Plano <strong>{m.planoNome}</strong>
              </p>
              {m.preco.inclusos != null && (
                <p className="text-base text-muted-foreground">
                  Inclui o dono + {m.preco.inclusos - 1} {m.preco.inclusos - 1 === 1 ? "pessoa" : "pessoas"}
                  {m.preco.extra > 0 && `. Cada pessoa a mais: + ${formatarReais(m.preco.extra)}`}
                </p>
              )}
              <p className="text-base text-muted-foreground">
                Sua equipe: {m.usuarios} {m.usuarios === 1 ? "pessoa" : "pessoas"}, contando você
                {m.aMais > 0 && ` (${m.aMais} a mais × ${formatarReais(m.preco.extra)})`}
                {m.cortesias > 0 && ` + ${m.cortesias} cortesia sem custo`}
              </p>
            </div>
          )}
          {codigo ? (
            <PagarPix codigo={codigo} valor={valor} descricao="Mensalidade" />
          ) : (
            <p className="rounded-2xl bg-superficie px-4 py-4 text-lg">Pagamento ainda não disponível. Fale com o suporte.</p>
          )}
        </>
      )}

      {mostrarContinuar && (
        <form action={continuarSemPagar}>
          <button
            type="submit"
            className="tocavel flex min-h-toque-grande w-full items-center justify-center gap-2 rounded-2xl bg-superficie px-4 text-xl font-bold [&_svg]:size-6"
          >
            Continuar para o sistema <ArrowRight aria-hidden />
          </button>
        </form>
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
