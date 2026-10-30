"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, QrCode, XCircle } from "lucide-react";
import { BotaoSecundario, ConfirmacaoImportante, MensagemErroCampo } from "@/components/vf";
import { textos } from "@/lib/textos";
import { cancelarAssinatura, trocarForma } from "../assinar/acoes";

/** Trocar Pix ⇄ cartão e cancelar (com confirmação: não dá para desfazer). */
export function BotoesAssinatura({ forma }: { forma: "PIX" | "CREDIT_CARD" | null }) {
  const t = textos.assinatura;
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [trabalhando, iniciar] = useTransition();
  const cartao = forma === "CREDIT_CARD";

  const rodar = (acao: () => Promise<{ ok: boolean; erro?: string }>) =>
    iniciar(async () => {
      setErro(null);
      const r = await acao();
      if (!r.ok) setErro(r.erro ?? null);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-2">
      <BotaoSecundario
        carregando={trabalhando}
        icone={cartao ? <QrCode aria-hidden /> : <CreditCard aria-hidden />}
        onClick={() => rodar(() => trocarForma(cartao ? "PIX" : "CREDIT_CARD"))}
      >
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
        onConfirmar={() => rodar(cancelarAssinatura)}
      />
    </div>
  );
}
