"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ExternalLink, QrCode, XCircle } from "lucide-react";
import { BotaoPrincipal, BotaoSecundario, ConfirmacaoImportante, MensagemErroCampo } from "@/components/vf";
import { fecharAba, levarAoPagamento, prepararAba } from "@/lib/pagamentos/abrir";
import { textos } from "@/lib/textos";
import { cancelarAssinatura, trocarForma } from "../assinar/acoes";

/**
 * Pagar a cobrança em aberto: abre a página do Asaas numa aba nova e esta aba vai para
 * "Esperando o pagamento", que libera o sistema sozinha quando o pagamento cai.
 */
export function BotaoPagar({ faturaId, link, children }: { faturaId: string; link: string | null; children: React.ReactNode }) {
  const router = useRouter();
  const espera = `/pagamento/${faturaId}`;
  if (!link) {
    return (
      <BotaoPrincipal href={espera} icone={<ExternalLink aria-hidden />}>
        {children}
      </BotaoPrincipal>
    );
  }
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener"
      onClick={() => router.push(espera)}
      className="tocavel inline-flex min-h-toque-grande w-full items-center justify-center gap-3 rounded-2xl bg-acao px-5 text-xl font-bold text-acao-texto select-none hover:bg-acao-escura [&_svg]:size-7 [&_svg]:shrink-0"
    >
      <ExternalLink aria-hidden /> <span>{children}</span>
    </a>
  );
}

/** Trocar Pix ⇄ cartão (com cobrança em aberto, já abre o Asaas na forma nova) e cancelar (com confirmação). */
export function BotoesAssinatura({ forma, temAberta }: { forma: "PIX" | "CREDIT_CARD" | null; temAberta: boolean }) {
  const t = textos.assinatura;
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [trabalhando, iniciar] = useTransition();
  const cartao = forma === "CREDIT_CARD";

  const trocar = () => {
    setErro(null);
    // A aba do Asaas abre já no toque (o navegador bloqueia aba aberta depois de esperar o servidor)
    const aba = temAberta ? prepararAba() : null;
    iniciar(async () => {
      const r = await trocarForma(cartao ? "PIX" : "CREDIT_CARD");
      if (!r.ok) {
        fecharAba(aba);
        setErro(r.erro);
      } else if (temAberta && r.link && r.faturaId) {
        if (levarAoPagamento(aba, r.link)) router.push(`/pagamento/${r.faturaId}`);
        return;
      } else {
        fecharAba(aba);
      }
      router.refresh();
    });
  };

  const cancelar = () =>
    iniciar(async () => {
      setErro(null);
      const r = await cancelarAssinatura();
      if (!r.ok) setErro(r.erro);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-2">
      <BotaoSecundario carregando={trabalhando} icone={cartao ? <QrCode aria-hidden /> : <CreditCard aria-hidden />} onClick={trocar}>
        {cartao ? t.trocarParaPix : t.trocarParaCartao}
      </BotaoSecundario>
      <BotaoSecundario className="text-perigo" icone={<XCircle aria-hidden />} onClick={() => setConfirmar(true)} disabled={trabalhando}>
        {t.cancelar}
      </BotaoSecundario>
      {erro && <MensagemErroCampo>{erro}</MensagemErroCampo>}
      <ConfirmacaoImportante
        aberto={confirmar}
        onAberto={setConfirmar}
        perigo
        titulo={t.cancelarTitulo}
        texto={t.cancelarTexto}
        textoConfirmar={t.cancelarSim}
        onConfirmar={cancelar}
      />
    </div>
  );
}
