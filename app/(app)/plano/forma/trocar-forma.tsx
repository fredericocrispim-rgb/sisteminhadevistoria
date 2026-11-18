"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Barcode, Check, CheckCircle2, ChevronRight, CreditCard, QrCode } from "lucide-react";
import { BarraEtapas, BotaoPrincipal, MensagemErroCampo } from "@/components/vf";
import { formatarReais } from "@/lib/pix";
import { cn } from "@/lib/utils";
import { textos } from "@/lib/textos";
import type { FormaPagamento } from "@/lib/pagamentos/config";
import { trocarCartao, trocarForma } from "../../assinar/acoes";
import { CAMPOS_CARTAO, CARTAO_VAZIO, CamposCartao, type DadosCartao } from "../../assinar/campos-cartao";

/**
 * Trocar a forma de pagamento: (1) Pix, cartão ou boleto e, no cartão, (2) os dados do cartão.
 * Pix ou boleto com mensalidade em aberto: vai para a tela dela (QR Code ou boleto).
 * Cartão com mensalidade vencida ou vencendo hoje: o cartão novo já paga.
 */
export function TrocarForma({
  atual,
  cartaoFinal,
  valorDevido,
  abrirNoCartao,
}: {
  atual: FormaPagamento | null;
  cartaoFinal: string | null;
  valorDevido: number | null;
  abrirNoCartao: boolean;
}) {
  const t = textos.assinatura;
  const router = useRouter();
  const [tela, setTela] = useState(abrirNoCartao ? 2 : 1);
  const [escolhida, setEscolhida] = useState<FormaPagamento | null>(abrirNoCartao ? "CREDIT_CARD" : null);
  const [cartao, setCartao] = useState<DadosCartao>(CARTAO_VAZIO);
  const [erro, setErro] = useState<{ campo?: string; texto: string } | null>(null);
  const [feito, setFeito] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  function voltar() {
    if (tela === 2 && !abrirNoCartao) return setTela(1);
    router.back();
  }

  function escolher(f: FormaPagamento) {
    setErro(null);
    setEscolhida(f);
    if (f === "CREDIT_CARD") {
      setTela(2);
      window.scrollTo(0, 0);
      return;
    }
    if (f === atual) return router.push("/plano");
    iniciar(async () => {
      const r = await trocarForma(f);
      if (!r.ok) return setErro({ texto: r.erro });
      router.push(r.faturaId ? `/pagamento/${r.faturaId}` : "/plano");
      router.refresh();
    });
  }

  function salvarCartao() {
    setErro(null);
    iniciar(async () => {
      const r = await trocarCartao(cartao);
      if (!r.ok) {
        if (r.campo === "cartao") setCartao((c) => ({ ...c, cvv: "" }));
        return setErro({ campo: r.campo, texto: r.erro });
      }
      setFeito(r.pago ? t.confirmadoTexto : t.cartaoSalvo);
      setTimeout(() => {
        router.replace(r.pago ? "/inicio" : "/plano");
        router.refresh();
      }, 2500);
    });
  }

  const erroDe = (campo: string) => (erro?.campo === campo ? erro.texto : undefined);
  const erroGeral = erro && !CAMPOS_CARTAO.includes(erro.campo ?? "") ? erro.texto : null;

  if (feito) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pt-6">
        <div
          role="status"
          className="flex items-center gap-4 rounded-3xl bg-acao-clara px-5 py-5 text-acao [&_svg]:size-10 [&_svg]:shrink-0"
        >
          <CheckCircle2 aria-hidden />
          <p className="text-xl font-extrabold">{feito}</p>
        </div>
      </main>
    );
  }

  const formas: {
    valor: FormaPagamento;
    rotulo: string;
    dica: string;
    icone: React.ReactNode;
  }[] = [
    {
      valor: "PIX",
      rotulo: t.pix,
      dica: t.dicaPix,
      icone: <QrCode aria-hidden />,
    },
    {
      valor: "CREDIT_CARD",
      rotulo: t.cartao,
      dica: t.dicaCartao,
      icone: <CreditCard aria-hidden />,
    },
    {
      valor: "BOLETO",
      rotulo: t.boleto,
      dica: t.dicaBoleto,
      icone: <Barcode aria-hidden />,
    },
  ];
  const etapas = abrirNoCartao ? [t.cartaoNovo] : escolhida === "CREDIT_CARD" ? [t.trocarForma, t.cartaoNovo] : [t.trocarForma];

  return (
    <>
      <BarraEtapas etapas={etapas} atual={abrirNoCartao ? 1 : tela} onVoltar={voltar} />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pt-2 pb-6">
        {tela === 1 && (
          <>
            <div role="radiogroup" aria-label={t.trocarForma} className="flex flex-col gap-3">
              {formas.map((f) => {
                const ehAtual = f.valor === atual;
                return (
                  <button
                    key={f.valor}
                    type="button"
                    role="radio"
                    aria-checked={ehAtual}
                    disabled={enviando}
                    onClick={() => escolher(f.valor)}
                    className={cn(
                      "tocavel flex min-h-toque-grande items-center gap-4 rounded-3xl p-4 text-left ring-2 disabled:opacity-60",
                      ehAtual ? "bg-oficina-clara ring-oficina" : "cartao ring-transparent",
                    )}
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-oficina text-oficina-texto [&_svg]:size-7">
                      {ehAtual ? <Check aria-hidden strokeWidth={3} /> : f.icone}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-2xl font-extrabold">{f.rotulo}</span>
                      <span className="text-base font-semibold text-muted-foreground">
                        {ehAtual ? `${t.formaAtual}${f.valor === "CREDIT_CARD" && cartaoFinal ? ` · final ${cartaoFinal}` : ""}` : f.dica}
                      </span>
                    </span>
                    <ChevronRight aria-hidden className="size-7 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
            {erroGeral && <MensagemErroCampo>{erroGeral}</MensagemErroCampo>}
          </>
        )}

        {tela === 2 && (
          <>
            <CamposCartao valor={cartao} onValor={setCartao} erroDe={erroDe} />
            {erroGeral && <MensagemErroCampo>{erroGeral}</MensagemErroCampo>}
            <BotaoPrincipal fixo onClick={salvarCartao} carregando={enviando} icone={<ArrowRight aria-hidden />}>
              {valorDevido ? t.pagarComCartao(formatarReais(valorDevido)) : t.salvarCartao}
            </BotaoPrincipal>
          </>
        )}
      </main>
    </>
  );
}
