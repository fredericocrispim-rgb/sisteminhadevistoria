"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, KeyRound, QrCode, Wallet } from "lucide-react";
import { BotaoPrincipal, BotaoSecundario, InstalarApp, LogoOficina } from "@/components/vf";
import { SENHA_PADRAO } from "@/lib/senha-padrao";
import { textos } from "@/lib/textos";
import type { EmpresaCadastro } from "./assistente";

const t = textos.cadastro.pronto;

/**
 * Fim do cadastro, antes do pagamento: senha provisória em vermelho bem destacada,
 * "Pagar pelo Pix" (abre o QR Code) e, logo abaixo, "Pular para o teste" (vai para o Início).
 */
export function TelaPronto({
  empresa,
  diasTeste,
  pagamentoAutomatico,
}: {
  empresa: EmpresaCadastro;
  diasTeste: number;
  pagamentoAutomatico: boolean;
}) {
  const router = useRouter();
  // Asaas ligado: escolher Pix, cartão ou boleto (assinatura mensal). Sem Asaas: QR Code do Pix manual.
  const pagar = pagamentoAutomatico ? "/assinar" : "/plano?aviso=1";
  useEffect(() => {
    router.prefetch(pagar);
    router.prefetch("/inicio");
  }, [router, pagar]);

  function ir(destino: string) {
    router.push(destino);
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-5 px-4 py-8 text-center">
      <div className="relative">
        <LogoOficina nome={empresa.nome} url={empresa.logo} tamanho="lg" />
        <CheckCircle2 aria-hidden className="absolute -right-3 -bottom-3 size-12 rounded-full bg-background text-acao" />
      </div>
      <h1 className="text-[2rem] font-extrabold">{t.titulo}</h1>
      <p className="text-xl text-muted-foreground">
        {t.texto}
        <br />
        {pagamentoAutomatico ? t.prazoAutomatico(diasTeste) : t.prazo(diasTeste)}
      </p>

      {/* Senha provisória: vermelha e bem destacada (todo mundo começa com a mesma) */}
      <div role="note" className="flex w-full flex-col items-center gap-1 rounded-3xl border-4 border-perigo bg-perigo-clara px-4 py-5 text-perigo">
        <p className="flex items-center gap-2 text-xl font-extrabold uppercase">
          <KeyRound aria-hidden className="size-7" /> {t.senhaProvisoria}
        </p>
        <p className="text-6xl font-black tracking-[0.15em] tabular-nums">{SENHA_PADRAO}</p>
        <p className="text-lg font-bold">{t.senhaAnote}</p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <BotaoPrincipal icone={pagamentoAutomatico ? <Wallet aria-hidden /> : <QrCode aria-hidden />} onClick={() => ir(pagar)}>
          {pagamentoAutomatico ? t.comecarAutomatico : t.comecar}
        </BotaoPrincipal>
        <BotaoSecundario icone={<ArrowRight aria-hidden />} onClick={() => ir("/inicio")}>
          {t.pularTeste}
        </BotaoSecundario>
      </div>

      <div className="w-full text-left">
        <InstalarApp podeFechar={false} />
      </div>
    </main>
  );
}
